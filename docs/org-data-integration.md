# Organizational data integration

**Status: not started. Phase 9.**

Referenced by the source-licence policy. This document will cover how an organization brings its own data into an Organization-edition deployment without that data leaking into the corpus or into a public distribution.

## What it has to cover

- **Local overlays.** Roles, competency areas and elements an organization adds for itself. These never enter the shared corpus, and organizational role definitions drive gap analysis exactly as the shipped reference roles do.
- **Importing existing competence records** from whatever system an organization runs today, and what provenance tier the imported records may claim. Almost always `organization` — an imported record carries the receiving organization's word, not an assessment this system witnessed.
- **Proprietary and controlled source material.** An organization's internal procedures may be cited by its local elements and must never be redistributed. The licence tiers in `content/sources/registry.yaml` govern the public corpus; an overlay needs the same discipline applied to material the project never sees.
- **Export and separation** on departure, so an individual leaves with their competency credentials and without the organization's controlled content — the practical form of the rule that competence is portable and authorization is not.

Nothing here changes the publication boundary in `tools/public-projection.ts`, which governs what leaves this repository.
