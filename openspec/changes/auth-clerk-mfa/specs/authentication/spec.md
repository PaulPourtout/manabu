## ADDED Requirements

### Requirement: Connexion et inscription

Le système SHALL permettre à un visiteur de créer un compte et de se connecter via Clerk (email + mot de passe au minimum), et de se déconnecter.

#### Scenario: Inscription d'un nouvel utilisateur
- **WHEN** un visiteur soumet le formulaire d'inscription avec un email et un mot de passe valides
- **THEN** un compte Clerk est créé et l'utilisateur est authentifié et redirigé vers la carte de parcours (`/learn`)

#### Scenario: Connexion d'un utilisateur existant
- **WHEN** un utilisateur enregistré fournit des identifiants valides sur `/login`
- **THEN** une session Clerk est établie et l'utilisateur accède aux pages protégées

#### Scenario: Accès non authentifié à une page protégée
- **WHEN** un visiteur non authentifié tente d'accéder à une page nécessitant une session
- **THEN** il est redirigé vers `/login`

### Requirement: Profil local synchronisé

Le système SHALL maintenir un enregistrement `user_profiles` local pour chaque utilisateur Clerk, créé/actualisé via webhook.

#### Scenario: Création du profil au premier compte
- **WHEN** Clerk émet un webhook `user.created` avec une signature valide
- **THEN** une ligne `user_profiles` est créée avec `clerk_user_id`, email, nom, rôle `learner` par défaut et valeurs de gamification initiales

#### Scenario: Webhook avec signature invalide
- **WHEN** une requête arrive sur l'endpoint webhook avec une signature Svix invalide ou absente
- **THEN** le système répond 400 et n'effectue aucune écriture en base

#### Scenario: Suppression de compte
- **WHEN** Clerk émet un webhook `user.deleted`
- **THEN** le profil local correspondant et ses données liées sont supprimés (cascade)

### Requirement: Contrôle de rôle côté serveur

Le système SHALL vérifier le rôle de l'utilisateur côté serveur pour tout accès au back-office et aux server functions sensibles.

#### Scenario: Apprenant tente d'accéder au back-office
- **WHEN** un utilisateur de rôle `learner` requête une route `admin/*` ou une server function admin
- **THEN** l'accès est refusé (redirection ou erreur 403), la vérification ne reposant pas uniquement sur l'UI

#### Scenario: Admin accède au back-office
- **WHEN** un utilisateur de rôle `admin` (profil local) requête une route `admin/*`
- **THEN** l'accès est autorisé

### Requirement: MFA obligatoire pour les admins

Le système SHALL exiger un second facteur d'authentification pour les comptes admin et l'offrir en option aux apprenants.

#### Scenario: Admin sans MFA enrôlé
- **WHEN** un admin authentifié mais sans second facteur enrôlé tente d'accéder à `admin/*`
- **THEN** il est dirigé vers l'enrôlement MFA et l'accès au back-office reste bloqué tant que le MFA n'est pas actif

#### Scenario: Apprenant active le MFA
- **WHEN** un apprenant active le MFA depuis sa page de profil
- **THEN** son compte exige le second facteur aux connexions suivantes, sans que ce soit imposé aux autres apprenants
