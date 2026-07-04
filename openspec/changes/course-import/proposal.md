## Why

Créer un cours entier à la main est fastidieux. Les admins doivent pouvoir importer un cours complet (unités, leçons, étapes, quiz) via un fichier JSON structuré, avec une validation claire avant insertion.

## What Changes

- Page `admin/import` permettant d'uploader/coller un fichier JSON de cours.
- Validation stricte du fichier avec Zod (le format est décrit dans `docs/LESSON_FORMAT.md`), avec retour d'erreurs localisées (chemin du champ fautif).
- Insertion **transactionnelle** (tout ou rien) du cours et de sa hiérarchie.
- **Création seule** : en cas de slug déjà existant, on demande un nouveau slug (jamais de mise à jour/écrasement d'un cours existant — l'édition passe par le CRUD).
- Import en statut brouillon par défaut.

## Capabilities

### New Capabilities
- `course-import`: import d'un cours complet depuis un fichier JSON validé, de façon transactionnelle.

### Modified Capabilities
<!-- Aucune. Réutilise les schémas Zod de content-authoring. -->

## Impact

- Dépend de `authentication` (`requireAdmin`) et réutilise la validation de `content-authoring`.
- Code : `src/routes/admin/import.tsx`, `src/server/functions/import.ts`, `src/lib/validation/import.ts`.
- Données : écrit dans `courses`, `units`, `lessons`, `lesson_steps`, `quiz_questions`.
- Référence : `docs/LESSON_FORMAT.md`.
