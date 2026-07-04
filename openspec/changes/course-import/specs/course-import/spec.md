## ADDED Requirements

### Requirement: Import d'un cours depuis un fichier JSON

Le système SHALL permettre à un admin d'importer un cours complet à partir d'un fichier JSON conforme au format documenté.

#### Scenario: Import d'un fichier valide
- **WHEN** un admin importe un fichier JSON conforme (cours + unités + leçons + étapes + quiz)
- **THEN** le cours et toute sa hiérarchie sont créés en base en statut brouillon, et l'admin est redirigé vers la page d'édition du cours

#### Scenario: Import atomique en cas d'erreur partielle
- **WHEN** le fichier contient une leçon invalide au milieu d'un cours par ailleurs valide
- **THEN** aucune donnée n'est insérée (transaction annulée) et l'erreur est signalée

### Requirement: Validation et retour d'erreurs

Le système SHALL valider le fichier avant insertion et signaler précisément les erreurs.

#### Scenario: Champ manquant ou type invalide
- **WHEN** le fichier omet un champ requis ou fournit un type incorrect (ex. `correctIndex` hors limites)
- **THEN** l'import est refusé et le chemin du champ fautif est indiqué (ex. `units[1].lessons[0].steps[2].quiz.correctIndex`)

#### Scenario: Leçon sans quiz
- **WHEN** une leçon du fichier ne contient aucune étape de type quiz
- **THEN** la validation échoue avec un message explicite

### Requirement: Gestion des conflits de slug

Le système SHALL ne jamais écraser silencieusement un cours existant portant le même slug.

#### Scenario: Slug déjà utilisé
- **WHEN** le slug du cours importé existe déjà
- **THEN** le système propose explicitement de renommer (nouveau slug) ou de mettre à jour le cours existant, sans écrasement automatique
