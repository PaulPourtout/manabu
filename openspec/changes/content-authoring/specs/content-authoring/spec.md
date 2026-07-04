## ADDED Requirements

### Requirement: Gestion des cours et de leur hiérarchie

Le système SHALL permettre à un admin de créer, éditer et supprimer des cours, unités, leçons, étapes et questions de quiz.

#### Scenario: Créer un cours
- **WHEN** un admin soumet le formulaire de création de cours avec un titre
- **THEN** un cours est créé en base avec un slug unique et le statut `brouillon`

#### Scenario: Ajouter une leçon avec étapes
- **WHEN** un admin ajoute une leçon à une unité et y insère des étapes de contenu et de quiz
- **THEN** les étapes sont persistées avec leur `position` et leur `type`, et chaque étape quiz porte une question valide

#### Scenario: Supprimer un cours
- **WHEN** un admin supprime un cours
- **THEN** ses unités, leçons, étapes et questions sont supprimées en cascade

### Requirement: Réordonnancement du contenu

Le système SHALL permettre de définir l'ordre des unités, leçons et étapes.

#### Scenario: Réordonner des leçons
- **WHEN** un admin change l'ordre des leçons d'une unité
- **THEN** le champ `position` est mis à jour et l'ordre d'affichage reflète le nouvel ordre

### Requirement: Publication du contenu

Le système SHALL distinguer le contenu publié du contenu en brouillon, et n'exposer aux apprenants que le contenu publié.

#### Scenario: Publier un cours
- **WHEN** un admin passe un cours en statut `publié`
- **THEN** ce cours devient visible dans la carte de parcours des apprenants

#### Scenario: Cours en brouillon invisible pour l'apprenant
- **WHEN** un apprenant consulte la liste des cours
- **THEN** aucun cours en `brouillon` n'apparaît

### Requirement: Prévisualisation

Le système SHALL permettre à un admin de prévisualiser une leçon comme un apprenant avant publication.

#### Scenario: Prévisualiser une leçon brouillon
- **WHEN** un admin ouvre la prévisualisation d'une leçon non publiée
- **THEN** il voit le rendu du player (contenu + quiz) sans que la leçon soit visible côté apprenant
