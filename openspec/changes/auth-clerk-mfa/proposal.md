## Why

L'application a besoin d'identifier les apprenants (pour sauvegarder leur progression) et de protéger le back-office. On délègue l'authentification à Clerk (SaaS), mais l'app doit disposer d'un profil local par utilisateur (rôle, gamification) et exiger le MFA pour les admins.

## What Changes

- Intégration du provider Clerk côté client et du SDK serveur (`@clerk/tanstack-react-start`).
- Pages de connexion / inscription (`/login`, `/register`) et bouton compte dans la navigation.
- Webhook Clerk (`user.created`, `user.updated`, `user.deleted`) qui synchronise un enregistrement `user_profiles` local (miroir du compte Clerk).
- Helper serveur `requireUser()` / `requireAdmin()` pour protéger routes et server functions **côté serveur**.
- Attribution du rôle (`learner` par défaut, `admin` via `publicMetadata` Clerk synchronisée).
- MFA **obligatoire pour les admins** (blocage de l'accès `admin/*` tant que le 2e facteur n'est pas enrôlé) et optionnel pour les apprenants.

## Capabilities

### New Capabilities
- `authentication`: identification des utilisateurs via Clerk, synchronisation du profil local, gestion des rôles et exigence MFA pour les admins.

### Modified Capabilities
<!-- Aucune : première capability. -->

## Impact

- Deps : `@clerk/tanstack-react-start`, `svix` (vérif webhook).
- Code : `src/integrations/clerk/*`, `src/server/auth/*`, `src/routes/login.tsx`, `src/routes/register.tsx`, route API webhook, `src/routes/__root.tsx` (provider déjà présent).
- Données : table `user_profiles` (déjà au schéma).
- Config : variables d'env `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`.
