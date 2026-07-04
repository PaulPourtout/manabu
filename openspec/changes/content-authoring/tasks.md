## 1. Validation partagée

- [x] 1.1 Créer `src/lib/validation/content.ts` (schémas Zod cours/unité/leçon/étape)
- [x] 1.2 Schémas Zod par type de question (single_choice, multiple_choice, match, fill_blank, reorder)

## 2. Server functions

- [x] 2.1 `src/server/functions/content.ts` : CRUD cours (protégé `assertAdmin`)
- [x] 2.2 CRUD unités / leçons / étapes / questions
- [x] 2.3 Réordonnancement en lot (`position`)
- [x] 2.4 Basculer le statut de publication d'un cours

## 3. Interface back-office

- [x] 3.1 `src/routes/admin/index.tsx` : tableau de bord + liste des cours
- [x] 3.2 `src/routes/admin/courses/$courseId.tsx` : édition cours + arborescence
- [x] 3.3 Formulaires d'étapes contenu (Markdown) et quiz (single/multiple/fill_blank ; match & reorder via import)
- [x] 3.4 Réordonnancement (boutons haut/bas ; drag & drop = amélioration future)
- [x] 3.5 Bouton publier / dépublier

## 4. Prévisualisation

- [ ] 4.1 Route de prévisualisation réutilisant les composants du player — **fait pendant `lesson-player`** (dépend de ses composants)
- [ ] 4.2 Mode « à blanc » (pas d'écriture de progression) — idem

## 5. Vérification

- [x] 5.1 Dashboard admin rendu sous auth (loader `listCourses` OK en runtime) ; création/édition via UI
- [ ] 5.2 Vérifier qu'un brouillon n'apparaît pas côté apprenant — avec `lesson-player`
- [ ] 5.3 Vérifier le rendu de prévisualisation — avec `lesson-player`
