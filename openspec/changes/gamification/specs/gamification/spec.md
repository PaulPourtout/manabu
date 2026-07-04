## ADDED Requirements

### Requirement: Attribution d'XP

Le système SHALL attribuer de l'XP à la complétion d'une leçon et cumuler l'XP sur le profil.

#### Scenario: XP à la complétion
- **WHEN** un apprenant complète une leçon (score ≥ seuil)
- **THEN** un montant d'XP est ajouté, journalisé dans `xp_events`, et `user_profiles.xp_total` est mis à jour

#### Scenario: Bonus score parfait
- **WHEN** la leçon est complétée avec un score parfait
- **THEN** un bonus d'XP s'ajoute au montant de base

### Requirement: Série de jours (streak)

Le système SHALL maintenir une série de jours d'activité.

#### Scenario: Incrément quotidien
- **WHEN** un apprenant complète au moins une leçon un jour donné
- **THEN** son `current_streak` est incrémenté au plus une fois pour ce jour et `longest_streak` mis à jour si dépassé

#### Scenario: Rupture de série
- **WHEN** un apprenant passe un jour civil sans compléter de leçon
- **THEN** son `current_streak` est remis à zéro lors de l'activité suivante

### Requirement: Vies (hearts)

Le système SHALL limiter les erreurs via un système de vies et régénérer les vies dans le temps.

#### Scenario: Perte de vie sur erreur
- **WHEN** un apprenant répond incorrectement à un quiz
- **THEN** une vie est décrémentée

#### Scenario: Blocage à zéro vie
- **WHEN** l'apprenant atteint 0 vie
- **THEN** il ne peut plus soumettre de réponse tant que les vies ne sont pas régénérées, et l'UI l'indique

#### Scenario: Régénération des vies
- **WHEN** le délai de régénération est écoulé
- **THEN** les vies sont restaurées (jusqu'au maximum)

### Requirement: Déverrouillage progressif

Le système SHALL verrouiller les leçons/unités tant que leur prérequis n'est pas complété.

#### Scenario: Leçon verrouillée
- **WHEN** un apprenant tente d'ouvrir une leçon dont la précédente n'est pas complétée
- **THEN** l'accès est refusé et la leçon est affichée comme verrouillée

#### Scenario: Déverrouillage après complétion
- **WHEN** l'apprenant complète la leçon prérequise
- **THEN** la leçon/unité suivante devient jouable

### Requirement: Badges

Le système SHALL attribuer automatiquement des badges selon des critères et les afficher.

#### Scenario: Badge première leçon
- **WHEN** un apprenant complète sa toute première leçon
- **THEN** le badge « Premiers pas » lui est attribué (une seule fois) et visible sur son profil

#### Scenario: Badge streak 7 jours
- **WHEN** le `current_streak` atteint 7
- **THEN** le badge « Une semaine ! » est attribué s'il ne l'a pas déjà
