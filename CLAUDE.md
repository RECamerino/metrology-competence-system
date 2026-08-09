# CLAUDE.md — Metrology Competence System

Session startup file. Read this first, every session. It is the shortest path to knowing where the project is and what will break if you get it wrong.

Deeper context lives in [`docs/00-context.md`](docs/00-context.md) (why every decision was made) and [`docs/handoff-playbook.md`](docs/handoff-playbook.md) (how to author content). Read those before doing anything structural.

---

## What this is

An open, organization-agnostic **Body of Knowledge for metrology**, plus a platform that turns demonstrated competence into a **portable, cryptographically verifiable credential the individual owns**.

Three things at once:

1. **The corpus** — encyclopedic, freely licensed, covering measurement science *and* the adjacent competencies that get missed (statistics, technical writing, data visualization, auditing, software, teaching, ethics).
2. **The credential** — every signoff produces a signed, artifact-backed attestation the person keeps. A future employer verifies it offline, against cryptography, without contacting anyone.
3. **The competence infrastructure** — serving ISO/IEC 17025:2017 §6.2, and giving accreditation bodies a verifiable basis for evaluating assessors against a scope.

Three principles held in tension deliberately:

- **No single person should hold all of it.** If someone can complete the corpus, it is too small.
- **Nothing gates entry.** No employer, no budget, no professional network required. The Personal edition is the *full* platform, free, serverless.
- **Rigor is not negotiable.** If the credential is easy it is worthless, and the person who worked for it is the one harmed.

---

## Status

**Phase 1 complete and revised. Phase 2 not started.**

| | |
|---|---|
| Domains / areas / elements | 43 / 257 / **2232** |
| Assessable units | 9096 |
| Ceilings — L3 / L4 / L5 | 13.1% / 66.2% / 20.7% |
| Kinds — knowledge / skill / judgment | 29.5% / 50.7% / 19.8% |
| Content authored | **0 elements** — skeleton only, no prose yet |
| Checks | 0 errors · 20/20 tests · typecheck clean |

### Phases

| Phase | What | State |
|---|---|---|
| 0 | Foundation — scaffold, licences, schemas, CI, source register | Done |
| 1 | Taxonomy skeleton + gate review + revision | **Done** |
| 2 | Proficiency rubric, roles, evidence model, credential + exchange + authorization design | **Next** |
| 3 | Guardrail kit, gold reference elements, schema freeze | Not started |
| 4 | Cross-cutting core content `CM-01`…`CM-22` | Not started |
| 5 | Discipline packs `DP-01`…`DP-21` | Not started |
| 6 | Credential and exchange engine | Not started |
| 7 | Assessment engine | Not started |
| 8 | Personal edition | Not started |
| 9 | Organization edition | Not started |
| 10 | Dashboards | Not started |
| 11 | Training modules | Not started |
| 12 | Commons, accreditation-body support, compliance package | Not started |

**Phase 3 is the Opus → Sonnet handoff point.** Schemas freeze there, so authoring proceeds against fixed contracts with worked exemplars.

---

## Rules that must not be broken

**1. IDs are append-only.** `content/taxonomy/domains/*.yaml` and `content/taxonomy/id-registry.lock` may grow. Nothing may ever be renamed or removed. A credential attesting `CM-03-014` must resolve to the same element forever — rename it and you have silently invalidated somebody's evidence of their own competence. Deprecate and supersede; never delete. CI enforces this and it cannot be waived.

**2. Every element carries a clause-level citation.** `ISO/IEC 17025:2017 §7.6.1`, not "see the standard". Referenceability is universal. CI rejects an element without one.

**3. Never paste text from a standard you cannot redistribute.** Quotation is separate from citation and is gated by `content/sources/registry.yaml`. Tier 3 = no quotation at all. Tier 2 = ≤25 words, ≤2 per source per element, with commentary. **Do not author quotations against any source flagged `CONFIRM-WITH-COUNSEL` — legal review is not complete.** Citations are always safe.

**4. No AI ships in the product.** AI is a knowledge domain (`CM-21`) and an authoring tool. No AI code path reaches a user whose output becomes accreditation evidence. Candidates may freely use their own AI during assessment — items are designed on that assumption.

**5. No external runtime calls in the default build.** No CDN, no fonts, no telemetry. Air-gapped is the default, not a variant. `npm run check:airgap` fails the build on any external reference.

**6. Competence is not authorization.** An element attests what a person knows, can do, or can judge. It never attests that they are *allowed* to. Competency credentials are portable; authorizations are not, and must never be exported into the wallet as though they travelled.

---

## Layout

```
content/taxonomy/domains/*.yaml   43 files, one per domain. THE taxonomy.
content/taxonomy/id-registry.lock Every ID ever issued. Append-only.
content/sources/registry.yaml     Source licence register, Tier 1/2/3.
content/elements/                 Element prose. EMPTY until Phase 4.
schemas/                          JSON Schema. Frozen at Phase 3.
packages/validator/               Integrity checks + 20 guardrail tests.
apps/viewer/                      Read-only taxonomy viewer (template + build).
tools/ceiling-plan.json           Level-ceiling judgement, per area + overrides.
tools/kind-plan.json              Knowledge/skill/judgment classification.
docs/                             Decision record, playbook, licence policy.
```

Element IDs deliberately do **not** encode the competency area. `CM-03-014`'s prefix is *historical*; the authoritative `domain` and `competencyArea` are fields. This lets an element be reorganised without renaming an ID a credential may already attest.

---

## Commands

```bash
npm run validate          # schema + integrity. Must be green.
npm test                  # 20 guardrail tests
npm run typecheck
npm run report:coverage   # per-domain counts, ceiling distribution, gaps
npm run report:quotes     # complete quotation manifest for legal review
npm run registry:sync     # append new IDs to the lock; commit the result
npm run build:viewer      # regenerate apps/viewer/index.html
npm run check:airgap      # scan build output for external references
```

Changing ceilings or kinds: edit `tools/ceiling-plan.json` or `tools/kind-plan.json`, then `node tools/apply-ceilings.ts` / `node tools/apply-kinds.ts`. Both refuse to run if an area is unplanned or an override names a nonexistent element. Never hand-edit those fields across files.

---

## Open decisions

1. **Legal review of the source register.** Priority order: ISO/IEC 17025, the JCGM copyright statement, ASME Y14.5, then ILAC/UKAS/EURAMET/OIML. Blocks Phase 4 quotation authoring only — citations and all other work are unaffected. No quotations exist yet, so nothing is currently exposed.
2. **L5 ceiling review.** Deferred to Phase 2, folded into anchor writing: if no observable expert behaviour can be written for an element, it is not L5 and gets demoted there.
3. **Commons operation.** The software will be built; whether the project *operates* a public instance (PII custody, moderation, funding) is deferred governance.
4. **Authority-tier issuer.** A neutral foundation as issuer of last resort would be the strongest long-term credential. Needs people and funding. Roadmap, not a dependency.
5. **Reviewer supply for thin domains.** `DP-21-A05` (relativistic geodesy) may have a few dozen qualified reviewers worldwide. The peer-review network needs an answer for domains that thin.

---

## What Phase 2 has to produce

Proficiency rubric with the per-element anchor template · the 12 reference roles · full evidence and assessment model (item parameterization format, rubric format, blueprint weighting, exposure control, challenge-exam and attempt-ledger rules, experience hours, waiting periods, recertification) · credential schema, DID method, trust registry, provenance tiers · **authorization as a first-class object, distinct from a competency credential** · reviewer programme · exchange protocol · accreditation-body dossier and scope-matching model.

**The largest single risk in Phase 2** is the item bank. At 9096 assessable units it is a bigger body of work than the BOK prose itself. The parameterization format decides whether one authored item template covers one unit or fifty. Bring options rather than picking silently.
