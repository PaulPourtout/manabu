# Manabu — Cahier des charges produit (PRD)

> Nom de code du projet : **Manabu** (学ぶ, « apprendre » en japonais). À renommer si besoin.

## 1. Contexte & vision

Manabu est une application web d'apprentissage gamifiée, inspirée de Duolingo : l'utilisateur progresse dans des **cours** découpés en **unités** puis en **leçons**, alternant des **phases de contenu** (leçon) et des **phases d'évaluation** (quiz), avec des mécaniques de jeu (XP, séries, vies, niveaux, badges) qui encouragent la régularité et l'engagement.

Un **back-office** permet à des administrateurs/formateurs de créer ce contenu pédagogique manuellement ou de l'importer en masse via un fichier (JSON), sans toucher au code.

L'application doit être utilisable aussi bien sur mobile (usage principal, à la Duolingo) que sur tablette et desktop.

## 2. Objectifs

- Permettre à un apprenant de suivre un parcours structuré, de sauvegarder sa progression et d'être motivé à revenir régulièrement.
- Permettre à un administrateur de créer/éditer du contenu pédagogique sans développeur, et d'importer des cours entiers via un fichier structuré.
- Fournir une expérience mobile-first fluide, comparable en fluidité à une app native, tout en restant une PWA/web app classique en v1 (pas d'app native prévue).

## 3. Personas

| Persona                         | Besoins                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Apprenant**                   | S'inscrire/se connecter, voir son parcours, faire des leçons et quiz, suivre sa progression, être récompensé (XP, streak, badges), reprendre où il s'est arrêté sur n'importe quel appareil.           |
| **Admin / créateur de contenu** | Créer des cours, unités, leçons et quiz via une interface, ou importer un fichier JSON pour générer plusieurs leçons/quiz d'un coup, prévisualiser le rendu avant publication, gérer les utilisateurs. |

## 4. Périmètre fonctionnel (v1)

### 4.1 Authentification & comptes

- Inscription / connexion par email + mot de passe.
- Session persistante (cookie), déconnexion.
- Rôles : `learner` (par défaut) et `admin`.
- Page de profil basique (nom, avatar simple, stats : XP total, streak actuel, niveau).
- **MFA (authentification à deux facteurs)** : obligatoire pour les comptes `admin` (accès au back-office) ; optionnel et activable par l'utilisateur pour les comptes `learner`, depuis la page de profil.
- _Hors v1 (envisageable plus tard)_ : OAuth (Google), réinitialisation de mot de passe par email, vérification d'email.

### 4.2 Structure du contenu pédagogique

Hiérarchie : **Cours → Unités → Leçons → Étapes (steps)**.

- Une **leçon** est une séquence d'**étapes**, chaque étape étant soit :
  - une **étape de contenu** (texte, image, exemple, explication) — la "phase de leçon" ;
  - une **étape de quiz** (question à choix unique, choix multiples, association, texte à trous, remise dans l'ordre) — la "phase de quiz".
- Une leçon peut mélanger librement des étapes de contenu et des étapes de quiz (comme Duolingo qui alterne explications courtes et exercices).
- Les unités et leçons sont **débloquées progressivement** : une leçon/unité n'est accessible que si la précédente est complétée (avec un seuil de réussite minimum au quiz, ex. 70%).

### 4.3 Déroulé d'une leçon (expérience apprenant)

1. L'apprenant sélectionne une leçon débloquée depuis la carte de parcours (« learning path »).
2. Il avance étape par étape (barre de progression en haut, façon Duolingo).
3. Sur les étapes de quiz, il répond ; feedback immédiat (correct/incorrect), explication optionnelle.
4. Une réponse incorrecte coûte une **vie** et la question est **remise en fin de leçon** (à re-réussir pour terminer) — cf. gamification. Il n'y a pas de note en pourcentage.
5. La leçon est **terminée** quand toutes les questions ont été finalement réussies sans tomber à 0 vie ; écran de résultat (XP gagné, streak mis à jour, éventuel badge). Si les vies tombent à 0, la tentative échoue et peut être **recommencée immédiatement**.
6. L'état de la tentative (étape courante, vies, file de remise) est sauvegardé à chaque étape validée : reprise à l'identique si l'utilisateur quitte en cours de route.

### 4.4 Gamification (niveau complet)

- **XP** : gagné à la complétion de chaque leçon (bonus si leçon **parfaite** = aucune vie perdue), affiché sur le profil et potentiellement un classement.
- **Streak (série de jours)** : incrémenté chaque jour où l'utilisateur complète au moins une leçon, calculé dans **son fuseau horaire** ; remise à zéro si un jour est manqué (« gel de streak » envisageable en v2).
- **Vies (hearts) par tentative** : chaque tentative de leçon démarre avec des vies fraîches (défaut 3), consommées par mauvaise réponse ; à 0 vie, la tentative échoue et peut être **recommencée immédiatement** (pas de stock global entre leçons, pas d'attente/régénération, pas d'achat de vies). Voir ADR 0001.
- **Niveaux / déverrouillage progressif** : leçons débloquées en **ordre linéaire strict** au sein d'un cours (la première est ouverte ; chacune ouvre la suivante).
- **Badges / succès** : obtenus sur critères (ex. « 7 jours de streak », « première leçon parfaite », « cours terminé »).
- _Hors v1 (envisageable v2)_ : classement social entre amis, ligues hebdomadaires, notifications de rappel.

### 4.5 Suivi de progression

- Table de bord apprenant : cours en cours, % de progression par cours/unité, historique des leçons complétées, XP total, streak, badges obtenus.
- Progression stockée par utilisateur, par leçon (statut : non commencé / en cours / complété, meilleur score, date de dernière complétion).

### 4.6 Back-office

Accessible aux utilisateurs `admin` uniquement.

- **Gestion des cours** : CRUD cours / unités / leçons / étapes / questions de quiz, via formulaires.
- **Import en masse** : upload d'un fichier **JSON** structuré (cf. `docs/LESSON_FORMAT.md`) qui génère automatiquement un cours complet (unités, leçons, étapes, quiz). Validation du fichier avant import avec retour d'erreurs clair (schéma invalide, champ manquant, etc.).
- **Prévisualisation** : possibilité de visualiser une leçon comme le ferait un apprenant, avant publication.
- **Statut de publication** : brouillon / publié, pour ne pas exposer un cours en cours de préparation.
- **Gestion des utilisateurs** : liste des utilisateurs, changement de rôle, désactivation de compte.
- _Hors v1_ : édition collaborative multi-admin en temps réel, versionning fin du contenu (un simple horodatage de dernière modification suffit).

## 5. Exigences non-fonctionnelles

- **Mobile-first & responsive** : conçu et testé d'abord pour mobile (largeur ~360–430px), puis adapté à la tablette et au desktop. Navigation adaptée par breakpoint (ex. barre de navigation basse sur mobile, barre latérale sur desktop).
- **Performance** : chargement initial rapide, navigation entre leçons sans rechargement complet de page (SPA-like grâce au routing client de TanStack Start).
- **Accessibilité** : contrastes suffisants, zones tactiles ≥ 44px sur mobile, navigation clavier possible sur desktop.
- **Fiabilité de la progression** : aucune perte de progression en cas de fermeture de l'onglet en cours de leçon (sauvegarde par étape).
- **Sécurité** : mots de passe hashés, sessions sécurisées, back-office protégé par contrôle de rôle côté serveur (pas seulement côté UI).
- **Déploiement simple** : l'ensemble (app + base de données) doit pouvoir démarrer avec une commande Docker, en local comme en environnement de démo/production.

## 6. Hors périmètre (v1)

- Application mobile native (iOS/Android) — v1 = web responsive uniquement.
- Paiement / abonnement / achat de vies.
- Fonctionnalités sociales avancées (amis, classements globaux, chat).
- Notifications push / emails transactionnels.
- Multi-langue de l'interface (i18n) — le contenu pédagogique peut porter sur une langue, mais l'UI de l'app sera en une seule langue en v1 (français).

## 7. Critères de succès v1

- Un apprenant peut s'inscrire, faire une leçon complète (mélange contenu + quiz) sur mobile, voir son XP/streak mis à jour et retrouver sa progression après reconnexion.
- Un admin peut importer un fichier JSON de cours et voir apparaître les leçons correspondantes, prêtes à être publiées.
- L'application démarre entièrement via `docker compose up` (app + PostgreSQL) sans configuration manuelle supplémentaire.
