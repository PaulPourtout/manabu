# content-authoring Specification

## Purpose
TBD - created by archiving change content-authoring. Update Purpose after archive.
## Requirements
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
- **THEN** il voit le rendu **interactif à blanc** du player (contenu + quiz jouables, feedback actif) sans qu'aucune progression/XP ne soit écrite, et sans que la leçon soit visible côté apprenant

### Requirement: Contenu assaini et médias restreints

Le système SHALL n'autoriser qu'un contenu sûr : Markdown rendu sans HTML brut/scripts, et médias limités aux images/audio en HTTPS avec URL validée.

#### Scenario: HTML dangereux neutralisé
- **WHEN** un corps de contenu contient du HTML brut ou une balise `<script>`
- **THEN** le rendu est assaini (le HTML dangereux est retiré), aucun script n'est exécuté côté apprenant

#### Scenario: Média non conforme rejeté
- **WHEN** un média référence une URL non HTTPS ou un type autre qu'image/audio
- **THEN** la sauvegarde/import est refusée avec un message explicite

