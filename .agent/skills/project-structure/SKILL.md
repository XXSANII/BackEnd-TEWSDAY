---
name: project-structure
description: The development rulebook for the MyApp backend (Express 5 + TypeScript + Knex/PostgreSQL + Redis + Zod). Use whenever writing, editing, or reviewing any code in this repo - adding or changing an API endpoint, a service, a validation schema, a route, a migration, a constant, a util, an error code, or API docs. Read this before touching src/.
---

# MyApp Backend - Structure & Development Rules

Every rule here is derived from the existing code. When a rule and the surrounding code disagree,
match the surrounding code and flag the mismatch to the user - do not silently "modernize".

## 1. Stack & commands

| Thing | What we use |
| --- | --- |
| Runtime | Node 20, CommonJS (`"type": "commonjs"`), TypeScript 5 `strict: true` |
| HTTP | Express 5 |
| DB | PostgreSQL via Knex 3 (`pg`), `pg_trgm` for fuzzy search |
| Cache | Redis via `ioredis` |
| Validation | Zod 4 |
| Auth | JWT (`jsonwebtoken`) + `Session` table + Redis cache |
| Uploads | `multer` (memoryStorage) -> S3-compatible object storage (`@aws-sdk/client-s3`) |
| Format | Prettier: 120 cols, single quotes, semicolons, 2-space, `trailingComma: es5` |

```bash
npm run dev            # tsx + nodemon, watches src/
npm run type-check     # tsc --noEmit  <- THE gate. Must pass before you report done.
npm run build          # tsc && tsc-alias
npm run db:make-migration <name>
npm run db:migrate-up / db:migrate-down
npm run db:seed
```

There is **no test suite**. Verification = `npm run type-check` passes + (when the change is behavioural)
a Bruno request under `bruno-api/`. Never claim a change is "tested".

## 2. Directory law

```
src/
  api/api.routes.ts                              # mounts every group + its auth guard
  api/<group>/<group>.routes.ts                  # mounts every module in the group
  api/<group>/<module>/<module>.routes.ts        # paths, versionMiddleware, multer
  api/<group>/<module>/<module>.controller.ts    # req -> service -> response envelope
  api/<group>/<module>/<module>.service.ts       # business logic, db, redis, storage
  api/<group>/<module>/<module>.validation.ts    # zod schemas + every exported type
  api/<group>/<module>/_<module>.utils.ts        # module-private helpers, underscore prefix
  api/<group>/<module>/<subresource>/...         # nested resource = the same files, nested
  middleware/<name>.middleware.ts
  config/env.ts                                  # the ONLY place process.env is read (zod-parsed)
  config/app.config.ts                           # fixed values: lifetimes, limits, vendor urls
  constants/<domain>.constants.ts                # `xType` objects + `xList` + `XType` types
  types/db.ts | express.d.ts | auth.d.ts
  utils/<domain>/<name>.{service,helper}.ts      # named exports only
  utils/cache/get*RedisKey.helper.ts             # every Redis key builder
  utils/request/asyncHandler.helper.ts           # controller wrapper, writes the success envelope
  utils/request/getRequestPayload.helper.ts      # typed, non-null req.user (throws if missing)
  utils/validation/regex.ts | *.schema.ts        # shared regexes + zod schemas
migrations/  seeds/  docs/<group>/  bruno-api/
```

Live module inventory (mount -> module folders):

| Group | Modules |
| --- | --- |
| `template` | `example` (the full CRUD example - copy it for a new resource) |

That is the whole API today: the template ships no sign-in, sign-up or profile endpoints. Build real
modules by copying `src/api/template/example/`.

Rules:
- A module is **always** the 4-file set (`.routes.ts`, `.controller.ts`, `.service.ts`, `.validation.ts`),
  plus an optional `_<module>.utils.ts`. The file base name always equals the folder name; `index.ts`,
  `<module>.types.ts`, `<module>.model.ts` and `<module>.helper.ts` do not exist here.
  Per-file spec: `references/module-files.md`. Never merge controller into routes, never put SQL in a controller.
- Import across modules with the `@/` alias (`@/utils/db`), import siblings relatively (`./example.service`).
- The only group today is `template`. Adding a group (conventionally `admin`, `auth`, `me`, `public`)
  means editing `src/api/api.routes.ts` and picking a new code prefix - ask the user first.

## 3. Layer contract

```
routes      declares path + versionMiddleware + multer; imports `* as controller`
controller  parses req with the zod schema, reads req.user, calls service, writes the envelope
service     pure(ish) async functions: typed input -> typed output. Throws ApiError. Owns all db/redis.
validation  zod schemas for request AND response + all exported types
```

- The controller **never** touches `db`, `redis`, or storage.
- The service **never** touches `req`, `res`, or `next`. It receives plain typed objects plus `user: UserPayload`.
- Service signature order: `(params, headers, input, files, user)` - include only the ones the endpoint
  has, `user` always last (`headers` appears where the endpoint records `ipAddress` / `userAgent` /
  `deviceId`, e.g. a sign-in endpoint takes `(input, headers)`).

## 4. Routing

```ts
const router = Router({ mergeParams: true });   // ALWAYS mergeParams
router.post('/create', versionMiddleware(1), controller.createExampleHandler);
router.post('/search', versionMiddleware(1), controller.searchExampleHandler);
router.get('/:exampleId/get', versionMiddleware(1), controller.getExampleHandler);
router.put('/:exampleId/edit', versionMiddleware(1), controller.editExampleHandler);
router.delete('/:exampleId/delete', versionMiddleware(1), controller.deleteExampleHandler);
router.use('/:exampleId/child', childRoutes);       // sub-routers mounted last
export default router;
```

- URL verb suffixes are mandatory: `/create`, `/search`, `/:id/get`, `/:id/edit`, `/:id/delete`.
- `search` is **POST** (filters travel in the body), not GET.
- Every leaf route carries `versionMiddleware(n)`. Public base is `/api/:version/...` with `v1`.
- Auth is applied at the mount point in `api.routes.ts`: today `template` -> `authProtectMiddleware`.
  The conventional guards for groups a project adds: `admin` -> `authorizeAdminMiddleware`,
  `me` -> `authProtectMiddleware`, `auth` + `public` -> nothing at the mount. A group with no guard at
  the mount then guards **per route**, after `versionMiddleware`: `authProtectMiddleware` on writes and
  `authGateMiddleware` on optional-user reads (none yet - the middleware is ready for them).
- `multer` is configured **in the routes file** with `memoryStorage()` and `upload.fields([...])`.

## 5. API codes - the backbone

Format `<group>_<NNN>_<action>`; e.g. `tmp_001_c`.

| Prefix | Meaning | Prefix | Meaning |
| --- | --- | --- | --- |
| `tmp_` | template group (live) | `mid_` | middleware |
| `adm_` | admin group (reserved) | `file_` | `utils/storage` services |
| `auth_` | auth group (reserved) | `int_` | internal/global (`int_999_01`, `int_999_02`) |
| `me_` | me group (reserved) | | |
| `pub_` | public group (reserved) | | |

Only `tmp_` has endpoints today. The reserved prefixes are the conventional ones for groups a project
adds - use them for those groups rather than inventing new ones.

Any other new group gets its own short lowercase prefix in the same style (e.g. `ord_` for an `order` group),
agreed with the user and added to this table and to `references/codes-and-errors.md` before its first
endpoint ships. Never reuse an existing prefix for a different group.

`NNN` = resource number, sequential **within its group**. `action` = `c` create, `e` edit, `g` get,
`s` search, `d` delete. `auth_*` and `mid_*` have no action letter.

**Codes are a public contract** (frontend + `docs/` depend on them). Never renumber or reuse a code.
New endpoint -> take the next free number; check `references/codes-and-errors.md` for the live registry.

Derived codes:
- validation error: `<code>_v_<NN>` - this string is the zod message
- service error: `<code>_s_<NN>`
- success: `<code>_success`

## 6. Response envelope

Success (controller returns a `HandlerResponse`, `asyncHandler` writes the envelope):
```ts
return { message: 'Example created successfully.', data: createdExample, status: 201 }; // status: 201 for create, omit for 200
// -> 201 { success: true, code: 'tmp_001_c_success', message: 'Example created successfully.', data: createdExample }
```
Only a handler that writes the response itself (file stream) touches `res`; it then returns nothing.

Error (produced only by `errorMiddleware`, never hand-rolled):
```json
{ "success": false, "code": "tmp_001_c_v_01", "message": "..." }
```
`ApiError` -> its own status/code. `ZodError` -> 400 with the first issue's message as the code.
Anything else -> 500 `int_999_01` and is written to `ErrorLog` by `logError`.

## 7. Controller template

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
export const createExampleHandler = asyncHandler('tmp_001_c', async (req) => {
  // Validate request body
  const { body } = createExampleSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdExample = await exampleService.createExample(body, user);

  // Send response
  return { message: 'Example created successfully.', data: createdExample, status: 201 };
});
```

- Wrap **every** handler in `asyncHandler('<code>', ...)` and return `{ message, data, status? }`. No try/catch,
  no `res.status().json()` in controllers.
- Parse the whole `req` with one schema and destructure `{ params, query, body, files }`.
- Re-guard required params (`if (!params.exampleId) throw new Error(...)`) - a plain `Error` here, because
  it is an impossible-state bug, not a user error.

## 8. Validation rules

- One schema per endpoint, shaped like the request: `z.object({ params, query, body, files })`.
- **Every** zod message is the error code string: `z.string('tmp_001_c_v_01')`.
- Always export the response schema and the inferred types:
  `CreateExampleInput` (body), `CreateExampleParams`, `CreateExampleFiles`, `CreateExampleResponse`.
- Search schemas compose the shared shapes and a sort map:
  ```ts
  export const searchExampleSortMap = { name: 'name', createdAt: 'createdAt' } as const;
  export const searchExampleValidSortKeys = Object.keys(searchExampleSortMap) as [string, ...string[]];
  export const searchExampleSchema = z.object({ body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchExampleValidSortKeys, 'name').shape,
    name: z.string('tmp_001_s_v_01').optional(),
  })});
  ```
- Multipart endpoints: every scalar body field arrives as a string, so wrap it with
  `z.preprocess(zodConvertToNumberPreProcess | ...BooleanPreProcess | ...JsonPreProcess, ...)`.
- Files: `createFileFieldSchema({ isRequired, maxCount, acceptedTypes, maxSizeInBytes, requiredError, mimeTypeError, sizeError, countError })`, and mark the `files` object `.partial()`.

## 9. Service rules

- Any write path runs inside `db.transaction(async (trx) => { ... })`; use `trx`, never `db`, inside it.
- Read-only services may use `db` directly.
- Before mutating, load the row with `.where({ <pk>, isActiveFlag: true }).first<T>()` and throw
  `ApiError(404, '<code>_s_NN', '... not found or inactive.')` when missing.
- After every insert/update, check the returned row and throw `ApiError(500, ...)` when it is empty.
- Audit columns come only from the helpers: `auditCreate(user.userLogName)` on insert,
  `auditUpdate(...)` on update (spread **last**), `auditSoftDelete(...)` to retire a row.
- **Soft delete only.** No SQL `DELETE`. Cascade by soft-deleting child rows in the same `trx`.
- Search pipeline order is fixed: build base query -> filters -> `applySearch` (trigram) ->
  `applySort` -> `query.clone().clearSelect().clearOrder().count()` -> `calculatePagination` ->
  `applyPagination` -> execute -> return `{ total, pagination, data }`.

## 10. Comment & code style

Full spec: `references/code-style.md`. The short version:

- Wide banner (`=` rule lines) above every exported handler / service / schema inside `src/api`;
  the same wide banner with only `@name` / `@code` / `@desc` in `src/utils`, `src/middleware`, `src/config`.
  Routes files get no banner. Everything in `src/utils` is a named export, never `export default`.
- Controller banner: `@name` (handler name without `Handler`), `@code`, `@route` (full `/api/v1` path),
  `@desc`. Service banner: `@name` is the **API code**, plus `@desc`. Validation: `@name` is the schema.
- Section comments come from a fixed vocabulary - controller always runs `// Validate request body` ->
  `// Extract user payload from request (set by auth middleware)` -> `// Call service` ->
  `// Send response`; services pick from `// Prepare data`, `// Check existing data`, `// Insert data`,
  `// Build query`, `// Apply filters`, `// Apply sorting`, `// Apply pagination`, `// Execute query`,
  `// Format return data`, `// Return result`, with `// -----------------------------------` separating
  long stages.
- Success messages read `'<Resource> <verb>ed successfully.'`; `ApiError` messages are full sentences;
  zod messages are bare error codes; plain `Error` is reserved for impossible states.

## 11. Ship checklist

1. `npm run type-check` passes.
2. Codes: new `_v_`/`_s_` codes are unique inside the endpoint and start at `01`; no existing code changed.
3. `src/types/db.ts` updated if the schema changed, with a paired migration `up` **and** `down`.
4. Redis invalidated wherever the mutated entity is cached.
5. API doc written to `docs/<group>/<code>_<name>.md` using the `docs-generation` skill in `.agent/skills/`.
6. Bruno request added/updated under `bruno-api/collections/`.
7. Nothing new in `dist/`, `.env`, or `package.json` unless the task actually required it.

## 12. Hard don'ts

- No `process.env` outside `src/config/env.ts`.
- No hard deletes; no query that forgets `isActiveFlag: true`.
- No `console.log` in services - errors flow through `ApiError`/`errorMiddleware`/`logError`.
- No renaming or renumbering existing API/error codes.
- No new dependency, abstraction, or "improvement" outside the requested change (see
  `.agent/skills/karpathy-guidelines/SKILL.md`).

## References

- `references/code-style.md` - banner comments, section-comment vocabulary, import order, naming and
  message wording: the rules that make every file look the same.
- `references/module-files.md` - what belongs in each file of a module folder (`.routes.ts`,
  `.controller.ts`, `.service.ts`, `.validation.ts`, `_<module>.utils.ts`), with required exports,
  naming, ordering, and what each file may never contain.
- `references/api-module-recipe.md` - full copy-paste recipe for a new endpoint or module.
- `references/codes-and-errors.md` - code registry, error-code grammar, middleware/global codes.
- `references/database-and-storage.md` - Knex/schema/migration rules, Redis keys & TTLs, file pipeline.
