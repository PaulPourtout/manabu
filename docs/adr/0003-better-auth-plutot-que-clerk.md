# Better Auth (auto-hébergé) plutôt que Clerk

> Remplace l'ADR **0002** (Clerk comme source de vérité du rôle), désormais **caduc**.

## Décision

L'authentification est assurée par **Better Auth**, bibliothèque open-source **auto-hébergée** dans notre propre PostgreSQL (via l'adapter Drizzle), et non par un SaaS managé (Clerk).

- **MFA** : activée via le plugin 2FA de Better Auth (TOTP + codes de secours) — **gratuite**, obligatoire pour les admins, optionnelle pour les apprenants.
- **Données d'auth dans notre base** : Better Auth crée ses tables (`user`, `session`, `account`, `verification`). L'utilisateur **est** en base — plus de table « miroir » ni de webhook de synchronisation.
- **Rôle** : simple champ sur l'utilisateur (`learner` / `admin`), **possédé par notre base** (fin du débat source-de-vérité). Bootstrap du 1er admin par `UPDATE` SQL (ou seed) ; promotions ultérieures via la page user-management qui écrit en base.
- **Désactivation** : drapeau local (`is_active`) + révocation de session gérée par Better Auth (pas d'API de ban externe). Le plugin `admin` de Better Auth (liste des utilisateurs, ban, changement de rôle, impersonation) peut couvrir une partie du change `user-management`.

## Pourquoi

- **MFA gratuite** : Clerk réserve la MFA à un palier payant ; Better Auth l'offre sans surcoût — critère décisif pour un projet démarrant en hobby.
- **Pas de lock-in, données maîtrisées** : l'auth vit dans notre Postgres, pas chez un tiers.
- **Fit natif** avec la stack (TanStack Start + Drizzle), c'était le choix d'origine.
- **Sécurité** : on s'appuie sur du code d'auth éprouvé (≠ auth 100 % maison, écartée car trop risquée) ; « managé vs auto-hébergé vetted » n'est pas un écart de sécurité intrinsèque mais un arbitrage responsabilité/coût/lock-in.
- Écarté : **Clerk** (MFA payante, lock-in) ; **Supabase Auth** (MFA gratuite mais réintroduit une plateforme managée) ; **auth maison** (risque de sécurité) ; **Keycloak/Ory** (trop lourds pour l'échelle actuelle).

## Conséquences

- **Contrepartie d'exploitation** : nous gérons l'envoi d'emails (vérification / réinitialisation) et la configuration de prod (secret, cookies sécurisés).
- **Dépendances** : retirer `@clerk/tanstack-react-start` et `svix` ; ajouter `better-auth`. Remplacer `src/integrations/clerk/*` par la config Better Auth. Variables d'env : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (+ config email) à la place des clés Clerk/webhook.
- **Schéma** : `user_profiles` fusionne avec l'utilisateur Better Auth (champs additionnels : `role`, XP/streak, `timezone`, `is_active`). Plus de webhook ni de miroir.
- **Specs / docs à aligner** : `auth-clerk-mfa` → renommer `auth-mfa` (Better Auth, sans webhook), `user-management` (écrit en base, éventuel plugin admin), `PRD.md` §4.1, `ARCHITECTURE.md` (auth, env), `README.md`, `.env.example`, `JOURNAL.md`. L'ADR 0002 est abandonné.
