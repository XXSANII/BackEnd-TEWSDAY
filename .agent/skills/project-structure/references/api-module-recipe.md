# Recipe: add an endpoint / module

Worked example: the `Example` resource in the `template` group, code base `tmp_001` - the live module in
`src/api/template/example/`, which exists to be copied.
Copy the shapes exactly; only names change. For the full per-file spec - required exports, ordering,
and what each file may never contain - see `module-files.md`; for banners, section comments, import
order and message wording, see `code-style.md`.

## Step 0 - decide the identity

1. Pick the **group** (only `template` exists today; a project adds its own, e.g. `admin`, `auth`, `me`,
   `public`) - that fixes the auth mount and the code prefix.
   A new group needs a new prefix first (see `codes-and-errors.md`, "Adding a group prefix").
2. Pick the **resource number**: next unused `NNN` inside that group (see `codes-and-errors.md`).
3. Pick the **action letter**: `c` create / `e` edit / `g` get / `s` search / `d` delete.
4. Full code = `tmp_001_c`. URL = `POST /api/v1/template/example/create`.

## Step 1 - `example.validation.ts`

```ts
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
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
    name: z.string('tmp_001_c_v_01'),
  }),
});

export const createExampleResponseSchema = z.object({
  exampleId: z.string(),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>['body'];
export type CreateExampleResponse = z.infer<typeof createExampleResponseSchema>;
```

Search variant:

```ts
export const searchExampleSortMap = { name: 'name', createdAt: 'createdAt' } as const;
export const searchExampleValidSortKeys = Object.keys(searchExampleSortMap) as [string, ...string[]];

export const searchExampleSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchExampleValidSortKeys, 'name').shape,
    name: z.string('tmp_001_s_v_01').optional(),
  }),
});

export const searchExampleResponseSchemaBody = z.object({ exampleId: z.string(), name: z.string() });
export const searchExampleResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchExampleResponseSchemaBody),
});
export type SearchExampleInput = z.infer<typeof searchExampleSchema>['body'];
export type SearchExampleResponse = z.infer<typeof searchExampleResponseSchema>;
```

Multipart variant (`params` + coerced body + files) - an illustrative `<resource>` endpoint, code
`tmp_002_c` (the template ships no live multipart endpoint):

```ts
export const createDocumentSchema = z.object({
  params: z.object({ exampleId: z.string('tmp_002_c_v_01') }),
  body: z.object({
    name: z.string('tmp_002_c_v_02'),
    sortOrder: z.preprocess(zodConvertToNumberPreProcess, z.number('tmp_002_c_v_03').min(0, 'tmp_002_c_v_03')),
    exampleIds: z.preprocess(zodConvertToJsonPreProcess, z.array(z.string('tmp_002_c_v_04')).optional().nullable()).optional().nullable(),
    isPublicFlag: z.preprocess(zodConvertToBooleanPreProcess, z.boolean('tmp_002_c_v_05').optional()),
  }),
  files: z
    .object({
      file: createFileFieldSchema({
        isRequired: true,
        maxCount: 1,
        acceptedTypes: ['application/pdf'],
        maxSizeInBytes: appConfig.file.GENERAL_FILE_MAX_SIZE_BYTE,
        requiredError: 'tmp_002_c_v_06',
        countError: 'tmp_002_c_v_07',
        mimeTypeError: 'tmp_002_c_v_08',
        sizeError: 'tmp_002_c_v_09',
      }).optional(),
    })
    .partial(),
});
```

## Step 2 - `example.service.ts`

```ts
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

Edit / delete follow the same three beats: **check existing (`isActiveFlag: true`) -> prepare -> write & verify**.
Delete uses `auditSoftDelete` on the main row and then on every child table, inside the same `trx`
(`<Resource>Example` stands for any join/child table that points at the row):

```ts
const updateDeleteData: Partial<Example> = auditSoftDelete(user.userLogName);
await trx('Example').where({ exampleId }).update(updateDeleteData).returning<Example[]>('*');
await trx('<Resource>Example').where({ exampleId, isActiveFlag: true }).update(updateDeleteData).returning('<resource>ExampleId');
```

Search:

```ts
export async function searchExample(input: SearchExampleInput): Promise<SearchExampleResponse> {
  // Build query
  let query = db('Example').select('exampleId', 'name').where({ isActiveFlag: true });

  // Apply filters
  if (input.name) query.where('name', 'ilike', `%${input.name}%`);
  // fuzzy alternative: query = applySearch(query, ['Example.name'], input.search);

  // Apply sorting
  query = applySort({ query, sortKey: input.sortKey, sortAsc: input.sortAsc, validColumns: searchExampleValidSortKeys });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({ query, pageNumber: pagination.currentPage, pageSize: pagination.pageSize });

  // Execute the query
  const examples = await query;

  return { total: totalCount, pagination, data: examples };
}
```

## Step 3 - `example.controller.ts`

One `asyncHandler` per endpoint, banner comment above it, envelope at the end. See SKILL.md section 7.
The `asyncHandler` label is always the endpoint code, e.g. `'tmp_001_c'`; the handler returns
`{ message, data, status? }` and the wrapper sends `code: 'tmp_001_c_success'`.

## Step 4 - `example.routes.ts`

```ts
import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './example.controller';

const router = Router({ mergeParams: true });

router.post('/create', versionMiddleware(1), controller.createExampleHandler);
router.post('/search', versionMiddleware(1), controller.searchExampleHandler);
router.delete('/:exampleId/delete', versionMiddleware(1), controller.deleteExampleHandler);
router.put('/:exampleId/edit', versionMiddleware(1), controller.editExampleHandler);
router.get('/:exampleId/get', versionMiddleware(1), controller.getExampleHandler);

export default router;
```

With uploads, declare multer in this file:

```ts
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/create', versionMiddleware(1), upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'coverImageFile', maxCount: 1 },
]), controller.createDocumentHandler);
```

## Step 5 - mount it

Add `router.use('/example', exampleRoutes);` to the group router (`src/api/template/template.routes.ts`).
A nested resource mounts inside its parent's routes file: `router.use('/:exampleId/<child>', <child>Routes);`.

## Step 6 - finish

- `npm run type-check`
- write `docs/template/tmp_001_c_createExample.md` (use the `docs-generation` skill in `.agent/skills/`)
- add its row to `docs/README.md`
- re-read the file against `code-style.md` §7 - banners, section comments, imports, names, messages
- add the Bruno request under `bruno-api/collections/<area>/<Resource>/`
