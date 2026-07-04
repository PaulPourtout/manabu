## 1. Server functions

- [x] 1.1 `listUsers` paginé (protégé `assertAdmin`)
- [x] 1.2 `setUserRole` (learner ↔ admin) avec garde-fou « dernier admin »
- [x] 1.3 `setUserBanned` (désactivation / réactivation) — garde-fous dernier admin + auto-désactivation

## 2. Interface back-office

- [x] 2.1 `src/routes/admin/users.tsx` : liste (email, rôle, statut)
- [x] 2.2 Action changer de rôle
- [x] 2.3 Action désactiver / réactiver

## 3. Vérification

- [x] 3.1 typecheck + build verts
- [ ] 3.2 Promotion/désactivation via l'UI — **passe runtime navigateur**
- [x] 3.3 Garde-fous « dernier admin » et auto-désactivation implémentés

## Notes

- Rôle/ban = colonnes `user` (source de vérité en base, ADR 0003). Le plugin admin de
  Better Auth refuse la session d'un utilisateur banni (`banned=true`).
- Suppression définitive de compte : hors v1.
