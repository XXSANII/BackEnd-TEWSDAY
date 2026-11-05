# tmp_001_e - Edit Example

## 1. API Code

`tmp_001_e`

## 2. API Version

`v1`

## 3. Method & URL Path

`PUT /api/v1/template/example/:exampleId/edit`

## 4. Security

`authorized (user)`

## 5. Description

- Edit an existing active example.

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
{
  "name"?: string // "Renamed example"
}
```

## 7. Response

### Success

```json
{
  "success": boolean, // true
  "code": string, // "tmp_001_e_success"
  "message": string, // "Example edited successfully."
  "data": {
    "exampleId": string // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### Error

```json
{
  "success": boolean, // false
  "code": string, // "tmp_001_e_s_01"
  "message": string // "Example not found or inactive."
}
```

## 8. Error Code

| Code             | Message                                | Status Code |
| ---------------- | -------------------------------------- | ----------- |
| `tmp_001_e_v_01` | Invalid example id (must be a UUID v4) | 400         |
| `tmp_001_e_v_02` | Invalid example name                   | 400         |
| `tmp_001_e_s_01` | Example not found or inactive.         | 404         |
| `tmp_001_e_s_02` | Failed to update example.              | 500         |

## 9. Table Used

- `Example`
