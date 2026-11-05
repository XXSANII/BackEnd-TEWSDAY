---
name: docs-generation
description: How to write the API documentation for a MyApp endpoint - file location and name, the 9 fixed sections, and the house JSON-with-comments style. Use whenever an endpoint is added or changed, or when the user asks for API docs.
---

# API docs generation

Every endpoint in `src/api/` has exactly one Markdown file under `docs/`. A new or changed endpoint is
not finished until its doc matches the code.

## Where the file goes

```
docs/<group>/<code>_<handlerName>.md        docs/template/tmp_001_c_createExample.md
                                            docs/template/tmp_001_s_searchExample.md
```

- `<group>` is the API group folder: `template` today (plus any group added later, e.g. `admin`,
  `auth`, `me`, `public`).
  It follows the **group the endpoint is mounted in today**, not where it used to live.
- `<code>` is the endpoint code (`tmp_001_c`), `<handlerName>` is the handler without the `Handler`
  suffix (`createExample`).
- First line of the file: `# <code> - <Title Case Name>` (e.g. `# tmp_001_c - Create Example`).
- If the file already exists, **overwrite it completely** - do not merge with the old content.
- After writing it, add or update the row in [`docs/README.md`](../../../docs/README.md).

## How to write it

- Document the **code as it is now**. Read the module's `.routes.ts`, `.controller.ts`, `.validation.ts`
  and `.service.ts` and describe what they actually do; ignore any earlier requirement or spec given in
  the conversation.
- The output is read in Notion, so keep it plain Markdown: headings, bullets, tables, fenced blocks.
- Cover the 9 sections, in order, exactly as specified in
  [`references/docs-format.md`](references/docs-format.md) - plus the optional section 10 when the
  endpoint caches in Redis.
- Error codes in section 8 are copied verbatim from the zod messages (`_v_`) and `ApiError` codes
  (`_s_`) in that module - never invented, never renumbered.
