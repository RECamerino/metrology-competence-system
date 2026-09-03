---
id: BOK-0009
title: Accuracy ratio rules, their withdrawal, and where they still bind
subjects:
  - CM-08
status: draft
summary: >-
  What the 4:1 ratio and the 2 % false accept risk requirement actually asked
  for, what they assumed, why the standards carrying them were withdrawn, and
  why a great deal of work is still performed against them because a contract
  says so. Three things have to be kept apart and routinely are not: what the
  standard historically required, where it still binds by contract, and what
  ISO/IEC 17025 asks instead. Teaching a withdrawn requirement as a live one is
  the failure this article exists to prevent.
sections:
  - id: s01
    heading: What a ratio rule is
    covers: >-
      Test uncertainty ratio and test accuracy ratio, what the 4:1 convention
      asked for, and the appeal of a rule that can be checked without
      computing anything.
  - id: s02
    heading: What a ratio rule assumes
    covers: >-
      The distributional and coverage assumptions buried in a bare ratio, and
      the cases where a comfortable ratio and a high false accept risk coexist.
  - id: s03
    heading: The false accept risk requirement
    covers: >-
      What Z540.3 asked for, how it differs from a ratio, and why it was a step
      toward the risk-based framework rather than away from ratios entirely.
  - id: s04
    heading: Withdrawn, and still in force
    covers: >-
      The status of Z540-1 and Z540.3 as standards, and the separate question
      of whether a laboratory is obliged to work to them.
    consensus: jurisdiction-dependent
    alternativeViews:
      - position: >-
          A laboratory whose contracts invoke Z540.3 is obliged to meet it, and
          its withdrawal as an active standard changes nothing about that
          obligation until the contract is renegotiated.
        basis: >-
          The obligation is contractual, not regulatory. A customer who
          specified a named standard specified the document as it read, and a
          supplier who quietly substituted a different acceptance criterion
          because the standard was withdrawn would be delivering something
          other than what was bought.
        heldBy: >-
          Standard practice in United States defence and aerospace supply
          chains, where the requirement is flowed down through purchase orders.
      - position: >-
          Withdrawal is a signal that the technical community no longer
          considers the requirement the best available, and a laboratory should
          be actively migrating its customers to a risk-based rule under
          ISO/IEC 17025 rather than maintaining a withdrawn one indefinitely.
        basis: >-
          Continuing to certify against a withdrawn document entrenches an
          acceptance criterion its own authors have moved on from, and the
          laboratory is usually the only party in the relationship competent to
          explain why the alternative is better.
        heldBy: >-
          Common in laboratories accredited to ISO/IEC 17025 serving mixed
          markets, and in accreditation body guidance.
  - id: s05
    heading: Keeping the three claims apart
    covers: >-
      The discipline of stating separately what a standard required, where it
      binds, and what current practice asks — and why collapsing them is the
      commonest failure in this area.
citations:
  - source: ANSI-NCSLI-Z540-3-2006
    clause: "5.3"
    relevance: >-
      The false accept risk requirement — the clause that made the probability
      of accepting a nonconforming item the acceptance criterion rather than a
      ratio between uncertainties. What s03 is about.
  - source: ANSI-NCSL-Z540-1-1994
    clause: "10.2"
    relevance: >-
      The earlier ratio-based acceptance requirement. Cited for what the
      predecessor document asked, which s01 describes and which remains the
      criterion a great deal of contractual work is still performed against.
  - source: ISO-IEC-17025-2017
    clause: "7.8.6"
    relevance: >-
      Reporting statements of conformity, including the requirement to record
      the decision rule applied. The current framework's answer, and the reason
      a laboratory cannot leave its acceptance criterion implicit whichever
      rule it uses.
  - source: JCGM-106-2012
    clause: "1"
    relevance: >-
      The scope of JCGM 106 is the role of measurement uncertainty in
      conformity assessment — the framework that superseded ratio thinking.
      Cited at scope level deliberately; see the note in CM-08-038 on why a
      conservative citation was preferred to a precise one here.
currency:
  authorityStatus: historical
  volatility: controlled
  sourceRevision: "ANSI/NCSLI Z540.3-2006 (R2013); ANSI/NCSL Z540-1-1994"
  lastVerified: "2026-08-14"
  note: >-
    BOTH PRIMARY SOURCES ARE WITHDRAWN AS ACTIVE STANDARDS and are retained
    here because practitioners still encounter them and are still contractually
    bound by them. This article describes what they required; it does not
    present those requirements as current. Section s04 records where the
    profession disagrees about what follows.
relatedArticles:
  - BOK-0002
authoring:
  createdOn: "2026-08-14"
---

Two documents dominate this subject and neither is an active standard. Both are
still worked to daily, because a purchase order says so. Reading about them is
therefore an exercise in holding three separate things in mind at once, and the
whole difficulty of the area is that they get collapsed into one.

## What a ratio rule is {#s01}

The idea is simple enough to check on a bench without computing anything, which
is most of why it lasted.

Compare the tolerance of the item being calibrated against the uncertainty of
the calibration that measures it. If the tolerance is at least four times the
uncertainty, accept the measurement as adequate for the decision. That is the
**4:1 rule**, and it appears under two names that are worth separating:

- **Test accuracy ratio (TAR)** — traditionally the ratio of the item's
  tolerance to the *accuracy specification* of the equipment used to measure
  it. A comparison of two specifications.
- **Test uncertainty ratio (TUR)** — the ratio of the item's tolerance to the
  *measurement uncertainty* of the calibration process, evaluated as a budget.

They are not interchangeable. TAR compares a specification with a
specification; TUR compares a specification with an evaluated uncertainty that
includes contributions the equipment specification never covered — the setup,
the operator, the environment, the item's own behaviour. A process can have a
comfortable TAR and an uncomfortable TUR, and where the two are quoted loosely
that is usually what has happened.

The attraction of either is real: one number, computable in a moment, no
distributional argument, and a criterion a purchaser can write into a contract
and audit without expertise.

## What a ratio rule assumes {#s02}

A ratio is a proxy for something else — the probability of accepting an item
that is in fact out of tolerance — and the proxy holds only under conditions
the rule does not state.

- **That the uncertainties combine roughly as assumed.** A bare ratio says
  nothing about how the calibration uncertainty was evaluated, which
  contributions were included, or what coverage factor the numbers are on.
  Comparing a tolerance against a k = 1 figure and against a k = 3 figure gives
  ratios differing by three for the same measurement.
- **That the item's true value is distributed across its tolerance in a
  particular way.** The risk of a wrong acceptance depends heavily on where
  items actually sit. A production process centred on nominal with tight spread
  produces very different risk from one that puts most items near a tolerance
  limit, and the ratio is identical in both cases.
- **That the decision is made at the tolerance limit with no guardband.** The
  ratio addresses the measurement, not the acceptance criterion, and says
  nothing about where the accept/reject boundary is drawn.

The consequence worth carrying: **a comfortable ratio and a high false accept
risk can coexist.** The ratio is a rule of thumb that works well in the
common case and fails in identifiable ones, which is precisely the profile of
a rule that survives for decades and then gets replaced.

## The false accept risk requirement {#s03}

The later document took a different route: rather than a ratio, it required
that the probability of accepting a nonconforming item not exceed a stated
figure — 2 %.

This is a genuine change of kind, not a tightening. It asks about the outcome
of the decision instead of about a property of the measurement, and getting to
it requires exactly what the ratio avoided: an evaluated uncertainty, a
statement about how items are distributed, and a computation.

It also, in practice, retained a ratio-based route as an alternative means of
compliance for the case where the risk computation was not performed, which is
one reason the two approaches are so frequently confused. A laboratory could
satisfy the standard by either path, and many satisfied it by the familiar one.

The direction of travel is the thing to take away. The requirement moved
attention from *how good was the measurement* to *how likely is this decision
to be wrong* — which is the question ISO/IEC 17025 and JCGM 106 now frame
directly, in terms of decision rules and guardbands.

## Withdrawn, and still in force {#s04}

Both documents have been withdrawn as active standards. Neither has stopped
being used.

The reason is that the obligation was never regulatory. It arrives through a
purchase order, a quality clause or a prime contractor's flow-down
requirement, and a contract that names a standard names it as it read. The
document's status with its issuing body and the supplier's obligation to meet
it are separate facts, and only the first one changed.

So a laboratory can simultaneously be accredited to ISO/IEC 17025, applying
decision rules agreed with each customer, and be contractually required to
demonstrate a 4:1 ratio or a 2 % false accept risk for a particular programme.
Nothing is inconsistent about that.

What the profession disagrees about is what a laboratory should *do* with the
situation — meet the requirement as specified and leave the contract alone, or
actively migrate customers to a current risk-based rule. Both positions are
recorded in this section's metadata, and the disagreement is substantive rather
than a matter of anyone being out of date. It also divides by sector and
national supply chain rather than by technical argument, which is why the
section is marked jurisdiction-dependent and not contested.

## Keeping the three claims apart {#s05}

Almost every error in this area is a collapse of three statements into one.
The discipline is to make each separately.

**What the standard required.** A statement about a document, in the past
tense, with the clause. "Z540.3 required that the probability of false accept
not exceed 2 %."

**Where it binds.** A statement about this laboratory and this work. "This
programme is performed under a contract invoking Z540.3." Note that this is
never a technical claim and cannot be inferred from the measurement — it is
read off a purchase order.

**What current practice asks.** A statement about the framework in force.
"ISO/IEC 17025 requires the decision rule to be agreed and recorded, and JCGM
106 supplies the risk model."

Collapsing them produces two recognizable failures. **Teaching a withdrawn
requirement as a live one** — a trainee who leaves believing 4:1 is what
ISO/IEC 17025 asks for, and who will apply it where no contract requires it and
where it is not the best available answer. And the mirror error, **dismissing a
contractual requirement as obsolete** — a laboratory that quietly substitutes
its own decision rule for the one a customer specified has delivered something
other than what was bought, however defensible the substitute.

Both failures come from the same place: treating the standing of a document and
the existence of an obligation as the same question. They are not, and this
area is where the difference bites hardest.
