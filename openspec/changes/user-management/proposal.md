## Why

Le rôle admin est possédé par notre base (ADR 0003). Après le bootstrap du 1er admin par SQL, les admins doivent pouvoir gérer les autres comptes (promouvoir/rétrograder, désactiver) sans passer par la base à la main.

## What Changes

- Page back-office `/admin/users` (protégée `requireAdmin`) : liste paginée des utilisateurs (email, rôle, statut).
- Changement de rôle `learner` ↔ `admin`.
- Désactivation / réactivation d'un compte via le **ban/unban de Better Auth** (révoque les sessions, bloque la reconnexion), réversible et non destructif.
- S'appuie sur le **plugin admin de Better Auth** (listUsers, setRole, banUser/unbanUser) plutôt que de réimplémenter.

## Capabilities

### New Capabilities
- `user-management`: administration des comptes (liste, rôle, activation/désactivation) via le plugin admin de Better Auth.

### Modified Capabilities
<!-- Aucune. -->

## Impact

- Dépend de `authentication` (`requireAdmin`, plugin admin déjà configuré).
- Code : `src/routes/admin/users.tsx`, server functions d'admin (appels au plugin admin), composants de liste.
- Données : table `user` (role, banned…).
