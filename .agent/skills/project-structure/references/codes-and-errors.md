# Codes & errors

## Grammar

```
<group>_<NNN>_<action>              endpoint code          tmp_001_c
<group>_<NNN>_<action>_v_<NN>       validation error       tmp_001_c_v_01   (zod message)
<group>_<NNN>_<action>_s_<NN>       service error          tmp_001_c_s_01   (ApiError code)
<group>_<NNN>_<action>_success      success envelope code  tmp_001_c_success
```

`NN` starts at `01` and is unique **within one endpoint**. Never reuse, renumber, or repurpose a code -
the frontend and `docs/` key off them. Adding a new error to an existing endpoint means taking the
next free `NN`, even if earlier numbers were removed.

Prefixes: `tmp` template - `auth` auth - `storage` storage - `pub` public - `me` me - `adm` admin -
`mid` middleware - `file` storage utils - `int` internal/global.
Action letters: `c` create, `e` edit, `g` get, `s` search, `d` delete ( plus custom action suffixes like `mode`, `avatar`, `read`, `start`, `complete`, `confirm`, `dispute`, `cancel`, `verify`, `resolve`, `suspend`, `share`).

### Adding a group prefix

A new route group (mounted in `src/api/api.routes.ts`) needs its own prefix before its first endpoint:
use the reserved prefix when the group is one of those, otherwise pick one short, lowercase, in the
same style (e.g. `ord` for an `order` group). Agree it with the user, add it to the prefix lines above,
to the prefix table in `SKILL.md` section 5, and give it its own registry table below. Its numbers start at `001`. A prefix is as permanent as a code: never reuse one
for a different group.

## Endpoint registry (verified against `src/api` - re-grep `@code` before claiming a number is free)

```bash
grep -rhno "\(tmp\|adm\|auth\|me\|pub\)_[0-9]\{3\}_[a-z]" src/api | sort -u   # the live list
```

### template - `authProtectMiddleware`
| Code | Route |
| --- | --- |
| `tmp_001_c` | `POST /api/v1/template/example/create` |
| `tmp_001_s` | `POST /api/v1/template/example/search` |
| `tmp_001_g` | `GET /api/v1/template/example/:exampleId/get` |
| `tmp_001_e` | `PUT /api/v1/template/example/:exampleId/edit` |
| `tmp_001_d` | `DELETE /api/v1/template/example/:exampleId/delete` |

Next free number: `tmp_002`. A group added later starts its own registry table here at `001`.

Documentation coverage for these codes is tracked in [`docs/README.md`](../../../../docs/README.md).

## Non-endpoint codes

### Global (`errorMiddleware`, `app.ts`)
| Code | Meaning | Status |
| --- | --- | --- |
| `int_999_01` | Unhandled/unexpected error, logged to `ErrorLog` | 500 |
| `int_999_02` | Route does not exist | 404 |

### Middleware
| Code | Meaning | Status |
| --- | --- | --- |
| `mid_001_01/02/03` | API version invalid / too low / malformed | 400/404/400 |
| `mid_002_01..06` | `authGateMiddleware`: bad token, id mismatch, expired, invalid, account banned (cached / fresh) | 401/403 |
| `mid_003_01/03` | `authProtectMiddleware`: not signed in, banned | 401/403 |
| `mid_004_01` | `authorizeAdminMiddleware`: not admin | 403 |

### File utils (`src/utils/storage`)
`file_001`..`file_012` are the storage services (`uploadFile` = `file_006`, `getFile` = `file_008`,
...). Their errors follow `file_0NN_NN`. `file_007` and `file_009` are retired - never reuse them.
`file_999_01..04` are the default `createFileFieldSchema` messages (required / mime type / size / count) -
override them with endpoint-specific `_v_` codes whenever you use the helper.

## How errors surface

```
service/controller throws ApiError(status, code, message)
  -> asyncHandler tags the error with logCode = '<code>' (unless it already has one)
  -> errorMiddleware maps it to { success:false, code, message } with that status
     (status >= 500 also goes to logError -> console + ErrorLog table)

zod .parse() throws ZodError
  -> errorMiddleware: 400, code = first issue's message (that's why messages ARE codes),
     message = the full issue array
```

So: a user-facing failure must be an `ApiError` or a zod message. A plain `Error` is reserved for
impossible states (`'Request payload is missing: user.'` from `getRequestPayload`, `'Example info is missing in request.'`) and intentionally
lands as a logged 500.
