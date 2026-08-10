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

**Phase 1 complete and revised. Phase 2 under way.**

| | |
|---|---|
| Domains / areas / elements | 43 / 257 / **2232** |
| Assessable units | 9096 |
| Ceilings — L3 / L4 / L5 | 13.1% / 66.2% / 20.7% |
| Kinds — knowledge / skill / judgment | 29.5% / 50.7% / 19.8% |
| Content authored | **1 element** · **1 BOK article** · **1 module** |
| Item bank | 3 archetypes · 10 bindings · **0.1%** of units covered |
| Checks | 0 errors · 129/129 tests · typecheck clean |

### Phases

| Phase | What | State |
|---|---|---|
| 0 | Foundation — scaffold, licences, schemas, CI, source register | Done |
| 1 | Taxonomy skeleton + gate review + revision | **Done** |
| 2 | Proficiency rubric, roles, evidence model, credential + exchange + authorization design | **In progress** |
| 3 | Guardrail kit, gold reference elements, schema freeze | Not started |
| 4 | Cross-cutting core `CM-01`…`CM-22` — BOK articles first, then the elements that reference them | Not started |
| 5 | Discipline packs `DP-01`…`DP-21` — same order | Not started |
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

**1. IDs are append-only.** `content/competence/taxonomy/domains/*.yaml` and `content/competence/taxonomy/id-registry.lock` may grow. Nothing may ever be renamed or removed. A credential attesting `CM-03-014` must resolve to the same element forever — rename it and you have silently invalidated somebody's evidence of their own competence. Deprecate and supersede; never delete. CI enforces this and it cannot be waived.

**1b. …but resolution is not meaning.** An immutable ID does not stop an anchor being rewritten, nor the bar being raised, and either changes what the credential asserts. Every credential therefore pins **three** things by content hash: `definitionRef` (the element definition), `assessmentPolicyRef` (the whole proficiency level entry — signer counts, hours, waiting period, reviewer requirements) and `knowledgeSnapshot` (the BOK sections it rested on). Pinning the element without the level leaves the hole half open: the element does not move, the bar does. **Drift is not invalidity** — an old credential stays true of the definition in force when it was earned, and the correct response is to show a reader *that* definition, never today's. See decision 39.

**2. Every element carries a clause-level citation.** `ISO/IEC 17025:2017 §7.6.1`, not "see the standard". Referenceability is universal. CI rejects an element without one.

**3. Never paste text from a standard you cannot redistribute.** Quotation is separate from citation and is gated by `content/sources/registry.yaml`. Tier 3 = no quotation at all. Tier 2 = ≤25 words, ≤2 per source per element, with commentary. **Do not author quotations against any source flagged `CONFIRM-WITH-COUNSEL` — legal review is not complete.** Citations are always safe.

**4. No AI ships in the product.** AI is a knowledge domain (`CM-21`) and an authoring tool. No AI code path reaches a user whose output becomes accreditation evidence. Candidates may freely use their own AI during assessment — items are designed on that assumption.

**5. No external runtime calls in the default build.** No CDN, no fonts, no telemetry. Air-gapped is the default, not a variant. `npm run check:airgap` fails the build on any external reference.

**6. Competence is not authorization.** An element attests what a person knows, can do, or can judge. It never attests that they are *allowed* to. Competency credentials are portable; authorizations are not, and must never be exported into the wallet as though they travelled.

**7. Nothing above L2 rests on a draft element.** L1 and L2 are witnessed observation and may be assessed against a draft; L3 upward requires `status: stable`, because that is where independent work is entrusted and a badly scoped element harms the holder. Deprecated elements cannot be newly attested at all. See decision 44.

**8. The ladder is bootstrapped, and it says so.** L3 needs an L4 signer, L4 needs L5, L5 needs L5 — so with no holders the ladder cannot start. A closed founding cohort admitted on external standing may sign L3–L5 without holding them, and **every credential they sign carries a permanent visible marker**. A bootstrap-signed L5 is not a peer-signed L5; never render them alike. See decision 43.

**10. A roleTarget is a scoped minimum requirement.** It states the level a role needs *if* the element is in that person's deployment scope — normative, not typical, not aspirational. It does **not** imply the element applies to anyone. **An element outside scope cannot produce a gap.** `null` means the element could never be that role's work in any deployment, which is not the same as "not in this person's scope". See decision 48.

**9. Training teaches; it never proves.** A module produces a training record, not a credential — `attestsCompetence` is `const false`. A module preparing for a `skill` element must declare `requiresPhysicalDemonstration`, because a simulation never substitutes for witnessed work on real equipment; completing it leaves that element `pending-demonstration`. Every module states in `cannotConvey` what its format cannot teach. See decision 45.

---

## Layout

**Two content trees, and the distinction is load-bearing.** `content/bok/` explains a SUBJECT. `content/competence/` assesses a PERSON. They were one file until decision 38 and that produced neither a usable encyclopedia nor a clean assessment model.

```
content/bok/<domain>/*.md         THE BODY OF KNOWLEDGE. Encyclopedic reference,
                                  organised by subject, public and redistributable.
                                  BOK-nnnn, append-only. Declares stable section
                                  ids; elements link to sections, not articles.

content/competence/
  taxonomy/domains/*.yaml         43 files, one per domain. THE taxonomy.
  taxonomy/id-registry.lock       Every ID ever issued, BOK and taxonomy. Append-only.
  taxonomy/proficiency.yaml       The 5-level ladder. Steward-controlled.
  roles/registry.yaml             12 reference roles. Every element needs a
                                  roleTarget for EVERY role — each one added is
                                  2232 more authored ratings.
  elements/                       ASSESSABLE CLAIMS, not prose. Empty until Phase 4.
  items/archetypes/               Reusable parameterized item SHAPES. ARC-nnnn.
  items/bindings/                 One archetype × one (element×level). Scales here.
  items/rubrics/                  Ships in the same commit as its item.
  modules/                        Training. MOD-nnnn. Teaches, never proves.

content/sources/registry.yaml     Source licence register. Outside both trees,
                                  because both cite it.

schemas/                          JSON Schema. Frozen at Phase 3.
packages/validator/               Integrity checks + 129 guardrail tests.
apps/viewer/                      Viewer SOURCE (template + build script).
docs/taxonomy/                    GENERATED. Never hand-edit; CI fails if stale.
tools/ceiling-plan.json           Level-ceiling judgement, per area + overrides.
tools/kind-plan.json              Knowledge/skill/judgment classification.
docs/                             Decision record, playbook, licence policy.
```

**Every element must carry at least one `knowledgeRefs` entry**, pointing at an article AND a section. This is the refresher path: someone credentialed eight months ago who has forgotten one detail will not retrain, they will look it up, and that link has to land on the passage covering *that detail*. Section ids are append-only for the same reason element IDs are. It also means the article must be written before the element — knowledge before the claim that someone has mastered it.

**Three generated views of the taxonomy, all from the same YAML.** `docs/taxonomy/*.md` for linear reading and diffing, `docs/taxonomy/taxonomy.csv` for spreadsheets, and the [published viewer](https://recamerino.github.io/metrology-competence-system/) for search and filter. Regenerate with `npm run build:docs` and `npm run build:viewer`. The Markdown and CSV are committed because their diffs *are* the audit record; the 270 KB built HTML is not.

Element IDs deliberately do **not** encode the competency area. `CM-03-014`'s prefix is *historical*; the authoritative `domain` and `competencyArea` are fields. This lets an element be reorganised without renaming an ID a credential may already attest.

---

## Commands

```bash
npm run validate          # schema + integrity. Must be green.
npm test                  # 129 guardrail tests
npm run typecheck
npm run report:coverage   # per-domain counts, ceiling distribution, gaps
npm run report:quotes     # complete quotation manifest for legal review
npm run registry:sync     # append new IDs to the lock; commit the result
npm run build:docs        # regenerate docs/taxonomy/ — commit the result
npm run check:docs        # fail if docs/taxonomy/ is stale (CI runs this)
npm run build:viewer      # regenerate apps/viewer/index.html
npm run check:airgap      # scan build output for external references
npm run build:public      # public distribution — BOK ships, item internals do not
npm run check:leak        # fail if restricted content reached dist/public/ (CI runs this)
```

**The publication boundary.** `content/bok/`, the taxonomy, the roles and the elements are published — a person must be able to see what competence *means* and what they will be assessed against. Item internals are not: prompts, generator parameters, scoring, rubrics and binding rationale. Archetypes are published as a *projection* (identity and shape only) because a credential names the archetype it was served from and that has to resolve offline. The projection is an **allowlist** in `tools/public-projection.ts`, so a field added later defaults to withheld — publication cannot be undone. See decision 42.

Changing ceilings or kinds: edit `tools/ceiling-plan.json` or `tools/kind-plan.json`, then `node tools/apply-ceilings.ts` / `node tools/apply-kinds.ts`. Both refuse to run if an area is unplanned or an override names a nonexistent element. Never hand-edit those fields across files.

---

## Open decisions

1. **Legal review of the source register.** Priority order: ISO/IEC 17025, the JCGM copyright statement, ASME Y14.5, then ILAC/UKAS/EURAMET/OIML. Blocks Phase 4 quotation authoring only — citations and all other work are unaffected. No quotations exist yet, so nothing is currently exposed.
2. **L5 ceiling review.** Still open, and now has a second test alongside anchor writing: if no *item* can be bound to an element at L5 that a competent practitioner could genuinely fail, it is not L5. `ARC-0003` exists for exactly this shape — an element that cannot support a defensible disagreement probably does not have expert practice in it.
3. **Commons operation.** The software will be built; whether the project *operates* a public instance (PII custody, moderation, funding) is deferred governance.
4. **Authority-tier issuer.** A neutral foundation as issuer of last resort would be the strongest long-term credential. Needs people and funding. Roadmap, not a dependency.
5. **Reviewer supply for thin domains.** `DP-21-A05` (relativistic geodesy) may have a few dozen qualified reviewers worldwide. The peer-review network needs an answer for domains that thin.
6. **Reviewer scoring load.** Rubric-scoring is turning out to be the norm rather than the exception, which raises the human cost of the bank. Not blocking, but it feeds the reviewer programme design and the Phase 7 estimate.

### Must land before the Phase 3 schema freeze

From external architectural review, August 2026. Not a new phase — scope that has to be inside the freeze, because changing it after thousands of articles exist is the same mistake the BOK split avoided by two weeks.

**Done:** knowledge-version provenance (decision 39) · BOK review provenance (decision 40) · disagreement and consensus (decision 41).

7. **Many paths to competence.** `BOK → module → assessment` must never harden into a mandatory linear course. Self-study, mentoring, a commercial course and prior practice are all legitimate routes to the same assessment, and the competence definition stays independent of any learning provider. Learning resources are plural and vendor-neutral by construction — this is what makes the corpus disruptive without attacking anyone. Needs a schema before Phase 11, and a stated principle now.
8. **Trust registry and status lifecycle.** Offline verification promises that a 2028 credential still verifies in 2031. That needs issuer key rotation, compromise and retirement with effective dates, plus a signed status list a verifier can obtain without contacting the issuer. Deleting a compromised key must not invalidate credentials legitimately signed with it earlier.
9. **Evidence sufficiency.** Hashing an artifact proves it has not changed; it does not record why it was *sufficient*. The reviewer's sufficiency decision and its rationale need a home, or a credential ends up carrying `sha256:…` with nothing saying why that satisfied anything.
10. **Exposure-group semantics and a binding-review record.** When do two differently parameterized items count as the same exposure? And who decided a binding was professionally valid — CI can only prove it is structurally possible. Both need rules before thousands of bindings exist, or the engine will decide by accident.
11. **Validity evidence.** CI proves integrity of the representation. Expert review proves technical validity. Neither proves the assessment measures the competence it claims to. That is empirical work — inter-rater reliability, whether items discriminate knowledge from skill from judgment, whether the five-level ladder matches how the profession actually reads competence. Research, not code, and the strongest thing the project could take to NCSL.
12. **Standards-revision review triggers.** `currency.volatility: controlled` means review is woken by a published revision rather than a calendar. The field exists on articles and elements; the tooling that actually wakes them does not. Tooling, not schema, so it can follow the freeze.

---

## What Phase 2 has to produce

**Done:** proficiency ladder · 12 reference roles · item parameterization format (archetypes + bindings, decision 36) · rubric format · experience hours and waiting periods (decision 37) · recertification defaults per level.

**Also done:** credential schema and provenance tiers · **authorization as a first-class object** · attempt ledger, challenge-exam no-retake rule, and exposure control.

**Remaining:** per-element anchor template · blueprint weighting · DID method and trust registry · reviewer programme · exchange protocol · accreditation-body dossier and scope-matching model.

**The attempt ledger's limit is deliberate and must not be "fixed" naively.** In the Personal edition the holder owns the machine, the ledger and the key, so they can truncate their own chain and it will verify clean — there is a test asserting exactly that. Hash-linking catches edits to the middle; only an *external* anchor fixes history, and every signoff produces one because there is no self-signoff anywhere. An unanchored ledger supports self-study claims and nothing more, which is what that provenance tier already means. Truncation becomes detectable the moment a counterparty holds a reference, which is why the credential carries `assessment.attemptRef`.

### What the first real archetypes taught

Authored against `CM-03` and validated. Two findings that change downstream estimates:

**Rubric-scoring is the norm, not the exception.** Writing `lookupResistance` honestly forces it — for a Type B assignment item the arithmetic *is* lookupable and an AI produces it instantly, so the numeric part carries 20% and the justification carries the item. Two of three archetypes are rubric-scored. Human reviewer effort across the bank is therefore higher than the phase plan assumed. This is a real cost of abolishing proctoring, and it lands in Phase 7.

**Watch the reuse ratio.** `npm run report:coverage` prints mean units per archetype. Decision 36 rests on 20–50; it currently reads **3.3** across five elements, which is far too small a sample to conclude anything. If it stays near 3 as `CM-03` fills in, the economics of the archetype approach do not hold — and that is much cheaper to discover now than after 9096 bindings.

Parameters carry `visibility: prompt | generator`. A generator parameter rendered into the prompt destroys the item *while leaving the file looking perfectly well-formed*; that is why it is validated rather than left to review.
