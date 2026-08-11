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
| 13 | One file per element: YAML frontmatter + Markdown body | Structured facts must be validatable and queryable; prose must be readable and diffable. Neither format does both well alone. **Refined by decision 38** — the format stands, but the encyclopedic prose moved out of the element and into a BOK article. |
| **38** | **The BOK and the competence system are separate trees** | See below. The single most consequential structural decision since the Phase 1 gate, and taken while zero prose existed. |
| 16 | Skeleton approved first, then domain-by-domain checkpoints | Restructuring a taxonomy is cheap before 2000 elements are written against it and ruinous after. |
| 19 | Cross-cutting core to full depth first, then discipline packs | The ~800 domain-independent elements are what every role shares and what makes the gap dashboard useful. Discipline depth is the differentiator but not the foundation. |
| 10 | Code Apache-2.0, content CC BY-SA 4.0 | Apache-2.0 carries a patent grant and is on essentially every government and corporate approved-licence list. CC BY-SA keeps improvements to shared knowledge open. |

#### Why the BOK and the competence system are separate

Until this point one file did two jobs. An element carried frontmatter that was an *assessable claim about a person* — `kind`, `levelCeiling`, `anchors`, `roleTargets` — and a Markdown body that was *knowledge about a subject*. Both at competence granularity, one file per element.

That produces neither thing well:

- **It is not an encyclopedia.** 2232 elements become 2232 assessment-shaped fragments. "Definitional uncertainty within the model" is a reasonable thing to assess and a poor thing to look up.
- **Knowledge serving several elements has nowhere to live.** It gets duplicated, and the copies diverge, or it gets assigned arbitrarily to one element and is invisible from the others.
- **The BOK cannot be cited on its own terms.** An outside author citing this work would be citing a claim about a person's competence, not a statement about the subject.
- **The lifecycles collide.** Knowledge ages when a standard is revised. Competence expectations age when professional practice moves. One file cannot carry two review triggers.
- **Publication is all-or-nothing.** The BOK is meant to be public and redistributable; item internals are not, because a rubric naming the defect classes injected into a budget tells a candidate exactly what to look for.

So: `content/bok/` holds articles organised by **subject**, and `content/competence/` holds the taxonomy, elements, items, roles and training. `content/sources/` sits outside both, because both cite it.

**The join is section-level, and that is the whole design.** Articles are sized by subject coherence — one article may serve five elements, one element may draw on three articles. Each article declares stable section ids; each element carries `knowledgeRefs` pointing at the specific sections covering it, and at least one is required.

The requirement driving section granularity rather than article granularity is concrete: **someone who demonstrated competence eight months ago and has forgotten one detail will not retrain.** They will look it up. They have to land on the passage covering that detail, not on an article vaguely about the area with it buried inside. A `knowledgeRef` that resolves to the wrong altitude is a broken refresher path, and it fails silently for exactly the person who most needs it.

Section ids therefore inherit the append-only discipline, one layer below element IDs, and BOK article ids share the same lock file.

Taken now because **zero element prose existed.** After Phase 4 this restructure would have been ruinous; at 0 authored elements it cost a directory move and a schema field. It does impose an ordering on authoring, deliberately: the reference material must exist before the claim that somebody has mastered it.

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
| **36** | **Item bank is an archetype library plus bindings**, not one item per assessable unit | Decided in Phase 2, and it is the decision that determines whether the item bank is finishable at all. See below. |
| **37** | **One logged activity credits every element it genuinely exercises** | Experience hours are per element, and there are 2232 of them. Apportioning each hour to exactly one element would make deep coverage arithmetically absurd — L5 across ten elements would demand ten thousand unshared hours — and would misdescribe practice, where a single calibration exercises uncertainty evaluation, traceability, and documentation at once. The candidate declares which elements an activity touched, and that declaration is itself reviewable evidence: an implausible claim is a reviewable defect, which puts the control on scrutiny rather than on arithmetic. |

#### Why assessment is open-resource, and why proctoring is gone

A working metrologist has GUM, the internet, and an AI assistant open. Testing recall measures the wrong thing.

Once assessment is open-resource, **item design carries the integrity load instead of surveillance**. Every candidate receives differently-parameterized problems, so a shared answer key is worthless. An item answerable by lookup — or by pasting the prompt into an AI assistant — is a *defective item*, and gets rejected in review.

That is what makes abolishing proctoring coherent rather than lax. Two further reasons:

- **Authority recognition.** A Corporate or Principal Metrologist may not recognise the authority of whoever is available to invigilate. Requiring it creates friction precisely for the senior people the challenge exam exists to serve.
- **Privacy.** Browser-based proctoring is weak against a determined cheater and creates a significant PII burden that conflicts with the minimal-PII design.

**Consequence, stated honestly:** organizations whose own quality system mandates proctored testing will not find that feature here. They can record their own supervision attestation as an ordinary evidence artifact through the overlay. No proctoring modality enters the core schema.

At L4–L5 the signer is a credentialed reviewer conducting a substantive defense — a peer interrogating the work, not an invigilator watching a screen.

#### Why the item bank is archetypes and bindings

This was the largest single risk in Phase 2. At 9096 assessable units, the authoring unit decides whether the item bank is a season of work or a decade of it, and the naive choice — one purpose-built item per unit — produces a body of work larger than the entire corpus and almost certainly unfinishable.

The alternatives were weighed explicitly:

| Approach | Cost | Why not |
|---|---|---|
| One item per assessable unit | 9096 items | Nothing reused, so nothing compromised — and not finishable by a small team. |
| One template per element | 2232 templates | Comparable in scale to the BOK prose itself, duplicated. |
| Generic `kind` × level frames | 15 frames | Drifts straight toward items answerable by lookup, which are defective by definition here. |

**Chosen: a library of parameterized archetypes, bound to many units through a cheap binding manifest.** An archetype is a reusable assessment *shape* — construct a budget containing a correlated pair; diagnose a defective certificate; defend a decision rule against a stated alternative. A binding attaches one archetype to one assessable unit, supplying the element's own parameters, tolerances, and rubric pointers. One archetype may serve twenty to fifty units.

The cost is real and lands in a specific place: **a badly bound archetype tests the archetype rather than the element.** That failure is invisible in the archetype, which may be excellent, and invisible in the binding, which may be well-formed. So binding review is a distinct quality gate with its own reviewers, not a rubber stamp on top of archetype review. The `kind` classification is what makes bindings tractable — a `skill` element cannot be bound to a knowledge archetype, and the validator can enforce that mechanically.

### Credentials and trust

| # | Decision | Why |
|---|---|---|
| 22 | W3C Verifiable Credentials 2.0 + Open Badges 3.0, DIDs, offline verification. **No blockchain.** | Verification is a signature check against a signed issuer trust registry distributed as a file. A ledger would add a network dependency, put immutable personal data somewhere it can never be erased, and be rejected outright by the regulated environments this must run in. |
| 23 | Dual custody | ISO/IEC 17025 §6.2 requires the laboratory to hold competence records for audit; the individual needs portability. Both hold a true copy; neither can erase the other's. |
| 24 | Visible provenance tiers + peer-review network | Self-study / Peer-reviewed / Organization / Accredited body / Authority. A hiring manager sees not just what was demonstrated but who stood behind it. This is how the entry-barrier principle and the rigor principle coexist: nothing is blocked, and the difference is legible rather than hidden. **Evidenced, not declared** — see below. |
| 27 | Structural anti-collusion controls + archived artifacts enabling re-review | No self-signoff. Reciprocal review blocked within a window. Reviewer standing verified per element. Artifacts hashed so any credential can be independently re-reviewed years later. |
| 32 | Reviewer authority is itself a verifiable credential, with a public service record | Reviews given to unaffiliated individuals are counted separately and displayed prominently. That count is the prestige signal, it is verifiable, and it travels onto a CV. |
| 33 | Transport-agnostic signed exchange protocol + optional Commons | The network is a *protocol*, not a service. Review requests and signed reviews are portable signed documents; they move over a public website, an intranet, email, or a USB stick, and the cryptography makes them equally valid. Nothing about earning a credential requires internet. |
| 34 | Assessor competence dossier + scope-matching engine | Lets an accreditation body answer "is this assessor competent for this job" from verifiable evidence rather than a CV. Consented, scoped disclosure; every view audit-logged and visible to the assessor. |

#### Training teaches; it never proves

Decision 45. The training layer was an empty directory and a phase number until now, which meant the most obvious way to reintroduce the project's founding objection had no guard on it at all.

**A module produces a training record, not a credential.** `attestsCompetence` is `const false` and cannot be authored otherwise. "Completed Advanced Metrology Training" is precisely the claim this system exists to replace, and a training layer that quietly issued competence claims would have rebuilt the problem inside the solution.

**What "nothing gates entry" does and does not mean.** It means the *system* imposes no gate: no employer, no budget, no professional network is required to learn, to be assessed, or to hold what you earn. It does **not** mean the system removes the requirement to do the work.

A person can read everything ever written about a CMM and still be unable to run one. That is a fact about the competence, not a defect in the software, and it is a defensible line to hold. Softening skill evidence so a simulation counts would not be inclusive — it would issue an attestation that somebody can operate equipment they have never touched, and the person most harmed by that is the holder, standing in front of the machine on their first day.

So training modules are **not** a workaround for equipment access. They are preparation, so that when access does come — bought, borrowed, or on the job — the bench time is spent well rather than spent learning what a book could have taught. Whether somebody obtains equipment and finds a credentialed witness is their business and their route; the system's job is to define the competence, supply the knowledge freely, and verify the demonstration honestly. It is not to procure hardware.

So the validator requires that a module preparing for an element whose `demonstration` is `equipment` declares it in `requiresPhysicalDemonstration`. A module claiming to complete such an element by simulation is asserting that a simulation substitutes for the bench, and the failure would otherwise be invisible: the module would look complete and the learner would believe they had finished something they have never done.

**The test is `demonstration`, not `kind`, and this paragraph said otherwise until the split was made.** `skill` means the evidence is observable performance rather than explanation; it does not mean the performance happens at a bench. Constructing an uncertainty budget is a skill and is desk work, and listing it as requiring physical demonstration tells a learner they are waiting for access they never needed. The validator rejects that too — inventing a barrier is as wrong as hiding one — so a module author following the old wording here would have had their module rejected by the rule this document was describing.

**`pending-demonstration` is an accurate statement of position, not a consolation prize.** Completing the module leaves those elements saying: the knowledge is done, the demonstration is not. It is precise rather than encouraging, which is why it is useful — a mentor or a laboratory reading it knows exactly what is being asked for, and the holder is never under the impression that the training finished the job.

**`cannotConvey` is required on every module**, and is the training-layer counterpart of `lookupResistance` on an archetype: an unfakeable sentence forcing the author to confront what they have not built. Some competences are perceptual and no simulation reaches them. Dimensional work is the type case — measuring force, the feel of a correctly wrung stack, the point at which a thimble slips. A module that pretends otherwise produces somebody who believes they can do something they have never done, which is worse than no training at all.

**Scope is deliberately limited to procedural simulation** — interactive diagrams, parametric widgets, guided worked examples. Not virtual instrumentation. A 3D instrument handled with a mouse teaches the handling of a mouse, becomes a toy rather than a competency module, and does not fit a serverless USB-distributable build with no external calls.

Training records may be **self-attested**, unlike credentials. Completing a module is a fact about participation; competence is a claim about ability, and claims about ability need somebody else to stand behind them. Requiring a witness to learn would punish exactly the person with no employer and no professional network. Self-attested records carry correspondingly little weight, and both facts are visible.

#### The ladder cannot start on its own

Decision 43, from external review. A deadlock in shipped configuration, not a documentation problem.

L3 requires a signer holding L4. L4 requires L5. L5 requires L5. At launch nobody holds anything, so **L3, L4 and L5 were all permanently unreachable and the system could only ever issue L1 and L2.** A second lock sat inside it: L3 and above also require a credentialed reviewer, and reviewer authority is itself a credential needing signers.

The answer is a **closed, time-limited founding cohort**, admitted on demonstrated *external* standing — a primary-laboratory or NMI appointment, accreditation assessor status, a publication record — who may sign L3 to L5 without holding those levels.

The rule that keeps it from being corrosive: **a bootstrap signature is permanently visible on every credential it produces.** `signers[].bootstrapAuthority` carries the basis for that specific signer, stated per person rather than assumed from cohort membership, and `isBootstrapSigned()` derives the flag from the signers so the two can never disagree. The marker is never cleared when the cohort closes, because the credential was still signed that way.

This is the same move as the provenance tiers. The project does not pretend a self-study credential and an accredited-body credential are equivalent; it makes the difference legible. A bootstrap-signed L5 is a weaker claim than a peer-signed L5, and a reader who cannot tell them apart has been misled about the strongest assertion the system makes.

#### The provenance tier is evidenced, not declared

An adversarial review made two findings about `provenanceTier` that turned out to be one problem. The first was that **no code read the field at all** — it carried the entire "open entry and rigour coexist" argument while a credential could assert `accredited-body` with one unevidenced witness and no issuer recorded. A tier nobody checks is not legibility; it is a string.

The second was that `self-study` looked **structurally impossible to issue**: the schema demands at least one signer, the validator rejects the subject among them, so who signs a self-study credential?

Somebody does, and the answer was never written down anywhere — which is why it read as a contradiction. **`self-study` describes the standing of the witness, not their absence.** A person with no employer and no professional network studies alone, does the work, and has it witnessed by whoever is available: a colleague, a mentor, a former supervisor. That person is real, is not the subject, and holds no credential and no reviewer authority — which is exactly why `heldLevel: null` was already legitimate at L1 and L2. The tier records the truth a reader needs: somebody stood behind this, and nobody with standing did. Far from a hole, that is the entry-barrier principle working.

`highestSupportedTier()` now computes what a credential's own evidence will carry, and `checkCredential` rejects anything above it. Each step requires something checkable offline in the document itself:

| Tier | What the document must show |
|---|---|
| `self-study` | A signer who is not the subject. The floor. |
| `peer-reviewed` | A signer whose standing is **evidenced** — an authority chain, or a founding-cohort basis. An unbacked `heldLevel` or `credentialedReviewer` does not lift the tier. |
| `organization` | Plus an issuer recorded as a registered entity: a name and a resolvable trust-registry entry, not an individual's DID. |
| `accredited-body` | Plus the issuer's own `accreditationRecognition`. |
| `authority` | **Cannot be issued.** The neutral-foundation issuer does not exist — open item 4. |

Two consequences worth stating. Understating is permitted and silent: claiming less than you can prove misleads nobody. And the long-standing "Asserted, not proven" warning finally has teeth — an unevidenced claim about a signer now caps the tier of the credential they signed, rather than merely producing a line nobody had to act on.

**And `self-study` on a credential is not the same statement as "an unanchored ledger supports self-study claims".** That sentence, which appeared in the ledger module, the ledger schema and CLAUDE.md, is about an *attempt record*. An unanchored ledger is a record nobody but its owner stands behind. A credential at any tier is signed, and every signoff anchors — so an unanchored ledger backs **no** credential at all, not even at the bottom tier. What it supports is a person's own account of their own practice: a claim, not an attestation. The two sentences read as one produced the apparent impossibility above.

The alternatives were weighed. An authority-tier issuer would be the cleanest story but needs funding and legal existence, blocking the ladder for years. A mutual peer cohort needs nobody's permission but is structurally the reciprocal-review pattern the anti-collusion controls exist to detect — a poor founding act for a trust network. Relaxing the witness level temporarily would silently change what L3 and L4 mean for everyone credentialed during the window.

##### "Closed" and "time-limited" needed a roster

Both words were in the decision from the beginning and neither had a mechanism. `bootstrapAuthority` was a field a signer wrote **about themselves**: a basis string, an optional cohort name nothing resolved, an optional admission date nothing compared to anything. So the cohort had no roster, no convening and no closing date, and anybody willing to write forty characters of plausible standing was a founder. A closed cohort anybody can join is not closed.

The consequence an adversarial review put plainly: three people could bootstrap-sign each other to L5 across an entire domain in a weekend, every marker correctly displayed, and afterwards be the only people able to sign anyone else as a peer. The markers are permanent, but a market that reads "L5" and skips the annotation is not one the annotation protects anybody from. **The ladder's peer meaning would never start.**

`content/competence/bootstrap-cohort.yaml` is the answer, and it publishes — a verifier resolves a bootstrap signature against it offline, exactly as they resolve an issuer against the trust registry. A roster kept in the repository would leave the check unrunnable in the field, which is the only place it matters. It is also the accountability record for the people exercising the strongest discretionary power in the system, which is why member `name` is appropriate here while minimal PII governs everywhere else: a credential holder is someone the system has power over, and a founding-cohort member is someone exercising it.

Four controls, in rough order of how much work they do:

- **Scope.** A founder is admitted on standing in a *field* — a primary-laboratory appointment in dimensional metrology, an assessor role for a named scope — and may sign only in the domains that standing covers. There is deliberately **no wildcard**: a person competent to vouch across all 43 domains is exactly the person the first principle says should not exist. This is that principle enforced as code rather than stated as an aspiration.
- **No self-dealing.** A member may not be the **subject** of a bootstrap-signed credential. Founders are admitted on external standing and need none; the authority exists to bring *other* people onto the ladder. This is the mutual-peer-cohort alternative — rejected two paragraphs above — made executable rather than merely disapproved of.
- **Time.** Nothing after `closesOn`, and nothing before the member's own `admittedOn`, which stops a credential being backdated into a period when its signer had no standing. Credentials signed while the cohort was open stay valid forever and keep their marker: closing ends new bootstrap signing, it does not un-happen what was signed. Extending the closing date is a governance act with a record, because quietly extending it indefinitely is how a bootstrap becomes a permanent aristocracy.
- **Volume.** Enforced when a steward sets `maxCredentials`. The mechanism exists so governance *can* cap it; the number is a steward judgement the schema declines to invent, and scope is doing the real work.

**The shipped roster convenes nobody.** No `closesOn`, no members, so no bootstrap signature is valid anywhere in the system today. That is correct rather than unfinished: appointing stewards is blocked on people, convening a cohort is a steward act, nothing has issued a credential, and the operating rule while that persists is that design proceeds and issuance does not. A roster that permitted bootstrap signing before anybody had been appointed would have quietly reversed it.

#### Draft elements cannot carry serious credentials

Decision 44. Every element is `status: draft` today, and nothing prevented a credential being issued against one.

**L1 and L2 may rest on a draft element; L3 and above require `stable`.** L1–L2 are witnessed observation and carry little weight. L3 is where independent laboratory work is entrusted, and a badly scoped element does real damage to the person holding the credential — draft means the wording is still being argued about. A deprecated element cannot be newly attested at any level; existing credentials against it stay valid and new ones go to its successor.

The useful side effect is pressure in the right direction: elements have to be promoted out of draft before the serious credentials come to depend on them.

#### The publication boundary: the BOK ships, the answer key does not

Decision 42. The BOK/competence split made this possible; this decides it.

**What is restricted is narrower than it sounds.** The taxonomy, the proficiency ladder, the roles, the elements and their anchors are all published. A person must be able to see what competence *means* and exactly what they will be assessed against — hiding that would gate entry, which is the one thing this project refuses to do. What is withheld is the operational content of a live item bank: prompts, generator parameters, scoring bands, rubrics, and binding rationale.

**This is not proctoring by another name.** Assessment stays open-resource; a candidate may use references, the internet and an AI assistant. An item defeated by knowing the general design was already defective and gets rejected in review. What withholding protects is narrower: `ARC-0002` injects a defect into a budget, and its `defect_class` parameter is `visibility: generator` precisely because naming the defect hands over the answer. A published rubric listing the defect classes does the same thing more slowly.

**Nor is it secrecy from collaborators.** Reviewers, stewards and anyone evaluating the methodology get the whole repository. The boundary is on the published artifact, not on scrutiny.

Two design choices carry the weight:

**Per-field, not per-file.** A credential records the archetypes an assessment was served from, and verification is offline against a distributed file. So `ARC-0002` must resolve to *something* for a reader holding only the public distribution. Withholding archetypes wholesale would break verification in order to protect content that is not sensitive. Identity and shape are published; content is not.

**An allowlist, not a denylist.** Fields are published only if named. When somebody adds a field to the archetype schema in two years and has never heard of `tools/public-projection.ts`, it defaults to withheld. A denylist would default it to published, and that failure is silent and irreversible — there is no unpublishing.

The leak scan is deliberately independent of the builder. The builder does what it was told; the scan reads the artifact that would actually be distributed and asks what must not be there. It also refuses any non-YAML file under `items/`, because a path-based rubric rule misses a rubric that has been renamed — which is exactly the mistake a well-meaning script makes.

#### Authority is evidenced, never declared

Decision 40. The BOK carries no `authoritative: true` field and never will. An article asserting its own authority is precisely the "trust me" problem the whole project exists to replace, and it would be inconsistent to demand artifact-backed evidence from a person while accepting a self-declaration from a document.

Authority is instead **derived** from review provenance: who reviewed the article, in what capacity, on what date, covering which sections, and what they concluded. A reader weighs the reviewers exactly as they weigh the signers on a credential.

Three properties make it work:

- **Review type is separated.** Technical review says the metrology is right; educational review says it can be learned from; editorial says it reads well. Conflating them lets a copy-edit masquerade as a technical endorsement.
- **Review is scoped to sections and pinned by content.** Articles grow. A reviewer who read four sections in 2026 has not endorsed a fifth added in 2028, and an unscoped review would silently claim they had. The content pin means a later rewrite is detected and the review stops vouching for prose its reviewer never saw.
- **`disputed` is a legitimate disposition**, not a failure state. A reviewer who disagrees on substance has told a reader something worth knowing.

#### Disagreement is a first-class concept, on its own axis

Decision 41. Where competent practitioners differ, the BOK must not silently pick one side and present it as settled — that overstates what the field knows and substitutes the authors' judgement for the profession's.

The trap avoided here is worth recording, because it was nearly walked into. `currency.authorityStatus` already looked like the place to express disagreement. It is not, and using it that way would have produced two fields meaning roughly the same thing and used interchangeably. The axes are orthogonal:

| | Answers | Example |
|---|---|---|
| `authorityStatus` | What standing does this claim have? Where is it from, does it bind? | An ISO clause is `normative` |
| `consensus` | Do competent practitioners agree about it? | …and its interpretation is `contested` |

That combination — normative and contested at once — is common in metrology rather than exotic, and neither field alone can express it.

`consensus` sits on the **section**, because disagreement attaches to a specific claim rather than a whole subject. And a section marked contested must record `alternativeViews`, stated in their strongest form with the basis on which they are held. **A disputed flag with no alternative recorded is worse than no flag**: it tells a reader there is controversy without telling them what it is, leaving them less able to act than before. The validator rejects it.

#### A roleTarget is a scoped minimum requirement

Decision 48. Found by authoring the first real element, which is the third time that exercise has surfaced a design flaw fixtures had hidden.

`roleTargets` said "target proficiency for each reference role" and never defined *target*. Requirement, typical, or aspiration are three different claims producing three different dashboards, and **26,784 ratings were about to be authored against whichever one an author assumed**.

The damage is not theoretical. Every element carries a rating for every role, so a naive gap analysis demands a calibration engineer hold L4 in relativistic geodesy, CMM metrology, mass and forty other domains at once. At 200 hours and 180 days per L4, ten percent of the corpus is roughly twenty-one working years — for one role. The Phase 10 dashboard would have been unusable, and by then the ratings would all have been written.

**Settled as follows:**

- A roleTarget is the **minimum proficiency required** for that role when the element falls within the person's deployment scope. **Normative**, not descriptive and not aspirational.
- **It does not imply applicability.** Deployment scope determines applicability; the roleTarget determines the level once applicable.
- **An element outside scope cannot produce a competence gap.** Not a small one, not a deprioritised one — none.
- **Scope must be machine-resolvable** from taxonomy and deployment data, which is why `deployment-scope.schema.json` exists and resolves domains, areas and named elements rather than describing scope in prose.
- Personal aspirations are not roleTargets. Organizational authorization is not a roleTarget.

**Scope lives outside the corpus, deliberately.** What a "calibration engineer" covers differs between a dimensional house and a national institute, and the taxonomy has no business deciding. The corpus states the requirement; an appointment — or the person's own declaration in the Personal edition — states applicability; gap analysis is the intersection. That keeps roles organization-agnostic, which they already had to be.

It also sharpens what `null` means. Null is now the strong claim that the element could **never** be part of that role's work in any deployment, which is different from "not in this person's scope today" — and the latter is exactly what scope is for. An author who reaches for null to mean "most people in this role wouldn't do this" is answering the wrong question.

#### A credential must pin the bar, not only the definition

Decision 46, from a second external review. Decision 39 was **half applied**, and the missing half was the one its own reasoning most obviously demanded.

`definitionRef` pinned what the ELEMENT meant. Nothing pinned what the LEVEL meant. But `proficiency.yaml` controls signer count, the level a witness must hold, credentialed-reviewer and cross-organizational requirements, double scoring, capstone, work product, mentoring, minimum experience hours, the waiting period and recertification — and its own schema says, in as many words, that changing a level's meaning retroactively changes what every existing credential asserts.

The failure is concrete. If L4 requires 200 hours and two reviewers today and 500 hours and three in three years, an old credential still reads `CM-03-014 @ L4` and its `definitionRef` still matches — because the element did not move, the bar did. A verifier had no way to tell.

`assessmentPolicyRef` now hashes the whole level entry. Not a projection: every field in it is a rule that had to be satisfied, and `descriptor` carries the level's generic meaning exactly as an anchor carries the element's. proficiency.yaml is steward-controlled and rarely edited, so drift should be rare — and when a steward does edit it, being made to confront the effect on existing credentials is the correct outcome rather than an inconvenience.

The question a credential now answers is the stronger one: not merely *what did L4 mean*, but **what rules had to be satisfied for this to be issued**.

#### A signer's own standing must be evidenced too

Decision 47, same review. `heldLevel: 4` and `credentialedReviewer: true` were assertions. In a system whose entire premise is replacing an unevidenced claim about a candidate, resting on an unevidenced claim about the signer is the same failure wearing a lab coat — "trust me, I'm an L4 reviewer" is not better than "trust me, he's competent".

A signer may now carry `authority`: references to their own credentials, by id and content hash, distinguishing `held-level` from `reviewer-authority`. A verifier can then establish offline that the DID holds the credential, that it covers this element at or above the required level, that it was valid at signing, and that the signer had reviewer standing.

Warned rather than rejected today, because no credentials exist to reference and a founding-cohort signer holds none by definition — the warning names the gap on every credential until the engine can close it. It becomes an error at Phase 6.

#### Append-only IDs guarantee resolution, not meaning

Decision 39, added after external architectural review.

Rule 1 has always said that IDs are append-only, and it has always been read as though that made a credential permanently interpretable. It does not. **An immutable identifier guarantees that `CM-03-014` always RESOLVES. Nothing in it guarantees that `CM-03-014` always MEANS the same thing.**

Anchors get rewritten as practice moves. Ceilings get revised. A BOK section gets substantially rewritten when a standard changes. None of that is prevented by an append-only ID, none of it was recorded, and the consequence is concrete: `CM-03-014 @ L4` earned in 2027 and the identical string earned in 2030 could attest materially different competence, with no artifact anywhere capturing the difference. A verifier reading the older credential would silently apply the newer meaning.

Every credential therefore pins, at issue:

- **`definitionRef`** — a hash of the element definition projected to the fields that carry meaning for the attested level: `kind`, `levelCeiling`, `demonstration`, and the anchor for that level. Editorial fields are excluded deliberately, because if a typo fix produced a drift warning the signal would become noise and reviewers would learn to ignore it.

  `demonstration` was missing from the projection until an adversarial review of the pin found it. Flip an element from `desk` to `equipment` and leave the anchor alone: the hash still matched, so a verifier read *definition unchanged* while what counts as admissible evidence for that claim had inverted. `status`, `roleTargets` and `prerequisites` are still out, each for its own reason — status is checked at issue and pinning it would make a routine promotion or a deprecation read as drift on credentials already issued; role targets say what roles need rather than what this person did, and gap analysis must read today's; prerequisites are the preparation graph, and somebody who met the anchor met it whatever route was recommended.
- **`knowledgeSnapshot`** — the BOK sections the element pointed at, pinned by content, so a reader knows what the claim rested on and not merely what was claimed.

**Hashes rather than version numbers**, because a version number depends on somebody remembering to increment it, and the failure mode of forgetting is silent.

**Drift is not invalidity, and this is the part most likely to be implemented wrongly.** A credential whose pin no longer matches the current corpus is not false. It remains exactly true of the definition in force when it was earned. What drift means is that a reader must be shown the definition *of that time* rather than today's. It is reported as a warning for that reason — treating it as an error would punish a holder for a change somebody else made years later, which is precisely the harm the append-only rule exists to prevent.

#### Why ECDSA P-256 and not Ed25519

Ed25519 is the Verifiable Credentials ecosystem default and is a better curve by most engineering measures. The deployments this must support require **FIPS-validated cryptographic modules**, and ECDSA over P-256 is specified in FIPS 186-5 with the curve in SP 800-186, so it is supported by validated modules in a way Ed25519 generally is not.

**The wording matters and was previously wrong here.** FIPS 140-3 is a *cryptographic module* validation standard, administered through the CMVP; it does not designate an algorithm or a curve as approved. Choosing P-256 does not make this application FIPS-validated. What it does is keep the signing operation inside the set of algorithms a validated module can perform, which is the necessary condition. **The project must still name the validated module or library that performs the signing** — that remains open, and it belongs in the compliance package rather than in a curve choice.

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
| `skill` | I can perform this | A work product they produced. An account of how it would be done cannot substitute. |
| `judgment` | I can decide about this and defend it | A defence. There is often no single right answer. |

A uniform evidence ladder across all three tests the wrong thing for at least two of them, which is why the classification has to exist before Phase 2 designs the ladder. **If an element genuinely needs two kinds of evidence, that is a sign it should be two elements.**

**What cannot substitute for a skill is description, not writing.** This row said "a written answer cannot substitute" until an adversarial review of the schemas caught it, and it was over-constrained in the same direction as the `skill`/bench conflation: a written artifact is very often the performance itself. An uncertainty budget is a work product. So is a procedure, and so is a validation report. What cannot stand in is explaining how one *would* be produced — that is a knowledge claim wearing a skill's clothes. The wording mattered because the open-resource parameterized items that the Personal edition can host offline are written by construction, and a strict reading of the old sentence disqualified the only evidence modality available to somebody assessing a desk skill without a laboratory.

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

**IDs are append-only.** `content/competence/taxonomy/domains/*.yaml` and `content/competence/taxonomy/id-registry.lock` may grow. Nothing in them may ever be renamed or removed.

Once a credential attests competence in `CM-03-014`, that identifier must resolve to the same element permanently. Rename it and you have silently invalidated somebody's evidence of their own competence, with no way to repair it. Elements that turn out to be wrong, redundant, or badly scoped are **deprecated and superseded**, never deleted.

CI enforces this. Stewards may not waive it. See [`../GOVERNANCE.md`](../GOVERNANCE.md).

---

## Open items

1. **Tier-2 quotation limits** — set at ≤25 words, ≤2 per source per element. Requires confirmation by counsel before Phase 4 authoring. Entries needing review are flagged `CONFIRM-WITH-COUNSEL` in the source register. Citations are unaffected.
2. **Public GitHub remote** — created at `RECamerino/metrology-competence-system`, with the taxonomy viewer published to Pages. Each push remains a separately authorised action.
3. **Commons operation** — the software will be built; whether the project *operates* a public instance (PII custody, moderation, funding) is deferred governance.
4. **Authority-tier issuer** — a neutral foundation as issuer of last resort is the strongest long-term credential but needs people and funding. Roadmap, not a dependency.
5. **Recertification defaults** — per-level defaults proposed in `content/competence/taxonomy/proficiency.yaml` (L3 60 months, L4 48, L5 36; none below L3). Per-domain overrides remain open: a `CM-21` element ages far faster than a `CM-02` one, and `volatility` is the field that should drive it.
6. **Experience-hour thresholds and waiting periods** — proposed per level in `content/competence/taxonomy/proficiency.yaml` (L3 40h/30d, L4 200h/180d, L5 1000h/365d). The attribution rule is settled as decision 37; the numbers themselves are a steward judgement and have not been tested against a real career history.
7. **Skeleton scale** — resolved. Landed at 2232 elements across 257 areas and 43 domains, against a 2000+ target.
