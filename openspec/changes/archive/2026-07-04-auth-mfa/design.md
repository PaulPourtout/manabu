## Context

Better Auth gère l'auth (sessions, hashing, MFA) **dans notre PostgreSQL** via l'adapter Drizzle (ADR 0003). Le rôle et les champs de gamification vivent sur la table `user`. Pas de service tiers, pas de webhook.

## Goals / Non-Goals

**Goals:**
- Auth email/mot de passe + déconnexion.
- Guards serveur réutilisables (`requireUser`, `requireAdmin`).
- MFA gratuite, imposée aux admins.
- Rôle possédé par notre base.

**Non-Goals:**
- OAuth social (activable plus tard via un plugin Better Auth).
- Gestion fine des permissions au-delà de `learner`/`admin`.

## Decisions

- **SDK** : `better-auth` côté serveur (`src/lib/auth/auth.ts`) + `better-auth/react` côté client (`auth-client.ts`). Route `/api/auth/$` monte `auth.handler`.
- **Plugins** : `twoFactor` (MFA), `admin` (rôle + ban + gestion des utilisateurs), `tanstackStartCookies` (cookies dans le contexte TanStack Start).
- **Rôle** : champ `user.role` (`learner` par défaut via `defaultRole`, `admin` dans `adminRoles`). Source de vérité = notre base.
- **Guards** : `getCurrentUser()` lit la session Better Auth ; `requireUser()` redirige si absent ; `requireAdmin()` vérifie `role === 'admin'` + MFA enrôlé.
- **MFA admin** : contrôle serveur de la présence du second facteur à l'entrée de `admin/*` ; flag d'env pour assouplir en dev.
- **Emails** : la vérification d'email / réinitialisation nécessitent un provider d'envoi (à brancher) ; en dev, vérification d'email désactivée.

## Risks / Trade-offs

- **Exploitation** : nous gérons secret, cookies sécurisés en prod, et l'envoi d'emails (contrepartie de l'auto-hébergement).
- **Écart de types** : l'option `server.handlers` des routes API peut précéder les types de la version de react-router installée (fonctionne au build/runtime).
