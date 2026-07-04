# Manabu

Application web d'apprentissage gamifiée façon Duolingo : leçons + quiz, progression sauvegardée, back-office de création/import de contenu.

> Statut : fondations posées (scaffold, DB, Docker, migrations, seed). Implémentation des fonctionnalités pilotée par OpenSpec.

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Description du produit, fonctionnalités, exigences.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Stack technique, architecture, modèle de données, Docker.
- [`docs/LESSON_FORMAT.md`](docs/LESSON_FORMAT.md) — Format du fichier JSON d'import des cours/leçons/quiz.
- [`JOURNAL.md`](JOURNAL.md) — Journal de bord : fait / en cours / planifié.

## Stack (résumé)

TanStack Start (React + TypeScript) · Tailwind CSS + shadcn/ui · TanStack Query · Drizzle ORM · PostgreSQL · Better Auth (auth auto-hébergée + MFA) · Docker (dev + prod).

## Démarrage rapide

```bash
cp .env.example .env          # générer BETTER_AUTH_SECRET : openssl rand -hex 32

# Option A — tout en Docker (app + db)
docker compose -f docker/docker-compose.yml up

# Option B — dev local (DB via Docker, app en local)
docker compose -f docker/docker-compose.yml up -d db
pnpm install && pnpm run generate-routes
pnpm db:migrate && pnpm db:seed
pnpm dev            # http://localhost:3000
```

## Développement des fonctionnalités (OpenSpec)

Chaque fonctionnalité est décrite comme un « change » spec-driven dans `openspec/changes/` :

```bash
openspec list                 # état des changes et de leurs tâches
openspec show auth-mfa        # détail d'un change
```

Ordre d'implémentation recommandé : `auth-mfa` → `content-authoring` → `course-import` → `lesson-player` → `gamification` → `user-management`.

> Premier admin : s'inscrire via l'app, puis `UPDATE "user" SET role='admin' WHERE email='…';` (voir `docs/adr/0003`).

## Décisions d'architecture

Voir `CONTEXT.md` (glossaire) et `docs/adr/` — notamment l'ADR 0001 (complétion pilotée par les vies) et l'ADR 0003 (Better Auth plutôt que Clerk).
