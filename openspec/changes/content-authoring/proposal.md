## Why

Les admins doivent pouvoir créer et organiser le contenu pédagogique (cours, unités, leçons, étapes de contenu et de quiz) sans toucher au code, et contrôler ce qui est publié aux apprenants.

## What Changes

- Back-office `admin/*` (protégé par `requireAdmin`) avec un tableau de bord listant les cours.
- CRUD complet : cours → unités → leçons → étapes (contenu / quiz) → questions de quiz.
- Réordonnancement des unités/leçons/étapes (champ `position`).
- Gestion du statut de publication (brouillon / publié) par cours.
- Prévisualisation d'une leçon telle que vue par un apprenant, avant publication.

## Capabilities

### New Capabilities
- `content-authoring`: interface d'administration pour créer, éditer, ordonner, prévisualiser et publier le contenu pédagogique.

### Modified Capabilities
<!-- Aucune. -->

## Impact

- Dépend de `authentication` (guard `requireAdmin`).
- Code : `src/routes/admin/**`, `src/server/functions/content.ts`, composants de formulaires (`src/components/admin/**`), validation Zod partagée (`src/lib/validation/content.ts`).
- Données : tables `courses`, `units`, `lessons`, `lesson_steps`, `quiz_questions` (déjà au schéma).
