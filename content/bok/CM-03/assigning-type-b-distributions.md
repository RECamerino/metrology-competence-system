---
id: BOK-0002
title: Assigning distributions to Type B contributions
subjects:
  - CM-03
  - CM-05
status: draft
summary: >-
  How a statement in a certificate, a datasheet or a specification becomes a
  standard uncertainty: what assigning a distribution actually claims, the
  divisor each shape implies, how to recover a standard uncertainty from a
  stated confidence or coverage factor, and what to do when the source wording
  genuinely admits more than one reading. The divisors are arithmetic and
  lookupable. The assignment they rest on is a judgement, it is rarely
  recorded, and it is where Type B evaluation is most often quietly wrong.
sections:
  - id: s01
    heading: What assigning a distribution actually claims
    covers: >-
      That a Type B distribution describes a state of knowledge about one
      quantity, not an observed frequency, and what follows from that for how
      the assignment must be defended.
  - id: s02
    heading: From a stated limit — the rectangular assignment
    covers: >-
      When a source gives bounds and nothing else, why equal probability across
      the interval is the assignment that adds no information, and the divisor
      root three.
  - id: s03
    heading: When values are not equally likely across the interval
    covers: >-
      Triangular and U-shaped assignments, the physical situations that produce
      each, and the divisors root six and root two.
  - id: s04
    heading: From a stated confidence or a stated coverage factor
    covers: >-
      Recovering a standard uncertainty from a certificate — dividing by the
      stated coverage factor, the factors implied by a confidence level, and
      the case where the certificate states neither.
  - id: s05
    heading: When the source statement admits more than one reading
    covers: >-
      Manufacturer specifications that describe a limit and a typical
      performance at once, and the live disagreement about which reading to
      take.
    consensus: contested
    contestedBasis: source-ambiguous
    contestedBasisNote: >-
      The disputed statement is the manufacturer's specification itself,
      which describes a limit and a typical performance at once and is
      read honestly in two different ways. The GUM supplies the
      conversion once a reading is chosen; it cannot choose the reading.
    alternativeViews:
      - position: >-
          Where a specification states a limit, the limit should be read as a
          limit and assigned rectangular, whatever else the datasheet says
          about typical performance.
        basis: >-
          The manufacturer stands behind the limit and not behind the typical
          figure. A normal assignment recovered from wording the manufacturer
          would not defend puts a number in the budget that has no author, and
          it reduces the reported uncertainty, so the error runs in the
          direction that flatters the laboratory.
        heldBy: >-
          Widespread in accredited calibration, and the reading an assessor is
          most likely to expect where a budget must survive external scrutiny.
      - position: >-
          Where the source describes the stated band as covering essentially
          all units and the population behind it is large, a normal assignment
          recovered from that coverage claim is closer to what is known than a
          rectangular one.
        basis: >-
          A rectangular assignment asserts that a value at the extreme of the
          band is exactly as likely as a value at the centre, which for a
          manufactured population is known to be false. Treating a
          near-certainty band as though it were a hard limit inflates the
          contribution by roughly a factor of one and a half, which matters
          when the term is dominant.
        heldBy: >-
          Common where the specification is dominant in the budget and the
          measurement supports a tight conformity decision.
  - id: s06
    heading: Recording the basis so the assignment survives review
    covers: >-
      What a reviewer needs written down — the source wording, the shape
      assigned, the divisor and the reason — and why an unrecorded assignment
      is indistinguishable from an arithmetic error.
citations:
  - source: JCGM-100-2008
    clause: "4.3.1"
    relevance: >-
      Establishes Type B evaluation as drawing on a pool of information other
      than repeated observation, which is what makes the assignment a
      judgement rather than a computation.
  - source: JCGM-100-2008
    clause: "4.3.3"
    relevance: >-
      The case where the source states its uncertainty as a multiple of a
      standard deviation, which is the cleanest recovery available and the one
      s04 treats first.
  - source: JCGM-100-2008
    clause: "4.3.4"
    relevance: >-
      The case where the source states an interval at a level of confidence,
      and the assumption about the underlying distribution that recovering a
      standard uncertainty from it requires.
  - source: JCGM-100-2008
    clause: "4.3.7"
    relevance: >-
      The rectangular assignment and its divisor, which s02 rests on directly.
  - source: JCGM-100-2008
    clause: "4.3.9"
    relevance: >-
      The triangular assignment and its divisor, and the circumstances in
      which values near the centre of the interval are more likely.
  - source: JCGM-101-2008
    clause: "6.3"
    relevance: >-
      The maximum-entropy argument, which is why assigning rectangular from
      bounds alone is the assignment that adds no information rather than
      merely a convention.
  - source: JCGM-101-2008
    clause: "6.4.6"
    relevance: >-
      The arc sine distribution, which the GUM itself does not treat and which
      s03 needs for cyclic influences.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
    relevance: >-
      The obligation to identify the contributions to measurement uncertainty.
      An assignment with no recorded basis satisfies it on paper and not in
      substance, which is what s06 is about.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "JCGM 100:2008; JCGM 101:2008"
  lastVerified: "2026-08-14"
  note: >-
    Tracks the GUM and Supplement 1. A revision of either should wake this
    article; nothing on a calendar should.
relatedArticles:
  - BOK-0001
authoring:
  createdOn: "2026-08-14"
---

Almost every uncertainty budget contains more Type B contributions than Type A
ones, and almost every Type B contribution begins as a sentence somebody else
wrote. Turning that sentence into a standard uncertainty takes two steps. The
second is arithmetic — divide by root three, or by two, or by the stated
coverage factor. The first is a judgement about what the sentence means, and it
is the step that is almost never written down.

## What assigning a distribution actually claims {#s01}

A Type B distribution is a statement about what is known, not about what has
been observed. This is not a philosophical nicety; it changes what counts as a
defence of the assignment.

An observed frequency can be argued about with data. Someone can ask for the
observations, count them and disagree. A Type B assignment has no observations
behind it, so the only thing available to a reviewer is the reasoning: what the
source said, what the assignment supposes about the quantity, and why that
supposition follows. Where the reasoning is absent, there is nothing to review.
The number is not wrong so much as unexaminable, which in a budget that has to
survive an assessment is a worse position to be in.

Two consequences follow, and both are practical:

- **The assignment is about one input quantity, not about the instrument.** A
  datasheet describes a population of instruments; the budget concerns the one
  on the bench. The step from a population statement to a state of knowledge
  about a specific unit is part of the assignment and is where most of the
  disagreement in s05 actually lives.
- **A conservative-looking assignment is still a claim.** Choosing rectangular
  because it gives a larger number is not a defence. It is defensible only if
  the bounds are genuinely all that is known, which is a statement about the
  source and not about the direction of the error.

## From a stated limit — the rectangular assignment {#s02}

When a source gives an interval and says nothing about where within it the
value lies, the assignment that adds no information of the author's own is the
one that treats every value in the interval alike. The standard uncertainty is
the half-width divided by root three.

The wording that signals this is more consistent than it first appears.
Maximum permissible error, a tolerance band, a specified limit, a guaranteed
not-to-exceed figure — each describes a boundary the quantity is asserted to
lie inside, with no claim about the distribution within. Resolution and
quantization belong here too: a reading displayed to a given increment tells
you which interval the value fell in and nothing else about where in it.

Two errors dominate. **Dividing by two instead of root three** treats a stated
limit as though it were a coverage interval, which understates the
contribution by about fifteen per cent and is the single commonest defect in
Type B lines. **Using the full width rather than the half-width** overstates it
by a factor of two, and survives longer than it should because the resulting
budget looks cautious.

## When values are not equally likely across the interval {#s03}

Two shapes come up often enough to be worth knowing, and both need a *reason*,
not a preference.

**Triangular** applies where values near the centre of the interval are more
likely than values near the edges — typically because the interval is the sum
of two independent effects each bounded in the same way, or because the
quantity has been adjusted toward a nominal and the adjustment is imperfect.
The divisor is root six. The honest test is whether the physical situation
supplies that reason. Assigning triangular because rectangular felt pessimistic
is choosing a smaller number and calling it a distribution.

**U-shaped, or arc sine,** applies where the quantity spends most of its time
near the extremes of the interval and passes quickly through the middle. This
is the signature of a cyclic influence sampled at an unknown phase: a
temperature swinging under thermostatic control, a sinusoidal interference
term, a periodic mechanical effect. The divisor is root two, and it is the one
case in ordinary practice where the correct assignment gives a *larger*
contribution than rectangular. The GUM does not treat this shape; Supplement 1
does.

The general point behind all three: the shape encodes what is known about
where the value sits, and each shape has a physical story attached. If no story
can be told, rectangular is the assignment that admits it.

## From a stated confidence or a stated coverage factor {#s04}

A calibration certificate is a different kind of source, because it has already
done the evaluation and reported the result at a coverage. The work is to undo
that scaling and recover the standard uncertainty, and the case divides three
ways.

**A stated coverage factor.** Where the certificate reports an expanded
uncertainty and states the coverage factor used, divide by it. This is the
clean case and it is also the most commonly available, because the ILAC and
national accreditation policies that most certificates are issued under require
the factor to be stated.

**A stated level of confidence.** Where the certificate gives an interval at a
stated confidence but no factor, a distribution has to be assumed before a
divisor exists. Assuming normality gives roughly 1.64 at ninety per cent, 1.96
at ninety-five, and 2.58 at ninety-nine. The assumption is usually reasonable
and it is still an assumption, which means it belongs in the record.

**Neither stated.** This is the case worth preparing for, because it is common
on certificates from outside an accredited scope and there is no correct answer
available. Assuming k equals two silently is what most practitioners do; it is
also the assumption most likely to be right and the one least likely to be
recorded. The defensible treatment is to make the assumption explicitly, state
it in the budget, and say what it would do to the result if the certificate had
in fact used k equals three. Where that difference matters to the outcome, the
answer is to ask the issuing laboratory rather than to choose.

One thing to carry out of this section: a figure recovered this way is a
**standard** uncertainty, and the number it came from was an **expanded** one.
Mislabelling either is not an arithmetic error, and it does not show up in any
check on the arithmetic. It shows up when someone downstream combines the wrong
one.

## When the source statement admits more than one reading {#s05}

Manufacturer specifications are the difficult case, and the difficulty is real
rather than a gap in anyone's knowledge.

A datasheet will often state a limit and, elsewhere on the same page, describe
typical performance well inside it. Read as a limit, the figure is rectangular.
Read as a near-certainty coverage claim about a manufactured population, it is
closer to a normal assignment recovered as in s04, and the resulting
contribution is smaller by roughly a third.

Both readings are held by competent practitioners and the choice has
consequences that run in opposite directions — one flatters the laboratory's
capability, the other can make a capable measurement look incapable against a
tight tolerance. The two positions are recorded in this section's metadata
rather than resolved here, because the profession has not resolved them.

What is *not* contested is the obligation that follows. Whichever reading is
taken, it is a reading, and the budget has to say which one was taken and why.
A line reading "manufacturer specification, 0.05, normal, k = 2" with nothing
further has hidden the entire judgement inside the word "normal".

## Recording the basis so the assignment survives review {#s06}

Four things, and they fit on one line of a budget table:

1. **The source wording as it actually reads** — not a paraphrase. The
   difference between "accuracy" and "typical accuracy" is the whole of s05.
2. **The shape assigned.**
3. **The divisor applied**, written out rather than folded into the result.
4. **The reason** — one clause is usually enough. "Stated limit, no
   distribution information" is a complete justification for rectangular.

The reason this matters is narrower than general good practice. A covariance
applied without a stated basis is indistinguishable from an arithmetic error;
so is a divisor. A reviewer who finds root two in a budget cannot tell whether
the author identified a cyclic influence or mistyped root three, and the
distinction between a sound budget and a defective one has been made
unavailable to the only person in a position to catch it.
