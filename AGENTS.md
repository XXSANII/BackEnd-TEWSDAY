# AGENTS.md - MyApp Backend

Instructions for AI coding agents working in this repository. Human contributors should read it too.

## Read this first

**Before writing or editing anything under `src/`, `migrations/`, or `seeds/`, load the
`project-structure` skill: [`.agent/skills/project-structure/SKILL.md`](.agent/skills/project-structure/SKILL.md).**

It is the authoritative rulebook for this codebase - layering, naming, API/error codes, response
envelope, database and cache rules. Its references:

| File | Covers |
| --- | --- |
| [`SKILL.md`](.agent/skills/project-structure/SKILL.md) | The rules: directory law, layer contract, routing, codes, envelope, templates, ship checklist |
| [`references/code-style.md`](.agent/skills/project-structure/references/code-style.md) | The house look: banner comments, section-comment vocabulary, import order, naming, message wording |
| [`references/module-files.md`](.agent/skills/project-structure/references/module-files.md) | What belongs in each file of a module folder - `.routes.ts`, `.controller.ts`, `.service.ts`, `.validation.ts`, `_<module>.utils.ts` |
| [`references/api-module-recipe.md`](.agent/skills/project-structure/references/api-module-recipe.md) | Step-by-step recipe for a new endpoint or module |
| [`references/codes-and-errors.md`](.agent/skills/project-structure/references/codes-and-errors.md) | Endpoint code registry, error-code grammar, middleware/global codes |
| [`references/database-and-storage.md`](.agent/skills/project-structure/references/database-and-storage.md) | Knex/schema/migrations, Redis keys & TTLs, file upload pipeline |

All skills live in [`.agent/skills/`](.agent/skills/) so every agent reads the same rules. These are in
force on every task here as well:

- `docs-generation` - how to write the `docs/<group>/<code>_<name>.md` API docs (9 fixed sections,
  plus an optional Redis section). The live index of every endpoint and its doc is
  [`docs/README.md`](docs/README.md).
- `karpathy-guidelines` - think before coding, simplest thing that works, surgical changes,
  verifiable success criteria.
- [`.agent/skills/special-requirement.md`](.agent/skills/special-requirement.md) - standing
  project-specific requirements the user has stated; empty until something is recorded there.

## What this project is

MyApp's backend API: an Express 5 + TypeScript service on PostgreSQL (Knex) and Redis.
<Describe your product here.>

It is a starter template. Out of the box it ships the core schema (`User`, `AuthAccount`, `Session`,
`Otp`, `File`, ...), the auth/version/error middleware, the shared utils, and exactly one API module:
the full CRUD example `template/example` (`tmp_001`). There are no sign-in or sign-up endpoints - build
real modules by copying `src/api/template/example/`.

## Project map

```
src/api/api.routes.ts              mounts every group with its auth guard
src/api/<group>/<group>.routes.ts  mounts every module in the group
src/api/<group>/<module>/          the module folder:
    <module>.routes.ts               paths, versionMiddleware, multer -> default Router
    <module>.controller.ts           req -> service -> response envelope (one *Handler per endpoint)
    <module>.service.ts              business logic, db/redis/storage (one function per endpoint)
    <module>.validation.ts           zod request + response schemas, every exported type
    _<module>.utils.ts               module-private helpers (optional)
    <subresource>/                   nested resource: the same files, mounted by the parent
src/middleware/              auth, version, error
src/config/env.ts            the only reader of process.env (zod-parsed)
src/config/app.config.ts     fixed values: lifetimes, limits, vendor urls
src/constants/               `xType` objects + `xList` + `XType` types
src/types/                   db.ts (schema mirror), express.d.ts (req.user), auth.d.ts
src/utils/                   cache, data, date, encryption, error, notification, request,
                             storage, validation (named exports only)
src/job/                     scheduled jobs (`<domain>/<name>.jobs.ts`), registered in job/index.ts
migrations/ seeds/           Knex, named by schema version (v-1-0-0)
docs/README.md               index of every endpoint -> code, route, doc file
docs/<group>/                one Markdown file per endpoint, named <code>_<name>.md
bruno-api/                   Bruno API collection used for manual verification
```

Modules per group (`src/api/<group>/<module>/`):

| Group | Modules |
| --- | --- |
| `template` | `example` (the full CRUD example - copy it for a new resource) |

Route groups and their auth (mounted in `src/api/api.routes.ts` under `/api/:version`):

| Mount | Guard |
| --- | --- |
| `/template` | `authProtectMiddleware` |

A group you add picks its guard here: conventionally `/admin` -> `authorizeAdminMiddleware`,
`/me` -> `authProtectMiddleware`, `/auth` and `/` (public) -> none at the mount, guarded per route.

## Commands

```bash
npm run dev          # nodemon + tsx, watches src/
npm run type-check   # tsc --noEmit -- the gate; must pass before reporting done
npm run build        # tsc && tsc-alias
npm run db:make-migration <name>
npm run db:migrate-up          # / db:migrate-down
npm run db:seed
```

There is no automated test suite. "Verified" means `npm run type-check` passes and, for behavioural
changes, the endpoint was exercised through the Bruno collection. Do not claim tests were run.

## The rules in one screen

1. **Four-file modules.** `<module>.routes.ts` -> `.controller.ts` -> `.service.ts`, with `.validation.ts`
   holding the zod schemas and all exported types. Module-private helpers are `_<module>.utils.ts`.
   The file base name always equals the folder name; there is no `index.ts`, `.types.ts`, `.model.ts`, or
   `.helper.ts` in an API module. What each file may and may not contain is spelled out in
   [`references/module-files.md`](.agent/skills/project-structure/references/module-files.md).
2. **Layer discipline.** Controllers never touch `db`/`redis`/storage; services never touch `req`/`res`.
3. **Every endpoint has a code** `<group>_<NNN>_<action>` (e.g. `tmp_001_c`). Validation errors are
   `<code>_v_NN` (used as the zod message), service errors `<code>_s_NN`, success `<code>_success`.
   Codes are a public contract: never renumber, reuse, or repurpose one.
4. **One response envelope.** Success: `{ success, code, message, data }` (201 on create, else 200).
   Errors are produced only by `errorMiddleware`; throw `ApiError(status, code, message)`.
5. **Every handler is wrapped in `asyncHandler('<code>', ...)`** and returns `{ message, data, status? }`;
   the wrapper writes the envelope and `<code>_success`. No try/catch or `res.status().json()` in controllers.
6. **Validate the whole `req`** with one schema (`params`/`query`/`body`/`files`) and export the inferred
   types. Multipart bodies need the `zodConvertTo*PreProcess` wrappers.
7. **Writes run in `db.transaction`**, reads always filter `isActiveFlag: true`, audit columns come from
   `auditCreate` / `auditUpdate` / `auditSoftDelete`, and deletes are **soft only**.
8. **Cache through `src/utils/cache/` helpers** (`myapp:` prefix, 300 s for entity reads/searches,
   3600 s for user/session) and invalidate on every mutation.
9. **Uploads**: multer memoryStorage in the routes file, `createFileFieldSchema` in validation,
   `uploadFile` inside the transaction in the service, store the returned `fileId`.
10. **Write it like the rest of the codebase.** Banner comment above every exported handler / service /
    schema, the house section-comment vocabulary inside functions (`// Validate request body`,
    `// Prepare data`, `// Apply filters`, ...), the fixed import order, and success messages that read
    `'<Resource> <verb>ed successfully.'`. The whole spec is
    [`references/code-style.md`](.agent/skills/project-structure/references/code-style.md).
11. **Document it.** Every new or changed endpoint gets its `docs/<group>/<code>_<name>.md`, a row in
    [`docs/README.md`](docs/README.md), and a Bruno request.

Hard don'ts: no hard deletes, no query without `isActiveFlag`, no `process.env` outside `src/config/env.ts`,
no `console.log` in services, no renaming existing codes, no new dependencies or refactors outside the
requested change, nothing committed to `.env` or `dist/`.

## Style

Full spec: [`references/code-style.md`](.agent/skills/project-structure/references/code-style.md).

Prettier: 120 columns, single quotes, semicolons, 2-space indent, `trailingComma: es5`.
Imports use the `@/*` alias for anything outside the current module, relative paths for siblings.
Exported handlers, services, and schemas carry the house banner comment:

```ts
/**
 * ============================================================================
 * @name    createExample
 * @code    tmp_001_c
 * @route   POST /api/v1/template/example/create
 * @desc    Create an example.
 *
 * ============================================================================
 */
```

## Working agreement

- Match the surrounding code. If a rule here conflicts with the code you are editing, follow the code and
  tell the user about the mismatch instead of silently changing it.
- Make the smallest change that satisfies the request; don't refactor adjacent code or add speculative
  abstractions.
- State assumptions up front; ask when two readings would produce materially different work.
- Report honestly: say what you ran, what passed, and what you left out.
