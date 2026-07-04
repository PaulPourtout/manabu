## ADDED Requirements

### Requirement: Attribution d'XP

Le système SHALL attribuer de l'XP à la complétion d'une leçon et cumuler l'XP sur l'utilisateur.

#### Scenario: XP à la complétion
- **WHEN** un apprenant complète une leçon
- **THEN** un montant d'XP est ajouté, journalisé dans `xp_events`, et `user.xp_total` est mis à jour

#### Scenario: Bonus leçon parfaite
- **WHEN** la leçon est complétée sans avoir perdu la moindre vie
- **THEN** un bonus d'XP s'ajoute au montant de base

### Requirement: Série de jours (streak)

Le système SHALL maintenir une série de jours d'activité, calculée dans le fuseau horaire de l'apprenant.

#### Scenario: Incrément quotidien
- **WHEN** un apprenant complète au moins une leçon un jour donné (dans son fuseau)
- **THEN** son `current_streak` est incrémenté au plus une fois pour ce jour et `longest_streak` mis à jour si dépassé

#### Scenario: Rupture de série
- **WHEN** un apprenant passe un jour civil (dans son fuseau) sans compléter de leçon
- **THEN** son `current_streak` est remis à zéro lors de l'activité suivante

#### Scenario: Fuseau de l'apprenant
- **WHEN** le fuseau de l'apprenant est connu (détecté et stocké sur `user.timezone`)
- **THEN** le « jour » de la série est calculé sur ce fuseau, pas sur celui du serveur

### Requirement: Vies par tentative

Le système SHALL limiter les erreurs via des vies **propres à chaque tentative** de leçon (pas de pool global), et permettre de recommencer immédiatement après un échec.

#### Scenario: Tentative avec vies fraîches
- **WHEN** un apprenant démarre (ou recommence) une tentative de leçon
- **THEN** elle débute avec un nombre de vies défini (défaut 3), indépendant des autres leçons

#### Scenario: Perte de vie sur erreur
- **WHEN** l'apprenant répond incorrectement à un quiz durant la tentative
- **THEN** une vie de la tentative est décrémentée

#### Scenario: Échec à zéro vie puis reprise immédiate
- **WHEN** les vies de la tentative atteignent zéro
- **THEN** la tentative échoue et l'apprenant peut la recommencer immédiatement depuis le début, avec des vies fraîches, sans délai d'attente

### Requirement: Déverrouillage progressif

Le système SHALL verrouiller les leçons selon un ordre linéaire strict au sein d'un cours (séquence aplatie des unités puis leçons).

#### Scenario: Première leçon ouverte
- **WHEN** un apprenant ouvre un cours publié
- **THEN** la première leçon du cours est jouable

#### Scenario: Leçon verrouillée
- **WHEN** un apprenant tente d'ouvrir une leçon dont la précédente (dans la séquence aplatie) n'est pas complétée
- **THEN** l'accès est refusé et la leçon est affichée comme verrouillée

#### Scenario: Déverrouillage après complétion
- **WHEN** l'apprenant complète la leçon prérequise (y compris à une frontière d'unité)
- **THEN** la leçon suivante devient jouable

### Requirement: Badges

Le système SHALL attribuer automatiquement des badges selon des critères et les afficher.

#### Scenario: Badge première leçon
- **WHEN** un apprenant complète sa toute première leçon
- **THEN** le badge « Premiers pas » lui est attribué (une seule fois) et visible sur son profil

#### Scenario: Badge streak 7 jours
- **WHEN** le `current_streak` atteint 7
- **THEN** le badge « Une semaine ! » est attribué s'il ne l'a pas déjà
