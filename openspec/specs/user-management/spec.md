# user-management Specification

## Purpose
TBD - created by archiving change user-management. Update Purpose after archive.
## Requirements
### Requirement: Liste des utilisateurs

Le système SHALL permettre à un admin de consulter la liste des utilisateurs avec leur email, rôle et statut (actif / désactivé).

#### Scenario: Consulter la liste
- **WHEN** un admin ouvre `/admin/users`
- **THEN** il voit les utilisateurs avec email, rôle et statut, la liste étant paginée

#### Scenario: Accès refusé aux non-admins
- **WHEN** un `learner` tente d'accéder à `/admin/users`
- **THEN** l'accès est refusé côté serveur

### Requirement: Changement de rôle

Le système SHALL permettre à un admin de promouvoir un utilisateur en `admin` ou de le rétrograder en `learner`.

#### Scenario: Promotion
- **WHEN** un admin change le rôle d'un utilisateur en `admin`
- **THEN** `user.role` est mis à jour et l'utilisateur accède au back-office (MFA requise, cf. `authentication`)

#### Scenario: Rétrogradation
- **WHEN** un admin change le rôle d'un `admin` en `learner`
- **THEN** l'utilisateur perd l'accès au back-office

### Requirement: Désactivation / réactivation réversible

Le système SHALL permettre de désactiver un compte (ban) et de le réactiver (unban), sans perte de données.

#### Scenario: Désactivation
- **WHEN** un admin désactive un compte
- **THEN** l'utilisateur est banni (sessions révoquées, reconnexion bloquée) et apparaît comme désactivé, sa progression restant intacte

#### Scenario: Réactivation
- **WHEN** un admin réactive un compte désactivé
- **THEN** le bannissement est levé et l'utilisateur peut se reconnecter, avec sa progression et son XP intacts

#### Scenario: Pas de suppression accidentelle
- **WHEN** un admin désactive un compte
- **THEN** aucune donnée n'est supprimée (la désactivation n'est jamais une suppression)

