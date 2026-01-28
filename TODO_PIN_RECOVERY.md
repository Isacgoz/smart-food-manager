# TODO: Fonction "PIN oublié" - À implémenter après tests Stripe

## Contexte
Actuellement, si un serveur/cuisinier oublie son PIN, seul le gérant peut le réinitialiser via Menu → Équipe.

## Besoin
Ajouter une fonction self-service "PIN oublié" sur la page de login POS.

## Solution recommandée : Demande au gérant (sécurisée)

### Workflow proposé
```
1. Serveur clique "PIN oublié ?" sur Login
2. Modal s'ouvre → Saisir nom
3. Notification envoyée au gérant (toast)
4. Gérant valide identité en personne
5. Gérant génère nouveau PIN (bouton)
6. PIN affiché à l'écran
7. Gérant communique oralement le PIN au serveur
8. Serveur se connecte avec nouveau PIN
```

### Avantages
- ✅ Sécurité : validation physique requise
- ✅ Traçabilité : log qui a demandé quand
- ✅ Pas d'email requis
- ✅ Adapté au contexte restaurant

### Fichiers à modifier
1. `pages/Login.tsx` - Ajouter bouton "PIN oublié ?"
2. `pages/Login.tsx` - Modal saisie nom
3. `store.tsx` - Fonction `requestPinReset(userName)`
4. `pages/Users.tsx` - Badge notification + action gérant
5. `shared/types.ts` - Interface `PinResetRequest`

### Estimation
- Développement : 20-30 min
- Tests : 10 min
- **Total : 30-40 min**

### Priorité
🟡 MOYEN - Nice to have pour production, pas bloquant

### Alternative simple (temporaire)
Ajouter texte d'aide sur Login:
```typescript
<p className="text-xs text-slate-400 mt-2">
  PIN oublié ? Demandez au gérant de le réinitialiser via Menu → Équipe
</p>
```

---

**Statut:** 🔴 TODO - Reporter après validation tests Stripe
**Créé le:** 2026-01-28
**Assigné à:** À définir
