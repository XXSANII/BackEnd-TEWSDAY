# House code style - make every file look like the same person wrote it

This file is about **shape**, not logic: banner comments, section comments, import order, naming,
wording. Copy these shapes literally. If a rule here disagrees with the file you are editing, follow
the file and tell the user about the mismatch.

Prettier settings (`.prettierrc`) are the only automatic part: 120 columns, single quotes, semicolons,
2-space indent, `trailingComma: es5`, `arrowParens: always`. Everything below is manual and is checked
by eye in review.

---

## 1. The banner comment

Two banner shapes exist, and which one you use depends on the folder.

### 1a. Wide banner - everything inside `src/api/`

Used above **every** exported handler, service function, and zod schema. 76 `=` characters, one blank
comment line before the closing rule:

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

| File | Tags, in this order | `@name` is |
| --- | --- | --- |
| `<module>.controller.ts` | `@name` `@code` `@route` `@desc` | the handler name **without** `Handler` (`createExample`) |
| `<module>.service.ts` | `@name` `@desc` | the **API code** (`tmp_001_c`) |
| `<module>.validation.ts` | `@name` `@code` `@desc` | the schema name (`createExampleSchema`) |
| `_<module>.utils.ts` | `@name` `@desc` | the function name (`hashPassword` in an `_auth.utils.ts`) |

- `@route` is the full public path including `/api/v1` and every parent param
  (`PUT /api/v1/template/example/:exampleId/edit`, `GET /api/v1/template/example/:exampleId/get`).
- `@desc` is one sentence, capitalised, ending in a period. Controller and service share the same
  sentence for the same endpoint; validation uses the gerund form already in the code
  (`Creating example schema`, `Edit example schema`).
- Tag values are aligned with spaces. Controller/service files align to 4 spaces after the tag
  (`@name    `), validation files in the older modules align to 2 (`@name  `) - match the file you are in.
- Routes files (`<module>.routes.ts`, `<group>.routes.ts`) carry **no** banner.

### 1b. Shared-code banner - `src/utils/`, `src/middleware/`, `src/config/`

The same wide banner, with only `@name`, an optional `@code`, and `@desc` (no `@type`, `@route`,
`@returns` or `@note` - fold those into `@desc` bullets):

```ts
/**
 * ============================================================================
 * @name    uploadFile
 * @code    file_006
 * @desc    Upload a file to the object storage and record it in the File table.
 *
 * ============================================================================
 */
```

- Every top-level function, class, interface and singleton gets one, exported or not.
- `@name` is the declared name.
- `@code` only when the unit owns an error-code family (`file_006`, `mid_001`); helpers with
  no codes of their own omit it (`applySort`, `calculatePagination`).
- `@desc` is one line when it fits in 120 columns, otherwise `@desc` alone followed by `- ` bullets.
- Everything in `src/utils/` is a **named** export (`export function`, `export const db`,
  `export class ApiError`) - never `export default`. Import it as `import { db } from '@/utils/db'`.
- Constants files use `// ===` section banners and `@constant` / `@desc` over each exported `xType` object.

---

## 2. Section comments inside a function

Short, sentence-case, no trailing period, on their own line with a blank line **above** (except the
first one in a block). Use the house vocabulary - do not invent synonyms:

**Controller** - always these four, in this order:

```ts
  // Validate request body                                  // or: Validate request params & body
  // Extract user payload from request (set by auth middleware)
  // Call service
  // Send response
```

**Service** - pick from this list as the steps apply:

```ts
  // Prepare data          // Check existing data      // Check existing user
  // Insert data           // Update data              // Delete main record
  // Delete cascade record // Upload file              // Invalidate cache
  // Build query           // Build base query         // Apply filters
  // Apply sorting         // Apply pagination         // Execute query
  // Format return data    // Return result
```

`// Execute query` and `// Execute the query` both exist in the codebase; match the neighbouring
functions in the file you are editing rather than converting them.

**Stage separators** - for services long enough to have phases (search with joins, multi-table writes),
separate the phases with a rule line at the same indentation:

```ts
    // -----------------------------------
    // Delete main record
    // -----------------------------------
```

Anything else - a line explaining *why* a non-obvious branch exists - is a normal sentence-case comment
placed directly above the code it explains. Never leave commented-out code behind.

---

## 3. Import order

Files are grouped top to bottom; no blank lines between imports inside `src/api` modules (the
aggregator routes files are the exception and group with blank lines).

```
1. framework / third-party        express, zod, multer, knex
2. project singletons + utils     { db } @/utils/db, { redis } @/utils/redis, { ApiError } @/utils/error/ApiError, @/utils/data/*
3. types + constants              @/types/db, @/types/express, @/constants/*
4. siblings, relative             ./example.service, ./example.validation, ./_example.utils
```

- Use the `@/` alias for anything outside the current module folder; use `./` or `../` only for
  siblings and the module's own sub-resources.
- Controllers import `asyncHandler`, `getRequestPayload` (only when they need `user`), `* as <module>Service`,
  and the schemas. Any other import is the signal that service work has leaked into the controller.
- `import * as exampleService from './example.service'` - namespace import, never named imports of services.

---

## 4. Naming

| Thing | Pattern | Example |
| --- | --- | --- |
| Folder + file base | the resource, camelCase singular | `example/example.service.ts` |
| Handler | `<action><Resource>Handler` | `getExampleHandler` |
| Service fn | `<action><Resource>` | `getExample` |
| Request schema | `<action><Resource>Schema` | `editExampleSchema` |
| Response schema | `<action><Resource>ResponseSchema` | `editExampleResponseSchema` |
| Types | `<Action><Resource>` + `Params` / `Input` / `Files` / `Response` | `EditExampleParams` |
| Sort map | `search<Resource>SortMap` / `search<Resource>ValidSortKeys` | `searchExampleSortMap` |
| Redis key helper | `get<Entity>RedisKey` | `getAuthRedisKey` |
| Util file | `<name>.service.ts` / `<name>.helper.ts` / `<name>.schema.ts` | `applySort.helper.ts` |
| Module-private utils | `_<module>.utils.ts` | `_example.utils.ts` |
| Local row variables | `existing…`, `new…Data`, `updated…`, `created…` | `existingExample`, `newExampleData` |

Actions are always the five verbs `create | edit | get | search | delete`; a "me"-scoped endpoint keeps
the possessive in the name (`getMe`, `editMe`; the caller's own rows of a resource would be
`searchMy<Resource>`, `getMy<Resource>`).

---

## 5. Message wording

- **Success message**: `'<Resource> <past-tense verb> successfully.'` - `'Example created successfully.'`,
  `'Example edited successfully.'`, `'Example deleted successfully.'`. Sentence case, period.
- **`ApiError` message**: a full sentence, period included, that a support engineer can read:
  `'Example not found or inactive.'`, `'Failed to create example.'`, `'Your account is banned. Please contact support.'`
- **Zod message**: never prose - it is the error code string and nothing else: `z.string('tmp_001_c_v_01')`.
- **Plain `Error` message** (impossible state, becomes a logged 500):
  `'Example info is missing in request.'`

---

## 6. Small shapes worth copying exactly

```ts
// Routes: one line per leaf route, collection routes first, sub-routers last
const router = Router({ mergeParams: true });
router.post('/create', versionMiddleware(1), controller.createExampleHandler);
router.use('/:exampleId/child', childRoutes);
export default router;

// Multer, only in routes files that take uploads, with this exact comment
// Set up multer
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Controller user - typed non-null, throws a plain Error (logged 500) if the auth middleware is missing
const { user } = getRequestPayload(req, ['user']);

// Service write - transaction, audit helper last, returning + result check
return db.transaction(async (trx) => {
  // Prepare data
  const newExampleData: Partial<Example> = { name, ...auditCreate(user.userLogName) };

  // Insert data
  const [newExample] = await trx('Example').insert(newExampleData).returning('exampleId as exampleId');
  if (!newExample) {
    throw new ApiError(500, 'tmp_001_c_s_01', 'Failed to create example.');
  }

  return newExample;
});

// Search tail - always this order, always a named returnResult
const returnResult: SearchExampleResponse = { total: totalCount, pagination, data: examples };
return returnResult;
```

---

## 7. Checklist before you call a file "done"

1. Every exported handler / service / schema has the right banner, with the right tags in the right order.
2. Section comments come from the vocabulary in §2 and read in the house order.
3. Imports follow §3 and the controller still has only its three imports.
4. Names follow §4 - including the `Handler` suffix and the four type suffixes.
5. Messages follow §5; every zod message is a bare error code.
6. `npm run type-check` passes and the file is Prettier-clean.
