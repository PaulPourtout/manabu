## 1. Provider & pages d'auth

- [ ] 1.1 Vérifier le câblage `<ClerkProvider>` dans `__root.tsx` et le header user (déjà scaffoldés)
- [ ] 1.2 Créer `src/routes/login.tsx` avec `<SignIn />`
- [ ] 1.3 Créer `src/routes/register.tsx` avec `<SignUp />`
- [ ] 1.4 Ajouter la redirection après connexion vers `/learn`

## 2. Guards serveur

- [ ] 2.1 Créer `src/server/auth/session.ts` avec `getCurrentUser()` (session Clerk + profil local)
- [ ] 2.2 Implémenter `requireUser()` (redirige vers `/login` si non authentifié)
- [ ] 2.3 Implémenter `requireAdmin()` (rôle `admin` + MFA enrôlé, sinon 403/redirection)
- [ ] 2.4 Fallback : créer le profil local si absent lors de la 1re requête authentifiée

## 3. Webhook de synchronisation

- [ ] 3.1 Créer la route API `POST /api/clerk/webhook`
- [ ] 3.2 Vérifier la signature Svix avec `CLERK_WEBHOOK_SIGNING_SECRET`
- [ ] 3.3 Gérer `user.created` / `user.updated` (upsert `user_profiles`, mapping `publicMetadata.role`)
- [ ] 3.4 Gérer `user.deleted` (suppression cascade)

## 4. MFA

- [ ] 4.1 Configurer le MFA dans le dashboard Clerk (TOTP + backup codes)
- [ ] 4.2 Imposer le 2e facteur pour l'accès `admin/*` (contrôle serveur)
- [ ] 4.3 Exposer l'activation MFA optionnelle sur la page de profil (`<UserProfile />`)
- [ ] 4.4 Flag d'env pour assouplir l'exigence MFA en dev

## 5. Vérification

- [ ] 5.1 Test manuel : inscription → profil local créé → accès `/learn`
- [ ] 5.2 Test manuel : apprenant bloqué sur `admin/*`, admin autorisé
- [ ] 5.3 Test du webhook (payload signé) et rejet d'une signature invalide
