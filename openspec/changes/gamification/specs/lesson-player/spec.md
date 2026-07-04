## MODIFIED Requirements

### Requirement: Sauvegarde de progression et score

Le système SHALL sauvegarder la progression par étape, calculer le statut de complétion selon le seuil de la leçon, et déclencher les effets de gamification associés (XP, streak, consommation de vies).

#### Scenario: Sauvegarde par étape
- **WHEN** l'apprenant valide une étape
- **THEN** la progression est persistée immédiatement (aucune perte si l'onglet est fermé ensuite)

#### Scenario: Complétion au-dessus du seuil
- **WHEN** le score de quiz de la leçon atteint ou dépasse `pass_threshold`
- **THEN** la leçon passe au statut `completed`, `best_score` est mis à jour, l'XP est attribuée et le streak actualisé

#### Scenario: Score sous le seuil
- **WHEN** le score est inférieur au seuil
- **THEN** la leçon reste `in_progress` (non validée) et l'apprenant peut réessayer

#### Scenario: Réponse incorrecte consomme une vie
- **WHEN** l'apprenant répond incorrectement à un quiz et qu'il lui reste des vies
- **THEN** une vie est décrémentée et la tentative enregistrée

#### Scenario: Soumission bloquée sans vie
- **WHEN** l'apprenant n'a plus de vie
- **THEN** la soumission de réponse est refusée jusqu'à régénération des vies
