---
id: BOK-0015
title: The test for errors of indication in weighing instrument calibration
subjects:
  - EC-04
  - DP-02
status: draft
summary: >-
  What a weighing instrument reads against known masses across its range: how
  many test loads, where they sit, how far they may deviate from their targets,
  the four sequences in which they can be applied and what each simulates, and
  what the indication is compared against. The third of cg-18's measurement
  methods and the one the other two defer to — it is the clause that makes a
  test load a reference value rather than a convenient mass.
sections:
  - id: s01
    heading: What the test establishes
    covers: >-
      Appraising the accuracy of the instrument over the whole weighing range,
      and why that is a different question from repeatability and from
      eccentricity.
  - id: s02
    heading: How many test loads, and where they sit
    covers: >-
      The minimum number, the worked target patterns, how far an actual load may
      deviate from its target, the spacing that has to survive that deviation,
      and the reduced-range case.
  - id: s03
    heading: The load has to be a standard weight here
    covers: >-
      The provision that separates this test from the other two, why the other
      two point at it, and what a substitution load is for.
  - id: s04
    heading: The four loading sequences and what each simulates
    covers: >-
      Unloading between steps or not, increasing or decreasing, what creep does
      to the result, and how each sequence maps onto a way the instrument is
      actually used.
  - id: s05
    heading: The reference value — nominal mass or conventional value
    covers: >-
      What the indication is differenced against, when the nominal value of the
      weights is good enough, and what happens when the test load is a
      collection rather than a single weight.
  - id: s06
    heading: From discrete errors to a characteristic of the range
    covers: >-
      The error at each test point, and the optional calibration curve that
      estimates the error anywhere in the range — including what an acceptable
      approximation has to do.
citations:
  - source: EURAMET-CG-18
    clause: "5.2"
    relevance: >-
      The test: the minimum number of test loads and their distribution, the
      worked target patterns with their deviation and spacing tolerances, the
      reduced-range case, the requirement that test loads be standard weights or
      substitution loads, and the four loading sequences with what each of them
      costs. Sections s02 through s04 rest on this clause.
  - source: EURAMET-CG-18
    clause: "6.2"
    relevance: >-
      The evaluation: the error at a discrete test point, the choice between the
      nominal and the conventional value of the reference mass, the treatment of
      a test load made of several weights, and the least-squares characteristic
      of the weighing range with the conditions an approximation must satisfy.
      Sections s05 and s06 rest on this clause.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "EURAMET cg-18 v4.0 (11/2015)"
  lastVerified: "2026-09-05"
  note: >-
    cg-18 is a guideline rather than a normative document, and is what this test
    is performed against in practice. A revision should wake this article
    together with BOK-0013 and BOK-0014 and the three elements resting on them.
relatedArticles:
  - BOK-0013
  - BOK-0014
  - BOK-0001
authoring:
  createdOn: "2026-09-05"
---

## What the test establishes {#s01}

Repeatability asks whether the instrument says the same thing twice.
Eccentricity asks whether it says the same thing wherever the load sits. This
test asks the question a user thinks they are asking all along: **is the
indication right**, across the range they will actually use.

The purpose is an appraisal of the accuracy of the instrument over the whole
weighing range — not at one convenient point. An instrument can be accurate at
capacity and wrong near the bottom, or the reverse, because the two ends are
governed by different terms: a proportional error scales with the load and an
offset does not, and a single test point cannot separate them. That is the whole
reason for a distributed set of loads rather than a check at Max.

It is also the test that produces the numbers a certificate reports. The other
two characterize behaviour; this one produces the errors, and the uncertainty
attached to them is what a user carries into their own budget.

## How many test loads, and where they sit {#s02}

At least five different test loads, distributed fairly evenly over the normal
weighing range — or at individual test points agreed in advance where the
instrument's use justifies them.

Two worked patterns are given, and the tolerances attached to them are the part
that matters in practice, because a laboratory never has exactly the weights the
pattern names:

- **Five loads** at zero or the minimum, a quarter of capacity, half, three
  quarters, and capacity. An actual test load may deviate from its target by up
  to a tenth of capacity, **provided consecutive test loads still differ by at
  least a fifth of capacity**.
- **Eleven loads** at zero or the minimum, then ten steps of a tenth of capacity
  up to capacity. Here an actual load may deviate by up to a twentieth of
  capacity, provided consecutive loads still differ by at least eight
  hundredths.

Read those as a pair of constraints rather than one. The deviation allowance is
generous, and it is the **spacing** condition that stops a laboratory using it to
collapse two neighbouring points into effectively the same load — which would
leave a gap in the range while the record still showed the right number of test
points.

Where a significantly smaller range of calibration has been agreed, the number
may be reduced accordingly — but not below **three** test points, which must
include the agreed minimum and maximum, and consecutive loads must not differ by
more than fifteen hundredths of capacity. A reduced range is a narrower claim,
not a cheaper test.

## The load has to be a standard weight here {#s03}

Test loads must consist of appropriate standard weights, or of substitution
loads used in the prescribed way.

**This is the provision that separates this test from the other two**, and the
one they both defer to. The repeatability and eccentricity tests say the test
load need not be calibrated or verified — *unless the results serve for the
determination of errors of indication as per this clause*. Both of those tests
compare indications against each other, so an unknown mass cancels. Here the
indication is compared against the mass, so the mass is a reference value and
its own error goes straight into the result.

That is why the combination is worth watching. A laboratory running all three
tests in one session, on one load, gets three results for the price of one
loading — and the moment the indications feed this test, the load has to have
been a calibrated weight all along. It cannot be decided afterwards.

Substitution loading exists for the case where the laboratory does not hold
enough standard weights to reach capacity, and it is a defined procedure rather
than an improvisation.

## The four loading sequences and what each simulates {#s04}

The indication is set to zero, and the test loads are normally applied once, in
one of four sequences. Each one models a way the instrument is really used, and
each has a cost.

1. **Increasing by steps, unloading between the separate steps.** This
   corresponds to the majority of uses — an instrument that weighs single loads,
   one after another, returning to empty between them. It is the sequence that
   most resembles ordinary practice, and it is the most work, because every load
   is moved on and off.
2. **Continuously increasing by steps, without unloading between them.** Less
   load handling, since weights are added rather than exchanged. The cost is that
   the result **may include creep effects** — the instrument's slow response to
   having been under load — which the first sequence largely avoids.
3. **Continuously increasing and then decreasing by steps.** This is the
   procedure prescribed for verification testing in the legal-metrology
   documents, and it carries the same creep caveat as the second.
4. **Continuously decreasing by steps starting from capacity.** Simulates use as
   a hopper weigher, where material is removed rather than added and the
   measurement is subtractive. Same caveat again.

The choice is not arbitrary and it is not free: a sequence chosen for
convenience rather than for how the instrument is used produces errors that
include an effect the user will never see, or omit one they will.

On a multi-interval instrument, these sequences may be modified for load steps
below capacity by applying tare loads, taring the instrument, and applying a test
load close to but not larger than the top of the partial range, so that
indications are obtained with the smallest scale interval. On a multiple-range
instrument the client identifies which ranges are to be calibrated.

## The reference value — nominal mass or conventional value {#s05}

The error at a test point is the indication minus the reference value of the
mass applied. Where the indication is a mean of more than one reading, it is
that mean.

The reference value may be approximated by the **nominal** value of the weights
— the number stamped on them — or, more accurately, by their **conventional
value**, which is the nominal value plus the correction recorded on their own
calibration certificate.

Choosing between them is a real judgement rather than a formality. The nominal
approximation is adequate when the weights' corrections are small compared with
the error being reported and with its uncertainty; it stops being adequate as
the instrument gets better, because the same correction that was negligible
against a coarse instrument is not negligible against a fine one. **The
approximation is a property of the pairing, not of the weights.**

Where a test load is made up of more than one weight, both the nominal value and
the correction are summed over the weights in the load — so a load assembled
from six weights carries six corrections, and the case for using conventional
values gets stronger rather than weaker as loads are built up.

## From discrete errors to a characteristic of the range {#s06}

The direct output is a set of discrete errors, one per test point.

In addition — or as an alternative — a **characteristic** may be determined for
the weighing range: a calibration curve allowing the error to be estimated at
any indication within the range, not only at the points tested. It is generated
by approximation, generally on a least-squares basis, minimizing the sum of the
squared residuals between the fitted function and the observed errors.

Three conditions attach to that approximation, and they are what separate a
curve from a line drawn through some dots:

- it should **take account of the uncertainties of the errors**, which are not
  equal across the range and should not be treated as if they were;
- it should use a **model function that reflects the physical properties of the
  instrument** — the form of the relation between load and indication — rather
  than whichever polynomial happens to fit best;
- it should include a **check that the parameters found are mathematically
  consistent with the actual data**.

A fit that satisfies none of those can still pass through every point, which is
precisely the danger: a high-order polynomial fitted to five errors will
reproduce them exactly and predict nonsense between them.

Because the error at a point is assumed unchanged if the actual indication is
replaced by its nominal value, the fit may be performed against either data set.
The guide's own appendix carries advice on selecting a suitable formula, which
is the right place to look before inventing one.
