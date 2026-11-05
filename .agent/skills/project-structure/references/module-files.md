# The files inside an API module folder

Every endpoint group lives at `src/api/<group>/<module>/` and is made of the same files. Using
`src/api/template/example/` as the canonical example:

```
src/api/template/example/
  example.routes.ts        paths, middleware, multer          -> exports default Router
  example.controller.ts    request in / envelope out          -> exports one *Handler per endpoint
  example.service.ts       business logic, db, redis, storage -> exports one function per endpoint
  example.validation.ts    zod schemas + all exported types   -> exports schemas + types
  _example.utils.ts        module-private helpers (optional)  -> exports plain functions
  <child>/                 nested sub-resource = same 4 files, mounted by the parent routes file
```

The file base name **always** equals the folder name. Never invent `example.helper.ts`, `example.types.ts`,
`index.ts`, or `example.model.ts` - the five names above are the whole vocabulary.

How the code inside these files must *look* - banners, section comments, import order, naming, message
wording - is in `code-style.md`.

---

## `<module>.routes.ts`

**Owns:** URL shape, HTTP verb, API version gate, multipart parsing, sub-router mounting.
**Never:** validation, business logic, `req.user` reads, database access.

```ts
import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './example.controller';    // namespace import, never named
import childRoutes from './child/child.routes';        // sub-resources, if any

// Set up multer                                       // only when the module takes uploads
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router({ mergeParams: true });           // mergeParams is mandatory

// collection routes first
router.post('/create', versionMiddleware(1), controller.createExampleHandler);
router.post('/search', versionMiddleware(1), controller.searchExampleHandler);
// then the :id routes
router.delete('/:exampleId/delete', versionMiddleware(1), controller.deleteExampleHandler);
router.put('/:exampleId/edit', versionMiddleware(1), controller.editExampleHandler);
router.get('/:exampleId/get', versionMiddleware(1), controller.getExampleHandler);
// then sub-routers, last
router.use('/:exampleId/child', childRoutes);

export default router;
```

Required:
- `Router({ mergeParams: true })` - `:version` / `:exampleId` from the parent must survive.
- `versionMiddleware(n)` on **every** leaf route.
- Order: `/create`, `/search`, then `/:id/delete`, `/:id/edit`, `/:id/get`, then `router.use(...)`.
- Uploads: `multer.memoryStorage()` declared in this file and applied as
  `upload.fields([{ name: 'file', maxCount: 1 }, ...])` between `versionMiddleware` and the handler.
- Per-route auth only in a group mounted **without** a guard (e.g. a `public` or `auth` group a project
  adds) - `authProtectMiddleware` for writes, `authGateMiddleware` for optional-user reads - placed
  straight after `versionMiddleware(1)`. A group guarded at its mount point in `src/api/api.routes.ts`
  (`template` -> `authProtectMiddleware`) is never re-guarded inside the module.
- `export default router;`

---

## `<module>.controller.ts`

**Owns:** parsing `req` through the schema, pulling `req.user`, calling the service, writing the envelope.
**Never:** `db`, `redis`, storage clients, SQL, try/catch, hand-written error bodies.

```ts
import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as exampleService from './example.service';
import { createExampleSchema, deleteExampleSchema, editExampleSchema, getExampleSchema, searchExampleSchema } from './example.validation';

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

Required:
- Export name: `<action><Resource>Handler`, always `export const`, always wrapped in
  `asyncHandler('<code>', async (req) => { ... })`. Take `res` only when the handler writes the response
  itself (file stream) and then returns nothing.
- The imports above (`getRequestPayload` only when the endpoint needs `user`) and nothing else - a controller that needs another import is doing service work.
- Banner comment with `@name` (no `Handler` suffix), `@code`, `@route` (full path incl. `/api/v1`), `@desc`.
- The four section comments in order: `// Validate request body` (or `// Validate request params & body`,
  `// Recheck request info`), `// Extract user payload from request (set by auth middleware)`,
  `// Call service`, `// Send response`.
- Read the authenticated user with `getRequestPayload(req, ['user'])` - it throws a plain `Error` (logged 500)
  when the auth middleware is missing.
- Other guards use a plain `Error` (impossible state -> logged 500), not `ApiError`:
  `if (!params.exampleId) throw new Error('Example info is missing in request.');`
- Return `{ message, data }`; add `status: 201` for create, omit it for `200`. `asyncHandler` adds
  `success: true` and `code: '<code>_success'`.
- Endpoints on optional-auth routes (`authGateMiddleware`) read `const { user } = req;` and pass it on
  **without** the guard - the service takes `user?: UserPayload`.
- Export order matches the service and validation files (the CRUD modules run create, delete, edit, get, search).

---

## `<module>.service.ts`

**Owns:** everything else - transactions, queries, cache, uploads, business rules, `ApiError`.
**Never:** `req`, `res`, `next`, zod parsing, HTTP status codes outside `ApiError`.

```ts
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { UserPayload } from '@/types/express';
import { Example } from '@/types/db';
import { CreateExampleInput, CreateExampleResponse, ... } from './example.validation';
import { applySort } from '@/utils/data/applySort.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { auditCreate, auditUpdate, auditSoftDelete } from '@/utils/data/auditFields.helper';

/**
 * ============================================================================
 * @name    tmp_001_c
 * @desc    Create an example.
 *
 * ============================================================================
 */
export async function createExample(input: CreateExampleInput, user: UserPayload): Promise<CreateExampleResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const { name } = input;
    const newExampleData: Partial<Example> = { name, ...auditCreate(user.userLogName) };

    // Insert data
    const [newExample] = await trx('Example').insert(newExampleData).returning('exampleId as exampleId');
    if (!newExample) {
      throw new ApiError(500, 'tmp_001_c_s_01', 'Failed to create example.');
    }

    return newExample;
  });
}
```

Required:
- `export async function <action><Resource>(...)` - a function declaration, not a const arrow.
- Parameter order `(params, headers, input, files, user)`, including only what the endpoint has;
  `user: UserPayload` (or `user?: UserPayload` behind `authGateMiddleware`) is always last. `headers`
  appears only where the endpoint stores request metadata (`ipAddress` / `userAgent` / `deviceId`),
  e.g. a sign-in endpoint that writes a `Session` row takes `(input, headers)`.
- Both sides typed from `./<module>.validation`: `Promise<XxxResponse>` return, `XxxInput` / `XxxParams` /
  `XxxFiles` arguments. Row payloads typed `Partial<Table>` from `@/types/db`.
- Banner comment uses the **API code as `@name`** (`@name tmp_001_c`) plus `@desc`.
- Section comments: `// Prepare data`, `// Check existing data`, `// Insert data`, `// Apply filters`,
  `// Apply sorting`, `// Apply pagination`, `// Execute the query`, `// Return result`, and
  `// -----------------------------------` banner blocks to separate stages of a long function.
- Writes inside `db.transaction(async (trx) => ...)` using `trx`; reads may use `db`.
- Every read filters `isActiveFlag: true`; every insert/update `.returning(...)` and checks the result;
  deletes are `auditSoftDelete` on the row plus every child table in the same `trx`.
- Cache reads/writes go through `src/utils/cache/` helpers, and any mutation `redis.del(...)`s the keys.

---

## `<module>.validation.ts`

**Owns:** the request schema, the response schema, and every type the other three files import.
**Never:** business logic, database access, HTTP concerns.

```ts
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { createFileFieldSchema } from '@/utils/validation/file.schema';
import z from 'zod';

/**
 * ============================================================================
 * @name  createExampleSchema
 * @code  tmp_001_c
 * @desc  Creating example schema
 *
 * ============================================================================
 */
export const createExampleSchema = z.object({
  body: z.object({
    name: z.string('tmp_001_c_v_01'),      // the message IS the error code
  }),
});

export const createExampleResponseSchema = z.object({
  exampleId: z.string(),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>['body'];
export type CreateExampleResponse = z.infer<typeof createExampleResponseSchema>;
```

Required, per endpoint, in this order: request schema -> response schema -> inferred types.
- Naming: `<action><Resource>Schema`, `<action><Resource>ResponseSchema`, and types
  `<Action><Resource>Params` / `Input` (body) / `Files` / `Response`
  (search also exports `<...>ResponseSchemaBody` + `SearchXxxResponseBody`).
- The request schema mirrors `req`: keys `params`, `query`, `body`, `files` - only the ones used.
- **Every** zod validator carries its error code as the message: `z.string('tmp_001_c_v_01')`,
  `z.uuidv4('tmp_001_e_v_01')`, `z.enum(languageList, 'tmp_002_e_v_01')`, `.min(1, 'tmp_002_e_v_02')`.
  Numbering is per endpoint, starts at `01`, and is never reused.
- Search endpoints also export the sort map and keys:
  ```ts
  export const searchExampleSortMap = { name: 'name', createdAt: 'createdAt' } as const;
  export const searchExampleValidSortKeys = Object.keys(searchExampleSortMap) as [string, ...string[]];
  ```
  and compose `...paginationSchema.shape` + `...sortingSchema(searchExampleValidSortKeys, 'name').shape`
  **after** the filter fields. The response schema is `{ total, pagination: PaginatedResponse, data: [...] }`.
- Multipart endpoints wrap scalar body fields in `z.preprocess(zodConvertToNumberPreProcess | ...Boolean... |
  ...Json..., ...)` from `@/utils/data/zodConvertTypePreProcess.helper`, and declare `files:` with
  `createFileFieldSchema({ ... })` on a `.partial()` object.
- Enum fields use the `as const` list from `src/constants/<domain>.constants.ts` - never an inline union.

---

## `_<module>.utils.ts` (optional)

Module-private helpers, underscore-prefixed so it sorts above the four core files and reads as "not an
endpoint". The template ships none; a typical one is an `_auth.utils.ts` holding `hashPassword`,
`comparePassword` and `establishUserSession` for an auth module's endpoints.

- Plain exported functions with the `@name` / `@desc` banner; no zod, no envelope.
- Create one only when two or more functions in **this module** need the same logic. If a second module
  needs it, it belongs in `src/utils/<domain>/` instead.
- May take an optional `trx?: Knex | Knex.Transaction` so callers can pass their transaction.

---

## `<group>.routes.ts` (one level up)

The group aggregator - only mounts child routers, no endpoints of its own:

```ts
import { Router } from 'express';
import exampleRoutes from './example/example.routes';
const router = Router({ mergeParams: true });
router.use('/example', exampleRoutes);
export default router;
```

A new module is not reachable until it is mounted here (and the group itself is mounted with its guard in
`src/api/api.routes.ts`).

---

## Nested sub-resources

A resource that only exists under a parent gets its own folder inside the parent module with the same
four files, and the parent's routes file mounts it last:
`src/api/<group>/<module>/<sub>/` -> `router.use('/<sub>', <sub>Routes);` (in `<module>.routes.ts`), or for
a child of one row, `src/api/template/example/<child>/` -> `router.use('/:exampleId/<child>', <child>Routes);`.
It gets its **own** API code (the next free `tmp_NNN`), not a sub-code of the parent.

---

## Files a change usually touches outside the module folder

| Path | When |
| --- | --- |
| `src/api/api.routes.ts` | new group, or a change to a group's guard |
| `src/api/<group>/<group>.routes.ts` | new module |
| `src/types/db.ts` | any DB schema change - same commit as the migration |
| `src/constants/<domain>.constants.ts` | any new enum-ish set of values |
| `src/utils/<domain>/...` | logic shared by two or more modules |
| `src/utils/cache/get*RedisKey.helper.ts` | a newly cached entity |
| `src/config/env.ts` | a new per-environment or secret value |
| `src/config/app.config.ts` | a new fixed value (lifetime, limit, vendor url) |
| `migrations/<ts>_v-x-y-z.ts` | schema change - `up` **and** `down` |
| `docs/<group>/<code>_<name>.md` | every new or changed endpoint (see the `docs-generation` skill) |
| `bruno-api/collections/...` | every new endpoint, for manual verification |
