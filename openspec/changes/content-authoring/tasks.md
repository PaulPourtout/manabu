## 1. Validation partagée

- [ ] 1.1 Créer `src/lib/validation/content.ts` (schémas Zod cours/unité/leçon/étape)
- [ ] 1.2 Schémas Zod par type de question (single_choice, multiple_choice, match, fill_blank, reorder)

## 2. Server functions

- [ ] 2.1 `src/server/functions/content.ts` : CRUD cours (protégé `requireAdmin`)
- [ ] 2.2 CRUD unités / leçons / étapes / questions
- [ ] 2.3 Réordonnancement en lot (`position`)
- [ ] 2.4 Basculer le statut de publication d'un cours

## 3. Interface back-office

- [ ] 3.1 `src/routes/admin/index.tsx` : tableau de bord + liste des cours
- [ ] 3.2 `src/routes/admin/courses/new.tsx` et `$courseId.tsx` : édition cours + arborescence
- [ ] 3.3 Formulaires d'étapes contenu (Markdown) et quiz (par type)
- [ ] 3.4 Drag & drop de réordonnancement
- [ ] 3.5 Bouton publier / dépublier

## 4. Prévisualisation

- [ ] 4.1 Route de prévisualisation réutilisant les composants du player
- [ ] 4.2 Mode « non comptabilisé » (pas d'écriture de progression)

## 5. Vérification

- [ ] 5.1 Créer un cours complet via l'UI et le publier
- [ ] 5.2 Vérifier qu'un brouillon n'apparaît pas côté apprenant
- [ ] 5.3 Vérifier le rendu de prévisualisation
