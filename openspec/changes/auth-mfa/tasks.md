## 1. Config & pages d'auth (fondation déjà en place)

- [x] 1.1 Config serveur `src/lib/auth/auth.ts` (Better Auth + plugins twoFactor/admin/tanstackStartCookies)
- [x] 1.2 Client `src/lib/auth/auth-client.ts`
- [x] 1.3 Route `/api/auth/$` montant `auth.handler`
- [x] 1.4 Page `src/routes/login.tsx` (connexion) + gestion du 2e facteur
- [x] 1.5 Page `src/routes/register.tsx` (inscription) + redirection vers `/learn`
- [x] 1.6 Bouton de déconnexion (page profil)

## 2. Guards serveur

- [x] 2.1 `src/lib/auth/session.ts` : `getCurrentUser()` (session Better Auth)
- [x] 2.2 `requireUser()` (redirige vers `/login` si non authentifié)
- [x] 2.3 `requireAdmin()` (rôle `admin` + MFA enrôlé, sinon redirection)

## 3. MFA

- [x] 3.1 Enrôlement MFA (TOTP + codes de secours) sur le profil
- [x] 3.2 Imposer le 2e facteur pour l'accès `admin/*` (contrôle serveur)
- [x] 3.3 Flag d'env pour assouplir l'exigence MFA en dev (`AUTH_REQUIRE_ADMIN_MFA`)

## 4. Emails

- [ ] 4.1 Brancher un provider d'envoi (vérification d'email / reset de mot de passe) — **différé** (nécessite un provider externe)
- [x] 4.2 Vérification d'email désactivée en dev (`requireEmailVerification: false`)

## 5. Vérification

- [x] 5.1 Sign-up/get-session opérationnels (testés en runtime)
- [x] 5.2 Apprenant bloqué sur `admin/*` (→ /), admin autorisé ; admin sans MFA → /profile (vérifié en runtime)
- [x] 5.3 Enrôlement MFA (backend `two-factor/enable` vérifié : totpURI + codes) ; page `verify-2fa` câblée (saisie du code TOTP = test manuel avec authenticator)
