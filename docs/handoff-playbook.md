# Authoring Playbook

The operating manual for adding content to the corpus. Follow it exactly; where it is prescriptive, the prescription is load-bearing.

> **Why this document exists.** The taxonomy, schemas, and rules were designed once, deliberately, with the full context of the project in view. Authoring happens later, at volume, and possibly by a different author — human or model — who does not carry that context. Quality degrades when an author has to *invent structure*; it holds when the structure is fixed and the author fills it. This playbook plus the frozen schemas plus CI remove the inventing.

---

## Before you write anything

1. `npm run validate` must be green on a clean checkout. If it is not, fix that first — you cannot tell your errors from pre-existing ones otherwise.
2. Read [`00-context.md`](00-context.md). Especially the parts explaining *why* proctoring is gone and *why* IDs are append-only.
3. Read two or three gold reference elements (`authoring.goldReference: true`). They are the bar. **None exist yet.** The flag is evidenced rather than declared — an element earns it by carrying reviews that cover every attainable level — and creating the set is Phase 3 work. Until then the worked references in CLAUDE.md's schema-probe table are the nearest thing to a bar.

---

## The rules that CI enforces

These fail the build. They are not style guidance.

| Rule | What fails |
|---|---|
| Every element has ≥1 clause-level citation | `citations: []` or absent |
| Every element reaches the knowledge behind it | `knowledgeRefs` absent, or pointing at an article or section that does not exist |
| Every BOK section is reachable | A declared section with no `{#sNN}` anchor, or an anchor with no declared section |
| A deprecated section points forward | `deprecated: true` with no `supersededBy` |
| Every cited source is in the register | Citation to an unregistered `sourceId` |
| Quotations respect their source's tier and limits | Tier 3 quoted at all; over word cap; too many per element; restricted quote without commentary |
| Every attainable level has an observable anchor | `anchors` missing any level from 1 to `levelCeiling` |
| Every role has a rating | `roleTargets` missing any role in the registry — use `null` for not-applicable |
| Ratings do not exceed the ceiling | A role targeting level 5 on a ceiling-3 element |
| The element matches its skeleton stub | `levelCeiling`, `domain`, or `competencyArea` disagreeing |
| Prerequisites resolve and are acyclic | Dangling reference, self-reference, or a cycle |
| IDs are append-only | Any ID in the lock file missing from the skeleton |
| New IDs are recorded | Skeleton IDs absent from the lock — run `npm run registry:sync` and commit |

---

## Two trees, and which one you are writing in

Before anything else, know which artifact you are producing. They are different documents with different jobs, and conflating them is the mistake decision 38 exists to prevent.

| | `content/bok/` | `content/competence/elements/` |
|---|---|---|
| Answers | What is true about this subject | What must a person be able to do |
| Written for | A reader looking something up | An assessor deciding if someone can do it |
| Sized by | Subject coherence | One assessable claim |
| Carries | Explanation, worked examples, failure modes | `kind`, `levelCeiling`, `anchors`, `roleTargets` |
| Never carries | Levels, roles, anchors | Teaching material |
| Ages when | A standard is revised | Professional practice moves |

**Write the article first.** An element must point at the reference material through `knowledgeRefs`, and CI requires at least one. That ordering is deliberate: knowledge before the claim that somebody has mastered it. An element nobody can prepare for is not assessable.

---

## Adding a BOK article

`content/bok/CM-03/correlation-and-covariance.md`. See `BOK-0001` — it is the worked reference for this format.

```yaml
---
id: BOK-0001
title: Correlation and covariance in uncertainty budgets
subjects: [CM-03, CM-05]      # subject matter does not respect the taxonomy
status: draft
summary: >-
  What the article covers and what it is for.
sections:
  - id: s01
    heading: Why inputs become correlated
    covers: >-
      What a reader will actually find here — written for someone arriving
      cold from a credential eight months later, not for the author.
citations:
  - source: JCGM-100-2008
    clause: "5.2.2"
---

## Why inputs become correlated {#s01}
```

**Every declared section needs a matching `{#sNN}` anchor in the body, and every anchor needs a declared section.** CI checks both directions. A declared section with no anchor is a reference that resolves to nothing; an anchor nobody declared is a heading that will get renamed by someone who cannot see anything depends on it.

**Section ids are append-only.** Add them freely; never reuse one for different content, and never renumber. An element's `knowledgeRefs` and a reader's bookmark both resolve through them. To retire one, set `deprecated: true` and `supersededBy` — CI requires the forward pointer, because a reader following an old link must land somewhere that tells them what changed.

**Size sections by what someone would come back for.** The test is not "is this a tidy heading" but "if a practitioner forgot this one thing, would this section be where they land?"

Then `npm run registry:sync` — BOK ids share the append-only lock with taxonomy ids.

---

## Adding an element

### 1. Register the ID first

Add the stub to the domain's file in `content/competence/taxonomy/domains/` — one file per domain — under the right competency area's `elements:` list:

`content/competence/taxonomy/domains/CM-03.yaml`:

```yaml
      - id: CM-03-A05
        title: Combining and Propagating Uncertainty
        elements:
          # …
          - { id: CM-03-053, title: "Correlated input quantities and covariance terms", kind: skill, levelCeiling: 5, status: draft }
```

`kind` and `levelCeiling` are governed by `tools/kind-plan.json` and `tools/ceiling-plan.json` and applied across files by `node tools/apply-kinds.ts` / `node tools/apply-ceilings.ts`. Set them there, not by hand — the tools refuse to run if an area is unplanned, which is how a forgotten element gets caught.

Then:

```bash
npm run registry:sync
```

Commit the lock-file change alongside the skeleton change, so the ID addition is visible in review.

**Rating `roleTargets` — the question is narrower than it looks.**

A roleTarget is the **minimum level that role needs, IF this element is part of their work**. It is not a claim that the element *is* part of their work. Applicability comes from the person's deployment scope, and an element outside scope produces no gap at all.

So rate it conditionally. "What would a calibration engineer need here, supposing this were in their scope?" — not "do calibration engineers usually do this?" The second question is not yours to answer and the answer differs by employer.

Use `null` only where the element could **never** be part of that role's work in any deployment. `metrology-technician-i` on uncertainty-budget construction is null, because that role does not evaluate uncertainty independently anywhere. `calibration-engineer` on relativistic geodesy is **not** null — it is a genuine requirement for an engineer whose scope includes it, and irrelevant to everyone else, which scope already handles.

The commonest error will be using null as a soft "probably not relevant". That silently removes the requirement for everyone, including the person for whom it was the whole job.

**Decide null against the element's L1 anchor, not against its title.** This is the rule that actually resolves the hard cases, and it was missing until eight elements were authored against it.

The difficulty is real. `metrology-technician-i` is defined as not evaluating uncertainty independently. Read against the *title* of an element like *Assigning a rectangular distribution*, that looks like null. Read against its **L1 anchor** — *given a source statement already identified as a stated limit and told the shape to assign, produces the standard uncertainty* — it plainly is not: that is a technician applying an existing budget, which the role does every day. The title describes the element at its ceiling. The roleTarget question is about the floor.

So: **null means the role could not perform what the L1 anchor describes, in any deployment.** If it could, the target is 1. Nothing in between is available, and reaching for null because the element's upper levels are out of reach is the same error as using null for "probably not relevant" — it removes the requirement at *every* level, including the one the role genuinely needs.

`kind` is a strong heuristic once you look at it this way, and it is worth knowing why:

| `kind` | What L1 typically asks | Effect on null |
|---|---|---|
| `skill` | A supplied-step performance — values given, target pointed out | Reachable by more roles than the title suggests. Null is **rarer** than it looks |
| `judgment` | Still a decision under ambiguity, even framed | A role defined as not exercising independent judgement in that area is null **at every level**. Null is **commoner** |
| `knowledge` | An explanation of something framed for them | Usually reachable; null is rare |

Worked from the CM-03 set, for `metrology-technician-i`: `null` on `CM-03-019`, `040` and `046` — all `judgment`, all of whose L1 anchors are decisions the role does not make. `1` on `CM-03-036` and `038` — both `skill`, both of whose L1 anchors are steps performed inside a budget somebody else built. And `null` again on `CM-03-050`, `051` and `056`, not because they are hard but because deriving or estimating a sensitivity coefficient is *constructing* a budget rather than applying one, which the role excludes at any level.

That last group is the point of the rule. Two of those three are `skill` elements with perfectly ordinary L1 anchors, and the heuristic still gives null — because the question was never the anchor's difficulty, it was whether the role does that kind of work at all.

**Expect foundational elements to come out uniform, and do not manufacture variation.** `DP-08-081`, `DP-08-094` and `DP-08-064` each carry `2` for all twelve roles. That is the honest answer: where a ceiling-2 foundational element is in a person's scope, no role needs less than the ceiling — a technician who cannot separate resolution from accuracy should not be reading a meter, and an assessor who cannot is not assessing — and no role can be `null`, because there is no deployment in which the element could never apply if the domain is in scope at all. Twelve identical ratings looks like a filled-in form and is not. Spreading them to look considered would be inventing a requirement gradient that does not exist.

Two consequences worth knowing. Across the 443 foundational elements this is roughly 5,300 near-constant ratings, which makes them the easiest chunk to generate and check mechanically. And it is an argument — recorded, not acted on — that the schema might want an element- or area-level default with per-role overrides, rather than twelve mandatory ratings on every element.

**Choosing `levelCeiling` honestly.** Most elements top out at 3. Reserve 4 for elements with real practitioner-level depth, and 5 for elements where genuine expert practice exists — where a person could plausibly spend a career and still be learning. Inflating ceilings manufactures depth that is not there and creates assessable units nobody can write items for.

### 2. Write the file

`content/competence/elements/CM-03/CM-03-053.md`:

```markdown
---
id: CM-03-053
title: Correlated input quantities and covariance terms
domain: CM-03
competencyArea: CM-03-A05
kind: skill
status: draft
summary: >-
  Why input correlations matter, when they are safe to ignore, and what
  happens to a combined standard uncertainty when they are wrongly assumed
  away. Under-reported uncertainty from ignored correlation is one of the
  most common defects found in laboratory budgets.
levelCeiling: 5
anchors:
  1: >-
    Given a budget in which two inputs are traceable to the same reference
    standard, flags the pair as correlated rather than carrying them as
    independent.
  2: >-
    Adds a covariance term to a supplied budget for an identified pair, using
    a correlation coefficient they have been given, and shows what it does to
    the combined standard uncertainty.
  3: >-
    Constructs a budget containing a covariance term, selects the correlation
    coefficient, and states the basis for that selection.
  # … through levelCeiling
roleTargets:
  metrology-technician-i: null
  metrology-engineer: 3
  principal-metrologist: 5
  # … every role in the registry
citations:
  - source: JCGM-100-2008
    clause: "5.2.2"
    relevance: >-
      Gives the general expression for combined standard uncertainty with
      correlated inputs, which the whole element builds on.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
knowledgeRefs:
  - article: BOK-0001
    section: s03
    relevance: The covariance term and how to lay it out in a budget table.
  - article: BOK-0001
    section: s04
    relevance: Where the correlation coefficient comes from.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "JCGM 100:2008"
  lastVerified: "2026-08-09"
prerequisites:
  - CM-03-048
relatedElements:
  - CM-03-054
  - CM-03-055
authoring:
  createdOn: "2026-08-09"
---

Short body: notes for assessors and item authors about how this claim is
tested. NOT the explanation — that lives in the BOK article above.
```

**`knowledgeRefs` is required, and points at sections rather than whole articles.** The person following it is usually not learning the subject from scratch; they demonstrated this competence months ago and have forgotten one detail. Send them to the passage, not the article.

**The anchors above are performance, not understanding, because `kind` is `skill`.** "Recognizes that inputs may be correlated" would be a knowledge anchor and wrong for this element — see [Write the anchors to match the element's kind](#write-the-anchors-to-match-the-elements-kind).

### 3. Validate

```bash
npm run validate
npm run report:coverage
```

---

## Writing quality bar

**The reader has references and an AI assistant open.** A definition they can look up adds nothing. Write what those cannot give them:

- **Why it matters.** What breaks when this is done wrong.
- **Where it bites.** The specific situations where practitioners get caught.
- **What people get wrong.** Common defects, and why they are tempting.
- **Where sources disagree.** ASME Y14.5 and ISO GPS diverge; VIM3 and colloquial laboratory usage diverge. Those divergences cause real disputes, and naming them is high-value content.

**Anchors describe what someone can be observed to do**, for *this specific element*.

| Bad | Good |
|---|---|
| "Understands uncertainty budgets" | "Constructs a budget for a multi-parameter measurement, identifies correlated inputs, and defends the coverage factor chosen" |
| "Familiar with 17025" | "Locates the clause governing a given laboratory practice and explains what evidence an assessor would expect to see for it" |
| "Expert in GD&T" | "Interprets a composite position tolerance with a datum reference frame and specifies an inspection method that measures what the callout actually controls" |

If you cannot write an observation for a level, that level does not exist for this element. Lower the ceiling.

---

## Citation and quotation rules

**Cite against a specific edition.** `ISO/IEC 17025:2017 §7.6.1` is a reference; "ISO 17025 section 7.6" is a guess. Clause numbering moves between editions.

**Write your own prose.** A paraphrase that tracks the source clause by clause is a copy in disguise, and no validator can catch it.

**When in doubt, cite rather than quote.** A citation is always safe.

**Never reproduce figures, tables, or diagrams** from a restricted source, under any tier. The word limits govern text only. Describe the figure in your own words and cite it by number. This matters most in `DP-01`, where GD&T is intensely figure-dependent.

**Tier 3 elements should be *more* substantive, not less.** The reader has no quoted text to fall back on, so your explanation carries all the weight.

**Do not author quotations against a source flagged `CONFIRM-WITH-COUNSEL`** in the register until that review is complete. Citations are unaffected.

Full policy: [`source-license-register.md`](source-license-register.md).

---

## Assessment items

*Full item schemas land in Phase 2. The design constraints are fixed now and will not change.*

Every assessment is **open-resource**. There is no proctoring anywhere in this system. **An item a competent person can answer by looking it up, or by pasting the prompt into an AI assistant, is a defective item and will be rejected.**

Preferred types, in order:

1. **Parameterized worked problems** — ship a parameter generator and a deterministic scoring function so every candidate gets different numbers. Auto-scored with tolerance bands and unit checking.
2. **Error-finding** — a flawed uncertainty budget, procedure, or certificate to diagnose.
3. **Scenario judgment** — a defensible-or-not call requiring justification.
4. **Data-driven analysis and interpretation.**
5. **Position-and-defend.**
6. **Multiple choice** — only for genuine terminology and convention checks.

Every non-auto-scored item ships with its rubric in the same commit.

---

## Write the anchors to match the element's kind

**Full guidance, with the four axes a level progression actually moves along, is in [`anchor-template.md`](anchor-template.md).** Read it before writing your first set. What follows is the short form.

Every element declares a `kind`. It is not decoration — it says what evidence proves attainment, so it governs how the anchors must be written.

| Kind | Anchors describe | Anchors must not describe |
|---|---|---|
| `knowledge` | What the person can explain, relate, analyze, or distinguish | Performing a task |
| `skill` | What the person can be observed producing or doing | Understanding the theory behind it |
| `judgment` | What decision the person makes under ambiguity, and how they defend it | Recalling the rule that decides it for them |

The commonest error is writing knowledge anchors for a skill element. "Understands the effect of stylus geometry on a measured form error" is a knowledge anchor. If the element is `skill`, the anchor must be closer to "selects and qualifies a stylus for a given feature, and demonstrates that the result is insensitive to the choice."

If you cannot write an anchor of the declared kind, the kind is wrong — fix `tools/kind-plan.json` rather than bending the anchor.

## Competence is not authorization

Nothing in this corpus grants anyone permission to do anything.

An element attests that a person knows, can do, or can judge something. It never attests that they are *allowed* to. Authorization — signing a certificate, releasing a result, approving a method — is granted by an organization, scoped to specific work, and revocable at will. It requires competence as evidence and is never implied by it.

Write elements accordingly. `CM-11-A05` covers what an approved signatory must be competent in; it does not make anyone a signatory. Where an element touches an authority, say plainly that the authority is conferred elsewhere.

## Knowledge currency

Every element declares what kind of claim it makes and how fast that claim ages, in a `currency` block. This is what stops the corpus rotting silently.

```yaml
currency:
  authorityStatus: historical      # see the schema for all seven values
  volatility: controlled
  sourceRevision: "Z540.3-2006 (R2013)"
  lastVerified: "2026-08-09"
  note: >-
    Withdrawn as an active standard in October 2020. Retained because it is
    still invoked by contract in US defence and aerospace work.
```

**The distinction that matters most is `normative` versus `historical`.** A withdrawn standard reads exactly like a live one unless something says otherwise, and a reader who cannot tell them apart will comply with the wrong thing. Where an element covers a withdrawn requirement, it must keep three things visibly separate:

1. what the standard historically required,
2. where it still binds — usually through a contract that names it,
3. what the current framework asks for instead.

`ANSI/NCSLI Z540.3` is the type case: withdrawn in 2020, superseded in general by the ISO/IEC 17025 decision-rule framework, and still contractually mandatory in a great deal of defence work. All three of those are true at once.

**Historical content is never deleted.** Content is created, not destroyed. Someone credentialed against an element must always be able to see what they were assessed on — deprecate, mark, and point forward with `supersedes` / `supersededBy`.

`volatility` drives review cadence, so set it honestly. `controlled` means review is triggered by a published revision rather than by a calendar; a new edition of ISO/IEC 17025 should wake up every element that tracks it.

## Vocabulary belongs to its framework

Sector vocabularies are not metrology vocabulary and must never be presented as though they were. Repeatability, reproducibility, bias, linearity, stability and resolution all mean different things in AIAG, VDA, ISO and laboratory practice.

Name the framework you are speaking in — "in the AIAG sense" — and where it diverges from VIM and GUM usage, say so explicitly. An organization-agnostic BOK that quietly adopts one sector's dialect as the truth has failed at its own premise. `CM-07` carries this constraint in its area summary; it applies everywhere.

## Things that will get a change rejected

- An element with no citation.
- Quoted text from a Tier 3 source, or over a Tier 2 limit.
- An anchor that describes knowledge rather than observable behaviour.
- A `levelCeiling` of 5 on an element where no expert practice plausibly exists.
- Renaming or deleting an ID. **Deprecate and supersede.**
- Content that steers readers toward a particular vendor, service, or commercial training provider. The corpus is organizationally agnostic.
- A reproduced figure or table from a restricted source.
- Prose that reads as a paraphrase of a standard's clause sequence.
- An assessment item answerable by lookup.

---

## Gold reference elements

*Authored in Phase 3, before content authoring begins at volume.*

Twenty to thirty elements spanning the hardest domains, marked `authoring.goldReference: true`. They are the quality bar and the few-shot reference for later authoring. They are reviewed to a higher standard and changed reluctantly.

**Both of those are now executable, and they cost more than they read.** The flag is refused unless the element names its `authoring.authors` and EVERY attainable level is covered by a current `technical` or `assessment` review, accepted, by somebody who is not an author **and carrying a recorded `standing`**. The last of those is satisfiable today with a `stated` basis — a sentence or two saying what the reviewer's standing actually is — because nobody holds a credential yet and the founding cohort convenes nobody. It asks for the case to be written down, not for standing nobody can currently hold. So the review effort is proportional to the ceiling rather than to the element: twenty-five elements at ceiling 4 is a hundred level-reviews, not twenty-five sign-offs. And because each review pins the level by the same hash a credential's `definitionRef` uses, **rewriting an anchor lapses the gold status until somebody reviews it again** — which is what 'changed reluctantly' turns into when it stops being an instruction and starts being a check. Plan the reviewer time before picking the elements.

When they exist, this section will list them by ID. Until then, this document plus the schemas are the specification.

---

## Command reference

```bash
npm run validate          # schema + integrity checks — must be green
npm run report:coverage   # where the corpus is thin
npm run report:quotes     # complete quotation manifest for legal review
npm run registry:sync     # append new IDs to the lock file
npm test                  # guardrail tests
npm run typecheck
```
