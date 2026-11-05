# CLAUDE.md

All development rules for this repository live in **[AGENTS.md](./AGENTS.md)**. Read it before making
any change.

The authoritative rulebook it points to is the `project-structure` skill:
[`.agent/skills/project-structure/SKILL.md`](./.agent/skills/project-structure/SKILL.md), with
`references/code-style.md`, `references/module-files.md`, `references/api-module-recipe.md`,
`references/codes-and-errors.md` and `references/database-and-storage.md`.

Load that skill before writing or editing anything under `src/`, `migrations/`, or `seeds/`.

All skills live in [`.agent/skills/`](./.agent/skills/) so every agent reads the same rules. Also in force:

- `docs-generation` - required format for `docs/<group>/<code>_<name>.md` API docs;
  [`docs/README.md`](./docs/README.md) indexes every endpoint and its doc.
- `karpathy-guidelines` - simplicity, surgical changes, verifiable success criteria.
- [`special-requirement.md`](./.agent/skills/special-requirement.md) - standing project-specific
  requirements, when there are any.

Quick reminders (details in AGENTS.md):

- Four-file modules: `routes -> controller -> service` + `validation`, plus optional `_<module>.utils.ts`.
- Every endpoint has a code `<group>_<NNN>_<action>`; errors are `_v_NN` / `_s_NN`; never renumber a code.
- Response envelope `{ success, code, message, data }`; throw `ApiError`, never hand-write an error body.
- Writes in `db.transaction`, reads filter `isActiveFlag: true`, deletes are soft only.
- Match the house look: banner comments, the fixed section-comment vocabulary, house message wording -
  see `references/code-style.md`.
- Every new or changed endpoint needs its doc file **and** its row in `docs/README.md`.
- `npm run type-check` is the gate. There is no test suite - don't claim tests were run.
