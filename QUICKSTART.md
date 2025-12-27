# 🚀 Démarrage Rapide - Smart Food Manager

## 1. Lancer l'Application en Local

```bash
cd "/Users/isacelgozmir/Downloads/smart-food-manager (6)"
npm run dev
```

**URL:** http://localhost:3000

---

## 2. Première Connexion (Mode Démo)

### Étape 1: Créer un Restaurant
- Cliquer sur **"Créer un nouveau restaurant"**
- **Nom**: Démo Restaurant
- **Email**: demo@test.com
- **Mot de passe**: demo1234
- Cliquer **"CRÉER MON COMPTE"**

### Étape 2: Login Employé (PIN)
Après création restaurant, vous arrivez sur l'écran login PIN:

- **Utilisateur**: Admin
- **PIN**: `1234`

**Fonds de caisse initial**: 100€ (exemple)

---

## 3. Parcours Complet Demo

### A. Configuration Initiale

**1. Créer Ingrédients** (Menu → Stock)
```
Nom: Pain burger
Unité: pièce
Stock initial: 50
Coût moyen: 0.50€

Nom: Steak haché
Unité: kg
Stock initial: 5
Coût moyen: 8.50€/kg
```

**2. Créer Produits** (Menu → Produits & Recettes)
```
Nom: Burger Classique
Catégorie: Plats
Prix TTC: 9.90€
TVA: 10%

Recette:
- Pain burger: 1 pièce
- Steak haché: 0.150 kg

→ Coût matière auto-calculé: 1.78€
→ Marge: 7.12€
```

**3. Créer Tables** (Menu → Tables)
```
Table 1 - Capacité 4 - Salle
Table 2 - Capacité 2 - Terrasse
```

### B. Prise de Commande (POS)

1. Sélectionner **"Table 1"** (ou nouvelle commande)
2. Cliquer sur **"Burger Classique"** × 2
3. Ajouter notes: "Sans oignon"
4. **"ENVOYER EN CUISINE"**

**→ Stock déstocké automatiquement:**
- Pain: 50 → 48
- Steak: 5kg → 4.7kg

### C. Encaissement

1. Cuisine → Marquer "EN PRÉPARATION" → "TERMINÉE"
2. Retour POS → Sélectionner commande
3. **"PAYER"**
   - Espèces: 20€
   - Rendu: 0.20€
4. **Ticket imprimé** (simulation console)

### D. Dashboard Rentabilité

Menu → **Dashboard**

**Métriques affichées:**
- 📊 **CA**: 19.80€
- 💰 **Coût matière**: 3.56€
- ✅ **EBE (Bénéfice)**: 16.24€
- 📈 **Marge**: 82%

---

## 4. Fonctionnalités Avancées

### Gestion Charges (EBE)
Menu → **Charges**
```
Catégorie: Loyer
Montant: 800€/mois
Type: Fixe
```

**Impact EBE:**
```
CA: 19.80€
- Coût matière: 3.56€
- Charges: 800€
= EBE: -783.76€ (normal pour démo)
```

### Export Données
Menu → **Paramètres** → **Exporter JSON**

Sauvegarde complète:
- Produits, recettes
- Commandes, paiements
- Stock, mouvements
- Charges, EBE

### Mode Offline (PWA)
1. Installer l'app (icône navigateur)
2. Couper WiFi
3. **→ App fonctionne offline**
4. Données synchronisées au retour connexion

---

## 5. Comptes Demo Pré-configurés

### OWNER (Gérant)
- **Nom**: Admin
- **PIN**: 1234
- **Droits**: Tous accès

### Créer Serveur
Menu → **Utilisateurs** → **+ Nouveau**
```
Nom: Serveur 1
Rôle: SERVER
PIN: 5678
```

### Créer Cuisinier
```
Nom: Chef
Rôle: COOK
PIN: 9999
```

---

## 6. Workflow Complet Restaurant

```mermaid
1. Gérant configure produits/recettes
   ↓
2. Serveur prend commande (PIN 5678)
   ↓
3. Ticket imprimé cuisine
   ↓
4. Cuisinier prépare (KDS optionnel)
   ↓
5. Serveur encaisse
   ↓
6. Stock déstocké AUTO
   ↓
7. Dashboard mis à jour temps réel
```

---

## 7. Raccourcis Clavier (à venir)

- `Ctrl+P`: Nouveau produit panier
- `Ctrl+Enter`: Envoyer cuisine
- `Ctrl+$`: Paiement rapide
- `Ctrl+T`: Ouvrir table

---

## 8. Troubleshooting

### "PIN incorrect" avec 1234
**Solution**: Vider cache navigateur + localStorage
```js
localStorage.clear()
```
Puis recharger page.

### Stock négatif
**Cause**: Vente sans recette configurée
**Solution**: Menu → Produits → Modifier → Ajouter recette

### Dashboard EBE incohérent
**Vérifier**:
1. Toutes commandes payées
2. Charges bien saisies
3. Export → Vérifier JSON

---

## 9. Données de Test Rapides

**Importer JSON démo:**
Menu → Paramètres → **Importer**

Coller le JSON du fichier `demo-data.json` (si disponible)

**OU Créer manuellement** (voir section 3)

---

## 10. Passer en Production

1. **Configurer Supabase**
   - Créer projet: https://supabase.com
   - Copier URL + ANON_KEY
   - Modifier `.env`:
     ```
     VITE_SUPABASE_URL=https://xxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJxxx
     ```

2. **Exécuter SQL Setup**
   - Supabase SQL Editor
   - Copier `supabase-setup.sql`
   - Run

3. **Déployer Vercel**
   - https://vercel.com/new
   - Importer repo GitHub
   - Ajouter env vars
   - Deploy

4. **Premier Compte Prod**
   - Créer via interface SaaS
   - Email + Mot de passe sécurisé
   - PIN hashés côté serveur

---

## 📚 Documentation Complète

- [CLAUDE.md](CLAUDE.md) - Guide développeur complet
- [DEPLOY.md](DEPLOY.md) - Déploiement production
- [COLOR_GUIDE.md](COLOR_GUIDE.md) - Charte graphique
- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - Installation détaillée

---

**🎯 Prêt à tester!** Bon appétit avec Smart Food Manager! 🍔
