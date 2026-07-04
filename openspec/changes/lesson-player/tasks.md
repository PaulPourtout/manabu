## 1. Données & server functions

- [ ] 1.1 `src/server/functions/lessons.ts` : `getLearningPath` (cours publiés + progression + verrouillage)
- [ ] 1.2 `getLessonForPlay(lessonId)` : reprise de tentative (étape courante, file de remise, vies)
- [ ] 1.3 `src/server/functions/progress.ts` : `submitStep` (évaluation serveur + persistance de l'état de tentative)
- [ ] 1.4 Gestion de la file de remise et détection de complétion (toutes questions réussies)

## 2. Carte de parcours

- [ ] 2.1 `src/routes/learn/index.tsx` : rendu cours/unités/leçons + états
- [ ] 2.2 Indicateurs (non commencée / en cours / complétée / verrouillée)

## 3. Player de leçon

- [ ] 3.1 `src/routes/learn/$lessonId.tsx` : coquille du player + barre de progression
- [ ] 3.2 Store de session (Zustand) : étape courante, réponse en cours
- [ ] 3.3 Composant d'étape de contenu (Markdown assaini + média)
- [ ] 3.4 Composants quiz : single_choice, multiple_choice, match, fill_blank, reorder
- [ ] 3.5 Feedback immédiat + remise en file des questions ratées
- [ ] 3.6 Écran de résultat en fin de leçon

## 4. Mobile-first

- [ ] 4.1 Boutons larges (≥ 44px), une action principale sans scroll
- [ ] 4.2 Vérifier le rendu sur breakpoints mobile / tablette / desktop

## 5. Vérification

- [ ] 5.1 Jouer la leçon de démo de bout en bout
- [ ] 5.2 Fermer l'onglet en cours puis reprendre → reprise à la bonne étape/vies
- [ ] 5.3 Vérifier chaque type de quiz et la remise en file
