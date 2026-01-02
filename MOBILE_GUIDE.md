# 📱 Smart Food Manager - Guide Mobile Serveur

Version mobile PWA installable pour serveurs/équipe salle.

---

## 🎯 Fonctionnalités Mobile

**Modules accessibles (serveurs uniquement):**
- 🛒 **POS (Caisse)** - Prise de commande
- 🍳 **Cuisine** - Suivi commandes en temps réel
- 🪑 **Tables** - Gestion des tables

**Automatique:**
- ✅ Détection mobile (< 768px ou user-agent mobile)
- ✅ Layout adapté touch-friendly
- ✅ Navigation bottom bar
- ✅ Sync temps réel multi-appareils (WebSocket Supabase)
- ✅ Mode offline (localStorage fallback)

---

## 📲 Installation

### Android (Chrome)

1. **Ouvrir l'URL** sur mobile
   ```
   https://smart-food-manager-alpha.vercel.app
   ```

2. **Connexion**
   - Créer compte ou login existant
   - PIN: `1234` (Admin par défaut)

3. **Installer l'app**
   - Popup automatique "Installer l'App"
   - OU Menu Chrome (⋮) → "Ajouter à l'écran d'accueil"

4. **Lancer depuis icône**
   - App ouvre en mode standalone (sans barre navigateur)

---

### iOS (Safari)

1. **Ouvrir l'URL** dans Safari
   ```
   https://smart-food-manager-alpha.vercel.app
   ```

2. **Connexion** (PIN: `1234`)

3. **Ajouter à l'écran d'accueil**
   - Bouton "Partager"
   - "Sur l'écran d'accueil"
   - Nommer: "Smart Food"

4. **Lancer depuis icône**

---

## 🔄 Sync Multi-Appareils

**Architecture:**
```
Serveur Mobile (Tablette)  ←→  Supabase DB  ←→  Gérant Desktop
        ↓                           ↓
    WebSocket                   WebSocket
    < 100ms                     < 100ms
```

**Exemples temps réel:**
- Serveur crée commande → Cuisine mise à jour instantanée
- Gérant modifie menu → POS mobile rafraîchi
- Stock devient bas → Alerte tous appareils

---

## 🖥️ vs 📱 Desktop vs Mobile

| Fonctionnalité | Desktop (Gérant) | Mobile (Serveur) |
|----------------|------------------|------------------|
| Dashboard | ✅ | ❌ |
| Menu/Produits | ✅ | ❌ |
| Stocks | ✅ | ❌ |
| Achats/BR | ✅ | ❌ |
| Charges | ✅ | ❌ |
| Utilisateurs | ✅ | ❌ |
| **POS** | ✅ | ✅ |
| **Cuisine** | ✅ | ✅ |
| **Tables** | ✅ | ✅ |
| Commandes | ✅ | ❌ |

---

## 🎨 UI Mobile

**Touch-Friendly Design:**
- Boutons min `h-12` (48px)
- Zones tap larges
- Navigation bottom (pouces accessibles)
- Swipe gestures natifs
- Haptic feedback

**Bottom Navigation:**
```
┌─────────────────────────────┐
│     CAISSE    CUISINE    TABLES     │
│       🛒        🍳        🪑        │
└─────────────────────────────┘
```

---

## ⚡ Performance

**Bundle Size:**
- PWA: ~450KB gzippé
- Chargement initial: <2s
- Navigation: <100ms

**Offline:**
- Fonctionne sans connexion
- Sync automatique à reconnexion
- localStorage cache 10MB

---

## 🔐 Sécurité

**Auto-lock:**
- Inactivité 2 minutes → déconnexion auto
- Sécurise terminaux partagés

**PIN Personnel:**
- Chaque serveur a son PIN unique
- Hash SHA-256 stocké
- Traçabilité commandes (audit)

---

## 🐛 Troubleshooting

### "Pas de bouton Installer"
- **Chrome Android:** Vérifier que site HTTPS
- **iOS Safari:** Utiliser "Partager" → "Sur l'écran d'accueil"
- **Déjà installé:** Icône déjà présente

### "Données perdues"
- **Cause:** Cache navigateur vidé
- **Solution:** Configurer Supabase (ETAPES_SUPABASE.md)
- **Mode prod:** Données sauvegardées en DB

### "Pas de sync temps réel"
- **Vérifier:** Supabase configuré (.env)
- **Vérifier:** Connexion internet active
- **Fallback:** localStorage fonctionne offline

---

## 📊 Statistiques Usage

**Recommandations:**
- 1 tablette par serveur (idéal)
- WiFi stable 5Ghz
- Batterie externe si service long
- Protection écran anti-reflets

---

## 🚀 Roadmap Mobile

**V1 (Actuel):**
- ✅ PWA installable
- ✅ Layout responsive
- ✅ Sync temps réel
- ✅ Offline-first

**V2 (Futur):**
- ⏳ Notifications push
- ⏳ Scan QR codes (tables)
- ⏳ Imprimante Bluetooth
- ⏳ Mode tablette cuisine (KDS)

**V3 (Long terme):**
- ⏳ Capacitor (accès hardware)
- ⏳ NFC paiements
- ⏳ Caméra (inventaire)

---

## 📞 Support

**Guide complet:**
- Configuration: [ETAPES_SUPABASE.md](ETAPES_SUPABASE.md)
- Production: [GUIDE_PRODUCTION.md](GUIDE_PRODUCTION.md)
- Statut: [STATUS.md](STATUS.md)

**GitHub:** https://github.com/Isacgoz/smart-food-manager
