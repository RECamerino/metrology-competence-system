# Authoring Playbook

The operating manual for adding content to the corpus. Follow it exactly; where it is prescriptive, the prescription is load-bearing.

> **Why this document exists.** The taxonomy, schemas, and rules were designed once, deliberately, with the full context of the project in view. Authoring happens later, at volume, and possibly by a different author — human or model — who does not carry that context. Quality degrades when an author has to *invent structure*; it holds when the structure is fixed and the author fills it. This playbook plus the frozen schemas plus CI remove the inventing.

---

## Before you write anything

1. `npm run validate` must be green on a clean checkout. If it is not, fix that first — you cannot tell your errors from pre-existing ones otherwise.
2. Read [`00-context.md`](00-context.md). Especially the parts explaining *why* proctoring is gone and *why* IDs are append-only.
3. Read two or three gold reference elements (`authoring.goldReference: true`). They are the bar.

---

## The rules that CI enforces

These fail the build. They are not style guidance.

| Rule | What fails |
|---|---|
| Every element has ≥1 clause-level citation | `citations: []` or absent |
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

## Adding an element

### 1. Register the ID first

Add the stub to `content/taxonomy/skeleton.yaml` under the right competency area:

```yaml
- id: CM-03-014
  title: Correlated input quantities in an uncertainty budget
  levelCeiling: 5
  status: draft
```

Then:

```bash
npm run registry:sync
```

Commit the lock-file change alongside the skeleton change, so the ID addition is visible in review.

**Choosing `levelCeiling` honestly.** Most elements top out at 3. Reserve 4 for elements with real practitioner-level depth, and 5 for elements where genuine expert practice exists — where a person could plausibly spend a career and still be learning. Inflating ceilings manufactures depth that is not there and creates assessable units nobody can write items for.

### 2. Write the file

`content/elements/CM-03/CM-03-014.md`:

```markdown
---
id: CM-03-014
title: Correlated input quantities in an uncertainty budget
domain: CM-03
competencyArea: CM-03-A02
status: draft
summary: >-
  Why input correlations matter, when they are safe to ignore, and what
  happens to a combined standard uncertainty when they are wrongly assumed
  away. Under-reported uncertainty from ignored correlation is one of the
  most common defects found in laboratory budgets.
levelCeiling: 5
anchors:
  1: >-
    Recognises that inputs may be correlated and can name a concrete example,
    such as two instruments calibrated against the same reference standard.
  2: >-
    Identifies likely correlations in a budget they have been given, and can
    explain why the standard independence assumption does not hold there.
  3: >-
    Constructs a budget including a covariance term, selects an appropriate
    correlation coefficient, and states the basis for that selection.
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
prerequisites:
  - CM-03-008
relatedElements:
  - CM-05-021
  - CM-15-004
authoring:
  createdOn: "2026-08-08"
---

Prose body: the explanation, worked examples, equations, failure modes.
```

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
