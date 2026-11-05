# Special requirements

Standing, project-specific requirements that override or extend the general rulebook
(`.agent/skills/project-structure/`). This file is intentionally short - it is the place for
decisions the user has made for this repo that a reader could not derive from the code.

Format: one `##` heading per requirement, with the date it was agreed and the reason.

```md
## <Requirement in one line>

_Agreed: YYYY-MM-DD_

- What must happen.
- Why (the constraint behind it).
- Where it applies (files, groups, endpoints).
```

## No requirements recorded yet

_As of project creation._

Nothing here yet. Everything currently in force lives in the three skills:

- `project-structure` - structure, layering, codes, envelope, database, cache, storage, code style.
- `docs-generation` - the `docs/<group>/<code>_<name>.md` format.
- `karpathy-guidelines` - simplicity, surgical changes, verifiable success criteria.

When the user states a rule that belongs to none of those (a business constraint, a deadline-driven
exception, a "never do X in this repo"), write it here instead of scattering it through comments.
