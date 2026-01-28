# Configuration Email de Confirmation - Supabase

## Contexte

Actuellement, l'application fonctionne en mode **auto-confirm** : les comptes sont créés instantanément sans validation email.

Pour activer l'envoi d'emails de confirmation à l'inscription, suivez ces étapes.

---

## ÉTAPE 1 : Accéder au Dashboard Supabase

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet **Smart Food Manager**

---

## ÉTAPE 2 : Activer Email Confirmations

### Navigation
```
Dashboard → Authentication → Settings
```

### Paramètres à modifier

1. **Cherchez la section : "Email Auth"**

2. **Trouvez l'option :**
   ```
   Enable email confirmations
   ```

3. **État actuel (probablement) :**
   ```
   ❌ Disabled
   ```

4. **Activez :**
   ```
   ✅ Enable email confirmations
   ```

5. **Sauvegardez** les changements

---

## ÉTAPE 3 : Configurer l'Email Template (Recommandé)

### Navigation
```
Dashboard → Authentication → Email Templates
```

### Template "Confirm signup"

1. **Cliquez sur** "Confirm signup"

2. **Personnalisez le message** (optionnel)

   **Template par défaut :**
   ```html
   <h2>Confirmez votre email</h2>
   <p>Cliquez sur le lien ci-dessous pour activer votre compte :</p>
   <p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
   ```

   **Template personnalisé suggéré :**
   ```html
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <h2 style="color: #10b981;">Bienvenue sur Smart Food Manager !</h2>

     <p>Merci de vous être inscrit(e) à Smart Food Manager.</p>

     <p>Pour activer votre compte et commencer à gérer votre restaurant, cliquez sur le bouton ci-dessous :</p>

     <div style="text-align: center; margin: 30px 0;">
       <a href="{{ .ConfirmationURL }}"
          style="background-color: #10b981;
                 color: white;
                 padding: 15px 30px;
                 text-decoration: none;
                 border-radius: 8px;
                 font-weight: bold;
                 display: inline-block;">
         ✅ CONFIRMER MON EMAIL
       </a>
     </div>

     <p style="color: #666; font-size: 12px;">
       Si vous n'avez pas créé de compte, ignorez cet email.
     </p>

     <p style="color: #666; font-size: 12px;">
       Ce lien expire dans 24 heures.
     </p>
   </div>
   ```

3. **Variables disponibles :**
   - `{{ .ConfirmationURL }}` - Lien de confirmation
   - `{{ .SiteURL }}` - URL de votre app
   - `{{ .Token }}` - Token de confirmation (si besoin custom)

4. **Sauvegardez** le template

---

## ÉTAPE 4 : Configurer URL de Redirection

### Dans le code (déjà fait ✅)

Le code SaaSLogin.tsx:357 inclut déjà :
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

### Dans Supabase Settings

1. **Navigation :**
   ```
   Dashboard → Authentication → URL Configuration
   ```

2. **Vérifiez "Redirect URLs" :**
   ```
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```

3. **Si manquant, ajoutez-les**

---

## ÉTAPE 5 : Tester le Flow Complet

### Test en local

1. **Créez un nouveau compte** avec un email réel

2. **Vérifiez la console** :
   ```
   ✅ Compte créé avec succès!

   📧 Un email de confirmation a été envoyé à votre@email.com.

   Veuillez cliquer sur le lien dans l'email pour activer votre compte avant de vous connecter.
   ```

3. **Vérifiez votre boîte mail** (inbox + spam)

4. **Cliquez sur le lien** de confirmation

5. **Résultat attendu :**
   - Redirection vers `/auth/callback`
   - Message : "Email confirmé !"
   - Login possible

---

## Comportement AVANT activation

### À l'inscription :
```
✅ Compte créé
❌ Pas d'email envoyé
✅ Login direct possible
```

### Flow utilisateur :
1. Créer compte
2. Login immédiat (auto-confirm)

---

## Comportement APRÈS activation

### À l'inscription :
```
✅ Compte créé
✅ Email de confirmation envoyé
❌ Login bloqué jusqu'à confirmation
```

### Flow utilisateur :
1. Créer compte
2. Voir message "Email envoyé"
3. Ouvrir email
4. Cliquer sur lien
5. Redirection → Email confirmé
6. Login possible

---

## Troubleshooting

### Problème : "Email non reçu"

**Vérifications :**

1. **Vérifier spam/courrier indésirable**

2. **Vérifier configuration SMTP Supabase :**
   ```
   Dashboard → Project Settings → Auth
   ```

3. **Vérifier Rate Limits :**
   - Supabase limite à 3 emails/heure en mode gratuit
   - Pour plus : upgrade plan

4. **Tester avec email service confirmé :**
   - Gmail ✅
   - Outlook ✅
   - Yahoo ✅
   - Emails entreprise : vérifier filtres

### Problème : "Email confirmé mais login impossible"

**Solution :**
1. Vérifier RLS policies sur table `app_state`
2. Vérifier que `company_id` correspond à `user.id`

### Problème : "Lien de confirmation expiré"

**Durée de validité :** 24h par défaut

**Renvoyer confirmation :**
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: 'user@email.com'
})
```

---

## Configuration Avancée (Optionnel)

### Custom SMTP (Plan payant)

Pour utiliser votre propre serveur email (SendGrid, Mailgun, etc.) :

1. **Dashboard → Project Settings → Auth**

2. **Section "SMTP Settings"**

3. **Configurer :**
   ```
   SMTP Host: smtp.votreservice.com
   SMTP Port: 587
   SMTP User: votre-username
   SMTP Password: votre-mot-de-passe
   ```

4. **Enable custom SMTP** ✅

### Double Opt-in (Recommandé production)

Pour forcer confirmation avant toute action :

**Modifier RLS policy app_state :**
```sql
CREATE POLICY "Users can only access confirmed accounts"
ON app_state
FOR SELECT
USING (
  auth.uid() = id
  AND
  (SELECT email_confirmed_at FROM auth.users WHERE id = auth.uid()) IS NOT NULL
);
```

---

## Résumé Configuration

| Paramètre | Valeur |
|-----------|--------|
| Email Confirmations | ✅ ON |
| Email Template | Personnalisé (optionnel) |
| Redirect URL | `{origin}/auth/callback` |
| Expiration lien | 24h (défaut) |
| Code modifié | ✅ SaaSLogin.tsx ligne 377-383 |

---

## Questions Fréquentes

**Q: Puis-je tester sans vraie adresse email ?**
R: Oui, utilisez https://temp-mail.org pour emails temporaires

**Q: Les anciens comptes doivent-ils reconfirmer ?**
R: Non, seuls les nouveaux comptes créés après activation du setting

**Q: Combien d'emails gratuits avec Supabase ?**
R: Plan gratuit : ~3 emails/heure. Plan Pro : illimité

**Q: Que se passe-t-il si je désactive après ?**
R: Retour en mode auto-confirm pour nouveaux comptes uniquement

---

## Support

**Documentation Supabase :**
https://supabase.com/docs/guides/auth/auth-email

**Support Supabase :**
https://supabase.com/support

**Issues GitHub Smart Food Manager :**
[Créer une issue si problème]

---

**Dernière mise à jour :** 2026-01-26
**Version Smart Food Manager :** Pre-Sprint 2
