# tmp_001_d - Delete Example

## 1. API Code

`tmp_001_d`

## 2. API Version

`v1`

## 3. Method & URL Path

`DELETE /api/v1/template/example/:exampleId/delete`

## 4. Security

`authorized (user)`

## 5. Description

- Soft-delete an example (sets `isActiveFlag` to `false`).

## 6. Request

### Params

```json
{
  "exampleId": string // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Query String

```json
{}
```

### Body

```json
{}
```

## 7. Response

### Success

```json
{
  "success": boolean, // true
  "code": string, // "tmp_001_d_success"
  "message": string, // "Example deleted successfully."
  "data": {
    "exampleId": string // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### Error

```json
{
  "success": boolean, // false
  "code": string, // "tmp_001_d_s_01"
  "message": string // "Example not found"
}
```

## 8. Error Code

| Code             | Message                  | Status Code |
| ---------------- | ------------------------ | ----------- |
| `tmp_001_d_v_01` | Invalid example id       | 400         |
| `tmp_001_d_s_01` | Example not found        | 404         |
| `tmp_001_d_s_02` | Failed to delete example | 500         |

## 9. Table Used

- `Example`
