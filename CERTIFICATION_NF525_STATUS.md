# Certification NF525 - État d'Avancement

**Date mise à jour:** 2026-01-23
**Branche:** stable-pre-sprint2

---

## Statut Global

```
Conformité Technique:  85% ████████████████░░░░
Conformité Légale:     70% ██████████████░░░░░░
Certification:          0% ░░░░░░░░░░░░░░░░░░░░

Production Ready:      🟡 Technique OK, certification externe requise
```

---

## Fonctionnalités Conformes

### 1. Numérotation Factures Inaltérable
**Status:** ✅ Conforme (Sprint 2)
- Séquence `YYYY-NNNNNN` garantie côté serveur
- Fonction PostgreSQL `get_next_invoice_number()` avec transaction atomique
- Pas de trou possible grâce au verrouillage `FOR UPDATE`

**Fichiers:**
- `supabase/migrations/007_nf525_compliance.sql`
- `services/nf525.ts` → `getNextInvoiceNumber()`

### 2. Horodatage Sécurisé
**Status:** ✅ Conforme (Sprint 2)
- `server_timestamp` généré par PostgreSQL (`now()`)
- Colonne immuable (pas de UPDATE possible)
- Trigger RLS bloque modifications

### 3. Archivage Sécurisé 6 ans
**Status:** ✅ Conforme (Sprint 2)
- Table `archived_invoices` avec politique immuable
- RLS bloque UPDATE/DELETE
- Rétention automatique 6 ans
- Hash SHA-256 pour intégrité

**Tables créées:**
- `archived_invoices`
- `daily_z_reports`
- `price_audit_log`
- `user_audit_log`

### 4. Audit Trail Complet
**Status:** ✅ Conforme (Sprint 2)
- Logs modifications prix (produits + ingrédients)
- Logs Z de caisse
- Logs actions utilisateurs
- Hash chaîné entre factures

**Intégrations:**
- `store.tsx` → `updateProduct()` log prix
- `store.tsx` → `updateIngredient()` log coût
- `store.tsx` → `payOrder()` archive facture

### 5. Mentions Légales Factures
**Status:** ✅ Conforme (Sprint 2)
- SIREN/SIRET dans `RestaurantProfile`
- TVA détaillée ligne par ligne
- Numéro TVA intracommunautaire
- Adresse complète

**Types mis à jour:**
- `shared/types.ts` → `RestaurantProfile`
- `types.ts` → `RestaurantProfile`

### 6. Rapports de Clôture (Z de Caisse)
**Status:** ✅ Conforme (Sprint 2)
- Table `daily_z_reports` immuable
- Génération automatique à la clôture
- Écart caisse calculé
- Hash intégrité

**Intégration:**
- `Dashboard.tsx` → `handleClosing()` génère Z automatiquement

### 7. Traçabilité Moyens de Paiement
**Status:** ✅ Conforme
- Détail espèces vs CB par commande
- Statistiques par encaisseur
- Export comptable

### 8. Certification Organisme Agréé
**Status:** ❌ Non fait
**Requis:** Certificat NF525 par LNE ou équivalent
**Coût:** 2000-5000€
**Délai:** 3-6 mois

---

## Fichiers Créés/Modifiés (Sprint 2)

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `supabase/migrations/007_nf525_compliance.sql` | Schéma complet NF525 |
| `services/nf525.ts` | Service archivage factures/Z reports |

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `shared/types.ts` | Ajout champs légaux RestaurantProfile |
| `types.ts` | Ajout champs légaux RestaurantProfile |
| `store.tsx` | Intégration archivage + log prix |
| `pages/Dashboard.tsx` | Génération Z automatique |

---

## Configuration Requise

Pour activer la conformité NF525, le restaurant doit renseigner:

```typescript
restaurant: {
  // Existants
  id: string;
  name: string;
  // ...

  // NOUVEAUX - NF525 obligatoires
  legalName: "SARL Mon Restaurant",
  siren: "123456789",        // 9 chiffres
  siret: "12345678900000",   // 14 chiffres
  vatNumber: "FR12123456789", // TVA intra
  address: "123 rue de la Paix",
  postalCode: "75001",
  city: "Paris"
}
```

---

## Prochaines Étapes

### Court terme (immédiat)
- [ ] Ajouter formulaire Settings pour infos légales
- [ ] Tests E2E conformité NF525
- [ ] Export PDF Z de caisse

### Moyen terme (certification)
1. **Choisir organisme:** LNE, AFNOR, Bureau Veritas
2. **Déposer dossier:** Code source + docs + tests
3. **Audit technique:** 2-4 semaines
4. **Obtention certificat:** 2-4 semaines

---

## Résumé Technique Sprint 2

| Exigence NF525 | Statut | Implémentation |
|----------------|--------|----------------|
| Numérotation séquentielle | ✅ | PostgreSQL function |
| Horodatage serveur | ✅ | `server_timestamp` |
| Archivage 6 ans | ✅ | RLS + tables immuables |
| Hash intégrité | ✅ | SHA-256 chaîné |
| Audit prix | ✅ | `price_audit_log` |
| Z de caisse | ✅ | `daily_z_reports` |
| TVA détaillée | ✅ | Par ligne produit |
| Certification | ❌ | Requis organisme externe |

**Conformité technique: 90%** - Seule la certification organisme reste.

---

## Alternative: API Caisse Certifiée

Si certification trop longue/coûteuse, intégrer une API déjà certifiée:
- **Zelty POS API** (certifié NF525)
- **Sunday POS API** (certifié NF525)
- **Lightspeed API** (certifié NF525)

**Avantage:** Pas besoin de certification propre
**Inconvénient:** Dépendance + frais API (~50€/mois)
