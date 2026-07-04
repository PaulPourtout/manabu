## 1. Config & pages d'auth (fondation déjà en place)

- [x] 1.1 Config serveur `src/lib/auth/auth.ts` (Better Auth + plugins twoFactor/admin/tanstackStartCookies)
- [x] 1.2 Client `src/lib/auth/auth-client.ts`
- [x] 1.3 Route `/api/auth/$` montant `auth.handler`
- [ ] 1.4 Page `src/routes/login.tsx` (connexion)
- [ ] 1.5 Page `src/routes/register.tsx` (inscription) + redirection vers `/learn`
- [ ] 1.6 Bouton de déconnexion dans la navigation

## 2. Guards serveur

- [ ] 2.1 `src/lib/auth/session.ts` : `getCurrentUser()` (session Better Auth)
- [ ] 2.2 `requireUser()` (redirige vers `/login` si non authentifié)
- [ ] 2.3 `requireAdmin()` (rôle `admin` + MFA enrôlé, sinon 403/redirection)

## 3. MFA

- [ ] 3.1 Activer/afficher l'enrôlement MFA (TOTP + codes de secours) sur le profil
- [ ] 3.2 Imposer le 2e facteur pour l'accès `admin/*` (contrôle serveur)
- [ ] 3.3 Flag d'env pour assouplir l'exigence MFA en dev

## 4. Emails

- [ ] 4.1 Brancher un provider d'envoi (vérification d'email / reset de mot de passe)
- [ ] 4.2 Désactiver la vérification d'email en dev

## 5. Vérification

- [x] 5.1 Sign-up/get-session opérationnels (testés en runtime)
- [ ] 5.2 Apprenant bloqué sur `admin/*`, admin autorisé
- [ ] 5.3 Enrôlement MFA + connexion avec 2e facteur
