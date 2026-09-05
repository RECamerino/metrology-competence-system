---
id: BOK-0016
title: The uncertainty budget for a weighing instrument calibration
subjects:
  - EC-04
  - CM-03
  - DP-02
status: draft
summary: >-
  What the three measurement-method tests are for: the uncertainty of the error
  reported on a weighing instrument's calibration certificate. The two halves of
  it — the uncertainty of the indication and the uncertainty of the reference
  mass — the terms inside each, which repeatability figure applies where, when
  eccentricity enters at all, and why the uncertainties of several standard
  weights are added rather than combined in quadrature. Expanding the result and
  stating it on a certificate belongs to CM-03 and is not repeated here.
sections:
  - id: s01
    heading: What the budget is a budget of
    covers: >-
      The error of indication as the measurand, its two independent halves, and
      why the tests in BOK-0013 to BOK-0015 exist upstream of it.
  - id: s02
    heading: The indication, and the corrections that make it up
    covers: >-
      Rounding at zero and at load, repeatability, and eccentricity, as
      corrections with expectation value zero — and the type-approval case that
      halves one of them.
  - id: s03
    heading: Which repeatability figure applies where
    covers: >-
      A single reading against the mean of several, one test load against
      many, and the rule for an indication that falls between two test points.
  - id: s04
    heading: When eccentricity enters the budget at all
    covers: >-
      The condition that brings the term in, the assumptions the estimate rests
      on, and why a test load of one body usually removes it.
  - id: s05
    heading: The reference mass, and why several weights are added arithmetically
    covers: >-
      The correction to nominal, the calibrated-to-tolerance case, and the
      correlation that forbids a sum of squares when a load is built from
      several weights.
  - id: s06
    heading: Combining, and where the budget stops being constant
    covers: >-
      The combined variance, and the two conditions under which a single
      uncertainty may be quoted for the whole range rather than one per point.
citations:
  - source: EURAMET-CG-18
    clause: "7.1"
    relevance: >-
      The basic formula for the calibration and its variance — the error as the
      difference between indication and reference mass, and the two independent
      uncertainty halves that follow. Section s01 rests on this clause.
  - source: EURAMET-CG-18
    clause: "7.1.1"
    relevance: >-
      The uncertainty of the indication: the correction terms and their
      distributions, the rounding limits at zero and at load including the
      type-approved case, which repeatability figure applies to which
      indication, the condition under which eccentricity contributes and the
      assumptions its estimate rests on, and the combined expression. Sections
      s02 through s04 rest on this clause.
  - source: EURAMET-CG-18
    clause: "7.1.2"
    relevance: >-
      The uncertainty of the reference mass: the correction to the nominal
      value from the weights' own certificate, the calibrated-to-tolerance
      alternative, and the arithmetic summation required when a test load
      consists of more than one standard weight. Section s05 rests on this
      clause.
  - source: JCGM-100-2008
    clause: "5.2.2"
    relevance: >-
      The general expression for combined standard uncertainty with correlated
      inputs. cg-18's arithmetic summation of several weights' uncertainties is
      this expression at full positive correlation, and s05 says so rather than
      leaving it as a rule to memorize.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "EURAMET cg-18 v4.0 (11/2015)"
  lastVerified: "2026-09-05"
  note: >-
    cg-18 is a guideline; the GUM clause cited alongside it is normative and
    does not move. A revision of cg-18 should wake this article together with
    BOK-0013, BOK-0014 and BOK-0015.
relatedArticles:
  - BOK-0013
  - BOK-0014
  - BOK-0015
  - BOK-0001
authoring:
  createdOn: "2026-09-05"
---

## What the budget is a budget of {#s01}

The quantity being reported is the **error of indication**: what the instrument
read, minus the mass that was actually on it. Everything in BOK-0013 to BOK-0015
exists to produce the inputs to that difference, and this budget is what turns it
into a number a user can rely on.

Because the error is a difference between two things measured independently, its
variance is the sum of two variances: one for the **indication**, one for the
**reference mass**. They are independent in the ordinary case — the instrument's
rounding has nothing to do with the weights' calibration — and that
independence is what makes the budget tractable. It is also the thing most worth
checking before assuming it, because s05 describes a case inside one half where
independence fails badly.

Where substitution loads have been used, the reference value is not simply the
mass on the pan and the substitution procedure supplies what replaces it.

## The indication, and the corrections that make it up {#s02}

The indication is not a single observed number. It is the reading at load, plus
a set of corrections, minus the reading at no load and its own correction. Each
correction has an **expectation value of zero** — that is what makes them
corrections rather than adjustments — and each contributes a standard
uncertainty.

- **Rounding at no load.** The zero indication is quantized, with limits of half
  a scale interval either side, and a rectangular distribution is assumed. There
  is a case that halves this: on an instrument type-approved to the legal
  metrology requirements, the rounding error of a zero indication *after a
  zero-setting or tare operation* is limited to a quarter of a scale interval
  rather than a half. Knowing whether the instrument in front of you is type
  approved is therefore worth a factor of two in one term.
- **Rounding at load.** The same treatment at the load indication, with the
  scale interval that applies there. On a multi-interval instrument that
  interval **varies with the indication**, so this term is not one number across
  the range.
- **Repeatability**, taken from the standard deviation the repeatability test
  produced. See s03, because which one applies is not obvious.
- **Eccentricity**, but only sometimes. See s04.

## Which repeatability figure applies where {#s03}

The repeatability contribution is the experimental standard deviation from the
test in BOK-0014, and three cases have to be told apart.

**A single reading, one repeatability test.** The standard deviation from that
test may be treated as representative for the whole range of the instrument.
That is a real simplification and it is permitted; it is also the assumption
that quietly stops being true on an instrument whose scatter grows with load.

**A mean of several readings.** Where the indication whose error is being
reported is itself the mean of N readings taken with the same test load during
the error-of-indication test, the contribution is the standard deviation divided
by the square root of N. Forgetting the divisor overstates the uncertainty;
applying it to a single reading understates it, which is the more dangerous
direction.

**Several test loads.** Where repeatability was determined at more than one
load, the indication whose error is being reported usually falls between two of
them — and the rule is to use the **greater** of the two enclosing standard
deviations, not an interpolation between them. That is deliberately conservative
and it is the choice a budget should be able to show it made.

On multi-interval and multiple-range instruments where repeatability was tested
in more than one interval or range, each interval's standard deviation may be
taken as representative for indications within that interval.

A certificate reporting a standard deviation should make clear whether it
belongs to a single indication or to a mean of N. Two laboratories reporting the
same instrument can otherwise publish figures differing by a factor of √N with
no visible reason.

## When eccentricity enters the budget at all {#s04}

The eccentricity term accounts for error caused by the centre of gravity of a
test load sitting off-centre. **It arises where a test load is made up of more
than one body** — a single weight placed centrally does not produce it — which
is one of the reasons BOK-0014 records a preference for a single body.

Where the effect cannot be neglected, its magnitude is estimated from the
largest difference the eccentricity test produced, scaled by the indication and
by the distance the eccentricity positions sat from the centre. That estimate
rests on three assumptions, and they are assumptions rather than findings: that
the eccentricity differences are proportional to the distance of the load from
the centre, that they are proportional to the value of the load, and that the
effective centre of gravity of a built-up test load sits no further from the
centre than half the distance to the eccentricity test positions.

A rectangular distribution is then assumed over that bound.

This is the term that most often gets carried into a budget without being
needed, and the question to ask first is not how to estimate it but whether the
test load was a single body.

## The reference mass, and why several weights are added arithmetically {#s05}

The reference value of mass is the nominal value of the weights plus a series of
corrections: to the conventional value, for buoyancy, for drift, for convection,
and any further ones the conditions demand.

The correction to the conventional value comes from the weights' own calibration
certificate, and its standard uncertainty is the expanded uncertainty on that
certificate divided by its coverage factor. There is an alternative for weights
calibrated to a stated tolerance and used at their nominal value: the correction
is then taken as zero and the tolerance is treated as the bound of a rectangular
distribution.

**Where a test load consists of more than one standard weight, the standard
uncertainties are summed arithmetically — not in quadrature.**

That instruction is easy to memorize and easy to apply for the wrong reason, so
it is worth saying what it is. Weights in a set are not independent: they are
calibrated against the same references, by the same laboratory, often in the
same session, and their errors move together. Adding in quadrature assumes
independence, and assuming independence where inputs are positively correlated
**understates** the result — it is not a conservative simplification, and the
direction of the error is not random. The arithmetic sum is the correlated case
of the general expression for combining uncertainties, taken at full positive
correlation. BOK-0001 covers why that direction follows, and this is the same
argument arriving through a rule in a calibration guide.

A load built from six weights therefore carries six uncertainties added
end to end, and the case for using conventional values rather than nominal ones
gets stronger as the load is built up rather than weaker.

## Combining, and where the budget stops being constant {#s06}

The variance of the indication is assembled from the two rounding terms — each
a squared scale interval over twelve — the repeatability variance, and the
eccentricity term, which enters scaled by the square of the indication because it
was estimated as a relative quantity. Added to the variance of the reference
mass, that gives the variance of the error.

The useful question a budget has to answer is whether **one** uncertainty may be
quoted for the whole weighing range, or whether it has to be stated per test
point. The uncertainty of the indication is constant only where two things hold:
the repeatability standard deviation is constant across the range, and no
eccentricity contribution has to be considered.

Neither is exotic. An instrument whose scatter grows with load fails the first;
a calibration performed with built-up test loads fails the second. A budget that
quotes a single figure across the range has asserted both, and a reviewer is
entitled to see that the assertion was checked rather than inherited from the
template the laboratory always uses.
