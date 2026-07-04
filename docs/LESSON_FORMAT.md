# Manabu — Format d'import JSON des cours

Ce document décrit le format de fichier JSON accepté par le back-office (`/admin/import`) pour générer automatiquement un cours complet (unités, leçons, étapes de contenu et de quiz).

Le fichier est validé côté serveur avec un schéma **Zod** avant toute insertion en base ; en cas d'erreur, le back-office affiche le chemin exact du champ invalide (ex. `units[1].lessons[0].steps[2].quiz.correctIndex`).

## 1. Structure générale

```json
{
  "course": {
    "title": "Anglais - Débutant",
    "slug": "anglais-debutant",
    "description": "Apprendre les bases de l'anglais du quotidien.",
    "isPublished": false
  },
  "units": [
    {
      "title": "Unité 1 : Se présenter",
      "lessons": [
        {
          "title": "Dire bonjour",
          "steps": [ /* voir section 2 */ ]
        }
      ]
    }
  ]
}
```

- `course.slug` : identifiant unique lisible (utilisé dans l'URL), généré automatiquement si absent (à partir du titre).
- `isPublished` : optionnel, `false` par défaut → le cours importé est un brouillon tant qu'un admin ne le publie pas explicitement.
- `units` : tableau ordonné (l'ordre du tableau = ordre d'affichage/déverrouillage).
- `lessons` : idem, ordonné au sein d'une unité.

> Il n'y a **pas** de seuil de score par leçon : la complétion est pilotée par les vies (une leçon est terminée quand toutes ses questions sont finalement réussies sans épuiser les vies de la tentative — voir ADR 0001).

## 2. Étapes (`steps`)

Chaque leçon contient un tableau ordonné d'étapes. Deux types possibles : `content` et `quiz`.

### 2.1 Étape de contenu

```json
{
  "type": "content",
  "title": "Les salutations",
  "body": "En anglais, on dit **Hello** ou **Hi** pour dire bonjour à n'importe quel moment de la journée.",
  "media": { "type": "image", "url": "https://.../hello.png", "alt": "Illustration de salutation" }
}
```

- `body` : texte au format Markdown simple (gras, italique, listes). Rendu tel quel dans le player.
- `media` : optionnel, une seule pièce jointe (image ou audio) par étape de contenu.

### 2.2 Étape de quiz

Champ commun : `type: "quiz"`, puis `quiz.type` détermine la sous-structure.

**a) Choix unique (`single_choice`)**
```json
{
  "type": "quiz",
  "quiz": {
    "type": "single_choice",
    "prompt": "Comment dit-on « bonjour » en anglais ?",
    "choices": ["Hello", "Goodbye", "Please", "Thanks"],
    "correctIndex": 0,
    "explanation": "« Hello » est la salutation la plus courante."
  }
}
```

**b) Choix multiples (`multiple_choice`)**
```json
{
  "type": "quiz",
  "quiz": {
    "type": "multiple_choice",
    "prompt": "Lesquels de ces mots sont des salutations ?",
    "choices": ["Hello", "Hi", "Bye", "Please"],
    "correctIndexes": [0, 1]
  }
}
```

**c) Association (`match`)**
```json
{
  "type": "quiz",
  "quiz": {
    "type": "match",
    "prompt": "Associe chaque mot anglais à sa traduction.",
    "pairs": [
      { "left": "Hello", "right": "Bonjour" },
      { "left": "Goodbye", "right": "Au revoir" }
    ]
  }
}
```

**d) Texte à trous (`fill_blank`)**
```json
{
  "type": "quiz",
  "quiz": {
    "type": "fill_blank",
    "prompt": "Complète la phrase : ___ my name is Paul.",
    "answer": "Hello",
    "acceptableAnswers": ["Hi"]
  }
}
```

**e) Remise dans l'ordre (`reorder`)**
```json
{
  "type": "quiz",
  "quiz": {
    "type": "reorder",
    "prompt": "Remets la phrase dans l'ordre.",
    "tokens": ["is", "Paul", "My", "name"],
    "correctOrder": [2, 1, 0, 3]
  }
}
```

## 3. Exemple de fichier complet minimal

```json
{
  "course": { "title": "Anglais - Débutant", "slug": "anglais-debutant" },
  "units": [
    {
      "title": "Unité 1 : Se présenter",
      "lessons": [
        {
          "title": "Dire bonjour",
          "steps": [
            { "type": "content", "body": "**Hello** = bonjour, à toute heure de la journée." },
            {
              "type": "quiz",
              "quiz": {
                "type": "single_choice",
                "prompt": "Comment dit-on « bonjour » en anglais ?",
                "choices": ["Hello", "Goodbye", "Please"],
                "correctIndex": 0
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 4. Règles de validation

- Une leçon doit contenir **au moins une étape**.
- Une leçon doit contenir **au moins une étape de type `quiz`** (sinon aucune évaluation possible → pas de déblocage de la suite).
- `correctIndex` / `correctIndexes` doivent référencer des index valides du tableau `choices`.
- `pairs`, `tokens`, `choices` : minimum 2 éléments.
- **Médias** : uniquement `image` ou `audio` avec une URL **HTTPS** valide ; toute autre URL/type est rejetée. Le corps Markdown est assaini au rendu (pas de HTML brut/scripts).
- Les slugs de cours doivent être uniques ; en cas de conflit à l'import, l'import est **refusé** et demande un nouveau slug (import = **création seule** en v1, jamais de mise à jour/écrasement d'un cours existant — l'édition passe par le back-office).
- L'import est **transactionnel** : si une seule leçon du fichier est invalide, rien n'est inséré en base (tout ou rien), afin d'éviter des cours à moitié importés.

## 5. Évolutions possibles (hors v1)

- Import de médias en pièce jointe directe (zip) plutôt que par URL externe.
- Support de variantes linguistiques (un même fichier générant plusieurs traductions d'un cours).
- Import incrémental (ajouter des leçons à un cours existant sans repartir de zéro).
