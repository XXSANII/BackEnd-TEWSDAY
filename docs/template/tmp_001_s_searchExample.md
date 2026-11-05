# tmp_001_s - Search Example

## 1. API Code

`tmp_001_s`

## 2. API Version

`v1`

## 3. Method & URL Path

`POST /api/v1/template/example/search`

## 4. Security

`authorized (user)`

## 5. Description

- Search active examples with name filter, sorting and pagination.

## 6. Request

### Params

```json
{}
```

### Query String

```json
{}
```

### Body

```json
{
  "pageNumber"?: number, // 1
  "pageSize"?: number, // 10
  "pageAll"?: boolean, // false
  "sortKey"?: "name" | "createdAt", // "name"
  "sortAsc"?: boolean, // true
  "name"?: string // "first"
}
```

## 7. Response

### Success

```json
{
  "success": boolean, // true
  "code": string, // "tmp_001_s_success"
  "message": string, // "Example searched successfully."
  "data": {
    "total": number, // 3
    "pagination": object, // see pagination.schema.ts
    "data": [
      {
        "exampleId": string, // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        "name": string // "First example"
      }
    ]
  }
}
```

### Error

```json
{
  "success": boolean, // false
  "code": string, // "tmp_001_s_v_01"
  "message": string // "tmp_001_s_v_01"
}
```

## 8. Error Code

| Code             | Message                     | Status Code |
| ---------------- | --------------------------- | ----------- |
| `tmp_001_s_v_01` | Invalid example name filter | 400         |

## 9. Table Used

- `Example`
