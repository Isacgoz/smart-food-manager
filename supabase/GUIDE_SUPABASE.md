# 🚀 Guide Configuration Supabase - Smart Food Manager

## Pré-requis

- Compte Supabase (https://supabase.com)
- Projet Supabase créé

---

## Étape 1: Récupérer tes clés Supabase

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (commence par `eyJ...`)

---

## Étape 2: Configurer les variables d'environnement

Crée ou modifie le fichier `.env.local` à la racine du projet:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Remplace par TES vraies valeurs!

---

## Étape 3: Exécuter le script SQL

1. Va dans **Supabase Dashboard** → **SQL Editor**
2. Clique sur **New Query**
3. Copie-colle TOUT le contenu de `supabase/SETUP_COMPLET.sql`
4. Clique sur **Run** (ou Ctrl+Enter)

### Résultat attendu:

```
Tables créées: 2
companies: rls_enabled = true
app_state: rls_enabled = true
8 policies créées
```

---

## Étape 4: Configurer l'authentification

1. Va dans **Authentication** → **Providers**
2. Active **Email** (devrait être activé par défaut)

### Configuration Email (IMPORTANT):

1. Va dans **Authentication** → **Email Templates**
2. Dans **Confirm signup**, modifie le lien:
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
   ```

3. Va dans **Authentication** → **URL Configuration**
4. Configure:
   - **Site URL**: `https://ton-domaine.vercel.app` (ou localhost:3000 pour dev)
   - **Redirect URLs**:
     ```
     https://ton-domaine.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```

---

## Étape 5: Désactiver confirmation email (DEV ONLY)

Pour le développement, tu peux désactiver la confirmation email:

1. Va dans **Authentication** → **Providers** → **Email**
2. Désactive **Confirm email**

⚠️ **Réactive en production!**

---

## Étape 6: Tester

1. Lance l'app: `npm run dev`
2. Va sur http://localhost:3000
3. Crée un nouveau compte
4. Vérifie dans Supabase:
   - **Authentication** → **Users**: Nouveau user créé
   - **Table Editor** → **companies**: Nouvelle company créée
   - **Table Editor** → **app_state**: Nouvel app_state créé

---

## Troubleshooting

### Erreur "new row violates row-level security policy"

**Cause**: Les policies RLS bloquent l'insertion.

**Solution**: Vérifie que:
1. L'utilisateur est bien authentifié
2. Le script SQL a été exécuté complètement
3. Les policies sont bien créées (vérifier avec la requête de vérification)

### Erreur "relation does not exist"

**Cause**: Les tables n'existent pas.

**Solution**: Réexécute le script `SETUP_COMPLET.sql`

### Erreur "infinite recursion detected"

**Cause**: Policies trop complexes.

**Solution**: Ce script utilise des policies simples qui évitent la récursion. Si l'erreur persiste, exécute:

```sql
-- Désactiver temporairement RLS
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

---

## Structure des données

### Table `companies`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | ID unique (= user.id) |
| name | TEXT | Nom du restaurant |
| owner_id | UUID | ID du propriétaire |
| plan | TEXT | SOLO, PRO, BUSINESS |
| is_active | BOOLEAN | Compte actif |
| created_at | TIMESTAMPTZ | Date création |

### Table `app_state`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | ID unique (= user.id) |
| company_id | UUID | Lien vers companies |
| data | JSONB | Toutes les données (products, orders, etc.) |
| updated_at | TIMESTAMPTZ | Dernière modification |

---

## Multi-tenant: Comment ça marche?

```
User A (kebab@mail.com)
  └── companies.id = "uuid-A"
  └── app_state.id = "uuid-A"
      └── data: { products: [...], orders: [...] }

User B (pizza@mail.com)
  └── companies.id = "uuid-B"
  └── app_state.id = "uuid-B"
      └── data: { products: [...], orders: [...] }
```

**Isolation garantie par RLS:**
- User A ne peut voir que ses données (uuid-A)
- User B ne peut voir que ses données (uuid-B)
- Impossible de voir les données d'un autre restaurant

---

## Commandes utiles SQL Editor

### Voir tous les users
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
```

### Voir toutes les companies
```sql
SELECT * FROM companies ORDER BY created_at DESC;
```

### Voir tous les app_state
```sql
SELECT id, company_id, updated_at,
       data->'restaurant'->>'name' as restaurant_name
FROM app_state ORDER BY updated_at DESC;
```

### Supprimer un user de test (ATTENTION)
```sql
-- D'abord supprimer les données
DELETE FROM app_state WHERE id = 'uuid-du-user';
DELETE FROM companies WHERE id = 'uuid-du-user';
-- Puis supprimer le user dans Authentication → Users
```

---

## Checklist finale

- [ ] Variables d'environnement configurées (.env.local)
- [ ] Script SQL exécuté sans erreur
- [ ] 2 tables créées (companies, app_state)
- [ ] RLS activé sur les 2 tables
- [ ] 8 policies créées
- [ ] Email redirect URL configuré
- [ ] Test création compte réussi
- [ ] Données visibles dans Table Editor

---

**🎉 Si tout est coché, ton Supabase est prêt!**
