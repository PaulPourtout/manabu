## 1. Données & server functions

- [x] 1.1 `src/server/functions/lessons.ts` : `getLearningPath` (cours publiés + progression + verrouillage linéaire)
- [x] 1.2 `getLessonForPlay(lessonId)` : reprise de tentative (étape courante, file, vies)
- [x] 1.3 `src/server/functions/progress.ts` : `startAttempt` + `submitStep` (évaluation serveur + persistance)
- [x] 1.4 File de remise + détection de complétion (toutes questions réussies) ; réponses jamais envoyées avant soumission

## 2. Carte de parcours

- [x] 2.1 `src/routes/learn/index.tsx` : rendu cours/unités/leçons + états
- [x] 2.2 Indicateurs (non commencée / en cours / complétée / verrouillée)

## 3. Player de leçon

- [x] 3.1 `src/routes/learn/$lessonId.tsx` : player + barre de progression + vies
- [x] 3.2 État de session (étape courante, reprise via l'état de tentative persistée)
- [x] 3.3 Composant d'étape de contenu (Markdown assaini — `src/lib/markdown.tsx`)
- [x] 3.4 Composants quiz : single_choice, multiple_choice, fill_blank, reorder, match
- [x] 3.5 Feedback immédiat + remise en file des questions ratées
- [x] 3.6 Écran de résultat + écran d'échec (recommencer)

## 4. Mobile-first

- [x] 4.1 Boutons larges (≥ 44px), une action principale, layout `max-w-md`
- [ ] 4.2 Vérifier le rendu sur breakpoints (mobile/tablette/desktop) — passe visuelle navigateur

## 5. Vérification

- [x] 5.1 typecheck + build verts
- [ ] 5.2 Jouer la leçon de démo de bout en bout — **passe runtime navigateur** (démon Docker instable ce jour)
- [ ] 5.3 Reprise après fermeture + remise en file — idem passe runtime
