## ADDED Requirements

### Requirement: Carte de parcours

Le système SHALL présenter à l'apprenant les cours publiés et leurs leçons avec leur état de progression et de déverrouillage.

#### Scenario: Affichage du parcours
- **WHEN** un apprenant authentifié ouvre `/learn`
- **THEN** il voit les cours publiés, organisés en unités et leçons, avec l'état de chaque leçon (non commencée / en cours / complétée / verrouillée)

#### Scenario: Reprise d'une tentative en cours
- **WHEN** un apprenant rouvre une leçon dont une tentative était en cours
- **THEN** le player reprend à l'étape courante enregistrée, avec les vies restantes et la file de remise de cette tentative (voir change `gamification` pour les vies)

### Requirement: Déroulé d'une leçon

Le système SHALL faire progresser l'apprenant étape par étape dans une leçon, en affichant une barre de progression, jusqu'à ce que toutes les questions aient été finalement réussies.

#### Scenario: Avancer dans les étapes de contenu
- **WHEN** l'apprenant valide une étape de contenu
- **THEN** l'étape suivante s'affiche et la barre de progression avance

#### Scenario: Question ratée remise en file
- **WHEN** l'apprenant répond incorrectement à une question de quiz
- **THEN** un feedback négatif s'affiche (avec explication si présente), la tentative est enregistrée, et la question est replacée en fin de leçon pour être re-présentée

#### Scenario: Fin de leçon
- **WHEN** l'apprenant a répondu correctement à toutes les questions (y compris celles remises en file)
- **THEN** la leçon passe au statut `completed` et un écran de résultat s'affiche

### Requirement: Rendu et évaluation des quiz

Le système SHALL rendre les 5 types de quiz et fournir un feedback immédiat, l'évaluation étant faite côté serveur.

#### Scenario: Réponse correcte
- **WHEN** l'apprenant répond correctement à une question
- **THEN** un feedback positif s'affiche (avec explication si présente) et il peut continuer

#### Scenario: Chaque type de quiz est jouable
- **WHEN** une leçon contient des questions de type single_choice, multiple_choice, match, fill_blank ou reorder
- **THEN** chaque type s'affiche avec l'interaction appropriée et est correctement évalué côté serveur

### Requirement: Sauvegarde de progression

Le système SHALL persister l'état de la tentative à chaque étape validée, afin de permettre la reprise sans perte.

#### Scenario: Sauvegarde par étape
- **WHEN** l'apprenant valide une étape
- **THEN** l'état de la tentative (étape courante, file de remise, vies restantes) est persisté immédiatement (aucune perte si l'onglet est fermé ensuite)

#### Scenario: Complétion enregistrée définitivement
- **WHEN** une leçon est complétée
- **THEN** son statut `completed` est acquis de façon permanente, indépendamment des tentatives futures
