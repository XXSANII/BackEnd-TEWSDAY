# API Documentation Specification

The file starts with an H1 title line - `# <code> - <Title Case Name>` - then covers the following
9 sections, in order, using these exact headings.

### 1. API Code

Endpoint code (e.g., `tmp_001_c`).

### 2. API Version

Target API version (e.g., `v1`).

### 3. Method & URL Path

HTTP method and full path (e.g., `POST /api/v1/template/example/create`).

### 4. Security

Authentication/authorization requirement: `none`, `gate`, `protected`, or `authorized (<role>)` (e.g., `authorized (admin)`).

### 5. Description

Write API purpose, constraints, and special business logic in bullet list (for listing fields, the bullet is preferred more than commas in most case).
**Include**: purpose of the joined field, effected cascading delete/set null table/field
**Ignore**: standard DB get/update, audit fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`), transactions, filtering/pagination on search (if the filter are directly search at that field) and soft deletes (only note if hard delete).

### 6. Request

Write `params`, `query string`, and `body` in JSON format with inline example comments:

```json
{
  "fieldName": dataType, // "example"
  "optionalField"?: dataType // 120
}
```

_Note: For search API request bodies, place `// search sorting & pagination` between filter fields and sorting/pagination fields._

_Note 2: For body that is not JSON format, include it's format_

### 7. Response

Write `success` and `error` in JSON format with inline example comments:

```json
{
  "fieldName": dataType // "example"
}
```

_Note: For success response, include HTTP status code if not 200_

### 8. Error Code

Table of endpoint-specific validation and service errors (exclude middleware and utils errors, except file utils):

| Code             | Message     | Status Code |
| ---------------- | ----------- | ----------- |
| `xxx_001_s_v_01` | Invalid xxx | 400         |

For message, use the exact message show in the code if provided.

### 9. Table Used

List database tables directly accessed by this endpoint (exclude tables used only in middleware and utils).

### 10. Redis Cache (only when the endpoint reads or writes the cache)

- **Key Pattern**: the key produced by the `src/utils/cache/` helper, e.g. `myapp:auth:<token>`
- **TTL**: the seconds passed to `redis.set(..., 'EX', n)` / `redis.setex(key, n, ...)`, with the human equivalent, e.g. `3600 seconds (1 hour)`
- **Invalidated by**: the endpoint codes that `redis.del` this key, when the endpoint writes.

Omit the section entirely for endpoints that never touch Redis.
