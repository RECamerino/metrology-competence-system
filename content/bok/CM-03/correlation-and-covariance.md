---
id: BOK-0001
title: Correlation and covariance in uncertainty budgets
subjects:
  - CM-03
  - CM-05
status: draft
summary: >-
  Why input quantities become correlated, what ignoring that correlation does
  to a combined standard uncertainty and in which direction, how to obtain a
  correlation coefficient, and the specific laboratory situations where the
  independence assumption quietly fails. Under-reported uncertainty from
  ignored correlation is among the most common defects found in real budgets.
sections:
  - id: s01
    heading: Why inputs become correlated
    covers: >-
      The physical mechanisms — shared reference standards, shared operators,
      shared environment, quantities derived from a common measurement.
  - id: s02
    heading: What the independence assumption costs when it is wrong
    covers: >-
      Direction and rough magnitude of the error, and why positive correlation
      between same-signed sensitivity coefficients under-reports uncertainty.
  - id: s03
    heading: The covariance term in the law of propagation
    covers: >-
      The general expression, what the cross term does, and how to lay it out
      in a budget table that a reviewer can follow.
  - id: s04
    heading: Obtaining a correlation coefficient
    covers: >-
      Estimating from repeated observations, deriving from a shared calibration
      path, and the bounding argument to use when neither is available.
    consensus: contested
    contestedBasis: practice-diverges
    contestedBasisNote: >-
      The GUM permits the covariance to be taken as zero where there is
      insufficient information to evaluate it (F.1.2.1). Neither
      position here accepts that: both hold that a budget with an
      unevaluated correlation needs something better than a zero, and
      they divide over what. The source is clear and a substantial body
      of accredited practice does otherwise.
    alternativeViews:
      - position: >-
          Where a correlation cannot be estimated from data, the budget should
          carry the bounding case rather than an assumed coefficient, and the
          report should state that a bound was used rather than a measurement.
        basis: >-
          An assumed coefficient carries an unquantified judgement into a figure
          that is then treated as though it were measured. A stated bound is
          honest about what is not known, and is defensible to an assessor who
          asks where the number came from.
        heldBy: >-
          Common in accredited calibration practice, particularly where the
          budget must survive external assessment.
      - position: >-
          A reasoned estimate of the coefficient, with its basis recorded, gives
          a more useful uncertainty than a bound that is known to be pessimistic.
        basis: >-
          Bounding at full correlation can inflate the reported uncertainty
          enough to make a capable measurement look incapable, which has real
          commercial and engineering consequences and is not a conservative
          choice so much as a different error.
        heldBy: >-
          Common where the measurement supports a conformity decision with a
          tight tolerance.
  - id: s05
    heading: Where this bites in practice
    covers: >-
      Concrete laboratory cases — gauge block stacks, multi-channel loggers,
      ratio measurements against one standard.
citations:
  - source: JCGM-100-2008
    clause: "5.2.2"
    relevance: >-
      Gives the general expression for combined standard uncertainty with
      correlated inputs, which sections s03 and s04 build on directly.
  - source: JCGM-100-2008
    clause: "F.1.2"
    relevance: >-
      Treats the practical evaluation of covariance, including the shared
      reference standard case that s05 works through.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "JCGM 100:2008"
  lastVerified: "2026-08-09"
  note: >-
    Tracks the GUM. A revision of JCGM 100 should wake this article; nothing on
    a calendar should.
authoring:
  createdOn: "2026-08-09"
---

Most uncertainty budgets are built as though every input quantity were
independent. Usually that is close enough to true. When it is not, the budget
is wrong in a specific and predictable direction, and the laboratory that
produced it has no way of knowing from the table alone.

## Why inputs become correlated {#s01}

Two input quantities are correlated when something they share moves them
together. In a laboratory that sharing is rarely subtle once you look for it:

- **A shared reference standard.** Two instruments calibrated against the same
  standard inherit that standard's error in the same direction. This is the
  single commonest source and the easiest to miss, because the two
  contributions appear in the budget under different instrument names.
- **A shared environment.** Temperature affects the artefact and the
  instrument, and if both effects appear as separate lines they are not
  independent lines.
- **A shared operator or procedure.** Systematic technique effects move
  together across the measurements one person makes.
- **Quantities derived from a common measurement.** If two inputs are both
  computed from one observed value, they are correlated by construction, and
  no amount of repetition will reveal it.

## What the independence assumption costs when it is wrong {#s02}

The direction matters more than the magnitude, because a reviewer who knows the
direction knows whether the published figure is defensible.

When two inputs are positively correlated and their sensitivity coefficients
carry the same sign, the covariance term is positive: the true combined
standard uncertainty is **larger** than the independent calculation gives. The
budget under-reports, the laboratory claims better performance than it has, and
conformity decisions made against that figure carry more risk than stated.

The reverse case — negative correlation, or opposite-signed sensitivity
coefficients — over-reports. That is a commercial problem rather than a safety
one, and it is correspondingly less often noticed.

The practical consequence: **ignoring correlation is not a conservative
simplification.** It is conservative only in the case that happens to help you,
and unconservative in the case that matters.

## The covariance term in the law of propagation {#s03}

The combined variance gains a cross term for every correlated pair. Its size
depends on both sensitivity coefficients, both standard uncertainties, and the
correlation coefficient between the pair.

Two things are worth doing in the budget table itself. First, give the
correlated pair adjacent rows and a visible marker, so a reviewer sees the
relationship without reconstructing it. Second, record the correlation
coefficient and its basis as a separate line rather than folding it silently
into a combined figure — a covariance applied without a stated basis is
indistinguishable from an arithmetic error.

## Obtaining a correlation coefficient {#s04}

Three routes, in descending order of how much they will convince a reviewer.

**From repeated simultaneous observations.** Where both quantities can be
observed together across a set of measurements, the coefficient is estimated
directly. This is the strongest basis and the least often available.

**From the shared path.** Where the correlation arises because both inputs
trace to one standard, the coefficient follows from how much of each input's
uncertainty comes from that shared contribution. This is usually the practical
answer.

**By bounding.** Where neither is available, evaluate the budget at the
correlation that maximizes the combined uncertainty and state that you have
done so. A defensible bound with its reasoning recorded is worth more than a
precise-looking coefficient with no basis, and reviewers treat it that way.

## Where this bites in practice {#s05}

**Gauge block stacks.** Blocks calibrated against a common master share its
error. Stacking multiplies the shared contribution rather than averaging it
away, which is the opposite of what the independent calculation predicts.

**Multi-channel data loggers.** Channels calibrated as a unit, against one
reference, are correlated across the whole instrument. Budgets frequently treat
each channel as independent because each has its own line in the calibration
certificate.

**Ratio measurements against one standard.** Numerator and denominator
referenced to the same standard are correlated, and here the correlation
usually helps — much of the shared error cancels in the ratio. Ignoring it
over-reports, sometimes substantially. This is the case worth knowing because
it runs opposite to the intuition the other examples build.
