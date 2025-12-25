# SKILL: Database Migration

## Objectif
Créer et gérer migrations DB sécurisées, testées, versionnées (pour futur backend PostgreSQL).

## Règles de concision
- 1 migration = 1 fonctionnalité
- Nom descriptif court
- Toujours testable en rollback
- Jamais de modif manuelle en prod

## Principes fondamentaux

### 1. Migration = Code versionné
```
Migration file = Instruction SQL datée + versionnée
Appliquée 1 seule fois (historique dans table alembic_version)
Rollback possible (downgrade)
```

### 2. Ordre d'exécution critique
```
1. Écrire modèle SQLAlchemy (models/...)
2. Générer migration (alembic revision --autogenerate)
3. Vérifier SQL généré manuellement
4. Tester en local (upgrade + downgrade)
5. Commit migration file
6. Appliquer en staging
7. Valider données staging
8. Appliquer en production
```

### 3. Never skip migration
```
Prod DB version = N
New migration = N+1

❌ Modifier migration N+1 après application
✅ Créer nouvelle migration N+2 pour corriger
```

## Workflow complet

### Création migration

```bash
# 1. Modifier model
# Exemple: models/reservation.py
class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(UUID, primary_key=True, default=uuid4)
    company_id = Column(UUID, ForeignKey("companies.id"), nullable=False, index=True)
    table_id = Column(UUID, ForeignKey("tables.id"), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20))
    date = Column(DateTime, nullable=False)
    nb_guests = Column(Integer, nullable=False)
    status = Column(Enum('PENDING', 'CONFIRMED', 'CANCELLED'), default='PENDING')
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. Générer migration
alembic revision --autogenerate -m "add_reservations_table"

# Output:
# alembic/versions/abc123_add_reservations_table.py
```

### Vérification manuelle migration

```python
# TOUJOURS vérifier fichier généré
# alembic/versions/abc123_add_reservations_table.py

def upgrade():
    # ✅ Vérifier:
    # - Indexes sur company_id, foreign keys
    # - Nullable correct
    # - Default values corrects
    # - Constraints (unique, check)

    op.create_table(
        'reservations',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('company_id', UUID(), nullable=False),
        sa.Column('table_id', UUID(), nullable=False),
        sa.Column('customer_name', sa.String(100), nullable=False),
        sa.Column('customer_phone', sa.String(20), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('nb_guests', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'CANCELLED'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['table_id'], ['tables.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # ✅ CRITICAL: Index sur company_id pour perf multi-tenant
    op.create_index('ix_reservations_company_id', 'reservations', ['company_id'])

def downgrade():
    # ✅ Ordre inverse!
    op.drop_index('ix_reservations_company_id', 'reservations')
    op.drop_table('reservations')
```

### Tests local

```bash
# Upgrade
alembic upgrade head
# Vérifier table créée
psql -U user -d dbname -c "\d reservations"

# Downgrade (test rollback)
alembic downgrade -1
# Vérifier table supprimée
psql -U user -d dbname -c "\d reservations"  # should error

# Re-upgrade
alembic upgrade head
```

### Application production

```bash
# 1. Backup DB
pg_dump -U user dbname > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Dry-run (afficher SQL sans exécuter)
alembic upgrade head --sql > migration.sql
cat migration.sql  # vérifier

# 3. Appliquer
alembic upgrade head

# 4. Vérifier
alembic current  # version actuelle
psql -U user -d dbname -c "SELECT * FROM alembic_version"
```

## Types de migrations

### 1. Ajout table
```python
def upgrade():
    op.create_table(
        'table_name',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('company_id', UUID(), nullable=False, index=True),
        # ... autres colonnes
    )
    op.create_index('ix_table_name_company_id', 'table_name', ['company_id'])

def downgrade():
    op.drop_index('ix_table_name_company_id')
    op.drop_table('table_name')
```

### 2. Ajout colonne
```python
def upgrade():
    op.add_column('products', sa.Column('image_url', sa.String(500), nullable=True))

def downgrade():
    op.drop_column('products', 'image_url')
```

### 3. Modification colonne
```python
def upgrade():
    # Changer nullable
    op.alter_column('ingredients', 'min_stock',
                    existing_type=sa.Numeric(10, 3),
                    nullable=False,
                    existing_nullable=True)

def downgrade():
    op.alter_column('ingredients', 'min_stock',
                    existing_type=sa.Numeric(10, 3),
                    nullable=True,
                    existing_nullable=False)
```

### 4. Migration de données
```python
def upgrade():
    # Ajout colonne avec valeur par défaut
    op.add_column('users', sa.Column('role', sa.String(20), nullable=True))

    # Remplir données existantes
    op.execute("UPDATE users SET role = 'SERVER' WHERE role IS NULL")

    # Rendre non-nullable
    op.alter_column('users', 'role', nullable=False)

def downgrade():
    op.drop_column('users', 'role')
```

### 5. Renommage
```python
def upgrade():
    op.rename_table('old_name', 'new_name')
    # OU
    op.alter_column('table_name', 'old_column', new_column_name='new_column')

def downgrade():
    op.rename_table('new_name', 'old_name')
    # OU
    op.alter_column('table_name', 'new_column', new_column_name='old_column')
```

## Checklist avant merge

### Migration file
- [ ] Nom descriptif (`add_`, `modify_`, `remove_`)
- [ ] upgrade() ET downgrade() présents
- [ ] Index sur company_id si nouvelle table
- [ ] Foreign keys correctes
- [ ] Nullable/Not Null cohérent
- [ ] Default values corrects
- [ ] Pas de DROP TABLE sans confirmation

### Tests
- [ ] upgrade fonctionne en local
- [ ] downgrade fonctionne (rollback OK)
- [ ] Pas de perte de données (si migration data)
- [ ] Performance OK (pas de full table scan si grosse table)

### Documentation
- [ ] Commentaire dans migration si logique complexe
- [ ] Schema diagram mis à jour (si grosse modif)

## Anti-patterns

### ❌ NE JAMAIS
```python
# 1. Modifier migration déjà appliquée
# Si erreur détectée après merge:
# ✅ Créer nouvelle migration corrective

# 2. DROP sans backup
def upgrade():
    op.drop_table('important_data')  # ❌ DANGER

# ✅ Mieux: Renommer d'abord
def upgrade():
    op.rename_table('important_data', 'important_data_deprecated')
    # Garder quelques jours, puis drop dans migration suivante

# 3. Migration dépendante de données spécifiques
def upgrade():
    # ❌ Assume user avec id=1 existe
    op.execute("UPDATE orders SET user_id = 1 WHERE user_id IS NULL")

# ✅ Mieux: Gérer le cas général
    op.execute("""
        UPDATE orders
        SET user_id = (SELECT id FROM users WHERE role = 'OWNER' LIMIT 1)
        WHERE user_id IS NULL
    """)

# 4. Migration non réversible
def upgrade():
    op.execute("DELETE FROM logs WHERE created_at < '2024-01-01'")

def downgrade():
    pass  # ❌ Impossible de restaurer données supprimées

# 5. Oublier index company_id
def upgrade():
    op.create_table(
        'new_table',
        sa.Column('company_id', UUID(), nullable=False)
        # ❌ Pas d'index = perf catastrophique multi-tenant
    )
```

### ✅ PATTERNS CORRECTS
```python
# 1. Migration réversible avec données
def upgrade():
    # Backup dans table temporaire
    op.execute("""
        CREATE TABLE logs_backup AS SELECT * FROM logs
        WHERE created_at < '2024-01-01'
    """)
    op.execute("DELETE FROM logs WHERE created_at < '2024-01-01'")

def downgrade():
    op.execute("INSERT INTO logs SELECT * FROM logs_backup")
    op.execute("DROP TABLE logs_backup")

# 2. Migration progressive (grosse table)
def upgrade():
    # Créer nouvelle colonne nullable d'abord
    op.add_column('huge_table', sa.Column('new_col', sa.String(100), nullable=True))

    # Remplir en batch (évite lock longue durée)
    op.execute("""
        UPDATE huge_table SET new_col = 'default_value'
        WHERE id IN (SELECT id FROM huge_table WHERE new_col IS NULL LIMIT 10000)
    """)
    # Répéter jusqu'à terminé (ou via script séparé)

    # Rendre non-nullable après
    op.alter_column('huge_table', 'new_col', nullable=False)
```

## Situations spéciales

### Breaking change (incompatible avec code existant)

```python
# Exemple: Renommer colonne utilisée par API
# Solution: Migration en 2 étapes

# Migration 1: Ajouter nouvelle colonne
def upgrade():
    op.add_column('products', sa.Column('cost_price', sa.Numeric(10, 2)))
    # Copier données
    op.execute("UPDATE products SET cost_price = unit_cost")

# Migration 2 (après déploiement code): Supprimer ancienne
def upgrade():
    op.drop_column('products', 'unit_cost')
```

### Rollback d'urgence

```bash
# Si migration crash en prod
# 1. Identifier version avant crash
alembic history

# 2. Downgrade vers version safe
alembic downgrade abc123  # hash de la version précédente

# 3. Restaurer backup si données corrompues
psql -U user dbname < backup_20241223_143000.sql

# 4. Vérifier état
alembic current
```

## Conventions nommage

```
Préfixes:
- add_        Ajout table/colonne
- remove_     Suppression
- modify_     Modification
- rename_     Renommage
- create_index_  Ajout index
- migrate_data_  Migration données

Exemples:
✅ add_reservations_table
✅ modify_products_add_image_url
✅ create_index_orders_date
✅ migrate_data_users_default_role
✅ remove_deprecated_logs_table

❌ update_db
❌ changes
❌ fix
```

## Notes Smart Food Manager

### Tables critiques (attention!)
- `companies` (multi-tenant racine)
- `users` (auth)
- `ingredients` (stock, PMP)
- `products` (recettes)
- `orders` (ventes, déstockage)
- `stock_movements` (historique)

### Index obligatoires
```sql
-- Multi-tenant isolation (TOUTES les tables)
CREATE INDEX ix_{table}_company_id ON {table}(company_id);

-- Performance queries
CREATE INDEX ix_orders_status ON orders(status);
CREATE INDEX ix_orders_date ON orders(created_at);
CREATE INDEX ix_stock_movements_ingredient_id ON stock_movements(ingredient_id);
CREATE INDEX ix_stock_movements_date ON stock_movements(created_at);
```

### Constraints métier
```sql
-- Stock non négatif
ALTER TABLE ingredients ADD CONSTRAINT check_stock_positive
  CHECK (current_stock >= 0);

-- Prix positifs
ALTER TABLE products ADD CONSTRAINT check_price_positive
  CHECK (price > 0);

-- Quantité commande positive
ALTER TABLE order_items ADD CONSTRAINT check_quantity_positive
  CHECK (quantity > 0);
```

## Commandes utiles

```bash
# Historique migrations
alembic history

# Version actuelle
alembic current

# Vérifier migrations pending
alembic heads

# Générer migration vide (custom SQL)
alembic revision -m "custom_migration"

# Downgrade toutes migrations (DANGER)
alembic downgrade base

# Upgrade vers version spécifique
alembic upgrade abc123

# Afficher SQL sans exécuter
alembic upgrade head --sql
```

## Checklist déploiement

Avant production:
- [ ] Backup DB complet
- [ ] Migration testée en staging
- [ ] Downgrade testé en staging
- [ ] Fenêtre maintenance communiquée (si downtime)
- [ ] Rollback plan documenté
- [ ] Monitoring configuré (après migration)

Après production:
- [ ] Migration appliquée (alembic current)
- [ ] Données vérifiées (SELECT quelques rows)
- [ ] Performance OK (EXPLAIN queries critiques)
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Rollback plan testé (si possible sans exécuter)
