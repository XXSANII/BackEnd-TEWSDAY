# tmp_001_g - Get Example

## 1. API Code

`tmp_001_g`

## 2. API Version

`v1`

## 3. Method & URL Path

`GET /api/v1/template/example/:exampleId/get`

## 4. Security

`authorized (user)`

## 5. Description

- Get one active example by id.

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
  "code": string, // "tmp_001_g_success"
  "message": string, // "Example retrieved successfully."
  "data": {
    "exampleId": string, // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    "name": string // "First example"
  }
}
```

### Error

```json
{
  "success": boolean, // false
  "code": string, // "tmp_001_g_s_01"
  "message": string // "Example not found or inactive."
}
```

## 8. Error Code

| Code             | Message                        | Status Code |
| ---------------- | ------------------------------ | ----------- |
| `tmp_001_g_v_01` | Invalid example id             | 400         |
| `tmp_001_g_s_01` | Example not found or inactive. | 404         |

## 9. Table Used

- `Example`
