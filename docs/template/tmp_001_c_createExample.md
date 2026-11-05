# tmp_001_c - Create Example

## 1. API Code

`tmp_001_c`

## 2. API Version

`v1`

## 3. Method & URL Path

`POST /api/v1/template/example/create`

## 4. Security

`authorized (user)`

## 5. Description

- Create a new example.

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
  "name": string // "First example"
}
```

## 7. Response

### Success

```json
{
  "success": boolean, // true
  "code": string, // "tmp_001_c_success"
  "message": string, // "Example created successfully."
  "data": {
    "exampleId": string // "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### Error

```json
{
  "success": boolean, // false
  "code": string, // "tmp_001_c_v_01"
  "message": string // "tmp_001_c_v_01"
}
```

## 8. Error Code

| Code             | Message                   | Status Code |
| ---------------- | ------------------------- | ----------- |
| `tmp_001_c_v_01` | Invalid example name      | 400         |
| `tmp_001_c_s_01` | Failed to create example. | 500         |

## 9. Table Used

- `Example`
