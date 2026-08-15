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
| 23 | Dual custody, **recorded on the credential** | ISO/IEC 17025 §6.2 requires the laboratory to hold competence records for audit; the individual needs portability. Both hold a true copy; neither can erase the other's. The `custody` array names who holds a copy and under what retention obligation — see below, because for a while this was a sentence in a schema description and nothing else. |
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

#### The cross-organizational rule rested on string inequality

Decision 27's anti-collusion controls include, at L5, "at least one signer outside the candidate's own organization, so that a closed group cannot certify its own experts." The organization was a free-form string, so the rule was worth exactly as much as `!==` between two things somebody typed.

Two colleagues at one laboratory writing **"Northfield Calibration"** and **"Northfield Calibration Ltd"** satisfied it. That is the worst shape a defect can take: it looks like a formatting difference and works like an evasion, so it can be done deliberately with complete deniability and accidentally by anybody.

`organizationRef` replaces the string with `{ name, id? }`, and the comparison now runs in three layers with the validator reporting which one decided:

1. **`id`** settles identity. Two organizations are the same iff their identifiers are — this also catches a *rename*, which no amount of name-matching can.
2. **Normalised `name`**, when no identifier is present: case, punctuation and trailing legal suffixes collapse, so the example above is one organization. Only *trailing* corporate form is stripped, so "Co-ordinate Metrology Services Ltd" keeps its first token.
3. **Neither.** A name that identifies nobody — "Independent", "self-employed", "none" — is not an organization. Two signers declaring different flavours of unaffiliated are two unaffiliated people, and counting them as two organizations satisfied the rule while proving nothing at all about separation.

`id` is optional on purpose. Requiring one would mean a signer whose laboratory has never issued anything could not sign, which gates participation behind registration — the barrier this project exists to remove. The cost of that choice is that the comparison is sometimes nominal, and at L5 the validator says so rather than letting a name-matched result look like an identity-matched one.

**The limit, stated because it does not go away.** Normalisation catches the accidental variant and the lazy one. It does not catch an abbreviation, and it does not catch a laboratory that gives its two divisions different names. Only `id` closes that, and only where an identifier exists to be recorded. The rule is stronger than it was and is not absolute; what changed is that a reader can now tell which they are holding.

One case deliberately still passes: an unaffiliated signer **is** outside a named candidate organization. A consultant belonging to nobody is plainly not a member of Northfield, and rejecting that would gate L5 behind employment.

#### Dual custody had no field

Decision 23 above was true and unrecorded. A single credential object carried no note of who else held a copy, so "both hold a true copy" was a claim the data could neither express nor contradict — an adversarial review called it a comment rather than a protocol, and that was fair.

Two failure cases, and they are not symmetrical.

The one usually noticed: a person leaves, the laboratory purges its copy in a records clear-out, and the only surviving root is the individual's. Nothing in software prevents that — a file held by somebody else is beyond reach, and a mechanism pretending otherwise would be worse than the gap. What the `custody` array does is make it **nameable**: a verifier reading the holder's copy sees that Lab A took custody under an obligation running to a stated date, so the absence is a records-management failure with an owner rather than a silence.

The one that actually harms the holder, and had no answer at all: an organization issues a credential **about** somebody, retains it for its own audit file, and never delivers it. The person cannot prove a competence that has been formally attested about them. A `holder` entry naming the subject is now required, so that credential cannot be well-formed.

The organizational side is required exactly where an organization stands behind the credential — the `organization` tier and above. Below it there is no laboratory, no §6.2 obligation, and **single custody is the honest arrangement rather than a defect**. Requiring a second custodian on a self-study credential would be requiring an employer, which is the barrier the project exists to remove.

**Divergence between copies needed nothing.** Two copies differing in content cannot both verify, because every credential is signed; the cryptography settles it, and a content hash per custody entry would be a second and weaker answer to a question already answered. What a signature cannot detect is a copy that does not exist, and that is the only thing this array is for. Worth stating plainly, so the next reviewer does not add the redundant mechanism.

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

**And it left one question unanswered, which authoring eight elements at once exposed.** Decision 48 says what null claims. It does not say *what to read the claim against*, and there are two candidates that disagree: the element's title, which describes it at its ceiling, and the element's **L1 anchor**, which describes its floor.

The disagreement is not marginal. `metrology-technician-i` is defined as not evaluating uncertainty independently. Against the title *Assigning a rectangular distribution* that reads as null. Against the L1 anchor — *given a source statement already identified as a stated limit and told the shape to assign, produces the standard uncertainty* — it plainly is not, because that is a technician applying an existing budget. Two authors, both following decision 48 correctly, produce opposite ratings. At 5407 elements × 12 roles that is **64,884 ratings with no tie-breaker**, and the resulting gap analysis would be incoherent in a way no check could detect: every individual rating is defensible and the aggregate means nothing.

**Settled: null is decided against the L1 anchor.** Null means the role could not perform what the L1 anchor describes, in any deployment. If it could, the target is 1. There is nothing in between, and using null because the *upper* levels are out of reach is the original error in a new place — it removes the requirement at every level, including the one the role actually needs.

This makes `kind` a useful heuristic and explains a pattern that would otherwise look inconsistent. A `skill` element's L1 is usually a supplied-step performance, so null is **rarer** than the title suggests. A `judgment` element's L1 is still a decision under ambiguity however tightly framed, so a role defined as not exercising judgement in that area is null at every level, and null is **commoner**. The heuristic is not the rule, though: `CM-03-050` and `CM-03-051` are `skill` elements with ordinary L1 anchors and are still null for `metrology-technician-i`, because deriving a sensitivity coefficient is *constructing* a budget rather than applying one — which the role excludes at any level. The question was never the anchor's difficulty. It was whether the role does that kind of work at all.

The operational form is in [`handoff-playbook.md`](handoff-playbook.md), with the worked CM-03 ratings.

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
| 8 | ~12 reference roles, all data, fully org-overridable, each classified `occupational` or `authority-overlay` | The shipped set exists so the platform is useful on first run, not because these are the correct roles for anyone in particular. The classification is required because an overlay is a granted permission rather than a job, and listing the two kinds side by side unmarked made gap analysis report authority as competence. |
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

#### The role model was quietly undoing this

The split above is clean in the schemas — two objects, one portable and one not — and the role registry collapsed it anyway. `approved-signatory` sat beside `calibration-engineer` and `laboratory-manager` as though the three were the same kind of thing. Its own summary said otherwise from the start (*"a position of granted authority attached to a named scope, not a rank — commonly held alongside another role"*) and nothing acted on the words.

The operational consequence, from an adversarial review: gap analysis reports "short of L3 for approved-signatory" as a **competence** gap. A laboratory reading a dashboard concludes that closing those gaps is the route to signatory status — and it is not. The authority is granted by the laboratory, recognised at that laboratory for that scope, and ends on departure. The dual-object model exists to prevent exactly that inference, and the role model was inviting it one layer up.

**Every role now declares `roleType`.**

- `occupational` — a job, with a competence profile of its own. Gaps against it are deficiencies in the ordinary sense.
- `authority-overlay` — a permission carried on top of an occupational role. A person is *Calibration Engineer AND Approved Signatory*.

A deployment scope names an occupation in `role` and any overlays in `overlays`; an overlay in `role` is a validation error, because a scope whose only role is an overlay is the dashboard above. Overlay gaps are still computed and still real — the competence an authority presupposes is a genuine question — but every `Gap` carries `basis`, so a renderer showing the two identically has chosen to. What an overlay gap answers is *could this person be granted this*. What it never answers is *have they earned it*, because nobody earns an authority.

`approved-signatory` is the only overlay in the shipped set. Two classifications are worth seeing because they could have gone the other way: **technical-assessor** carries real authority — it can recommend withdrawal of an accreditation — and is `occupational` anyway, because the role has a competence profile of its own, the discipline plus assessment practice, which its own summary treats as two separate competencies. **metrology-trainer** is occupational for the same reason. The test is not *does it carry authority* but *does it describe a job*.

`roleType` is required rather than defaulted, because an organization replacing this registry with its own titles has to classify each one, and being made to decide is the point: the distinction is invisible until somebody is told it exists. That is the whole story of this finding — the words were in the file for months and no mechanism read them.

**Authorization becomes a first-class object in Phase 2**, distinct from a competency credential:

- granted by an organization, not earned by assessment
- scoped to specific activities, ranges or methods
- revocable immediately and unilaterally, with no appeal to competence
- expiring on departure, reorganization or scope change
- requiring competence as evidence, and recording which elements it relied on
- never exported into the portable wallet as though it travelled

`CM-11-A05` (Approved Signatory Competence) and the `authorities` field already on the role registry both anticipated this. Phase 2 makes it explicit.

## The viewer had to split, and why it could not lazy-load

The viewer was one self-contained HTML file, and that property is the point rather than an implementation detail: it opens from a file share or any static intranet host with no server, so a reviewer in an air-gapped environment gets the same artifact as everybody else. Rule 5 forbids fetching anything at runtime.

Self-contained plus no server means everything ships in the file, so size grows with the corpus. Measured rather than estimated: **96% of the page was data**, a stub element costs ~100 bytes and an **authored** element costs ~3.4 KB — a **34× multiplier applied to every element that gets written**. At 5,407 elements a fully authored single file projects to roughly **18 MB**. The growth is not the taxonomy; it is authoring succeeding.

**Lazy-loading fragments is the obvious fix and is ruled out by the promise, not by taste.** `fetch()` against `file://` is blocked by CORS in every current browser, so a lazy viewer works perfectly on the published site and breaks silently the moment somebody copies it to a USB stick — which is the distribution the design exists to serve. A failure that only appears in the air-gapped case is the worst possible shape for this project.

So the split is per **domain**, and every page stays whole:

| | |
|---|---|
| `index.html` | 64 domains with counts — **52 KB** |
| `<DOMAIN>.html` | one domain entire, areas and elements and authored detail — **40 KB mean, 68 KB largest** |

Against 655 KB for the old single file, and against 18 MB projected.

**The cost is that search and filter are per-domain rather than corpus-wide.** That is a real loss and it was weighed against how the thing is actually used: a reader goes to the discipline they work in — 64 to choose between, on one screen — and digs from there. Searching 5,407 elements at once was never how anybody navigated this.

CI now refuses to publish a page containing a `fetch`, an `XMLHttpRequest`, a script `src` or a stylesheet `link`. The constraint that makes the whole design work was previously honoured by discipline alone, and discipline is not a check.

## The taxonomy was missing an axis

Raised by a practising metrologist after the foundational work landed: there is nothing to mark off whether somebody can calibrate a generic oscilloscope, nothing for calibrating an RF passive device. Checked, and correct — but the diagnosis is not "some elements are missing".

**The corpus had two axes and both are measurement science.** `CM` organises by cross-cutting concept, `DP` by measured quantity. Neither is organised by *the work*. A technician's day is not "uncertainty, then traceability" — it is an oscilloscope, then a torque wrench, then an RF attenuator, and their competence is per equipment type. That axis did not exist.

**The proof was already in the corpus.** `DP-08-052` is titled *Oscilloscope **DC and timebase** calibration*. It was truncated to the parts that fit a DC and low-frequency electrical domain: bandwidth belongs to `DP-10`, jitter and time-interval to `DP-14`. Calibrating a scope is one job, and a quantity-organised taxonomy could only describe a third of it. An element cut down to fit the shelf it was put on is what a missing axis looks like from the inside — and the same applies to an RF attenuator, whose physics is `DP-10`, whose DC resistance is `DP-08`, and whose calibration is neither.

`EC` is the third axis, organised by the equipment type that arrives on a bench. It required widening the ID patterns in `common.schema.json`, a third `kind` on the taxonomy schema, and a third group in the generated docs and the viewer — all additive, and widening an ID pattern cannot invalidate an existing ID.

### The boundary that keeps EC from swallowing CM-06

An EC element is the competence to calibrate a class of equipment: what the parameters are, how they are measured, what standard is required, and where the job goes wrong.

It is **not** a restatement of `CM-06`, which owns calibration *methodology* — procedure design, adjustment decisions, certificates, as-found and as-left. `CM-06` says what as-found data is and why both are recorded; `EC` says what as-found data for an oscilloscope consists of.

**The test: an EC element that could be written without naming the equipment belongs in `CM-06` instead.**

**The pack is now built out: 21 EC domains, 203 equipment types, 2732 elements.** Every area follows one spine — receiving inspection, calibration configuration, standards and fixturing, then adjustment, uncertainty budget, conformity statement — wrapped around the parameters that make that equipment type distinct. The spine repeats because the job genuinely does. The parameters never repeat: no two of the 86 areas share a single parameter element, which is the mechanical form of the rule that an area whose parameters could be swapped for another type's has been written wrong.

Both examples that prompted this now resolve. Searching the viewer for *oscilloscope* returns 26 elements; *RF passive* returns 17, covering attenuation against frequency, return loss, coupler directivity, adapter removal, connector gauging and mismatch uncertainty — none of which existed anywhere in the corpus a day ago.

**The first pass missed things, and a metrologist reading it found them in minutes.** Fixture and custom-gauge calibration against a print — the commonest real calibration in a production environment — was absent entirely. Calibration kits and verification kits appeared only as *parameters* inside the VNA area, never as artefacts with a calibration of their own. Environmental chambers were one line inside a temperature-source area, with altitude and thermal-vacuum chambers missing outright. Fluid colour measurement — Gardner, Saybolt, Lovibond — did not exist. And long-scale DMM calibration was a single title where the actual work is a choice between direct, comparison and bridge methods with a Zener transfer.

That is the shape of the error to expect from a generated pass: the **spine** is reliable and the **coverage** is not. A whole equipment type going missing is invisible from inside the corpus, because nothing in it is wrong — there is simply nothing there, and no check can find an absence it was never told to look for. The second pass added 58 areas and 773 elements, which is a 65% increase on the first, and there is no reason to think a third pass would find nothing.

### The list has to reach the SI, not stop at the bench

A third correction, and the one that changed what the pack is for. An equipment list is only sufficient if it contains **every piece of calibration equipment needed to trace a measurement back to the SI** — not just the tier a technician touches.

The gap was structural and easy to miss because both ends existed. `DP` held the science of the standards: *Josephson effect and voltage standards*, *ITS-90 structure and defining fixed points*, *Microcalorimeters as primary power standards*, *Caesium beam and fountain clocks*. `EC` held the working instruments. **Nothing held the apparatus in between or above** — the torque transducer as a reference standard rather than a parameter inside the torque-wrench area, the force standard machine, the fixed-point cell as something you operate, the Josephson system as hardware somebody keeps running.

So the chain read: working instrument → *nothing* → SI realisation.

`EC` now carries three rungs in every discipline:

| Tier | Example in `EC-04` |
|---|---|
| Working instrument | Torque wrench and screwdriver calibration |
| Reference standard | **Torque transducer and reference torque standard** |
| SI realisation | **Torque standard machine**; **Kibble balance and primary mass dissemination** |

**The boundary against `DP` is the same one that keeps `EC` out of `CM-06`, one tier up.** `DP-08-002` is knowledge of the Josephson effect. `EC-01-A15` is the competence to run the cryogenic system, select the Shapiro step, detect a mis-biased array, and defend a calibration made with it. One is what the standard *is*; the other is whether this person can *operate* it.

### One EC pack per DP, as a test

The fourth correction was a counting argument: there should be as many equipment packs as there are disciplines, and there were 13 against 21.

The count is a crude test and it found five real holes. **Nanometrology, additive manufacturing, digital metrology and geodesy had no equipment pack at all** — four disciplines whose instruments nobody could be assessed on. And **magnetics** had one on paper only: `EC-13` claimed DP-11 and contained no gaussmeter, no fluxmeter, no permeameter, no magnetometer. Zero magnetics elements anywhere in the axis. A pack that claims a discipline and covers half of it is worse than an absent one, because the count looks satisfied.

Four packs were also carrying two disciplines each. Those split — flow out of pressure, humidity out of temperature, spectroscopy and fibre out of photometry — and **the moved areas kept their IDs**. `EC-14` contains areas numbered `EC-05-A05` and elements numbered `EC-05-1xx`, which looks wrong and is correct: rule 1 says an ID records where something was FIRST created, and the containing structure is what is authoritative.

That move exposed a bug of exactly the kind this session has been finding. `tools/apply-ceilings.ts` checked its overrides with `if (!area.startsWith(file.replace('.yaml','')))` — assuming an area lives in the domain file whose name its ID begins with. The project's own first rule denies that assumption, and the moment an area moved, the applier reported 31 perfectly correct overrides as typos. It now checks against every element the scan actually visited.

**Both passes were generated, and that is a risk worth naming.** IDs are append-only, so 1185 titles are now permanent. The parameter lists are drawn from ordinary calibration practice and the boundary rule was applied throughout, but a practising metrologist reading their own discipline will find titles they would have worded differently, and a few they would not have included. Correcting a title is free; withdrawing an element means deprecating it. **This wants a discipline-by-discipline review before anything is authored against it**, and the review is cheaper than it looks because a whole equipment type is thirteen to twenty lines in one file.

`EC-01-A01` — Oscilloscope Calibration, 26 elements — is the worked pattern, and the oscilloscope was chosen deliberately because it spans three quantity domains at once and so is the strongest available test of whether the axis is real. It is: none of those 26 elements can be placed in a single `DP` domain without losing part of the job.

Ceilings run mostly to 4, where the non-routine case — a scope that meets bandwidth on one channel and not the next — is where proficiency actually shows. Two reach 5: high-bandwidth work above 1 GHz, and timebase jitter, both of which support career-long learning and a defensible capstone.

### Scale, and why it is not a reason to decline

A typical accredited scope of accreditation runs to dozens or low hundreds of equipment types. At the density of the worked pattern that is well over a thousand elements, and this axis plausibly grows the corpus by half again.

That is what it costs to describe the work rather than the science. A competence system for calibration that cannot say *"this person can calibrate an oscilloscope"* is missing its most-used claim, and the three roles read it differently: the technician performs it, the engineer designs the method and the fixturing, and the metrologist has to understand it well enough to say whether the measurement was sound.

## The corpus started above where people start

Raised by a practising metrologist, checked, and correct.

`DP-08` — DC and Low Frequency Electrical Metrology, 52 elements — opened with *The ampere definition from the elementary charge* (L4) and *Josephson effect and voltage standards* (L5). It contained **no element for Ohm's law**, none for series or parallel circuit behaviour, and none for what a volt is. `CM-13-A05`, "Underlying Physics for Metrologists", covers thermal expansion, heat transfer, elasticity, fluid statics and wave optics — and has no electrical content at all, across four electrical discipline packs.

Every one of the 43 domains bottomed out at ceiling 3, because `tools/ceiling-plan.json` defined only L3, L4 and L5. There was no rung below Competent in the plan, so an element that genuinely tops out lower could not be expressed, and foundational content was therefore either inflated or — as actually happened — left out entirely.

### Why this was a defect and not a scope decision

A metrology BOK is not a physics textbook, and that would be a perfectly good reason to exclude circuit theory. Three things stop it being the reason here.

**Nothing declared the assumption.** A stated prerequisite is a scope decision. An unstated one is a gate, and *nothing gates entry* is the project's first principle.

**The role registry already contains the excluded person.** `metrology-technician-i` — "performs routine calibrations against documented procedures, under supervision" — is a first-class role requiring a `roleTarget` on every element, and there was no element pitched where they actually begin.

**It would have been decided 2232 times instead of once.** Every author reaching "what does `metrology-technician-i` need for *Cryogenic current comparator bridges*?" answers `null`, honestly. Repeat that across the corpus and the technician is written out one cell at a time — and the repair becomes thousands of edits rather than one structural change. The same deadline logic as `roleType`: **before role targets are authored at volume.**

### What it is not

It is not a lower tier of the same elements. L1 is already reachable on all 2245 — that was never the gap, and the level-range work that made L1 visible in the generated views does not address this. **L1 on a hard element is "can follow a supplied rule on a hard thing", which is not the same claim as competence in series-circuit behaviour.** The fix is elements, not levels.

### The shape

Each domain carries a foundational-knowledge area where one is appropriate, with **the same depth as any other area in that domain**, covering what personnel need to perform the work.

Scope is bounded by a checkable test rather than by anyone's view of what a technician ought to know: an element belongs if a technician doing supervised work in that domain needs it, **or** if an element elsewhere in the domain is unintelligible without it. Ohm's law passes both — `DP-08-021`, Wheatstone and Kelvin bridge techniques, is not comprehensible without it. Maxwell's equations fail both. The test also gives `prerequisites` somewhere to bottom out; that field could previously only point within the professional tier, so the graph had no floor.

Ceilings run lower here and that is the point. `DP-08-053` (charge, current, voltage and resistance as quantities) tops out at **L2**: applying a definition in a familiar situation and recognising an unfamiliar one is the whole competence, and there is no unsupervised novel-case practice above it. Ohm's law reaches L3 like anything else. Foundational does not mean shallow — it means the ceiling is set by the competence rather than by a floor in the plan.

**Training is authored per domain, not per element.** Foundational knowledge is learned as a block, and thirteen modules for thirteen fundamentals would be an administrative fiction rather than a teaching decision. One module per foundational area. Note the ordering constraint that already applies: a module needs `knowledgeRefs` into the BOK, and no BOK article covers electrical fundamentals yet, so the module follows the article rather than the taxonomy.

**Size it as a career, not a ramp.** For most people who will ever use this corpus the foundational area is not the route to the rest of the domain — it is the whole of it, and very few venture further. `DP-08-A07` is 48 elements against 52 for the entire professional remainder of the domain, and that ratio is the point rather than an overshoot. It has to carry somebody for twenty years.

**It comes first.** Display order follows array order in the YAML rather than the area ID, so the block sits at the top of `competencyAreas` while keeping its append-only `A07`. An entry section at the bottom of the domain is an entry section nobody finds.

**Split by instrument class and use case.** The first draft had one element called *operating a digital multimeter*, which spanned a 3½-digit handheld, a 6½-digit bench meter, an 8½-digit reference, a null detector and a nanovoltmeter — different instruments, different jobs, under a heading too broad for any item to be bound to it. Each class is now its own element, and the ceilings differ accordingly: a handheld reaches L3, a reference DMM and a nanovoltmeter reach L4, because a twenty-year technician is still better at those than a two-year one. Foundational is not shallow.

Every foundational area is titled **`Foundational Knowledge — <what it covers>`**. That is not decoration: it is one recognisable section repeated across 43 domains, and the first person to look for it searched the viewer for "Foundational" and found nothing, because the area had been given a descriptive name of its own instead.

`DP-08-A07` — Foundational Knowledge — Electrical Quantities and Circuits — was the worked pattern, and **31 domains now carry one: all 21 disciplines and 10 of the core**, 395 further elements.

Where they do not is a decision rather than an omission. `CM-01` and `CM-02` get none because they *are* the corpus's foundational layer; a tier beneath *What measurement is, and what it is not* would be inventing depth downward. Nine core domains get none because nobody's first day is measurement decision risk or AI in metrology — those are specialist practice reached from elsewhere, not disciplines somebody enters cold.

**No `EC` pack gets one either**, and that is the least obvious call. Equipment-family entry knowledge already exists in two places: the quantity fundamentals sit in the paired `DP` foundational area, and bench practice sits in `CM-06` *Calibration at the Bench* and `CM-12` *The Laboratory Environment and Bench Discipline* — both written in this pass with the equipment packs in mind. Twenty-one more foundational areas would have duplicated both, and duplication in a corpus this size is worse than absence because two copies drift.

The pass also produced seven duplicate element titles — four pre-existing `DP`/`EC` collisions where the same words described knowing a technique and performing it, and three introduced by the new areas. All seven were retitled, and the collision is now a standing check rather than something found by ad-hoc script. `checkDuplicateTitles` warns rather than errors: two identically titled elements are still distinct competences, but a reader handed one cannot tell which competence a credential names. Its own test caught a defect in it — the first version compared raw strings and would have missed a title differing only by a double space.

## Who owns a person's competency record

**The individual. Always, and without qualification.**

This has been true of every mechanism built so far and was stated in none of them, which is the kind of omission that gets decided by accident later — a dashboard in Phase 10 assuming it may read everything, and a principle discovered only when somebody objects.

**What the organization gets is substantial, and none of it is ownership.** A laboratory using this has an unusually strong instrument: competence evidence an auditor can verify rather than take on trust, a basis for assigning trainers and mentors to the people who will actually benefit, and a workforce gap picture computed against real deployment scopes instead of assembled from job titles. That is a better answer to ISO/IEC 17025:2017 §6.2 than a training matrix in a spreadsheet, and it is worth paying for. It is also entirely compatible with the record belonging to somebody else.

**What the individual carries is responsibility, not just possession.** Keeping the record current, seeking assessment, arranging the training or the bench time, deciding what to pursue next. Ownership without responsibility is a filing cabinet; the reason the record is the person's is that they are the one who has to act on it. An organization can require its people to use the system and can decline to employ somebody whose scope shows unclosed gaps — that is an ordinary employment decision. What it cannot do is hold, withhold, or extinguish the evidence.

### Where this is already encoded

Six mechanisms, none of which was designed with this section in front of it, all of which agree:

| Mechanism | How it carries the principle |
|---|---|
| `credential.portable` | `const true`, against `authorization.portable`'s `const false`. The competence travels; the permission does not. |
| `attempt-ledger.subject` | One ledger per person, *never* per organization — "the record has to follow the person between employers, or the no-retake rule resets every time they change jobs". |
| `credential.status` | Revocation is for fraud and assessment defect, explicitly **not** "for an employer who has fallen out with the holder: a competency credential records something that happened, and an organization cannot un-happen it". |
| `training-record` self-attestation | Learning may be self-attested where competence may not, because requiring a witness to *learn* would gate it behind an employer. |
| `credential.custody` | An organization holds a **copy** under a §6.2 retention obligation. Holding a copy for audit is not owning the record. |
| `deployment-scope` | The one artifact the organization does own — its statement of what this person's job covers — and deliberately a separate object from anything the person carries. |

### What follows, and is not built

Two consequences fall straight out of the principle and have no mechanism yet. Both are recorded in the open items.

**An organization's view of a person's record is a disclosure, not a read.** `computeGaps(elements, scope, held)` takes what the person holds as a plain map, with no record of where it came from or what was consented to. Decision 34 already built the consented, scoped, audit-logged disclosure model for accreditation assessors; the employer case — the workforce dashboard above — has nothing equivalent, and will otherwise assume it can see everything a person holds, including credentials earned elsewhere that are none of its business.

**Revocation is currently one-sided.** The issuer sets `status.revoked` and the subject has no way to contest it in the data. The intent is stated plainly, but `fraud` is unfalsifiable from the holder's side and the status list a verifier consults belongs to the issuer. Whether a holder's counter-statement travels with the credential is undecided.

### The claim this licenses, stated precisely

A signed, artifact-backed, offline-verifiable record that pins what each claim meant when it was earned is **stronger than a résumé on provenance** — not a self-report, not a title, not an employer's say-so that evaporates when the employer does.

It is **not yet stronger on validity**, which is open item 11: nothing so far establishes that an assessment measures the competence it names, or that L4 means the same thing across two laboratories and two assessors. A signature proves who stood behind a claim. It does not prove they were right.

Both halves have to be said together. The first is what makes this worth building; the second is what a metrologist will ask about first, and the project's credibility rests on having the honest answer ready rather than on the claim being bigger.

## Some elements have two evidence routes

Open item 10. Found by authoring `CM-03-051` — the sixth time authoring against the design has surfaced something reading the schema did not.

`demonstration: desk | equipment` is a single enum on the element, and it answers a question that sounds like it has one answer: is this competence observable with ordinary working tools, or does it need apparatus the learner may not be able to reach?

For most elements it does. Constructing an uncertainty budget is desk work; wringing a gauge block stack is not. Decision 45 and rule 11 both lean on this, and the reasoning is sound: telling somebody they are blocked on equipment access when they could sit the assessment tomorrow with a spreadsheet **invents a barrier**, and the project's position is that barriers inherent to the competence are real while invented ones are not.

**`CM-03-051` — numerical estimation of sensitivity coefficients — has two routes, and the standard contemplates both.** The coefficient is obtained by perturbing an input and observing the result. Where the model is a manufacturer's correction routine or a fitted surface, that is desk work. Where the model exists only as the instrument itself, the perturbation is applied to the physical instrument and the observation carries its measurement noise — which is bench work, and is the route JCGM 100 §5.1.4 describes most directly.

The competence is the same in both. What differs is the apparatus, and **which route is available is a property of the laboratory, not of the element.**

Forcing one value is wrong in both directions, and neither error is silent for the same person:

- **`equipment`** invents a barrier for every learner who could demonstrate this tomorrow against a routine. That is the failure rule 11 names explicitly, and it lands on exactly the person the Personal edition exists for — no employer, no bench, no budget.
- **`desk`** — the value the element currently carries — means a module preparing someone for the instrument route cannot list it in `requiresPhysicalDemonstration`, so a learner who will need access is told nothing about it. Rule 11's other half, hiding a real barrier.

**This is a schema-freeze question rather than a content one**, which is why it is recorded here rather than fixed. `demonstration` sits inside the definition pin — it was added to the projection when an adversarial review found that flipping `desk` to `equipment` left the hash matching while what counts as admissible evidence had inverted. That was the right fix, and its consequence is that **correcting this later reads as drift on every credential already issued against the element.** Cheap now; permanent after Phase 3.

Three shapes are worth weighing, and none is chosen here:

1. **Make it a set.** `demonstration: [desk, equipment]` — both routes admissible, and a module declares which one it prepares for. Most honest, and the largest change: every consumer of the field currently assumes a scalar.
2. **Keep the scalar as the *minimum* route** and let the module carry the rest. Smallest change; leaves the element unable to say that the harder route exists at all.
3. **Split the element.** Rejected on the reasoning already in rule 14 — one competence, two routes to evidencing it, and splitting would create two elements a person could hold separately for work that is not separate. It is not the *Oscilloscope DC and timebase* case; nothing here is truncated.

**Note the shape of the defect, because it is a repeat.** The element records the ambiguity in a YAML comment explaining why `desk` was chosen. A human reads that comment; no code does. That is open item 22 in [`../CLAUDE.md`](../CLAUDE.md) — `knowledgeRefs` proving a link resolves while proving nothing about coverage — appearing in a second field, and the two should probably be answered together: **the corpus has several places where an author knows something true about an element and has nowhere to put it that participates in anything.**

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
8. **Consented disclosure to an employer** — an organization's view of a person's record is a disclosure, not a read, and there is no model for it. Decision 34 built one for accreditation assessors; the workforce gap dashboard has nothing. Follows from [Who owns a person's competency record](#who-owns-a-persons-competency-record). Needs a schema before Phase 9 or 10 settles it by default.
9. **A holder's counter-statement to revocation** — the issuer can revoke and the subject cannot contest it in the data. Pairs with the trust-registry and status-list work.
10. **`demonstration` is a scalar, and for some elements the evidence route is not** — see [Some elements have two evidence routes](#some-elements-have-two-evidence-routes). A schema-freeze question, not a content one.
7. **Skeleton scale** — resolved. Landed at 2232 elements across 257 areas and 43 domains, against a 2000+ target.
