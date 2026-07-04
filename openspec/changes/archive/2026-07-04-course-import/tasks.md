## 1. Schéma de validation

- [x] 1.1 `src/lib/validation/content.ts` inclut `courseImportSchema` (aligné sur `docs/LESSON_FORMAT.md`)
- [x] 1.2 Composé avec les schémas de question (5 types)
- [x] 1.3 Vérifié : exemple du doc valide ; rejets (index hors bornes avec chemin, leçon sans quiz, média non-HTTPS)

## 2. Import serveur

- [x] 2.1 `src/server/functions/import.ts` : `importCourse` (protégé `assertAdmin`)
- [x] 2.2 Insertion transactionnelle (`db.transaction`) de toute la hiérarchie
- [x] 2.3 Détection de conflit de slug → refus + demande d'un nouveau slug (création seule)
- [x] 2.4 Retour d'erreurs Zod avec chemin du champ

## 3. Interface d'import

- [x] 3.1 `src/routes/admin/import.tsx` : upload de fichier + zone de texte JSON
- [x] 3.2 Gestion du conflit de slug (saisie d'un nouveau slug)
- [x] 3.3 Affichage lisible des erreurs de validation (chemin + message)
- [x] 3.4 Redirection vers l'édition du cours après import réussi

## 4. Vérification

- [x] 4.1 Exemple de `docs/LESSON_FORMAT.md` validé par le schéma
- [x] 4.2 Fichiers invalides → erreurs localisées (vérifié)
- [ ] 4.3 Import réel en base + conflit de slug — passe runtime consolidée (daemon Docker instable)
