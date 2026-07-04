## 1. Moteur de gamification (serveur)

- [x] 1.1 `src/server/functions/gamification.ts` : XP (base + bonus « parfait », `xp_events`)
- [x] 1.2 Logique de streak (jour civil dans `user.timezone` ; +1 / reset / no-op)
- [x] 1.3 Vies par tentative : init à 3, décrément, échec à 0, réinit à la reprise (dans `progress.ts`)
- [x] 1.4 Évaluation et attribution des badges (idempotente, `onConflictDoNothing`)
- [x] 1.5 Détection du fuseau côté client + stockage (`syncTimezone`, effet sur `/learn`)

## 2. Intégration au player

- [x] 2.1 XP + streak à la complétion (`onLessonCompleted` appelé par `submitStep`)
- [x] 2.2 Décrément d'une vie sur réponse incorrecte
- [x] 2.3 Échec à 0 vie → recommencer immédiatement (vies fraîches)
- [x] 2.4 Déverrouillage linéaire strict (calculé dans `getLearningPath`)

## 3. UI gamification

- [x] 3.1 Vies (player) ; XP + série (profil) ; XP gagné (écran de résultat)
- [x] 3.2 Verrous visuels sur les leçons dans `/learn`
- [x] 3.3 Écran de résultat enrichi (XP gagnée, badge débloqué)
- [x] 3.4 `src/routes/profile.tsx` : XP total, série, badges obtenus

## 4. Vérification

- [x] 4.1 typecheck + build verts
- [ ] 4.2 Compléter une leçon → XP/série/badges ; erreurs → vies puis échec — **passe runtime navigateur**
- [ ] 4.3 Leçon verrouillée puis débloquée — idem passe runtime
