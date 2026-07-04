# authentication Specification

## Purpose
TBD - created by archiving change auth-mfa. Update Purpose after archive.
## Requirements
### Requirement: Connexion et inscription

Le système SHALL permettre à un visiteur de créer un compte et de se connecter via Better Auth (email + mot de passe), et de se déconnecter.

#### Scenario: Inscription d'un nouvel utilisateur
- **WHEN** un visiteur soumet le formulaire d'inscription avec un email et un mot de passe valides
- **THEN** un utilisateur est créé (rôle `learner` par défaut) et est authentifié puis redirigé vers la carte de parcours (`/learn`)

#### Scenario: Connexion d'un utilisateur existant
- **WHEN** un utilisateur enregistré fournit des identifiants valides sur `/login`
- **THEN** une session est établie et il accède aux pages protégées

#### Scenario: Accès non authentifié à une page protégée
- **WHEN** un visiteur non authentifié tente d'accéder à une page nécessitant une session
- **THEN** il est redirigé vers `/login`

### Requirement: Rôles en base

Le système SHALL stocker le rôle (`learner` / `admin`) sur l'utilisateur en base et l'utiliser pour l'autorisation.

#### Scenario: Rôle par défaut
- **WHEN** un compte est créé
- **THEN** il reçoit le rôle `learner`

#### Scenario: Promotion en admin
- **WHEN** le rôle d'un utilisateur passe à `admin` (bootstrap SQL ou page user-management)
- **THEN** cet utilisateur accède au back-office aux connexions suivantes

### Requirement: Contrôle de rôle côté serveur

Le système SHALL vérifier le rôle côté serveur pour tout accès au back-office et aux server functions sensibles.

#### Scenario: Apprenant tente d'accéder au back-office
- **WHEN** un utilisateur `learner` requête une route `admin/*` ou une server function admin
- **THEN** l'accès est refusé (redirection ou 403), la vérification ne reposant pas uniquement sur l'UI

#### Scenario: Admin accède au back-office
- **WHEN** un utilisateur `admin` requête une route `admin/*`
- **THEN** l'accès est autorisé

### Requirement: MFA obligatoire pour les admins

Le système SHALL exiger un second facteur (TOTP + codes de secours) pour les comptes admin et l'offrir en option aux apprenants.

#### Scenario: Admin sans MFA enrôlé
- **WHEN** un admin authentifié mais sans second facteur enrôlé tente d'accéder à `admin/*`
- **THEN** il est dirigé vers l'enrôlement MFA et l'accès au back-office reste bloqué tant que le MFA n'est pas actif

#### Scenario: Apprenant active le MFA
- **WHEN** un apprenant active le MFA depuis son profil
- **THEN** son compte exige le second facteur aux connexions suivantes, sans que ce soit imposé aux autres apprenants

