## ADDED Requirements

### Requirement: Carte de parcours

Le système SHALL présenter à l'apprenant les cours publiés et leurs leçons avec leur état de progression.

#### Scenario: Affichage du parcours
- **WHEN** un apprenant authentifié ouvre `/learn`
- **THEN** il voit les cours publiés, organisés en unités et leçons, avec l'état de chaque leçon (non commencée / en cours / complétée)

#### Scenario: Reprise d'une leçon en cours
- **WHEN** un apprenant rouvre une leçon qu'il avait quittée en cours de route
- **THEN** le player reprend à la première étape non validée

### Requirement: Déroulé d'une leçon

Le système SHALL faire progresser l'apprenant étape par étape dans une leçon, en affichant une barre de progression.

#### Scenario: Avancer dans les étapes de contenu
- **WHEN** l'apprenant valide une étape de contenu
- **THEN** l'étape suivante s'affiche et la barre de progression avance

#### Scenario: Fin de leçon
- **WHEN** l'apprenant valide la dernière étape
- **THEN** un écran de résultat s'affiche avec le score obtenu

### Requirement: Rendu et évaluation des quiz

Le système SHALL rendre les 5 types de quiz et fournir un feedback immédiat.

#### Scenario: Réponse correcte
- **WHEN** l'apprenant répond correctement à une question de quiz
- **THEN** un feedback positif s'affiche, avec l'explication si elle existe, et il peut continuer

#### Scenario: Réponse incorrecte
- **WHEN** l'apprenant répond incorrectement
- **THEN** un feedback négatif s'affiche avec la bonne réponse/explication, et la tentative est enregistrée

#### Scenario: Chaque type de quiz est jouable
- **WHEN** une leçon contient des questions de type single_choice, multiple_choice, match, fill_blank ou reorder
- **THEN** chaque type s'affiche avec l'interaction appropriée et est correctement évalué

### Requirement: Sauvegarde de progression et score

Le système SHALL sauvegarder la progression par étape et calculer le statut de complétion selon le seuil de la leçon.

#### Scenario: Sauvegarde par étape
- **WHEN** l'apprenant valide une étape
- **THEN** la progression est persistée immédiatement (aucune perte si l'onglet est fermé ensuite)

#### Scenario: Complétion au-dessus du seuil
- **WHEN** le score de quiz de la leçon atteint ou dépasse `pass_threshold`
- **THEN** la leçon passe au statut `completed`, avec `best_score` mis à jour

#### Scenario: Score sous le seuil
- **WHEN** le score est inférieur au seuil
- **THEN** la leçon reste `in_progress` (non validée) et l'apprenant peut réessayer
