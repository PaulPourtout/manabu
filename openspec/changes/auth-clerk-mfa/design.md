## Context

Clerk gère l'auth (sessions, hashing, MFA). L'app (TanStack Start) doit exposer le provider côté client et vérifier la session côté serveur. Le rôle et la gamification vivent dans `user_profiles` (Postgres), pas dans Clerk.

## Goals / Non-Goals

**Goals:**
- Auth email/mot de passe fonctionnelle + déconnexion.
- Profil local synchronisé de façon fiable via webhook signé.
- Guard serveur réutilisable (`requireUser`, `requireAdmin`).
- MFA imposé aux admins.

**Non-Goals:**
- OAuth social (activable plus tard dans le dashboard Clerk, sans code).
- Réinitialisation de mot de passe custom (gérée par Clerk).
- Gestion fine des permissions au-delà de `learner`/`admin`.

## Decisions

- **SDK** : `@clerk/tanstack-react-start` fournit `<ClerkProvider>` (déjà câblé dans `__root.tsx`) + helpers serveur (`getAuth`) utilisables dans les server functions et loaders.
- **Webhook** : route API `POST /api/clerk/webhook` ; vérification de signature avec `svix` et `CLERK_WEBHOOK_SIGNING_SECRET` ; upsert `user_profiles` par `clerk_user_id`.
- **Rôle** : source de vérité = `user_profiles.role`. Le passage à `admin` se fait via `publicMetadata` Clerk (répercuté au webhook `user.updated`) ou manuellement en base. Le guard lit le profil local.
- **Guards** : `requireUser()` récupère la session Clerk + le profil local (le crée en fallback si le webhook a été manqué) ; `requireAdmin()` ajoute la vérif de rôle + MFA.
- **MFA admin** : contrôle serveur sur la présence du 2e facteur (claims de session Clerk) à l'entrée de `admin/*`.

## Risks / Trade-offs

- **Webhook manqué** (dev local sans tunnel) → fallback de création de profil à la première requête authentifiée, pour ne pas bloquer le dev.
- **Latence de synchro** rôle Clerk ↔ profil local → acceptable ; le profil local reste la référence pour l'autorisation.
- **MFA en dev** : possibilité de désactiver l'exigence via env pour faciliter les tests locaux.
