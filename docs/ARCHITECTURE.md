# Manabu — Architecture technique

Complète `docs/PRD.md`. Décisions techniques validées avec l'utilisateur : **Clerk** (auth en SaaS tiers), **Drizzle ORM**, gamification complète, **Docker dev + prod**.

## 1. Stack technique

| Domaine                 | Choix                                                                                                                                      | Raison                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework fullstack     | **TanStack Start** (React 19, Vite, SSR)                                                                                                   | Fullstack React moderne : routing file-based (TanStack Router) + server functions/API routes intégrées → pas besoin d'un backend séparé.                                   |
| Langage                 | **TypeScript** (strict)                                                                                                                    | Type-safety de bout en bout, y compris entre server functions et client.                                                                                                   |
| Style / UI              | **Tailwind CSS v4** + composants **shadcn/ui**                                                                                             | Mobile-first par nature (breakpoints utilitaires), rapide à composer, accessible par défaut.                                                                               |
| Routing                 | **TanStack Router** (inclus dans Start)                                                                                                    | File-based routing, typé, gestion des loaders/route guards (protection back-office).                                                                                       |
| Data fetching / cache   | **TanStack Query** (via server functions de Start)                                                                                         | Cache client, invalidation, mutations optimistes (ex. réponse au quiz).                                                                                                    |
| État client léger       | **Zustand** (ou `useState`/context) pour l'état éphémère d'une session de leçon (vies restantes pendant la leçon en cours, étape courante) | Évite de solliciter le serveur à chaque frame ; sync en base à la fin de chaque étape.                                                                                     |
| ORM                     | **Drizzle ORM** + `drizzle-kit` (migrations)                                                                                               | Léger, SQL-first, typé, bon fit Vite/serverless-friendly.                                                                                                                  |
| Base de données         | **PostgreSQL 16**                                                                                                                          | Relationnel, robuste, adapté au modèle hiérarchique cours/unités/leçons.                                                                                                   |
| Authentification        | **Clerk**                                                                                                                                  | SaaS d'auth géré : inscription/connexion, sessions, hashing des mots de passe, OAuth (Google, etc.) prêts à l'emploi sans les héberger nous-mêmes ; composants UI React fournis. |
| Validation              | **Zod**                                                                                                                                    | Validation des formulaires, des payloads de server functions, et du fichier JSON importé au back-office.                                                                   |
| Tests                   | **Vitest** (unitaire/composants) + **Playwright** (e2e critique : login, faire une leçon)                                                  | Confiance sur les parcours critiques sans sur-investir en v1.                                                                                                              |
| Conteneurisation        | **Docker** + **docker-compose** (profils dev/prod)                                                                                         | Un seul point d'entrée pour lancer app + DB.                                                                                                                               |
| Gestionnaire de paquets | **pnpm**                                                                                                                                   | Rapide, lockfile strict, standard pour ce genre de stack.                                                                                                                  |

> TanStack Start joue le rôle de « frontend + backend » : les server functions (`createServerFn`) et/ou des routes API (`/api/...`) exposent les opérations nécessitant la base de données. Il n'y a **pas de service backend séparé** en v1 — cela simplifie fortement le Docker et le déploiement. Si un besoin de découplage fort apparaît plus tard (ex. worker asynchrone), on pourra extraire un service dédié sans tout réécrire grâce à la couche Drizzle isolée.

## 2. Arborescence de projet (proposée)

```
manabu/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── LESSON_FORMAT.md
├── docker/
│   ├── Dockerfile                 # multi-stage: deps → build → runtime
│   └── docker-compose.yml         # postgres + app (profils dev / prod)
├── drizzle/                       # migrations générées
├── src/
│   ├── routes/                    # file-based routing TanStack Router
│   │   ├── __root.tsx
│   │   ├── index.tsx               # landing / redirection
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── learn/
│   │   │   ├── index.tsx           # carte de parcours (path)
│   │   │   └── $lessonId.tsx       # player de leçon (contenu + quiz)
│   │   ├── profile.tsx
│   │   └── admin/
│   │       ├── index.tsx           # dashboard back-office
│   │       ├── courses/
│   │       │   ├── index.tsx
│   │       │   ├── $courseId.tsx
│   │       │   └── new.tsx
│   │       ├── import.tsx          # upload JSON
│   │       └── users.tsx
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts           # schéma Drizzle
│   │   │   ├── client.ts           # connexion pg + drizzle()
│   │   │   └── seed.ts
│   │   ├── auth/
│   │   │   └── clerk.ts            # config Clerk (middleware, helpers serveur)
│   │   ├── functions/              # server functions (createServerFn)
│   │   │   ├── lessons.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── progress.ts
│   │   │   ├── gamification.ts
│   │   │   └── import.ts           # parsing + validation JSON → insert
│   │   └── lib/
│   │       └── permissions.ts      # guard "admin only"
│   ├── components/
│   │   ├── lesson/                 # étapes de contenu, player
│   │   ├── quiz/                   # types de questions
│   │   ├── gamification/           # XP bar, streak, vies, badges
│   │   └── ui/                     # shadcn/ui
│   ├── lib/
│   │   ├── validation/              # schémas Zod partagés
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

## 3. Modèle de données (schéma Drizzle — vue logique)

```
user_profiles                      -- pas de mot de passe/session ici : gérés par Clerk
  id, clerk_user_id (unique, provenant de Clerk), name, avatar_url,
  role ('learner' | 'admin'),
  xp_total, current_streak, longest_streak, last_activity_date,
  hearts, hearts_refill_at, created_at

courses
  id, title, description, slug, is_published, created_at, updated_at

units
  id, course_id (FK), title, position, is_published

lessons
  id, unit_id (FK), title, position, is_published,
  pass_threshold (ex. 0.7)

lesson_steps
  id, lesson_id (FK), position, type ('content' | 'quiz'),
  content_body (jsonb, pour type=content : texte/markdown/media)

quiz_questions
  id, lesson_step_id (FK, 1-1 avec une step de type 'quiz'),
  type ('single_choice' | 'multiple_choice' | 'match' | 'fill_blank' | 'reorder'),
  prompt, explanation, data (jsonb : choix/réponses selon le type)

user_lesson_progress
  id, user_id (FK), lesson_id (FK),
  status ('not_started' | 'in_progress' | 'completed'),
  best_score, last_attempt_at, completed_at

user_step_attempts                 -- historique fin, sert à reprendre en cours de leçon
  id, user_id (FK), lesson_step_id (FK), is_correct, answered_at

badges
  id, code, title, description, icon

user_badges
  id, user_id (FK), badge_id (FK), earned_at

xp_events                          -- journal, utile pour audits/anti-triche futurs
  id, user_id (FK), amount, reason, created_at
```

Le contenu variable (choix de quiz, éléments à associer, texte du contenu de leçon) est stocké en `jsonb` pour rester flexible sans exploser le nombre de tables — cohérent avec le format d'import (voir `docs/LESSON_FORMAT.md`).

## 4. Format d'import JSON (back-office)

Un admin peut uploader un fichier JSON représentant un **cours complet**. Schéma validé côté serveur avec Zod avant insertion transactionnelle en base. Détail complet et exemple dans `docs/LESSON_FORMAT.md`.

Aperçu de la forme générale :

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
            { "type": "content", "body": "..." },
            {
              "type": "quiz",
              "quiz": {
                "type": "single_choice",
                "prompt": "...",
                "choices": ["..."],
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

## 5. Authentification & autorisation

- **Clerk** gère l'inscription/connexion (email + mot de passe, OAuth possible dès v1 sans effort supplémentaire), les sessions et leurs cookies/JWT — rien de tout cela n'est stocké dans notre Postgres.
- À la création d'un compte Clerk (webhook `user.created`), on crée en miroir une ligne dans `user_profiles` (Postgres, via Drizzle) portant `clerk_user_id` + les champs propres à l'app (rôle, XP, streak, vies). Le rôle `admin` est positionné manuellement (ou via les `publicMetadata` Clerk, synchronisés au même endroit).
- Middleware / guard sur les routes `admin/*` et sur les server functions sensibles : vérification côté serveur de la session Clerk (`auth()`) **et** du rôle stocké dans `user_profiles` — jamais une vérification côté client seule.
- Le SDK `@clerk/tanstack-react-start` fournit les composants (`<SignIn />`, `<SignUp />`, `<UserButton />`) et les helpers serveur pour protéger routes et server functions.
- **MFA** : géré nativement par Clerk (TOTP via app d'authentification, SMS OTP, backup codes). Configuré dans le dashboard Clerk :
  - **obligatoire** pour le rôle `admin` — appliqué via une règle Clerk (ou vérification serveur `sessionClaims`/`has()` qui refuse l'accès à `admin/*` tant que le second facteur n'est pas enrôlé) ;
  - **optionnel** pour le rôle `learner`, activable depuis `<UserProfile />` sans développement supplémentaire.
  - Le composant `<SignIn />` gère automatiquement l'étape de vérification du second facteur ; en cas de flow de connexion custom, il faut gérer explicitement le statut intermédiaire `needs_second_factor`.

## 6. Mobile-first & responsive

- Développement des écrans en priorité sur breakpoint mobile (`base`, sans préfixe Tailwind), puis extension `sm:` / `md:` / `lg:` pour tablette/desktop.
- Navigation : barre de navigation basse fixe sur mobile (Apprendre / Profil), transformée en barre latérale sur `md:`+.
- Le player de leçon (contenu + quiz) est pensé pour être utilisable au pouce (gros boutons, une action principale visible sans scroll).
- Le back-office est utilisable sur tablette/desktop en priorité (formulaires plus denses), mais reste consultable sur mobile sans être cassé (tables → cartes empilées sur petit écran).

## 7. Docker (dev + prod)

- **`docker/Dockerfile`** multi-stage :
  1. `deps` : install des dépendances (pnpm, cache des layers).
  2. `build` : build Vite/TanStack Start (`pnpm build`).
  3. `runtime` : image finale légère (node:alpine) ne contenant que le build + `node_modules` de prod, lancée via `pnpm start`.
- **`docker/docker-compose.yml`** :
  - service `db` : `postgres:16-alpine`, volume nommé pour la persistance, healthcheck.
  - service `app` :
    - en **dev** : bind mount du code source, commande `pnpm dev`, hot-reload, dépend de `db` (healthy).
    - en **prod** : utilise l'image buildée par le Dockerfile (stage `runtime`), variables d'env de prod, pas de bind mount.
  - Utilisation de **profils** (`dev` / `prod`) ou de deux fichiers compose (`docker-compose.yml` + `docker-compose.prod.yml` en override) pour distinguer les deux modes sans dupliquer toute la config.
- Migrations Drizzle exécutées automatiquement au démarrage du conteneur `app` (script `pnpm db:migrate` avant `pnpm start`), avec un `seed` optionnel pour données de démo.

## 8. Variables d'environnement (`.env.example`)

```
DATABASE_URL=postgres://manabu:manabu@db:5432/manabu
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NODE_ENV=development
PORT=3000
```

> Les clés Clerk sont propres à chaque environnement (instance de dev/staging/prod dans le dashboard Clerk) — à ne jamais committer, seulement dans `.env` local et les secrets du déploiement.

## 9. Scripts principaux (`package.json`)

```
dev            → tanstack start dev (via vite)
build          → build de production
start          → lance le serveur buildé
db:generate    → drizzle-kit generate (nouvelles migrations depuis le schéma)
db:migrate     → drizzle-kit migrate (applique les migrations)
db:seed        → script de seed (données de démo + compte admin par défaut)
test           → vitest
test:e2e       → playwright test
```

## 10. Roadmap de mise en œuvre proposée

1. **Bootstrap** : scaffold TanStack Start + TypeScript + Tailwind + shadcn/ui, Docker Compose (db + app dev), connexion Drizzle ↔ Postgres, `pnpm dev` fonctionnel.
2. **Auth** : intégration Clerk (inscription/connexion/déconnexion), webhook de synchronisation vers `user_profiles`, rôle `admin`/`learner`, route guard back-office.
3. **Modèle de données & back-office CRUD** : schéma Drizzle + migrations, CRUD cours/unités/leçons/quiz basique en back-office.
4. **Import JSON** : schéma Zod, page d'upload, validation + insertion transactionnelle, prévisualisation.
5. **Player de leçon** : rendu des étapes de contenu et de quiz (types principaux), sauvegarde de progression par étape, écran de résultat.
6. **Gamification** : XP, streak, vies, déverrouillage progressif des unités/leçons, badges.
7. **Polish mobile-first & accessibilité**, tests e2e des parcours critiques.
8. **Dockerfile de prod** (multi-stage) + configuration `docker-compose.prod.yml`, documentation de déploiement.

## 11. Points à trancher plus tard (non bloquants pour démarrer)

- Politique exacte de régénération des vies (temps fixe ? une par X heures ?).
- Faut-il un mode « pas de vies » pour certains cours (ex. contenu non compétitif) ?
- Activation d'OAuth (Google, etc.) — simple bascule dans le dashboard Clerk, sans migration de données.
- Plan Clerk à choisir (le tier gratuit suffit largement pour le développement et une démo).
- Multi-cours en parallèle pour un même utilisateur : autorisé dès la v1 (pas de restriction à un seul cours actif).
