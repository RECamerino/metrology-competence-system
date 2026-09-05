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
| Domains / areas / elements | 64 / 494 / **5459** — three axes, see rule 14 |
| Assessable units | 21314 |
| Ceilings — L2 / L3 / L4 / L5 | 0.7% / 23.1% / 61.3% / 14.9% |
| Kinds — knowledge / skill / judgment | 17.6% / 60.8% / 21.5% |
| Content authored | **26 elements** · **17 BOK articles** · **2 modules** — 8 domains, all three axes |
| Item bank | 5 archetypes · 41 bindings · **0.2%** of units covered |
| Checks | 0 errors · 326/326 tests · typecheck clean |

### Phases

| Phase | What | State |
|---|---|---|
| 0 | Foundation — scaffold, licences, schemas, CI, source register | Done |
| 1 | Taxonomy skeleton + gate review + revision | **Done** — but the skeleton that passed the gate was 2232 elements, and it is now 5459. See *The corpus tripled* below. |
| 2 | Proficiency rubric, roles, evidence model, credential + exchange + authorization design | **In progress** |
| 3 | Guardrail kit, gold reference elements, schema freeze | Not started |
| 4 | Cross-cutting core `CM-01`…`CM-22` — BOK articles first, then the elements that reference them | Not started |
| 5 | Discipline packs `DP-01`…`DP-21` — same order | Not started |
| 6 | Credential and exchange engine | Not started |
| 7 | Assessment engine | Not started |
| 8 | Personal edition | Not started |
| 9 | Organization edition | Not started |
| 10 | Dashboards | Not started |
| 11 | Training modules — schema, rules and MOD-0001 done in Phase 2; the bank is not | Not started |
| 12 | Commons, accreditation-body support, compliance package | Not started |

**Phase 3 is the Opus → Sonnet handoff point.** Schemas freeze there, so authoring proceeds against fixed contracts with worked exemplars.

---

## Rules that must not be broken

**1. IDs are append-only.** `content/competence/taxonomy/domains/*.yaml` and `content/competence/taxonomy/id-registry.lock` may grow. Nothing may ever be renamed or removed. A credential attesting `CM-03-014` must resolve to the same element forever — rename it and you have silently invalidated somebody's evidence of their own competence. Deprecate and supersede; never delete. CI enforces this and it cannot be waived.

**1b. …but resolution is not meaning.** An immutable ID does not stop an anchor being rewritten, nor the bar being raised, and either changes what the credential asserts. Every credential therefore pins **three** things by content hash: `definitionRef` (the element definition), `assessmentPolicyRef` (the whole proficiency level entry — signer counts, hours, waiting period, reviewer requirements) and `knowledgeSnapshot` (the BOK sections it rested on). Pinning the element without the level leaves the hole half open: the element does not move, the bar does. **Drift is not invalidity** — an old credential stays true of the definition in force when it was earned, and the correct response is to show a reader *that* definition, never today's. See decision 39.

**2. Every element and article carries a clause-level source reference.** `ISO/IEC 17025:2017 §7.6.1`, not "see the standard". Referenceability is universal and CI rejects content without one. It need **not** be *normative*: the corpus covers accepted practice, emerging technique, research and interpretation, plus adjacent competencies — technical writing, teaching, ethics — where no clause requires anything of anybody. The standing of the claim is recorded separately in `currency.authorityStatus`, and whether practitioners agree in a section's `consensus`.

**3. Never paste text from a standard you cannot redistribute.** Quotation is separate from citation and is gated by `content/sources/registry.yaml`. Tier 3 = no quotation at all. Tier 2 = ≤25 words, ≤2 per source per element, with commentary. **Do not author quotations against any source flagged `CONFIRM-WITH-COUNSEL` — legal review is not complete.** That rule is now executable: 30 of the 36 registered sources carry `quotation.blockedPendingCounsel: true`, and the validator rejects any quotation against them regardless of the word and count limits recorded beside it. Those limits stay in the register on purpose — they are the ceiling that takes effect the moment counsel reports, not a claim that quotation is permitted now. Until then the marker was prose in `notes` that no code read, while the machine-readable fields next to it said 80 words were fine. Citations are always safe.

**4. No AI ships in the product.** AI is a knowledge domain (`CM-21`) and an authoring tool. No AI code path reaches a user whose output becomes accreditation evidence. Candidates may freely use their own AI during assessment — items are designed on that assumption.

**4b. The corpus is written in US English, and it is checked.** Not an aesthetic preference: the schemas' own field names are already American — `organizationRef`, `candidateOrganization`, `requiresCrossOrganizational` — and they are frozen contracts that cannot move, so prose using the British form described the system in a spelling the system itself does not use. The corpus also benchmarks against NCSLI, ANSI/NCSLI Z540 and US Department of Labor job titles throughout. The convention was **undeclared until 2026-09-03**, which is how 447 British forms accumulated without anyone deciding to write them; `npm run check:spelling` now stops it drifting back. **Scope is narrow on purpose** — only `-ise`/`-yse` forms where US English genuinely differs. It does not touch words spelled `-ise` in both (exercise, premise, supervise, enterprise, otherwise), it does not touch `analysis` or `analyses`, and it must never touch **`metre`** or **`litre`**, which are the SI unit names in the BIPM brochure and are not Americanized.

**5. No external runtime calls in the default build.** No CDN, no fonts, no telemetry. Air-gapped is the default, not a variant. `npm run check:airgap` fails the build on any external reference.

**6. Competence is not authorization.** An element attests what a person knows, can do, or can judge. It never attests that they are *allowed* to. Competency credentials are portable; authorizations are not, and must never be exported into the wallet as though they travelled.

**6b. The individual owns the record. Always.** An organization gets something substantial — competence evidence an auditor can verify, a basis for assigning trainers, a workforce gap picture computed against real deployment scopes — and none of it is ownership. It holds a **copy** under a §6.2 retention obligation (`custody`), and it owns exactly one artifact: the `deployment-scope` stating what the job covers. The person carries the responsibility that goes with owning it: keeping the record current, seeking assessment, arranging the training or the bench time. An organization may require its people to use the system and may act on unclosed gaps — ordinary employment decisions. It may not hold, withhold, or extinguish the evidence. Six mechanisms already encode this and none of them said so; see [`docs/00-context.md`](docs/00-context.md). **The unbuilt consequence to watch: an organization reading a person's record is a disclosure, not a read** — open decision 20.

**7. Nothing above L2 rests on a draft element.** L1 and L2 are witnessed observation and may be assessed against a draft; L3 upward requires `status: stable`, because that is where independent work is entrusted and a badly scoped element harms the holder. Deprecated elements cannot be newly attested at all. See decision 44.

**8. The ladder is bootstrapped, and it says so.** L3 needs an L4 signer, L4 needs L5, L5 needs L5 — so with no holders the ladder cannot start. A closed founding cohort admitted on external standing may sign L3–L5 without holding them, and **every credential they sign carries a permanent visible marker**. A bootstrap-signed L5 is not a peer-signed L5; never render them alike. See decision 43. **But the ladder does not only need bootstrapping at the start** — because signer standing is scoped to the element, an element ceilinged at 3 or 4 can never produce the holder its own top rung requires, so that rung stays bootstrap-only forever. That is 84% of the corpus and it is open decision 26; `npm run report:reachability` measures it.

**8b. "Closed" and "time-limited" are the roster's job, not the credential's.** `bootstrapAuthority` used to be a field a signer wrote about themselves, so anyone could join a cohort with no roster, no convening and no closing date — and three people could bootstrap-sign each other across a domain in a weekend. Membership now resolves against `content/competence/bootstrap-cohort.yaml`, which **publishes**, because a verifier must resolve it offline exactly as they resolve the trust registry. Four controls: **scope** (a founder signs only in the domains their standing covers — no wildcard, because a person competent across all 43 is the person the project says should not exist); **no self-dealing** (a member may never be the *subject* of a bootstrap-signed credential — that is the mutual peer cohort decision 43 rejected); **time** (nothing after `closesOn`, nothing before the member's own `admittedOn`); and **volume** when a steward sets a ceiling. **The shipped roster convenes nobody**, so no bootstrap signature is valid today — the correct state while steward appointment is blocked.

**8c. Offline verification is a snapshot, and the snapshot's age is part of the answer.** A verifier resolves an issuer against `content/trust-registry.yaml`, which **publishes** — with no registry, a signature proves internal consistency and nothing about who made it. **"No network" and "fresh trust" cannot both be absolute**, so the design does not try: every verdict carries `registryAgeDays` and what that age leaves unknowable, and a bare "verified" with no such statement is the defect. Keys are **append-only within an issuer** — removing one breaks every credential it ever signed. `retired` (ordinary rotation) leaves earlier signatures valid and forbids later ones; `compromised` requires a date, invalidates signatures from it onward, and **leaves the ones before it standing**, because invalidating those punishes a holder for a breach that came after they earned it. `didMethods` is the profile a deployment can actually resolve offline — shipped as `did:key` alone. **The registry admits nobody today**, so nothing verifies, which is the correct state while steward appointment is blocked.

**9. Training teaches; it never proves.** A module produces a training record, not a credential — `attestsCompetence` is `const false`. Every module states in `cannotConvey` what its format cannot teach. See decision 45.

**10. A roleTarget is a scoped minimum requirement.** It states the level a role needs *if* the element is in that person's deployment scope — normative, not typical, not aspirational. It does **not** imply the element applies to anyone. **An element outside scope cannot produce a gap.** `null` means the element could never be that role's work in any deployment, which is not the same as "not in this person's scope". **Decide null against the element's L1 anchor, not its title** — the title describes the ceiling and the rating question is about the floor, and without that tie-breaker two authors following the rule correctly produce opposite ratings on the same element. If the role could do what L1 describes, the target is 1; null removes the requirement at *every* level. **That makes `null` on a prerequisite incompatible with a numeric target on what depends on it**, and CI now rejects the pair: gap analysis would otherwise report the role short on the dependent element while never surfacing the thing it is built on, sending a supervisor to train the wrong element. Checked only where the prerequisite is authored, so its reach grows as the corpus fills in. A `judgment` element's L1 is still a decision under ambiguity, so null is commoner there than on `skill`. See decision 48 and [`docs/handoff-playbook.md`](docs/handoff-playbook.md) for the worked CM-03 ratings.

**10b. A role is an occupation or an authority overlay, and they are not the same kind of thing.** Every role declares `roleType`. `occupational` is a job with a competence profile of its own; `authority-overlay` is a permission granted on top of one — a person is *Calibration Engineer AND Approved Signatory*. `approved-signatory` is the only overlay in the shipped registry, and it sat beside the occupations unmarked, so gap analysis reported shortfalls against it as **competence** gaps and invited an organization to read "close these" as the route to signatory status. It is not: the authority is granted, recognized at that laboratory for that scope, and ends on departure. A deployment scope names an occupation in `role` and overlays in `overlays`; an overlay in `role` is an **error**. Overlay gaps are still computed and still real — they answer *could this person be granted this*, never *have they earned it* — and every `Gap` carries `basis` so a renderer cannot blend the two by accident. This is rule 6 reaching the role model, which is where it had not.

**11. `skill` is not the same as bench work, and the evidence route is a SET.** `kind: skill` means the evidence is observable *performance* rather than explanation. It does **not** mean the performance happens at a bench — constructing an uncertainty budget is a skill and is desk work. The element declares `demonstration`, an array of `desk`, `equipment` or both, and a module preparing an `equipment` route must list the element in `requiresPhysicalDemonstration`, leaving it `pending-demonstration`. Listing a desk-route element there is **also** an error: it tells a learner they are waiting for access they never needed, and inventing a barrier is as wrong as hiding one. **It is a set because for some elements the route is a property of the LABORATORY rather than of the element** — a sensitivity coefficient is estimated by perturbing a correction routine (desk) or the instrument itself (bench), the competence is the same in both, and JCGM 100 §5.1.4 contemplates both. A scalar failed this rule in one direction or the other for every such element, silently and differently for different people. So a module preparing a **multi-route** element must state which `route` it prepares: both are admissible, omission cannot be read as either, and read as desk work it would leave a learner bound for the bench unwarned while the module validated cleanly. Stating a route where the element declares only one is an error too — one fact, one place. **The pin sorts the routes**, so reordering is not drift; *adding* one is, because admissible evidence widened. `CM-03-051` is the only multi-route element so far.

**12. The provenance tier is evidenced, not declared.** `provenanceTier` carries the argument for how open entry and rigour coexist, and until it was checked it was read by no code at all — a credential could assert `accredited-body` with one unevidenced witness. Each step up now requires something a reader can verify offline: **self-study** a signer who is not the subject; **peer-reviewed** a signer whose standing is *evidenced*, so an unbacked `heldLevel` or `credentialedReviewer` does not lift it; **organization** an issuer registered with a name and trust-registry entry; **accredited-body** the issuer's own accreditation recorded. **`authority` cannot be issued** — no such issuer exists (open decision 4). Understating is permitted and silent. **`self-study` means the witness has no standing, not that there is no witness** — which is why it is issuable at all, and how somebody with no employer and no network holds something real.

**13. Every domain opens with a foundational-knowledge area where one is appropriate — FIRST, not last.** The corpus began each discipline at professional practice: `DP-08` opened at the ampere definition and the Josephson effect and had no element for Ohm's law, so prior education was an unstated entry requirement in a project whose first principle is that nothing gates entry. The gap was invisible because the *levels* looked open — L1 is reachable on every element, but L1 on *Cryogenic current comparator bridges* is not competence in series-circuit behaviour. **The fix is elements, not levels.** Display order follows array order in the YAML, not the area ID, so the block sits at the top of `competencyAreas` while keeping its append-only ID. **Size it as a career, not a ramp.** For most people who will ever use this corpus, the foundational area is not the path to the rest of the domain — it is the whole of it, and very few venture further. `DP-08-A07` is 48 elements against 52 for the entire professional remainder, and that ratio is deliberate. **Split by instrument class and use case.** A single element called *operating a digital multimeter* spanned a 3½-digit handheld, an 8½-digit reference, a null detector and a nanovoltmeter — different instruments for different jobs, under a heading too broad to assess against. Each class is its own element. Ceilings run below 3 where the competence genuinely stops there, which is what the L1 and L2 rungs in `tools/ceiling-plan.json` exist for, and reach 4 where a twenty-year technician is still better at it than a two-year one. Foundational is not shallow. **Grading these areas is mostly not done, and `npm run report:foundational` says which** — 21 of 31 carried a flat L3 with zero overrides, which is one artefact of the generated pass rather than 21 decisions, and a bare default cannot be told apart from a judged-and-uniform one without the `reviewedBy`/`reviewedOn` the plan now carries. **The commoner defect is the missing L4, not the missing L2**: 29 of 31 areas have nothing above L3, while nine of the ten *graded* areas used overrides in the downward direction only. Grade against what a title claims — naming or distinguishing is L2, a consequence clause ("and why a reading needs to settle") is L3, and genuine expertise is L4. Do **not** grade an area you cannot judge; ungraded is legible, wrong is not. **Every such area is titled `Foundational Knowledge — <what it covers>`**, without exception: one recognizable section repeated across 43 domains, which a reader can find by searching the words they were told to expect. **Training for a domain's foundational knowledge is authored as one module, not one per element** — it is learned as a block, and 48 modules for 48 fundamentals would be an administrative fiction.

**14. Three axes, not two — `EC` is the equipment-calibration pack.** `CM` is organized by cross-cutting concept and `DP` by measured **quantity**; both are measurement science, and neither is organized by **the work**. A technician's day is an oscilloscope, then a torque wrench, then an RF attenuator, and their competence is per equipment type. The corpus already contained the proof: `DP-08-052` is titled *Oscilloscope **DC and timebase** calibration* because bandwidth belongs to `DP-10` and jitter to `DP-14` — one job, truncated to the third of it that fitted the shelf it was put on. **An EC element is the competence to calibrate a class of equipment**: the parameters, the standards required, and where the job goes wrong. It is **not** a restatement of `CM-06`, which owns calibration *methodology* — `CM-06` says what as-found data is and why both are recorded, `EC` says what as-found data for an oscilloscope consists of. **An EC element that could be written without naming the equipment belongs in `CM-06` instead.** **21 EC packs — one per DP — 203 equipment types, 2732 elements — and it carries the WHOLE TRACEABILITY CHAIN**, not just the working tier. Three rungs: the instrument that arrives on a bench, the reference standard it is calibrated against (torque transducers, standard resistors, SPRTs, AC-DC transfer standards), and the apparatus that realizes the SI (Josephson and quantum Hall systems, force and torque standard machines, fixed-point cells, caesium fountains, cryogenic radiometers, Kibble balance). **`DP` holds the science of a standard; `EC` holds the competence to operate the apparatus and calibrate with it** — the same boundary as CM-06, one tier up. A list that stops at the working instrument cannot answer how a measurement reaches the SI, which is the question the whole system exists to answer. **ONE EC PACK PER DP, AND THAT IS A TEST.** 21 and 21. A discipline with no equipment pack is a discipline whose instruments nobody can be assessed on, and counting found five: nanometrology, additive manufacturing, digital metrology, geodesy, and magnetics — which had an EC pack claiming it and covering only its high-voltage half. When an area moves between packs its IDs do **not** renumber; the prefix is historical, per rule 1. Every area is a SPINE — receiving inspection, configuration, standards and fixturing, then adjustment, uncertainty, conformity — wrapped around the parameters that make that equipment type distinct. The spine repeats because it genuinely does; the parameters never do. **Test: no two areas share a single parameter element, and an area whose parameters could be swapped for another type's has been written wrong.** This is where the technician works, the engineer designs, and the metrologist reads to judge whether a measurement was sound.

---

## Layout

**Two content trees, and the distinction is load-bearing.** `content/bok/` explains a SUBJECT. `content/competence/` assesses a PERSON. They were one file until decision 38 and that produced neither a usable encyclopedia nor a clean assessment model.

```
content/bok/<domain>/*.md         THE BODY OF KNOWLEDGE. Encyclopedic reference,
                                  organized by subject, public and redistributable.
                                  BOK-nnnn, append-only. Declares stable section
                                  ids; elements link to sections, not articles.

content/competence/
  taxonomy/domains/*.yaml         64 files, one per domain. THE taxonomy.
                                  CM = concept, DP = quantity, EC = equipment
                                  type. Three axes; see rule 14.
  taxonomy/id-registry.lock       Every ID ever issued — taxonomy, BOK, modules,
                                  archetypes. Append-only.
  taxonomy/proficiency.yaml       The 5-level ladder. Steward-controlled.
  roles/registry.yaml             13 reference roles — 12 occupational, 1
                                  authority overlay. Every element needs a
                                  roleTarget for EVERY role — each one added is
                                  now 5459 more authored ratings.
  elements/                       ASSESSABLE CLAIMS, not prose. 26 authored,
                                  across CM-03, CM-08, CM-15, CM-21, DP-08,
                                  DP-20, EC-01 and EC-04.
  items/archetypes/               Reusable parameterized item SHAPES. ARC-nnnn.
  items/bindings/                 One archetype × one (element×level). Scales here.
  items/rubrics/                  Ships in the same commit as its item.
  modules/                        Training. MOD-nnnn. Teaches, never proves.
  bootstrap-cohort.yaml           Who may sign the ladder into existence, and
                                  until when. Steward-controlled. PUBLISHES —
                                  a verifier resolves it offline. Convenes
                                  nobody today, so no bootstrap signature is
                                  currently valid.

content/sources/registry.yaml     Source licence register. Outside both trees,
                                  because both cite it.
content/trust-registry.yaml       Issuer trust registry. Steward-controlled.
                                  PUBLISHES — offline verification resolves
                                  against it. Admits nobody yet, so nothing
                                  verifies.

schemas/                          18 JSON Schemas. Frozen at Phase 3.
packages/validator/               The ONLY implemented package. 262 tests.
apps/viewer/                      The only implemented app. TWO templates and a
                                  build script; output is an index page plus one
                                  page per domain, none committed. Every page is
                                  self-contained and fetches NOTHING — that is
                                  what lets it be copied to a file share, and CI
                                  refuses to publish a page that reaches out.
docs/taxonomy/                    GENERATED. Never hand-edit; CI fails if stale.
tools/                            Build scripts, ceiling-plan.json, kind-plan.json,
                                  public-projection.ts (the publication allowlist).
docs/                             Decision record, playbook, anchor template, governance.
```

**`packages/{core,assessment,credentials,exchange,compiler}` and `apps/{personal,desktop,web,server,commons}` are empty directories.** They describe the intended architecture; none contains code. Do not assume anything there exists.

### Where the contracts and the executable rules live

Eighteen schemas, and the ones that are not obvious from their names:

| Schema | Governs |
|---|---|
| `element`, `taxonomy`, `bok-article` | The corpus itself |
| `proficiency`, `role-registry`, `source-registry` | The frames content is written into |
| `bootstrap-cohort` | The founding roster — makes "closed, time-limited" resolvable rather than asserted |
| `trust-registry` | Who may issue, which keys were theirs, and how old this snapshot is |
| `item-archetype`, `item-binding` | The item bank (decision 36). `itemType` includes `witnessed-performance`, the only shape that can assess an element whose demonstration route is `equipment`. **What the witness must observe is two-layer**: the archetype states what its whole family of procedures requires, the binding states what THIS test adds |
| `credential`, `authorization` | What travels with a person, and what never does. An authorization's scope is computable on every dimension, because the question an accreditation body asks of it is a comparison and not a reading |
| `attempt-ledger` | No-retake rule and exposure control |
| `deployment-scope` | Which elements apply to a person — pairs with `roleTargets` |
| `disclosure` | What a person has consented one organization to see, for one purpose, until one date. An organization's view of a record is a disclosure, not a read |
| `training-module`, `training-record` | Learning, and the record that may never claim competence |
| `common` | Shared `$defs` — every ID pattern lives here, plus `organizationRef`, because deciding whether two organizations differ is a rule and not a display concern, `person`, because articles and elements both have to name the humans behind them, `reviewerStanding`, because a reviewer's standing is the same question wherever it is asked, and `taxonomyIncludes`/`taxonomyExcludes`, because a deployment scope and an authorization scope must resolve against the taxonomy by the same operation or they will disagree |

Rules JSON Schema cannot express are executable, in `packages/validator/src/`:

| Module | The rule it enforces |
|---|---|
| `checks.ts` | Everything corpus-wide: IDs, citations, anchors, BOK refs, item bank, modules, duplicate titles, that a role never needs an element whose prerequisite is `null` for it, that a contested section says WHERE the disagreement lives, that an item bound to disputed knowledge declares what its scoring must not credit, that a proficiency-test result is not admitted below L3, that a gold reference is carried by review rather than asserted, that a reviewer claiming a resolvable standing can actually be resolved, and that a desk archetype is never bound to work that only exists while it is being done, and that a witnessed binding says what the witness must see for its own test |
| `credentials.ts` | No self-signoff, signoff policy, the wallet boundary, draft-status attestability, evidenced provenance tier, founding-cohort authority, dual custody, and why the evidence was enough |
| `trust.ts` | Offline verification against a registry snapshot, and the age of the answer |
| `ledger.ts` | Hash chain, no-retake, exposure count, trust horizon |
| `definitions.ts` | Semantic pinning — `definitionRef`, `assessmentPolicyRef`, drift, and what a section pin covers besides its prose |
| `authorizations.ts` | Does this authorization cover this work? Three answers — `covered`, `not-covered`, **`undecidable`** — and **units are never converted**, because a grant of 0–100 mm against a job at 0.5 m reads as `0.5 < 100` the moment they are |
| `scope.ts` | Gap analysis. **An element outside scope cannot produce a gap**, an authority overlay is not an occupation, and an organization computes gaps only through a disclosure that holds up |
| `canonical.ts` | The one hashing function. Changing it invalidates every hash ever computed |
| `reports.ts` | Coverage, per-element item gaps, per-archetype reuse |

**Every element must carry at least one `knowledgeRefs` entry**, pointing at an article AND a section. This is the refresher path: someone credentialed eight months ago who has forgotten one detail will not retrain, they will look it up, and that link has to land on the passage covering *that detail*. Section ids are append-only for the same reason element IDs are. It also means the article must be written before the element — knowledge before the claim that someone has mastered it.

**Three generated views of the taxonomy, all from the same YAML.** `docs/taxonomy/*.md` for linear reading and diffing, `docs/taxonomy/taxonomy.csv` for spreadsheets, and the [published viewer](https://recamerino.github.io/metrology-competence-system/) for search and filter. Regenerate with `npm run build:docs` and `npm run build:viewer`. The Markdown and CSV are committed because their diffs *are* the audit record; the 270 KB built HTML is not.

Element IDs deliberately do **not** encode the competency area. `CM-03-014`'s prefix is *historical*; the authoritative `domain` and `competencyArea` are fields. This lets an element be reorganized without renaming an ID a credential may already attest.

---

## Commands

```bash
npm run validate          # schema + integrity. Must be green.
npm test                  # 326 guardrail tests
npm run typecheck
npm run report:coverage   # per-domain counts, ceiling distribution, per-element item gaps
npm run report:foundational # which foundational areas a person has actually graded
npm run report:reachability # which declared ceilings a peer signature can actually reach
npm run report:quotes     # complete quotation manifest for legal review
npm run registry:sync     # append new IDs to the lock; commit the result
npm run build:docs        # regenerate docs/taxonomy/ — commit the result
npm run check:docs        # fail if docs/taxonomy/ is stale (CI runs this)
npm run build:viewer      # regenerate the viewer: index + one page per domain
npm run check:airgap      # scan build output for external references
npm run build:public      # public distribution — BOK ships, item internals do not
npm run check:leak        # fail if restricted content reached dist/public/ (CI runs this)
```

**The publication boundary.** `content/bok/`, the taxonomy, the roles and the elements are published — a person must be able to see what competence *means* and what they will be assessed against. Item internals are not: prompts, generator parameters, scoring, rubrics and binding rationale. Archetypes are published as a *projection* (identity and shape only) because a credential names the archetype it was served from and that has to resolve offline. The projection is an **allowlist** in `tools/public-projection.ts`, so a field added later defaults to withheld — publication cannot be undone. See decision 42.

Changing ceilings or kinds: edit `tools/ceiling-plan.json` or `tools/kind-plan.json`, then `node tools/apply-ceilings.ts` / `node tools/apply-kinds.ts`. Both refuse to run if an area is unplanned or an override names a nonexistent element. Never hand-edit those fields across files.

---

## Open decisions

**Blocked on people, not on work — do not raise these as next actions.** Steward appointment and validation of the experience-hour thresholds both need input the project does not yet have, with no timetable. The operating rule while that persists is in [`docs/stewards.md`](docs/stewards.md): design and authoring proceed, issuance does not. Nothing has issued a credential, so nothing decided so far has harmed anybody.

1. **Legal review of the source register.** Priority order: ISO/IEC 17025, the JCGM copyright statement, ASME Y14.5, then ILAC/UKAS/EURAMET/OIML. **One register entry is already known to be wrong on its own terms**: `EURAMET-CG-18` records `termsBasis` as "published free of charge… cite freely; quote briefly with commentary", and the document's own copyright page says extracts may be taken only with the permission of the EURAMET Secretariat — which is stricter than "quote briefly". Nothing is exposed, because `blockedPendingCounsel` already refuses every quotation against it and no quotation exists anywhere in the corpus; but the recorded terms are an assessment nobody had checked against the document, and the other 35 entries were assessed the same way. Found by opening cg-18 to author `EC-04-005`. Blocks Phase 4 quotation authoring only — citations and all other work are unaffected. No quotations exist yet, so nothing is currently exposed.
2. **L5 ceiling review.** Still open, and now has a second test alongside anchor writing: if no *item* can be bound to an element at L5 that a competent practitioner could genuinely fail, it is not L5. `ARC-0003` exists for exactly this shape — an element that cannot support a defensible disagreement probably does not have expert practice in it.
3. **Commons operation.** The software will be built; whether the project *operates* a public instance (PII custody, moderation, funding) is deferred governance.
4. **Authority-tier issuer.** A neutral foundation as issuer of last resort would be the strongest long-term credential. Needs people and funding. Roadmap, not a dependency.
5. **Reviewer supply for thin domains.** `DP-21-A05` (relativistic geodesy) may have a few dozen qualified reviewers worldwide. The peer-review network needs an answer for domains that thin.
6. **Reviewer scoring load.** Rubric-scoring is turning out to be the norm rather than the exception, which raises the human cost of the bank. Not blocking, but it feeds the reviewer programme design and the Phase 7 estimate.

### Must land before the Phase 3 schema freeze

From external architectural review, August 2026. Not a new phase — scope that has to be inside the freeze, because changing it after thousands of articles exist is the same mistake the BOK split avoided by two weeks.

**Done:** knowledge-version provenance (decision 39) · BOK review provenance (decision 40) · disagreement and consensus (decision 41) · role type, occupational vs authority overlay (was item 14) · **trust registry, key lifecycle and the DID profile (was items 8 and 18)** · **where a disagreement lives, and what an item may not score for it** — `consensus` said practitioners disagree and nothing said *why*, so a section contested because its source contradicts itself could not be told from one contested because no source reaches the question, and only the first is resolved by a revision. `contestedBasis` splits them four ways and all four are used by real content. Its consequence for assessment is `positionNeutrality`: an item bound to an element that reaches disputed knowledge must state what the scoring credits and what it must never credit, because a rubric that rewards arriving at the author's position is a validity defect that reads perfectly well on the page. The obligation is **derived, not declared** — the corpus already knows which sections are disputed and which elements reach them, and an author who has to remember a flag is the arrangement that left `CONFIRM-WITH-COUNSEL` unenforceable.

**Also done:** **experience breadth, and a declared position on education** — `minExperienceHours` was the ladder's only experience input, and hours measure duration. LM-14 describes progression as several years of progressively more complex *assignments*, which is a claim about range: 1000 hours on one repetitive task clears a 1000-hour bar exactly as well as 1000 hours across escalating work, at the level whose whole claim is judgement in unfamiliar cases. `minDistinctActivities` is set at L4 and L5, recorded on the credential as `distinctActivities`, and checked — a requirement nothing reads is the defect corrected twice already. Separately, the profession treats formal education as **substitutable** for experience (RP-17 §4.2.1, LM-14) and this system does not admit it; that exclusion is now declared in `proficiency.yaml` with its reasoning and its cost, because an undeclared departure reads as an oversight.

**Also done:** **an authorization scope is computable on every dimension.** `authorization.scope` was four arrays of free prose, so decision 34's scope-matching engine — *does this grant cover this method, at this range, at this site* — could only be answered by somebody reading strings. "Signing certificates", "certificate signing" and "sign accredited certs" are three spellings of one activity and no comparison finds that; `"0.5 mm to 100 mm"` compares against nothing at all. Activities are a closed enum, methods carry identifiers and optional revisions, ranges carry a quantity, a unit and numeric bounds, and the measurement dimension resolves against the taxonomy through the **same selector definitions a deployment scope uses** — shared in `common.schema.json` and resolved by one `matchesSelectors`, because two implementations would eventually disagree and a person's job would contain an element their authorization did not cover for no reason anybody could find. **`authorizationCovers` returns three answers, not two**: `undecidable` is what makes `covered` and `not-covered` safe, since collapsing it either way wrongly blocks work or wrongly permits signing. **The unit trap is why it had to exist** — 0–100 mm against a job at 0.5 m reads as `0.5 < 100` the moment units are ignored, authorizing a certificate five times outside the grant with arithmetic that looks sound. **No conversion table ships**: half-right conversion inside a metrology system fails silently and in the direction of permitting more, so a unit mismatch is refused and says so. Was open decision 13.

**Also done:** **an organization's view of a person's record is a disclosure, and there is now a document for it.** `computeGaps(elements, scope, held)` took what somebody holds as a plain map with no record of where it came from, so the workforce dashboard would have been built assuming an employer may see everything a person holds — credentials earned elsewhere, before this job, in domains this job never touches. **Decision 34 turned out to have DECIDED the model and not built it**: "consented, scoped disclosure, every view audit-logged" was a row in a decision table with no schema and no code behind it, so there was nothing to copy and `disclosure.schema.json` is the first one, serving the assessor case too. Granted by the **subject**, to one organization, for one `purpose`, until a required expiry, and **bounded by the deployment scope pinned by content** — the organization owns that scope, so an unpinned bound is no bound, and widening a job description would otherwise widen what the employer may see with nobody consenting. Every entry must be in scope and one that is not refuses the **whole** view rather than being trimmed away; a refusal returns `null` rather than an empty gap list, because "no gaps found" is the worst possible rendering of "you were not permitted to look". **A person reading their own gaps needs none of it** — that is a read, by the owner, and `computeGaps` stays unguarded for it. Was open decision 20.

**Also done:** **why the evidence was enough.** A hash proves an artifact has not changed and says nothing about why it was *sufficient*, so a credential carried `sha256:…` and a date while the re-reviewer it exists for — including somebody challenging it — had no way to discover what the reviewer thought it demonstrated. The archive supported authentication and not review. `evidence[].sufficiency` records the decision, the date and a rationale long enough to argue with, and is **required on every artifact somebody judged** — `work-product`, `capstone`, `defense-record`, `mentoring-record` — but never on `attempt`, which is a record of what happened rather than a thing a reviewer decided was enough, and where a required rationale would reliably attract filler. **The decider must be one of the signers**: a sufficiency judgement from anybody else is not part of the attestation, and on the document it reads as though it were. Was open decision 9.

**Also done:** **a section pin covers what the section claims about itself, and a reviewer's standing is told apart from their name.** Two findings, one object. `sectionHash` hashed the prose alone, so flipping `consensus` from `established` to `contested` moved no bytes: the hash matched, a reviewer's attestation survived a change to how the passage must be read, and a credential resting on it reported no drift while its knowledge went from settled to disputed. `consensus`, `contestedBasis` and `alternativeViews` are now inside the pin — the last one carrying the substance of the disagreement and rewritable in full without touching prose — while `covers` and `contestedBasisNote` stay out as editorial and `deprecated`/`supersededBy` stay out as lifecycle, on the argument that keeps an element's `status` out. Separately, `reviewer` was a name: the corpus could say *X reviewed this on this date* and not *X had standing to*, which is the gap decision 47 closed for signers and never applied to the people reviewing the corpus. `standing.basis` is `held-credential`, `founding-cohort` or `stated`; **the two that claim to resolve are checked**, and `stated` — the only one available while nobody holds a credential and the cohort convenes nobody — is honest about being weighed rather than resolved. Standing is required only where a claim rests on it: a gold reference may not rest on a name alone. Was open decisions 15 and 16.

**Also done:** **a gold reference is now derived from review, and elements have review provenance at all.** `authoring.goldReference` was a bare boolean an author could set on their own work — the shape decision 8b removed from `bootstrapAuthority`, and the shape `bok-article` refuses BY NAME when it says there is deliberately no `authoritative: true` field. The article schema said it; the element schema did the opposite. **The roster answer was wrong here**: a bootstrap cohort publishes because a verifier resolves it offline, a gold reference never leaves the project, and gating it on a steward act would have put a new blocker on the critical path of the phase that has to create them. So it is derived — which required `reviews` on elements, because `authoring.lastReviewedOn` is a date with nobody attached to it and there was nothing to derive from. `goldReference: true` now needs named authors, **every** attainable level covered by a current accepted `technical` or `assessment` review, and no reviewer who is an author. The pin is the same `elementDefinitionHash` a credential uses, so **rewriting an anchor lapses the status** — "changed reluctantly" stops being an instruction and becomes arithmetic, and the review cost is proportional to the ceiling, which the Phase 3 estimate did not carry. Was open decision 25. Reviewer *standing* is still unevidenced — that is item 16, now in two places.

**Also done:** **the cryptosuite identifier was invented, and the curve had nowhere to live.** `cryptosuite` was a `const` reading `ecdsa-rdfc-2019-p256`. No such suite exists — W3C defines `ecdsa-rdfc-2019`, `ecdsa-jcs-2019` and `ecdsa-sd-2023`, and none carries a curve. A `const` is only ever checked against itself, so nothing here could have caught it; it would have surfaced the first time a holder took a credential to an implementation that was not ours. **The fix is not a de-hyphenation** — `rdfc` canonicalizes via JSON-LD expansion and RDF, requiring an `@context` this project does not have and whose resolution rule 5 forbids, so the suite is now **`ecdsa-jcs-2019`** (RFC 8785, plain JSON, no network). **The curve moved to where a verifier reads it**: `publicKeyMultibase` on the trust registry is now patterned to a P-256 Multikey (`0x8024` + 33-byte point → 49 chars beginning `zDnae`), so P-384 and Ed25519 are refused rather than silently admitted. The bound is computed from the encoding, not taken from convention, and the test recomputes it. Was open decision 17 — and it is the *category* of error the review record names: a claim about the outside world, taken on plausibility, about to freeze permanently.

**Also done:** **how the evidence is gathered is a SET, not a scalar** — `demonstration` asked a question that sounds like it has one answer, and for some elements it does not: a sensitivity coefficient is estimated by perturbing a correction routine or the instrument itself, and which route is available is a property of the laboratory. Forcing one value was wrong in both directions and neither error was silent for the same person — `equipment` invents a barrier for the learner who could sit the assessment tomorrow with a spreadsheet, `desk` hides a real one from the learner who will need access. It was urgent rather than merely important because **`demonstration` sits inside the definition pin**, so the correction would have read as drift on every credential issued against the element once the freeze had passed. Taken at 21 authored elements and no issued credential. A module now states which `route` it prepares where the element leaves the choice open, and may not restate one where the element has already answered; `requiresPhysicalDemonstration` is derived from that and checked both ways. Was open decision 23.

**Also done:** **the evidence route the profession names first** — `assessment.modality` enumerated four values and none was a proficiency test or interlaboratory comparison, so a laboratory holding the strongest objective evidence for a person (a satisfactory PT result in that measurement area, compared against a value it did not set) had to re-manufacture it as a work product judged by a colleague. `witnessed-proficiency-test` is admissible from L3 and checked not to appear below it, because L1 and L2 are witnessed observation of framed work and a PT result is neither. Additive, so nothing already issued is affected — but the enum lives in two schemas that freeze at Phase 3, which is what made it urgent rather than important.

7. **Many paths to competence.** `BOK → module → assessment` must never harden into a mandatory linear course. Self-study, mentoring, a commercial course and prior practice are all legitimate routes to the same assessment, and the competence definition stays independent of any learning provider. Learning resources are plural and vendor-neutral by construction — this is what makes the corpus disruptive without attacking anyone. Needs a schema before Phase 11, and a stated principle now.
10. **Exposure-group semantics and a binding-review record.** When do two differently parameterized items count as the same exposure? And who decided a binding was professionally valid — CI can only prove it is structurally possible. Both need rules before thousands of bindings exist, or the engine will decide by accident.
11. **Validity evidence.** CI proves integrity of the representation. Expert review proves technical validity. Neither proves the assessment measures the competence it claims to. That is empirical work — inter-rater reliability, whether items discriminate knowledge from skill from judgment, whether the five-level ladder matches how the profession actually reads competence. Research, not code, and the strongest thing the project could take to NCSL.
19. **Experience claims need activity-to-element granularity.** Decision 37 lets one activity credit every element it exercises, which is right. The inverse risk is a claim of forty hours against seventeen elements with nothing recording which part demonstrated which. The declaration is reviewable evidence only if there is something to review.
21. **Revocation is one-sided.** The issuer sets `status.revoked`; the subject cannot contest it in the data. The intent is stated plainly — revocation is not for an employer who has fallen out with the holder — but `fraud` is unfalsifiable from the holder's side, and the status list a verifier consults belongs to the issuer. Decide whether a holder's counter-statement travels with the credential. The registry now carries the issuer's revocations and nothing from the subject, so this is where it would go.
22. **`knowledgeRefs` proves a link RESOLVES, not that it COVERS.** CI checks the article exists and declares the section; it cannot check that those sections cover the element. `CM-03-052` points at `BOK-0001` §s03 and §s02 honestly and they cover about half of what it assesses — nothing on coverage factors, deriving a standard uncertainty from a certificate, or the negligibility judgement its L4 anchor turns on. The element is schema-valid, CI-clean, and its refresher path is broken for a holder who has forgotten any of those. Recorded in the element's closing note, where a human will read it and no code will. **The last of its family still open, with item 9.** Decisions 15, 16 and 23 were the same defect in `sectionHash`, `reviewer` and `demonstration`, and all three were closed the same way — by giving the knowledge a field that participates in something, rather than by writing the note more carefully. This one resists that remedy, because what is missing is not a place to record coverage but a way to compute it.
24. **The source register has no physics, and its safety coverage is one domain wide.** **Partly closed 2026-08-17**: `IEC-60601-1-2020` and `IEC-62353-2014` are registered, so `EC-12-A10` is authorable — but that is *medical electrical* safety and nothing else. Arc flash (`DP-08-100`, still abandoned) is IEEE and NFPA territory; mechanical, radiation, laser and chemical safety are each absent; and **no physics source is registered at all**, which is the larger half of this item and untouched. Note the new entries are the weakest classification in the register and say so in their own `termsBasis`: Tier 2 was assigned by analogy with ISO/IEC 17025, not from IEC's terms, which nobody has read. Original note follows. 32 registered sources: governance, uncertainty, vocabulary, units, statistics, GPS. Rule 2 requires a clause-level reference to a **registered** source, so anything resting on units or measurement vocabulary is authorable (`DP-08-081`, `094`, `064` all cite the VIM) and anything resting on the physics or the hazard is not — `DP-08-068` (shunt paths) and `DP-08-100` (arc flash) were both attempted and abandoned rather than fitted to a strained citation. Generalizes to all 31 foundational areas: mechanics, thermodynamics, fluid dynamics, optics, chemistry. **A licence and editorial-policy question, not authoring work** — the obvious candidates are restricted and land in the same counsel queue as item 1, and whether the project cites textbooks has never been decided. Cheap now, expensive once 443 elements exist. See [`docs/00-context.md`](docs/00-context.md).
26. **84% of declared ceilings cannot be reached by peer signature, and the arithmetic says so.** `levelCeiling` is documented as the highest *attainable* level, but attainability also depends on the signoff policy, which requires a signer already holding a level **in the same element** (`credentials.ts` — "at least this competent in the same element"). L3 needs an L4 holder; L4 and L5 need an L5 holder. So an element ceilinged at 4 needs an L5 holder in an element whose ceiling forbids anyone from ever holding L5 — its top rung is reachable only by bootstrap signature, permanently, and rule 8 makes the cohort transitional. Same argument at ceiling 3. Only a ceiling of 5 has a fully peer-reachable ladder, which is the one case the founding cohort exists to seed. **`npm run report:reachability` quantifies it: 4556 of 5407 elements, and three EC packs (`EC-12` 122 elements, `EC-16` 38, `EC-15` 13) contain no L5 element at all, so they top out at a peer-signed L3.** Rule 8 identified the bootstrap problem corpus-wide; what it did not identify is that element-scoping makes it *permanent per element* rather than a starting condition. **Not a content defect** — no author can fix it by editing an element, and it is not evidence that any ceiling is wrong. Four ways out, all steward decisions: widen signer scope beyond the element, lower the required holder level at the top of the ladder, redefine a ceiling as "the highest peer-signable level" and say so in the field description, or accept that the top rung of most elements is a bootstrap artefact. Found by tracing the EC-12 review's F-03, which framed it as an EC-12 pack problem; it is not.

12. **Standards-revision review triggers.** `currency.volatility: controlled` means review is woken by a published revision rather than a calendar. The field exists on articles and elements; the tooling that actually wakes them does not. Tooling, not schema, so it can follow the freeze. **One case inverts and the tooling must not assume otherwise: for `historical` content the trigger is a revision of the thing that REPLACED the source, not of the source.** A withdrawn standard will never be revised again, so `CM-08-038` is woken by a new edition of ISO/IEC 17025 or JCGM 106 — never by Z540.3. Wiring "wake content when its cited source is revised" would leave every historical element permanently asleep. **A second case the revision trigger misses entirely: the PUBLISHER changing.** ILAC and IAF merged into Global ACI on 2026-01-01, which revised no document — every ILAC designation is unchanged and every citation still resolves — while making two taxonomy titles describe an organizational landscape that no longer exists (`CM-01-043`, `CM-10-045`, both retitled 2026-09-03). Nothing in the corpus would ever have flagged it, because `volatility: controlled` watches documents and this was a change to who publishes them. Whatever wakes content has to watch the issuing body as well as the issue.

---

## What Phase 2 has to produce

**Done:** proficiency ladder · 13 reference roles · **per-element anchor template** ([`docs/anchor-template.md`](docs/anchor-template.md), with a CI lint rejecting unobservable phrasing, and separate upper-rung guidance for `knowledge` — its L4/L5 rows were phrased for `skill` and `judgment`, which made them unfollowable for the 108 knowledge elements at ceiling 5) · item parameterization format (archetypes + bindings, decision 36) · rubric format · experience hours and waiting periods (decision 37) · recertification defaults per level.

**Also done:** credential schema and provenance tiers · **authorization as a first-class object** · attempt ledger, challenge-exam no-retake rule, and exposure control.

**Remaining:** blueprint weighting · reviewer programme · exchange protocol · accreditation-body dossier. **The scope-matching model now has a computable substrate** — `authorization.scope` and `authorizationCovers` — but the assessor DOSSIER it matches against does not exist: decision 34 was a row in a decision table, and `disclosure.schema.json` supplied the consent half. What is left is the dossier itself.

**The attempt ledger's limit is deliberate and must not be "fixed" naively.** In the Personal edition the holder owns the machine, the ledger and the key, so they can truncate their own chain and it will verify clean — there is a test asserting exactly that. Hash-linking catches edits to the middle; only an *external* anchor fixes history. An unanchored ledger supports self-asserted claims about one's own practice and nothing more. Truncation becomes detectable the moment a counterparty holds a reference, which is why the credential carries `assessment.attemptRef`.

**"…and nothing more" does not mean "self-study".** That sentence used to end "which is what that provenance tier already means", and the word was doing double duty. An unanchored *ledger* is a record nobody but its owner stands behind. A self-study *credential* is signed — the tier describes the witness's **standing**, not their absence — so an unanchored ledger backs **no** credential at any tier, because every credential is signed and every signoff anchors. Read as one sentence the two produced an apparent contradiction: a named tier the no-self-signoff rule seemed to forbid. See rule 12.

**But "every signoff produces an anchor" did not cover the case that mattered.** A signoff anchors the chain *as it stands at signing time*, and a **failed** challenge produces no credential and so no anchor — so the one entry a candidate has reason to delete is the one nothing else holds a copy of, and the next signoff anchors a history the counterparty never saw intact. Fail, truncate, retake, pass, and the resulting credential is `peer-reviewed` with a false no-retake claim. Two things now close what can be closed: `checkChallengeProvenance` requires a challenge-exam credential to name an attempt anchored *independently of the signoff resting on it*, or be issued at `self-study`; and a dangling anchor — one naming a head the chain no longer contains — is an **error**, because that is positive evidence of truncation and was previously discarded in silence. Consequence to hold onto: **a challenge exam served with no counterparty present at the draw cannot back anything above self-study.** The ordinary assessment route is unaffected at every level.

---

## Picking up cold

### The corpus tripled, and most of it is unreviewed

**2232 → 5407 elements in one session**, and 5459 today. The `EC` axis (21 packs, 203 equipment types, 2732 elements) and 31 `Foundational Knowledge` areas were **generated in passes** from hand-written per-type specifications. Read that as a warning label, not a boast.

**Structure is sound and checked.** Zero duplicate element titles corpus-wide, zero pairs of equipment areas sharing a parameter element, every ID locked, every generated view current, 262 tests green. `checkDuplicateTitles` exists because that defect was found twice by ad-hoc script before it became a standing check.

**Coverage is the thing that is not proven.** A practicing metrologist reviewed the equipment axis four times and found real gaps every time — fixture-to-print calibration absent entirely, cal kits present only as parameters, magnetics claimed by a pack that contained none of it, the whole reference-and-primary tier missing between a working instrument and the SI. Each round changed the design rather than adding to it.

The reason it keeps happening is worth internalizing: **a missing equipment type is invisible from inside the corpus.** Nothing in it is wrong. There is simply nothing there, and no check finds an absence it was never told to look for. Assume a further pass would find more.

**So: a discipline-by-discipline read by somebody who works in that discipline is owed work, not optional.** It is also cheap now and expensive later — a title can be corrected freely, but an element can only ever be deprecated, and one equipment type is 13–20 lines in one file. `EC-10` (radiation dose standards) and `EC-12` (medical) are where the generated content is least trustworthy.

**What actually exists as content.** Two clusters, and they were authored for different reasons. The `CM-03` set closed a real defect; the rest were chosen deliberately to STRESS THE SCHEMA before the Phase 3 freeze, picking the weirdest shapes rather than the easiest ones. Each artifact is the worked reference for its format:

| | |
|---|---|
| `BOK-0001` | `correlation-and-covariance.md` — five sections, one marked `contested` with both positions recorded |
| `BOK-0002`–`0004` | Type B distributions, sensitivity coefficients and linearization, completeness and double-counting. Written to serve the eight elements below, each carries one `contested` section, and between them they closed two of the three gaps `CM-03-052` recorded against itself |
| `CM-03-053` | `skill`, ceiling 5, `demonstration: desk`, five performance anchors, thirteen role targets, bound at every level |
| `CM-03-052` | The second element, authored AFTER its items existed. `skill`, ceiling 4. Read its closing note: it records what the new articles closed, what is still missing (the coverage factor in the REPORTING direction, which belongs to `CM-03-060`), and why it still cannot go `stable` |
| `CM-03-019`, `036`, `038`, `040`, `046`, `050`, `051`, `056` | The eight that had bindings and no definition — a binding claiming to test a competence with no anchors to test against. Authored to close that. Four `skill`, three `judgment`, ceilings 4 and 5 |
| `BOK-0012` + `CM-03-120` | Known corrections left **unapplied** — the case the method's own founding assumption excludes. `CM-03-016` represents a correction and `CM-03-115` applies one; both assume it is applied, so the corpus held both halves of the default and nothing of the departure. Article carries a `contested` section on a tension **inside the GUM itself**, which describes the added-maxima practice in one place and warns against its general form in another. The element's closing note forbids scoring an item on which side a candidate takes |
| `BOK-0011` + `CM-03-119` | The CMC → certificate substitution. The **only content authored against `ILAC-P14-2020`** rather than the GUM, and the worked case of a competence found by tracing a chain rather than by reading a file: `CM-03-083` derives the CMC, `CM-03-084` spans the scope, and the step between them was missing, so a holder of both could still report the CMC verbatim on every certificate. Article carries a `contested` section on how far the repeatability allowance may be pressed |
| **The schema probes** | Below. Read these before authoring outside `CM-03` — each is the only worked example of its shape |
| `BOK-0005` + `DP-08-081`, `094`, `064` | Foundational tier. `knowledge` and `skill` at **ceiling 2**, no prerequisites, every role target identical. The shape most of the corpus's 443 foundational elements will take |
| `BOK-0006` + `EC-01-030` | The only `EC` element and the only **`demonstration: [equipment]`** one. Cross-axis prerequisite into `DP-08`. Read it with `MOD-0002` |
| `BOK-0007` + `CM-15-046`, `052` | Adjacent competency. `046` is `normative`; `052` is **`accepted-practice`** — the worked case of rule 2's "no clause requires anything of anybody" |
| `BOK-0008` + `CM-21-012` | **`interpretation`** + `volatile`. Its subject is fabricated clause references, which is a defect this corpus's own CI cannot detect |
| `BOK-0009` + `CM-08-038` | **`historical`** — a withdrawn standard still contractually binding. Article carries the only `jurisdiction-dependent` section |
| `BOK-0010` + `DP-20-002` | **`emerging`** + the only `recertificationMonths`. `knowledge` at ceiling 5 |
| `BOK-0013`–`0015` + `EC-04-004`/`005`/`007` + `ARC-0005` | **The witnessed-performance family, and the first bindings outside `CM-03`.** cg-18's three measurement methods — repeatability, eccentricity, errors of indication — on a weighing instrument, authored against §5.1, §5.2, §5.3, §6.1, §6.2 and §6.3 of the one registered source that is an equipment-calibration guideline. Read them for what authoring them FOUND: the item bank could not express an assessment for an equipment-route element at all (which is why `EC-01-030` had no bindings either), then that a witnessed archetype written for one test cannot state a witness requirement for a family — and then, on the third, nothing, which is the result that mattered. **`EC-04-007` is also the sequencing trap**: the other two tests' loads need not be calibrated *unless the data also serves this one*, and that cannot be decided after the loading |
| `BOK-0016` + `EC-04-014` | **The first `demonstration: [desk]` element in `EC`, and the first cross-axis binding.** The uncertainty budget the three tests above feed. `EC` is organized by the equipment being calibrated, NOT by where the work happens — given the records, this budget is built at a table, and marking it `equipment` because its neighbours are would invent a barrier for the learner who can obtain records far more easily than a balance. Bound to `ARC-0004`, from `CM-03`. Its L4 is the correlated case: several standard weights whose uncertainties sum arithmetically, where assuming independence understates and always in the same direction |
| `BOK-0017` + `EC-04-013` | **The first `judgment` element in `EC`, and the one `ARC-0005` cannot serve.** Whether to adjust a balance before calibrating it. `demonstration: [desk]` follows from `kind` rather than from a call about benches — the element schema says knowledge and judgment are evidenced by explanation and defence. Bound at **L4 only**, to `ARC-0003`, and the three levels below are a documented gap: a position-and-defend item needs a position worth defending, which L1–L3 do not supply. Carries the only `contested` section in `EC`, on what "as found" is being asked to mean |
| `MOD-0001` | Prepares for a `desk` element and deliberately declares NO physical demonstration |
| `MOD-0002` | Prepares for an `equipment` element and MUST declare it. The two modules are the two halves of rule 11, and CI enforces both directions — verified by deliberately breaking each |
| `ARC-0001`–`0005` | `ARC-0004` and `ARC-0005` span families; `ARC-0001`–`0003` are narrow. **`ARC-0005` is the first witnessed archetype and the first to bind outside `CM-03`.** Written for one test, widened to cg-18's family of measurement methods when a second element landed beside it, and the third then bound to it **with no schema change and no new test** — which is what tells you a family shape from a convenient one |

**What the corpus says about itself.** Run `npm run report:coverage` first — its `ITEM GAPS` section names the next content work rather than requiring you to infer it, and it is authoritative where this file has gone stale. Two shapes to expect. Elements carrying items with **no authored definition** — a binding claiming to test a competence that has no anchors to test against — which stood at eight and is now **zero**. And elements with items only at upper levels, a candidate unable to climb to an L4 they have no L3 item for, which is still real: eight elements have unbound attainable levels. Several of those are **deliberate and documented in the binding file**, because at L1 the archetype supplies the values the element exists to obtain, and padding `ARC-0004` into the slot would inflate the reuse figure while assessing nothing. Read the binding's comment before treating a gap as work.

**The highest-value engineering work is authoring something real against the design.** That exercise has found a genuine flaw **six times out of six** — the BOK/competence split, the generator-parameter leak, the missing level pin, the undefined `roleTarget`, `knowledgeRefs` proving that a link RESOLVES while proving nothing about whether it COVERS (open decision 22), and **the item bank having no shape for work that is watched rather than submitted**. Reading the schemas has never found one.

**The sixth is the one to learn the lesson from, because it had been sitting in plain sight as a number.** Every `itemType` was a desk item served as a prompt and `lookupResistance` was required of all of them, so no element whose `demonstration` route is `equipment` could be bound to anything. The evidence was already on the coverage report — `EC-01-030`, the corpus's only EC element, had zero bindings — and it read as *not done yet* rather than *not possible*. Six passes over the schemas did not find it. Authoring `EC-04-005` and trying to bind it found it in minutes, because the binding is where the two halves are forced to meet. If you are choosing what to do next and nothing else is pressing, author an element or bind one and see what breaks.

### What four adversarial reviews taught, and how to use the next one

Four external reviews were worked through in September 2026 — CM-03, foundational
ceilings, EC-12, and the proficiency ladder with the role registry. Roughly
twenty-five findings. **Eleven were confirmed as filed. Four were refuted or
materially narrowed by checking. Two got LARGER.** That split was consistent
enough to be predictive, and it is the reason to verify before acting:

**Claims about the corpus held up almost every time.** Every "grep returns zero
hits" was accurate. Absences are demonstrable, and a reviewer who says an
element does not exist is nearly always right.

**Claims about the outside world, and about what the code does, often did not.**
The failures were an NCSLI document misattributed by number; a falsification
test the reviewer stated but never ran; a rule cited from the wrong file
(`CM-17` for `CM-20`); and twice a mechanism assumed missing that was present
and already tested — `provenanceTier` for witness standing, and the
`authorities` field that made a role's supposed contradiction disappear.

**Two findings grew under checking, and both were worth more than what they
displaced.** Tracing EC-12's ceiling complaint produced open decision 26: the
problem was corpus-wide, not one pack's. Grading one foundational area revealed
that nine of the ten already-graded areas had overridden ceilings DOWNWARD only,
making the missing L4 question — not the missing L2 — the commoner defect.

**Checking also found three defects no review caught**: the `CM-20`/`CM-17`
mis-reference, `EC-12-A09`'s summary naming a device class the area does not
contain, and a false claim about DP budget elements that a PR of this project's
own had introduced.

So: **verify each finding against the files before acting, and say plainly which
ones do not survive.** A refuted finding is a result, not a failure — and the
reviewer is usually pointing at something real even when the stated consequence
is wrong.


**Do not raise stewards or experience-hour validation as next actions.** Both are blocked on people, with no timetable. See the note under Open decisions.

### What the first real archetypes and elements taught

Authored against `CM-03` and validated. Findings that change downstream estimates:

**Rubric-scoring is the norm, not the exception.** Writing `lookupResistance` honestly forces it — for a Type B assignment item the arithmetic *is* lookupable and an AI produces it instantly, so the numeric part carries 20% and the justification carries the item. Two of three archetypes are rubric-scored. Human reviewer effort across the bank is therefore higher than the phase plan assumed. This is a real cost of abolishing proctoring, and it lands in Phase 7.

**The reuse ratio is moving, and the mean is the wrong statistic.** `report:coverage` prints units per archetype individually. `ARC-0004` — construct a budget from records, with the structural feature as a *generator* parameter — now reaches **21 units across six elements**, while the three narrow archetypes sit at 2–5. The mean (8.0) averages those and understates the shape that matters. **Read decision 36's 20–50 target per archetype, not as a mean:** a shape built to span a family plausibly reaches it; one built for a single subject never will.

**`ARC-0004` is the first archetype to reach that target, and it got there by crossing an AXIS.** Its sixth element is `EC-04-014`, the uncertainty budget for a balance calibration — a `CM-03` archetype serving an `EC` element, which is the first cross-axis binding in the corpus and took no change to the archetype. That is the second reuse result in two authoring passes and it points the opposite way from the first: `ARC-0005` spans a family of *procedures* within one area, `ARC-0004` spans a *subject* across two axes. **The bank's economics do not rest on one kind of generalization**, which matters at 21314 assessable units.

**But a witnessed archetype spans an EQUIPMENT CLASS, not the axis**, and the coverage report says so plainly: `EC-01-030` still has no items. A witnessed archetype now exists, and it cannot serve a multimeter verification because `ARC-0005` is a weighing-instrument shape — the procedures it spans are cg-18's, and cg-18 is about one class of instrument. So the `EC` axis needs roughly **one witnessed archetype per equipment-class family**: far fewer than 2732, and considerably more than one. That is a Phase 7 estimate nobody has made, and it is the first number the item bank has produced about its own eventual size rather than about its current coverage. `EC-01-030` sitting unbound beside three bound EC-04 elements is what makes it visible.

**A witnessed archetype spans, and it has to.** `ARC-0005` was written for one test and reached 3 units. Widening it to the family cg-18 groups under its measurement methods took it to 6 across two elements, and the third took it to **9** — second only to `ARC-0004`. The arithmetic is what forced it rather than tidiness: the `EC` axis is 2732 elements, and one archetype per test is not a bank anybody can build. **What widening cost is worth knowing**, because it is the first real constraint the witnessed shape has shown. `witnessRequirement` on an archetype can only state what every procedure in its family requires; what a witness must watch for a particular test is a property of that procedure, and the binding is where the procedure is chosen. So the field is two-layer, and a binding to a witnessed archetype owes its own half. Found by authoring the second element, not by looking at the first.

**The third element is the one that validated it, by costing nothing.** `EC-04-007` bound to the widened `ARC-0005` with no schema change, no archetype change beyond a comment, and no new test — one article, one element, one binding. That is the marginal cost of an element inside an established family, and it is the number the `EC` axis has to be planned against: the expensive artifact is the FIRST member, and everything after it is content. A shape that needs adjusting for each new member was never a family shape, and would not have shown the difference until the third one.

Parameters carry `visibility: prompt | generator`. A generator parameter rendered into the prompt destroys the item *while leaving the file looking perfectly well-formed*; that is why it is validated rather than left to review.
