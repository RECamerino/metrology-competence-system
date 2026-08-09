# Context and Decision Record

This is the authoritative record of *why* the project is shaped the way it is. Read it before changing anything structural. Where a decision looks arbitrary, the rationale here is usually the reason it is not.

---

## The problem

Metrology knowledge is fragmented across NMI publications, accreditation bodies, standards developers, and proprietary corporate training. Nobody can point at a single place and say: *this is what the field expects a person to know, at what depth, for what role, and here is how you prove it.*

Separately, competence records live in whatever system an employer happens to run. Change jobs and the evidence of everything you learned stays behind.

Three things are being built:

1. **The corpus** — an encyclopedic, freely-licensed BOK spanning measurement science and the adjacent competencies that get missed.
2. **The credential** — a portable, cryptographically verifiable record of demonstrated competence that the individual owns.
3. **The competence infrastructure** — serving ISO/IEC 17025:2017 §6.2 personnel-competence obligations, and giving accreditation bodies a verifiable basis for evaluating assessors against a scope.

## Three principles held in tension, deliberately

**No single person should hold all of it.** The corpus is meant to exceed any individual. If someone can complete it, it is too small.

**Nothing gates entry.** No employer, no budget, no professional network required. The Personal edition is the *full* platform, free, running with no server. Someone with no experience must be able to install it, do the work, produce real evidence, and arrive at an interview with verifiable proof.

**Rigor cannot be negotiable.** If the credential is easy, it is worthless, and the person who worked for it is the one harmed. Escalating evidence, mandatory experience hours, waiting periods between levels, no self-signoff, and recertification because competence decays.

The tension between the second and third principles is real and is not resolved by softening either one. It is resolved by making *provenance visible* — see decision 24.

---

## Decision record

### Corpus and content

| # | Decision | Why |
|---|---|---|
| 6 | Three-tier source register. **Referenceability mandatory for all tiers; quotability tier-gated.** | A BOK that cannot mention ISO/IEC 17025 is useless; a repository that reproduces it cannot be redistributed. Separating citation from quotation resolves both. See [`source-license-register.md`](source-license-register.md). |
| 11 | Encyclopedic — 2000+ leaf elements, 3-level hierarchy, full per-discipline depth | The discipline list is a floor, not a ceiling. Comprehensiveness is the point, not a stretch goal. Demonstrated at the Phase 1 gate: `DP-21` Geodetic and Gravitational Metrology was added because optical clocks now resolve centimetre elevation change, which makes the gravity potential a quantity a time and frequency laboratory measures — the boundary between geodesy and metrology moved, and the taxonomy followed it. |
| 13 | One file per element: YAML frontmatter + Markdown body | Structured facts must be validatable and queryable; prose must be readable and diffable. Neither format does both well alone. |
| 16 | Skeleton approved first, then domain-by-domain checkpoints | Restructuring a taxonomy is cheap before 2000 elements are written against it and ruinous after. |
| 19 | Cross-cutting core to full depth first, then discipline packs | The ~800 domain-independent elements are what every role shares and what makes the gap dashboard useful. Discipline depth is the differentiator but not the foundation. |
| 10 | Code Apache-2.0, content CC BY-SA 4.0 | Apache-2.0 carries a patent grant and is on essentially every government and corporate approved-licence list. CC BY-SA keeps improvements to shared knowledge open. |

### Proficiency and assessment

| # | Decision | Why |
|---|---|---|
| 7 | 5-level Dreyfus-style, anchored per element to **observable** behaviour | Generic adjectives produce meaningless ratings. "Understands uncertainty budgets" cannot be assessed; "constructs a budget, identifies correlated inputs, defends the coverage factor" can. |
| 20 | Certification unit is (element × level), **element-scoped at every level**; per-element ceilings | Revised at the Phase 1 gate. The original design assessed L1–L2 across a competency area, which was far cheaper to author but made `CM-03-048 @ L2` ambiguous: it could mean the element was assessed, or that some cluster containing it was. Those are materially different claims, and a credential's meaning cannot be renegotiated after issue. Cost of the correction is real — assessable units rise from 4992 to 8844 as estimated at the gate, and L1/L2 item authoring goes from 251 areas to 2232 elements. (Those are the gate-time figures, kept as the record of what was weighed at the time. The revision landed at 257 areas and 9096 units; CLAUDE.md carries the current numbers.) Accepted deliberately: an ambiguous credential is worth less than an expensive one. |
| 28 | Parameterized, constructed-response, judgment-centric items. MCQ minor. | See below. |
| **29** | **Proctoring abolished entirely** | See below. |
| 30 | Hybrid scoring: deterministic auto-scoring where possible, rubric-scored by credentialed reviewers otherwise; calibration and double-scoring at L4–L5 | Human effort concentrated where judgment is genuinely required. Inter-rater reliability at the top levels is what makes a credential defensible in an audit. |
| 31 | Challenge exam: comprehensive, open-resource, one attempt per element-level, no retakes | Lets an experienced hire skip content without pretending they need it. The attempt ledger is what makes "one attempt" mean anything. |
| 21 | Escalating evidence ladder + time-in-grade + recertification | Time cannot be shortcut. This is the mechanism that makes the corpus a lifetime's pursuit. |

#### Why assessment is open-resource, and why proctoring is gone

A working metrologist has GUM, the internet, and an AI assistant open. Testing recall measures the wrong thing.

Once assessment is open-resource, **item design carries the integrity load instead of surveillance**. Every candidate receives differently-parameterized problems, so a shared answer key is worthless. An item answerable by lookup — or by pasting the prompt into an AI assistant — is a *defective item*, and gets rejected in review.

That is what makes abolishing proctoring coherent rather than lax. Two further reasons:

- **Authority recognition.** A Corporate or Principal Metrologist may not recognise the authority of whoever is available to invigilate. Requiring it creates friction precisely for the senior people the challenge exam exists to serve.
- **Privacy.** Browser-based proctoring is weak against a determined cheater and creates a significant PII burden that conflicts with the minimal-PII design.

**Consequence, stated honestly:** organizations whose own quality system mandates proctored testing will not find that feature here. They can record their own supervision attestation as an ordinary evidence artifact through the overlay. No proctoring modality enters the core schema.

At L4–L5 the signer is a credentialed reviewer conducting a substantive defense — a peer interrogating the work, not an invigilator watching a screen.

### Credentials and trust

| # | Decision | Why |
|---|---|---|
| 22 | W3C Verifiable Credentials 2.0 + Open Badges 3.0, DIDs, offline verification. **No blockchain.** | Verification is a signature check against a signed issuer trust registry distributed as a file. A ledger would add a network dependency, put immutable personal data somewhere it can never be erased, and be rejected outright by the regulated environments this must run in. |
| 23 | Dual custody | ISO/IEC 17025 §6.2 requires the laboratory to hold competence records for audit; the individual needs portability. Both hold a true copy; neither can erase the other's. |
| 24 | Visible provenance tiers + peer-review network | Self-study / Peer-reviewed / Organization / Accredited body / Authority. A hiring manager sees not just what was demonstrated but who stood behind it. This is how the entry-barrier principle and the rigor principle coexist: nothing is blocked, and the difference is legible rather than hidden. |
| 27 | Structural anti-collusion controls + archived artifacts enabling re-review | No self-signoff. Reciprocal review blocked within a window. Reviewer standing verified per element. Artifacts hashed so any credential can be independently re-reviewed years later. |
| 32 | Reviewer authority is itself a verifiable credential, with a public service record | Reviews given to unaffiliated individuals are counted separately and displayed prominently. That count is the prestige signal, it is verifiable, and it travels onto a CV. |
| 33 | Transport-agnostic signed exchange protocol + optional Commons | The network is a *protocol*, not a service. Review requests and signed reviews are portable signed documents; they move over a public website, an intranet, email, or a USB stick, and the cryptography makes them equally valid. Nothing about earning a credential requires internet. |
| 34 | Assessor competence dossier + scope-matching engine | Lets an accreditation body answer "is this assessor competent for this job" from verifiable evidence rather than a CV. Consented, scoped disclosure; every view audit-logged and visible to the assessor. |

#### Why ECDSA P-256 and not Ed25519

Ed25519 is the Verifiable Credentials ecosystem default and is a better curve by most engineering measures. **FIPS 140-3 validation is required for the DoD deployments this must support**, and P-256 (FIPS 186-5) is the approved choice.

This is expensive to reverse: every credential already issued is signed with the suite in force at the time. Decided deliberately, at the start, rather than discovered later.

### Platform and deployment

| # | Decision | Why |
|---|---|---|
| 1 | Web app, PWA-capable, React + TypeScript, self-hosted | PWAs need a secure context, which internal-CA HTTPS over an intranet satisfies. Nothing about a PWA requires the public internet. |
| 2 | All deployment profiles by configuration; **air-gapped is the default build** | Egress-dependent code is *absent* from the build when unconfigured, not merely disabled. In an enclave, an unexpected outbound request is an incident, not a bug report. Enforced by `npm run check:airgap`. |
| 3 | Storage-agnostic behind an adapter; SQLite default, Postgres adapter | A working air-gapped install should be a single file with no database server to get through change control. |
| 4 | Pluggable auth adapter, local accounts as shipped default | Runs out of the box with no identity provider. LDAP/AD, OIDC, SAML, CAC/PIV are adapters. |
| 12 | Vite + React + TS frontend, Fastify + TS backend, Tauri desktop | One language end-to-end keeps the contributor pool wide and keeps the isomorphic core honest. |
| 25 | Personal edition is the **full platform**, free, serverless, USB-distributable | Not a viewer. Dashboards, gaps, training, assessment, signoff workflow, wallet — all of it, locally. |
| 35 | Isomorphic core, plus a packaged desktop build | `packages/core` has zero server assumptions, so the same engine runs in a browser and behind Fastify. One implementation, no drift between editions. The desktop build matters because browser storage can be cleared by accident, and with a no-retake attempt ledger that accident is costly. |
| 26 | Build to DoD controls from day one; ship the evidence package | FIPS crypto, CAC/PIV, STIG baseline, SP 800-171 / CMMC mapping, boundary diagram. The project cannot hold an ATO — that is granted to a specific system in a specific enclave — but it can ship what an organization needs to pursue one. |
| **14** | **No AI ships in the product** | AI remains a knowledge domain (`CM-21`) and an authoring tool. Candidates may freely use their own AI during assessment; items are designed on that assumption. But no AI code path ships: hallucinated metrology guidance must never reach a user whose output feeds accreditation evidence. |
| 15 | Least-privilege visibility by default, org-configurable, minimal PII, full access audit log | Individuals see their own record; team leads see direct reports; department and above see aggregates unless policy grants more. No birthdate, no national ID, no free-text personal notes anywhere in the schema. |

### Process

| # | Decision | Why |
|---|---|---|
| 8 | ~12 reference roles, all data, fully org-overridable | The shipped set exists so the platform is useful on first run, not because these are the correct roles for anyone in particular. |
| 17 | Full guardrail kit before the model handoff | Frozen schemas, immutable ID registry, authoring playbook, gold reference set, CI gate. See [`handoff-playbook.md`](handoff-playbook.md). |
| 18 | `git init` locally; public GitHub | Every push is a separate, explicitly authorised action. |

---

## Competence is not authorization

Added at the Phase 1 gate. Every element declares a `kind` — **knowledge**, **skill** or **judgment** — because those determine what evidence proves attainment:

| Kind | The claim | What proves it |
|---|---|---|
| `knowledge` | I understand this | Explanation, relation, analysis |
| `skill` | I can perform this | A witnessed work product. A written answer cannot substitute. |
| `judgment` | I can decide about this and defend it | A defence. There is often no single right answer. |

A uniform evidence ladder across all three tests the wrong thing for at least two of them, which is why the classification has to exist before Phase 2 designs the ladder. **If an element genuinely needs two kinds of evidence, that is a sign it should be two elements.**

**Authority is deliberately not a fourth kind, and the distinction is load-bearing.**

Knowledge, skill and judgment are *earned*, and they are properties of a person. Authority is *granted*, and it is a relationship between a person, an organization and a scope of work. An element cannot *be* an authority, so putting it in the same enum would be a category error.

The consequence that matters most for this project:

> **Competency credentials are portable. Authorizations are not.**

An approved signatory who leaves a laboratory keeps every competency they demonstrated. They do not keep signatory authority, because the laboratory granted it and the accreditation body recognized it *at that laboratory, for that scope*. A wallet that treated the two identically would let someone arrive at a new employer holding what looks like signing authority — a defect in the credential model, not in the taxonomy.

So a person can hold verified L4 judgment in CMM task-specific uncertainty and still not be authorized to release a CMM result, and both statements are true and non-contradictory. Competence is a necessary input to authorization; it is never sufficient, because authorization also depends on appointment, current scope, organizational policy and continued employment.

**Authorization becomes a first-class object in Phase 2**, distinct from a competency credential:

- granted by an organization, not earned by assessment
- scoped to specific activities, ranges or methods
- revocable immediately and unilaterally, with no appeal to competence
- expiring on departure, reorganization or scope change
- requiring competence as evidence, and recording which elements it relied on
- never exported into the portable wallet as though it travelled

`CM-11-A05` (Approved Signatory Competence) and the `authorities` field already on the role registry both anticipated this. Phase 2 makes it explicit.

## The one rule that cannot be waived

**IDs are append-only.** `content/taxonomy/domains/*.yaml` and `content/taxonomy/id-registry.lock` may grow. Nothing in them may ever be renamed or removed.

Once a credential attests competence in `CM-03-014`, that identifier must resolve to the same element permanently. Rename it and you have silently invalidated somebody's evidence of their own competence, with no way to repair it. Elements that turn out to be wrong, redundant, or badly scoped are **deprecated and superseded**, never deleted.

CI enforces this. Stewards may not waive it. See [`../GOVERNANCE.md`](../GOVERNANCE.md).

---

## Open items

1. **Tier-2 quotation limits** — set at ≤25 words, ≤2 per source per element. Requires confirmation by counsel before Phase 4 authoring. Entries needing review are flagged `CONFIRM-WITH-COUNSEL` in the source register. Citations are unaffected.
2. **Public GitHub remote** — repository is local. Creating the remote and the first push each need explicit authorisation.
3. **Commons operation** — the software will be built; whether the project *operates* a public instance (PII custody, moderation, funding) is deferred governance.
4. **Authority-tier issuer** — a neutral foundation as issuer of last resort is the strongest long-term credential but needs people and funding. Roadmap, not a dependency.
5. **Recertification defaults** — proposed per domain in Phase 2.
6. **Experience-hour thresholds and waiting periods** — proposed per level in Phase 2.
7. **Skeleton scale** — 2000+ is the target; the Phase 1 coverage report shows where it actually lands.
