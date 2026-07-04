## Context

Le plugin admin de Better Auth fournit déjà les opérations de gestion (liste, rôle, ban/unban). On expose une UI back-office par-dessus, protégée serveur.

## Goals / Non-Goals

**Goals:**
- Liste paginée des utilisateurs.
- Changement de rôle et désactivation/réactivation réversibles.
- S'appuyer sur le plugin admin (pas de réimplémentation).

**Non-Goals:**
- Suppression définitive de compte (destructive) — hors v1.
- Gestion fine de permissions/organisations.

## Decisions

- **Plugin admin Better Auth** : opérations `listUsers`, `setRole`, `banUser`/`unbanUser` appelées côté serveur (server functions protégées `requireAdmin`).
- **Désactivation = ban** : réversible, non destructif ; révoque les sessions. Pas de table/flag séparé (le champ `banned` du plugin fait foi).
- **Garde-fous** : un admin ne peut pas se rétrograder/désactiver lui-même s'il est le dernier admin (éviter le lockout).

## Risks / Trade-offs

- **Dernier admin** : prévoir la protection anti-lockout.
- **Cohérence UI/serveur** : la liste reflète l'état Better Auth (source unique).
