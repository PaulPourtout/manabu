## Why

L'application a besoin d'identifier les apprenants (pour sauvegarder leur progression) et de protéger le back-office. On utilise **Better Auth** (auto-hébergé dans notre Postgres, voir ADR 0003) : auth email/mot de passe, MFA gratuite, rôles et bannissement gérés en base.

## What Changes

- Intégration de Better Auth (config serveur `src/lib/auth/auth.ts`, client `src/lib/auth/auth-client.ts`, route `/api/auth/$`).
- Tables d'auth dans notre Postgres (`user`, `session`, `account`, `verification`, `two_factor`) — voir `src/db/auth-schema.ts`. Le rôle (`learner`/`admin`) et le statut de bannissement vivent sur la table `user`.
- Pages de connexion / inscription (`/login`, `/register`) et déconnexion.
- Helpers serveur `requireUser()` / `requireAdmin()` pour protéger routes et server functions **côté serveur**.
- **MFA** (plugin twoFactor : TOTP + codes de secours) : obligatoire pour les admins, optionnelle pour les apprenants.
- Bootstrap du 1er admin par mise à jour en base (`UPDATE "user" SET role='admin'`).

## Capabilities

### New Capabilities
- `authentication`: identification via Better Auth, rôles en base, exigence MFA pour les admins, protection serveur du back-office.

### Modified Capabilities
<!-- Aucune : première capability. -->

## Impact

- Deps : `better-auth` (retrait de `@clerk/*`, `svix`).
- Code : `src/lib/auth/*`, `src/routes/api/auth/$.ts`, `src/routes/login.tsx`, `src/routes/register.tsx`, guards serveur.
- Données : tables Better Auth (`user`…) déjà au schéma.
- Config : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (+ config email pour vérif/reset).
