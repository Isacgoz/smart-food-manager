# SKILL: Executing Plan

## Objectif
Exécuter le plan technique en suivant strictement les étapes, sans dévier.

## Règles de concision
- Aucune explication sauf si erreur
- Pas de répétition du plan
- Actions directes uniquement
- Output minimal

## Principes d'exécution

### 1. Suivre le plan à la lettre
- Pas d'improvisation
- Pas d'ajout non planifié
- Pas de refactoring spontané
- Si problème → signaler, ne pas contourner

### 2. Une étape à la fois
- Finir étape N avant N+1
- Ne pas mélanger les étapes
- Valider avant de continuer

### 3. Créer d'abord, tester après
- Ne pas lancer serveur dev
- Ne pas écrire tests (sauf demande explicite)
- Assume serveur running pour validation

### 4. Commentaires code minimaux
- Commenter POURQUOI, jamais QUOI
- Seulement si logique non évidente
- Format court : `# raison`

### 5. Commits selon convention
```
type(scope): ultra short msg

Examples:
✅ feat(ingredients): CRUD
✅ fix(stock): negative calc
✅ refactor(api): extract service
❌ feat(ingredients): Added full CRUD for ingredients management
```

## Format de sortie

### Pendant l'exécution
```
Étape 1/5: Database model
✓ Created models/ingredient.py

Étape 2/5: Migration
✓ Generated migration
✓ Applied migration

Étape 3/5: Schemas
✓ Created schemas/ingredient.py

...

Terminé.
Commit: feat(ingredients): CRUD
```

### Si erreur
```
Étape 3/5: Schemas
✗ Error: [message court]

Cause: [1 phrase]
Fix: [action corrective]

Reprendre? [attendre confirmation]
```

### Si ambiguïté dans plan
```
Étape 4/5: Service layer
⚠ Ambiguïté détectée

Question: [question précise]
Options:
A. [option 1]
B. [option 2]

Recommandation: [A ou B] - [raison courte]

Attente décision.
```

## Workflow d'exécution

### Phase 1: Setup
```bash
# Créer branche (si pas déjà fait)
git checkout -b feature/nom-feature

# Vérifier prérequis
[commandes de vérification si nécessaire]
```

### Phase 2: Implémentation
Pour chaque étape :
1. Lire actions du plan
2. Créer/modifier fichiers
3. Exécuter commandes
4. Cocher checklist mentalement
5. Passer étape suivante

### Phase 3: Validation
```bash
# Validation manuelle selon plan
# Exemples de commandes curl ou requests
```

### Phase 4: Commit & Push
```bash
git add .
git commit -m "type(scope): msg"
git push -u origin feature/nom-feature

# Si PR demandée
gh pr create --title "title" --body "description"
```

## Exemples d'exécution

### Exemple bon (concis)
```
Étape 1/5: Database model
✓ models/ingredient.py

Étape 2/5: Migration
✓ Migration created
✓ Applied

Étape 3/5: Schemas
✓ schemas/ingredient.py

Étape 4/5: Service
✓ services/ingredient_service.py

Étape 5/5: Routes
✓ routes/ingredient_routes.py
✓ Registered in main

Terminé.
Commit: feat(ingredients): CRUD
```

### Exemple mauvais (verbeux)
```
Maintenant je vais commencer par créer le modèle de base de données.
J'ai créé le fichier models/ingredient.py qui contient la classe Ingredient
avec tous les champs nécessaires comme spécifié dans le plan...

[50 lignes d'explications inutiles]
```

## Gestion des fichiers

### Créer nouveau fichier
```python
# Pas de commentaires expliquant le fichier
# Code direct
# Commentaires seulement si logique non évidente

# ✅ BON
class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(UUID, primary_key=True)
    company_id = Column(UUID, ForeignKey("companies.id"))
    name = Column(String)
    unit_id = Column(UUID, ForeignKey("units.id"))
    current_stock = Column(Numeric(10, 3), default=0)
    min_stock = Column(Numeric(10, 3), default=0)  # alert threshold
    
    # Relations
    unit = relationship("Unit")
    company = relationship("Company")

# ❌ MAUVAIS
# This file contains the Ingredient model
# It represents ingredients in the database
# Each ingredient belongs to a company
class Ingredient(Base):
    # The table name in the database
    __tablename__ = "ingredients"
    
    # Primary key using UUID
    id = Column(UUID, primary_key=True)
    # Foreign key to companies table
    company_id = Column(UUID, ForeignKey("companies.id"))
    ...
```

### Modifier fichier existant
- Utiliser str_replace ou edit_file
- Changements minimaux
- Pas de refactoring non planifié

### Exemple commentaire utile
```python
# PMP recalc: (old_stock * old_pmp + new_qty * new_price) / total_stock
new_pmp = ((current_stock * current_pmp) + (received_qty * unit_price)) / (current_stock + received_qty)

# Round to prevent floating point drift
ingredient.current_pmp = round(new_pmp, 2)
```

## Gestion des erreurs

### Erreur technique (import, syntax)
```
✗ Error: ModuleNotFoundError: No module named 'pydantic'

Fix: pip install pydantic --break-system-packages
Reprendre? [y/n]
```

### Erreur logique (plan incomplet)
```
✗ Ambiguïté: Plan ne spécifie pas comportement si stock < 0

Options:
A. Bloquer vente (raise error)
B. Autoriser stock négatif
C. Warning mais autoriser

Recommandation: A (prevent data corruption)

Attente décision.
```

### Erreur base de données
```
✗ Migration failed: column "company_id" already exists

Cause: Migration déjà appliquée?
Fix options:
A. Downgrade puis rerun
B. Skip migration (risky)
C. Edit migration file

Recommandation: A

Commande: alembic downgrade -1
```

## Commandes fréquentes

### Backend
```bash
# Migration
alembic revision --autogenerate -m "msg"
alembic upgrade head

# Check models
python -c "from models import Ingredient; print('OK')"

# Manual DB check (si besoin debug)
psql -U user -d dbname -c "SELECT * FROM ingredients LIMIT 1;"
```

### Git + GitHub CLI
```bash
# Status
git status

# Add all
git add .

# Commit (format court)
git commit -m "feat(scope): msg"

# Push
git push -u origin branch-name

# Create PR
gh pr create --title "feat: title" --body "closes #123"

# Merge PR (si autorisé)
gh pr merge 123 --squash
```

### Validation API (exemples)
```bash
# Test endpoint (si validation demandée)
curl -X POST http://localhost:8000/api/ingredients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tomate","unit_id":"uuid","min_stock":10}'

# Expected: 201 + JSON response
```

## Anti-patterns exécution

❌ Expliquer chaque ligne de code créée
❌ Ajouter features non planifiées
❌ Refactoring spontané
❌ Commentaires évidents
❌ Commits verbeux
❌ Tests non demandés
❌ Lancer serveur dev
❌ Dévier du plan

## Patterns à suivre

✅ Suivre plan strictement
✅ Output minimal (checkmarks)
✅ Commentaires uniquement si POURQUOI nécessaire
✅ Commits format court
✅ Signaler ambiguïtés
✅ Une étape à la fois
✅ Validation selon plan uniquement

## Checklist avant de terminer

Avant de marquer "Terminé" :
- [ ] Toutes étapes du plan exécutées
- [ ] Fichiers créés aux bons chemins
- [ ] Migrations appliquées (si applicable)
- [ ] Validation manuelle effectuée
- [ ] Commit créé (format correct)
- [ ] Push effectué
- [ ] PR créée (si demandée)

Si une étape manque → Pas terminé.

## Notes spécifiques Smart Food Manager

### Toujours vérifier
- `company_id` filtrage présent
- Foreign keys correctes
- Index sur company_id
- Timestamps (created_at, updated_at)

### Migrations
- Toujours générer avec `--autogenerate`
- Vérifier migration avant apply
- Nom descriptif court

### Multi-tenant
- Chaque query filtrée par company_id
- Pas d'access inter-companies
- Vérifier dans services ET routes

### PMP et stock
- Précision Numeric(10,3)
- Round après calculs
- Prévenir valeurs négatives (si métier l'exige)

### Conversions unités
- Utiliser fonctions centralisées
- Pas de calculs manuels dispersés
- Cache si nécessaire (futur)

## Format final output

```
Étape 1/N: [nom]
✓ [action 1]
✓ [action 2]

Étape 2/N: [nom]
✓ [action 1]

...

Étape N/N: [nom]
✓ [action 1]
✓ [action 2]

Validation:
✓ [test 1]
✓ [test 2]

Commit: type(scope): msg

Terminé.
```

Ou si erreur/ambiguïté → signaler immédiatement et attendre.
