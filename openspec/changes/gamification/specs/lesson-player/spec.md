## MODIFIED Requirements

### Requirement: Sauvegarde de progression

Le système SHALL persister l'état de la tentative à chaque étape validée (afin de permettre la reprise sans perte), et déclencher à la complétion les effets de gamification (XP, streak). La consommation de vies s'applique aux réponses incorrectes durant la tentative.

#### Scenario: Sauvegarde par étape
- **WHEN** l'apprenant valide une étape
- **THEN** l'état de la tentative (étape courante, file de remise, vies restantes) est persisté immédiatement (aucune perte si l'onglet est fermé ensuite)

#### Scenario: Complétion enregistrée définitivement
- **WHEN** une leçon est complétée
- **THEN** son statut `completed` est acquis de façon permanente, l'XP est attribuée et le streak actualisé

#### Scenario: Réponse incorrecte consomme une vie
- **WHEN** l'apprenant répond incorrectement à un quiz durant la tentative
- **THEN** une vie de la tentative est décrémentée et la question est remise en file

#### Scenario: Échec de tentative à zéro vie
- **WHEN** les vies de la tentative atteignent zéro
- **THEN** la tentative échoue (aucune complétion) et peut être recommencée immédiatement depuis le début avec des vies fraîches
