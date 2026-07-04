## 1. Server functions (plugin admin)

- [ ] 1.1 `listUsers` paginé (protégé `requireAdmin`)
- [ ] 1.2 `setUserRole` (learner ↔ admin) avec garde-fou « dernier admin »
- [ ] 1.3 `banUser` / `unbanUser` (désactivation / réactivation)

## 2. Interface back-office

- [ ] 2.1 `src/routes/admin/users.tsx` : liste paginée (email, rôle, statut)
- [ ] 2.2 Action changer de rôle
- [ ] 2.3 Action désactiver / réactiver (avec confirmation)

## 3. Vérification

- [ ] 3.1 Promouvoir un learner → accès back-office (MFA requise)
- [ ] 3.2 Désactiver un compte → reconnexion bloquée ; réactiver → accès rétabli, données intactes
- [ ] 3.3 Empêcher la rétrogradation/désactivation du dernier admin
