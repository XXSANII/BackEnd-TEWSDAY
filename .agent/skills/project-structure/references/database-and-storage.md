# Database, cache & storage rules

## Knex / PostgreSQL

- Single instance: `import { db } from '@/utils/db'` (config comes from `knexfile.ts` keyed on `NODE_ENV`).
- Table names are **PascalCase** (`"User"`, `"AuthAccount"`), columns **camelCase** (`"createdAt"`).
  Knex quotes them for you; in `whereRaw`/`raw` you must quote manually: `db.raw('"expiredAt" < now()')`.
- Primary keys are uuid columns named `<entity>Id` (`exampleId`, `authAccountId`).
- Every table carries the `BaseEntity` audit columns: `isActiveFlag`, `createdAt`, `createdBy`,
  `updatedAt`, `updatedBy`.

### Non-negotiables

1. Every read filters `isActiveFlag: true`.
2. Every write path is wrapped in `db.transaction(async (trx) => ...)` and uses `trx` inside.
   Passing a `trx` down into a util (`getFile`) is done via its `trx` option.
3. Never `DELETE`. Soft-delete with `auditSoftDelete(user.userLogName)`, then soft-delete children in
   the same transaction.
4. Audit columns come only from `src/utils/data/auditFields.helper.ts`:
   - `auditCreate(userLogName)` -> `{ isActiveFlag: true, createdBy, updatedBy }` (always set `updatedBy` on
     create, or the DB default `'system'` steals the attribution)
   - `auditUpdate(userLogName)` -> `{ updatedBy, updatedAt }`, spread **last** so it wins
   - `auditSoftDelete(userLogName)` -> `{ isActiveFlag: false, updatedBy, updatedAt }`
5. Insert/update always `.returning(...)` and the result is checked before use.
6. Type the payload as `Partial<Table>` from `@/types/db` - that is what catches column typos.

### Types & enums

- `src/types/db.ts` mirrors the DB schema. **Change the schema -> change this file in the same commit.**
- Enum-ish columns are defined once in `src/constants/<domain>.constants.ts` (`system`, `user`,
  `storage`), grouped under `// ===` section banners:
  ```ts
  /**
   * @constant  userStatusType
   * @desc      List of supported user statuses in the application.
   */
  export const userStatusType = {
    NORMAL: 'normal',
    REPORTED: 'reported',
    ...
  } as const;
  export const userStatusList = Object.values(userStatusType);
  export type UserStatusType = (typeof userStatusList)[number];
  ```
  `db.ts` re-exports the alias (`export type UserStatus = UserStatusType`), validation uses
  `z.enum(userStatusList, '<code>_v_NN')`, and code that needs one value uses the object
  (`userStatusType.NORMAL`, `.default(intervalUnitType.DAY)`). Never inline a string union anywhere else.

### `User.status`

`userStatusList = ['normal', 'reported', 'suspected', 'suspended', 'banned']`.

| Status | Sign in & use the API | Meaning |
| --- | --- | --- |
| `normal` | yes | Nothing wrong |
| `reported` | yes | Flagged, waiting for an admin to review |
| `suspected` | yes | Under admin review |
| `suspended` | yes | Restricted - decide per feature what a suspended user may no longer do |
| `banned` | **no** | Locked out entirely, cannot even sign in |

Never test the status with `=== 'normal'`. Use the derived list in `src/constants/user.constants.ts`:

- `usableUserStatusList` - everything except `banned`: the statuses allowed to sign in and use the API.
  (The auth middlewares lock out `banned` directly; a sign-in endpoint a project adds must do the same.)

When a feature needs a narrower gate (e.g. "may be listed publicly"), add another derived list next to it
in the same file instead of comparing against individual statuses.

### Migrations

- `npm run db:make-migration <name>` -> `migrations/<timestamp>_<name>.ts`.
- The house naming is the schema version: `v-1-0-0`, `v-1-0-1`.
- Always implement **both** `up` and `down`; `down` must fully reverse `up`.
- Raw SQL is fine and used for extensions/indexes:
  ```ts
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  await knex.raw('CREATE INDEX IF NOT EXISTS "idx_example_name_trgm" ON "Example" USING gin ("name" gin_trgm_ops);');
  ```
- Seeds live in `seeds/` with the same version naming.

### Search

- Simple contains filter:
  ```ts
  query.where('name', 'ilike', `%${input.name}%`);
  ```
- Fuzzy/typo-tolerant search: `applySearch(query, ['User.username', 'User.displayName'], search)` -
  it uses the `pg_trgm` `<%` operator (threshold `0.3`, set on the database by the baseline migration
  `v-1-0-0`) and requires the GIN trigram index for that column. If you add a new
  searchable column, add its trigram index in a migration.
- The index is only used when all OR-ed columns are on one table. To search columns across joined
  tables, search each table separately and `UNION` the ids.
- Sorting goes through `applySort` with an explicit `validColumns` allowlist (never interpolate a
  user-supplied column name).
- Count with `query.clone().clearSelect().clearOrder().count().first()` **before** applying pagination.

## Redis

- Single instance: `import { redis } from '@/utils/redis'`.
- Keys are **only** built by helpers in `src/utils/cache/`, all prefixed `myapp:`:
  today only `getAuthRedisKey` (the auth middleware's session cache). Need a new cached entity -> add a helper
  (`get<Entity>RedisKey`), don't inline a template string.
- TTL convention: `3600` (1 h) for session/user payloads, `300` (5 min) for entity reads, searches and
  suggestions.
- Read-through shape:
  ```ts
  const cachedData = await redis.get(redisKey);
  if (cachedData) return JSON.parse(cachedData);
  ...
  await redis.set(redisKey, JSON.stringify(result), 'EX', 300);
  ```
- **Invalidate on write.** Any service that mutates a cached entity must `redis.del(...)` the matching
  keys (a service that changes a user or ends a session must also clear its `getAuthRedisKey` entry).
  Forgetting this serves stale data for up to an hour on the auth path.

## Files & object storage

Pipeline for an uploaded file:

1. `multer.memoryStorage()` in the routes file, `upload.fields([{ name, maxCount }])`.
2. `createFileFieldSchema` in the validation file validates mime type / size / count with endpoint codes.
3. In the service, inside the transaction:
   ```ts
   const result = await uploadFile({
     fileContent: coverImageFile,
     userLogName: user.userLogName,
     filePath: `users/${user.userId}/cover/`,
     fileSizeLimitInBytes: ...,
     fileTypeLimit: 'image',
     isPublic: true,
   });
   const coverImageId = result.fileId;
   ```
   `uploadFile` writes the S3 object + the `File` row; store the returned `fileId` on your row.
   (`useFile` / `removeFile` and their `usedCount` reference counting were removed - nothing read the count.)
4. Reading back: `getFile(fileId)` returns a presigned URL for private files and a direct bucket URL for
   public ones. It returns an empty `MOCK_RETURN` (not an error) when the file is missing - callers must
   tolerate `fileUrl: null`.
5. `filePath` convention: `users/<userId>/profile/`, `users/<userId>/cover/`, etc. -
   plural resource, id, purpose, trailing slash.
6. Buckets come from `env.OBJECT_STORAGE_BUCKET` (`myapp-dev` / `myapp-prod`, listed in
   `objectBucketType`).

## Config & secrets

- `src/config/env.ts` is the single place that reads `process.env`; import `env` from it. It parses
  `process.env` with zod once at startup (numbers are numbers, booleans are booleans, defaults applied) and
  holds only values that change per environment or are secret. `server.ts` calls `assertRequiredEnv()`.
- `src/config/app.config.ts` (`appConfig`) holds fixed values that are the same in every environment:
  token/session lifetimes, file-size limits, third-party API urls. Add a new fixed value there, not to `.env`.
- `.env` is git-ignored. Never commit secrets, never print them in logs or responses.
- Deploys are tag-driven: pushing a `v1.2.3` tag builds and deploys production (`.github/workflows/deploy-prod.yml`).
