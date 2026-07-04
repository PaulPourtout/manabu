## 1. Schéma de validation

- [ ] 1.1 Créer `src/lib/validation/import.ts` (schéma Zod du fichier complet, aligné sur `docs/LESSON_FORMAT.md`)
- [ ] 1.2 Composer avec les schémas de question de `content-authoring`
- [ ] 1.3 Test de conformité sur l'exemple du doc

## 2. Import serveur

- [ ] 2.1 `src/server/functions/import.ts` : `importCourse` (protégé `requireAdmin`)
- [ ] 2.2 Insertion transactionnelle (`db.transaction`) de toute la hiérarchie
- [ ] 2.3 Détection de conflit de slug (renommer / mettre à jour, sans écrasement)
- [ ] 2.4 Retour d'erreurs Zod avec chemin du champ

## 3. Interface d'import

- [ ] 3.1 `src/routes/admin/import.tsx` : upload de fichier + zone de texte JSON
- [ ] 3.2 Aperçu (nb d'unités/leçons) avant confirmation
- [ ] 3.3 Affichage lisible des erreurs de validation
- [ ] 3.4 Redirection vers l'édition du cours après import réussi

## 4. Vérification

- [ ] 4.1 Importer l'exemple de `docs/LESSON_FORMAT.md` → cours créé
- [ ] 4.2 Importer un fichier invalide → aucune écriture + erreur localisée
- [ ] 4.3 Importer un slug existant → proposition de renommage/màj
