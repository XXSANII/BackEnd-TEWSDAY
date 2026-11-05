# MyApp Backend

MyApp's backend API: an Express 5 + TypeScript service on PostgreSQL (Knex) and Redis.

This is a pure starter: the core schema, auth middleware, shared utils, a session-expiry cron job,
and one full CRUD template module (`template/example`) to copy when you add your own resources.
There are no sign-in / sign-up endpoints - add your own `auth` group when the project needs one.

## Stack

| Thing | What we use |
| --- | --- |
| Runtime | Node 20, TypeScript 5 (`strict`), CommonJS |
| HTTP | Express 5 |
| Database | PostgreSQL via Knex 3, `pg_trgm` for fuzzy search |
| Cache | Redis via `ioredis` |
| Validation | Zod 4 |
| Auth | JWT + `Session` table + Redis cache, Google sign-in |
| Uploads | `multer` -> S3-compatible object storage (`@aws-sdk/client-s3`) |
| Email | Gmail SMTP (`EMAIL_USER` + `GOOGLE_APP_PASSWORD`) via `sendEmail` |

## Prerequisites

- Node.js 20
- PostgreSQL with the `pg_trgm` extension available (the baseline migration runs `CREATE EXTENSION`)
- Redis
- S3-compatible object storage - optional, only needed for file uploads

## Setup

```bash
cp .env.example .env        # then fill in the database, Redis and JWT_SECRET values
npm install
npm run db:migrate-up       # creates the schema (migrations/20260101000000_v-1-0-0.ts)
npm run db:seed             # creates the default admin account
npm run dev                 # http://localhost:5001, health check at /status-check
```

Default admin account (from `seeds/v-1-0-0.ts`) - for when you add a sign-in endpoint:

| Email | Password |
| --- | --- |
| `admin@myapp.com` | `SomePassword1234` |

Every API route is versioned: `http://localhost:5001/api/v1/...`. The full endpoint list is in
[`docs/README.md`](docs/README.md), and a ready-made [Bruno](https://www.usebruno.com/) collection lives in
[`bruno-api/`](bruno-api/).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the server with `tsx` + `nodemon`, watching `src/` |
| `npm run type-check` | `tsc --noEmit` - the gate every change must pass |
| `npm run build` | Compile to `dist/` (`tsc && tsc-alias`) |
| `npm start` | Run the compiled server (`dist/src/server.js`) |
| `npm run db:make-migration <name>` | Create a new Knex migration |
| `npm run db:migrate-up` / `db:migrate-down` | Apply the latest migrations / roll back the last batch |
| `npm run db:make-seed <name>` | Create a new seed file |
| `npm run db:seed` | Run every seed |
| `npm run db:seed:single <file>` | Run one seed file |
| `npm test` | Jest (no test suite yet - passes with no tests) |

## Folder map

```
src/
  server.ts, app.ts           bootstrap, global middleware, /status-check, 404 + error handler
  api/api.routes.ts           mounts every route group with its auth guard
  api/<group>/<module>/       one module = routes / controller / service / validation
    template/                 the CRUD module to copy (authProtectMiddleware) - example
  middleware/                 auth, version, error
  config/env.ts               the only reader of process.env (zod-parsed)
  config/app.config.ts        fixed values: lifetimes, limits, vendor urls
  constants/                  enum-like value lists (user, storage, system)
  job/                        cron jobs (session expiry)
  types/                      db.ts schema mirror, express.d.ts, auth.d.ts
  utils/                      cache, data, date, encryption, error, notification, request, storage, validation
migrations/ seeds/            Knex, named by schema version (v-1-0-0)
docs/                         one Markdown file per endpoint + the index in docs/README.md
bruno-api/                    Bruno API collection for manual verification
.agent/skills/                the development rulebook (see AGENTS.md)
```

## Adding a module

Follow the step-by-step recipe in
[`.agent/skills/project-structure/references/api-module-recipe.md`](.agent/skills/project-structure/references/api-module-recipe.md):
pick the group and the next free API code, write the four module files (`.validation.ts`, `.service.ts`,
`.controller.ts`, `.routes.ts`), mount it in the group router, then add its doc under `docs/`, its row in
`docs/README.md`, and a Bruno request. The house rules behind it are in [`AGENTS.md`](AGENTS.md).
