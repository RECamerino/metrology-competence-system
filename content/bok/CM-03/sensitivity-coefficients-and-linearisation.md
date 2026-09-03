---
id: BOK-0003
title: Sensitivity coefficients and the limits of the linear approximation
subjects:
  - CM-03
status: draft
summary: >-
  What a sensitivity coefficient is and what it carries, how to obtain one by
  differentiating the model, how to estimate one numerically when the model
  cannot be differentiated, how to choose the perturbation without turning
  noise into a derivative, and how to tell when first-order propagation has
  stopped being adequate. The law of propagation is a linear approximation to
  a model that is usually not linear. It is an excellent approximation almost
  always, and a budget that never asks whether this is one of the exceptions
  has not checked its own foundation.
sections:
  - id: s01
    heading: What a sensitivity coefficient is and what it carries
    covers: >-
      The partial derivative of the model at the estimates, why it converts
      units as well as scaling magnitude, and what a coefficient of one
      actually asserts.
  - id: s02
    heading: Deriving the partial derivatives analytically
    covers: >-
      Differentiating a closed-form model, the product, quotient and power
      cases that dominate practice, and the two traps — a quantity appearing
      more than once, and a derivative that changes sign across the range.
  - id: s03
    heading: Estimating a coefficient numerically
    covers: >-
      Perturbing an input and observing the output when the model is a
      routine, a lookup, a simulation or the instrument itself, and what the
      resulting number is and is not.
  - id: s04
    heading: Choosing the perturbation
    covers: >-
      Why the step size is the whole judgement, how the estimate fails at both
      ends, and the convergence check that makes the choice reviewable.
  - id: s05
    heading: Where the first-order approximation stops being adequate
    covers: >-
      The signals that curvature matters — a large input uncertainty relative
      to the scale over which the derivative changes, a derivative near zero,
      a model with a turning point in range.
  - id: s06
    heading: What to do about significant curvature
    covers: >-
      Carrying a higher-order term versus propagating distributions
      numerically, what each assumes, and the disagreement about which to
      reach for first.
    consensus: contested
    contestedBasis: source-silent
    contestedBasisNote: >-
      The GUM supplies a higher-order term and JCGM 101 supplies
      numerical propagation. Each source describes its own method and
      neither addresses which to reach for when curvature is
      significant, so the question at issue has no source to settle it.
    alternativeViews:
      - position: >-
          Where the model is nonlinear enough for the first-order result to be
          inadequate, the right response is to abandon the linear framework and
          propagate distributions numerically rather than to patch it with a
          higher-order term.
        basis: >-
          The higher-order correction in the GUM is derived under an
          assumption that the input quantities are normally distributed, and a
          budget reaching for it has usually already established that its
          inputs are not well behaved. A numerical propagation makes no
          linearity assumption at all, and the tooling to run one is now
          ordinary.
        heldBy: >-
          Common where Supplement 1 is already in routine use, and in national
          institute practice.
      - position: >-
          A higher-order term is the proportionate response for a model with
          mild curvature, and reaching for a numerical propagation imposes a
          method the laboratory may not be able to validate or defend.
        basis: >-
          A numerical propagation has to be specified, implemented, seeded and
          shown to have converged, and each of those is a place for an
          unreviewed error to hide. A closed-form correction to a budget a
          reviewer can already follow is auditable in a way a simulation
          result is not, and for mild curvature the two agree.
        heldBy: >-
          Common in accredited calibration laboratories, particularly where
          the budget is one of many maintained against a documented procedure.
citations:
  - source: JCGM-100-2008
    clause: "5.1.2"
    relevance: >-
      The law of propagation of uncertainty for uncorrelated inputs. Its
      accompanying note is the source for the higher-order treatment in s06,
      and is where the framework itself states that linearization has limits.
  - source: JCGM-100-2008
    clause: "5.1.3"
    relevance: >-
      Sensitivity coefficients as the partial derivatives evaluated at the
      estimates — the definition s01 and s02 rest on.
  - source: JCGM-100-2008
    clause: "5.1.4"
    relevance: >-
      Determining sensitivity coefficients experimentally by observing the
      change in the output produced by a change in one input, which is the
      practice s03 and s04 are about.
  - source: JCGM-101-2008
    clause: "8"
    relevance: >-
      Using a numerical propagation to validate the linear framework's result
      for a given model. This is the check s05 asks for and one of the two
      responses s06 records.
  - source: JCGM-100-2008
    clause: "7.2.7"
    relevance: >-
      Reporting the components and how each was obtained. A numerically
      estimated coefficient with no recorded perturbation cannot satisfy this,
      which is why s04 treats the step size as part of the result.
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
  - BOK-0002
authoring:
  createdOn: "2026-08-14"
---

A budget line has three parts: a standard uncertainty, a sensitivity
coefficient, and the product of the two. Most of the attention in practice goes
to the first. The second is where the units live, where the model actually
enters the calculation, and where an error produces a result that looks
entirely reasonable.

## What a sensitivity coefficient is and what it carries {#s01}

The sensitivity coefficient for an input quantity is the partial derivative of
the measurement model with respect to that quantity, evaluated at the
estimates. It answers one question: if this input moved by a small amount, how
much would the result move?

Two things about it are worth holding onto.

**It converts units.** In a mass determination that includes a temperature
correction, the coefficient on the temperature input carries units of mass per
degree. The standard uncertainty entering that line is in degrees; the
contribution leaving it is in mass. A budget in which every contribution is
already in the units of the measurand has either applied its coefficients or
skipped them, and only the working shows which.

**A coefficient of one is a claim, not a default.** It is correct whenever the
input enters the model additively in the same units as the output — a
correction term, an offset, a zero error. It is silently wrong the moment the
model changes to a ratio or a product, and this is the commonest way a
coefficient error survives: for the model as first written the coefficient
genuinely was one, the model was later revised, and the budget was not.

**It is evaluated at the estimates, and it moves.** A derivative is a local
quantity. A budget written for one operating point does not automatically
transfer to another, and a template applied across a range is asserting that
the coefficients are near enough constant over it — which is often true and is
never automatic.

## Deriving the partial derivatives analytically {#s02}

Where the model is a closed-form expression, differentiating it is the direct
route and it produces something a reviewer can check line by line.

Three structures cover most laboratory models:

- **Sums and differences.** The coefficient is one, or minus one, in the units
  of the term. Corrections and offsets live here.
- **Products and quotients.** The coefficient on each input is the result
  divided by that input. The practical consequence is that the *relative*
  contributions add in quadrature directly, which is why a budget for a ratio
  measurement is usually laid out in relative terms — but the sign differs
  between numerator and denominator, and that matters as soon as the pair is
  correlated.
- **Powers.** The exponent multiplies the relative contribution. A quantity
  entering squared contributes twice its relative uncertainty, and a quantity
  under a square root contributes half. This is where a plausible-looking
  budget is most often wrong by a factor of exactly two.

Two traps account for most analytic errors.

**A quantity appearing in more than one place.** If an input enters the model
twice — a temperature that appears in both an expansion correction and a
buoyancy correction, say — the derivative is the sum of the contributions from
both appearances, and the effects may partly cancel. Differentiating only the
first occurrence gives a coefficient that is wrong in magnitude and sometimes
in sign, and the budget that results is entirely well formed.

**A derivative that changes sign across the operating range.** Where a
correction has a turning point inside the range the instrument is used over,
the coefficient is near zero at one point and substantial on either side of it.
Evaluating at the wrong point produces a contribution that looks negligible and
is not. Any model with a turning point in range needs the coefficients
evaluated where the measurement is actually made, and needs the budget to say
where that was.

## Estimating a coefficient numerically {#s03}

Frequently there is nothing to differentiate. The model is a manufacturer's
correction routine, a lookup table, a fitted surface, a finite-element result,
or the instrument itself with no written model at all. In each case the
coefficient is obtained by moving the input and observing the output.

The procedure is unremarkable: perturb one input by a known amount, hold the
others, record the change in the result, and take the ratio. The GUM
recognizes this route explicitly, and it is not a second-class one — for a
model that exists only as software it is the only honest route available.

What the resulting number *is*: an estimate of the derivative averaged over the
interval spanned by the perturbation.

What it is *not*: the derivative. The two coincide as the perturbation
approaches zero and the model approaches linearity over it, and neither of
those is exactly true in practice. That gap is the whole subject of the next
section.

One practical note that is often missed. Where the perturbation is applied to
the physical instrument rather than to a model of it, the observed change
carries the measurement noise of the instrument as well as the response being
sought. The estimate then needs repeating, and the scatter across repeats is
information about how far it can be trusted.

## Choosing the perturbation {#s04}

The step size is the judgement, and it fails at both ends.

**Too large** and the ratio is a chord across a curved response rather than a
tangent to it. The number returned is an average slope over an interval nobody
asked about, and it will differ from the local derivative by an amount that
depends on curvature the estimate itself cannot reveal.

**Too small** and the change in the output is comparable to the noise, the
rounding of the routine, or the resolution of the instrument. The ratio is then
dominated by whichever of those happens to be largest, and the estimate is
numerical noise divided by a small number — which is to say, a large and
entirely arbitrary coefficient.

Neither failure announces itself. Both produce a plausible number.

The check that makes the choice reviewable is to **vary the perturbation and
watch what the estimate does.** A well-conditioned estimate is stable across a
range of step sizes — an order of magnitude either way changes it very little.
An estimate that drifts steadily as the step grows is telling you about
curvature; an estimate that becomes erratic as the step shrinks is telling you
where the noise floor is. Between the two there is usually a plateau, and the
estimate belongs on it.

Two things then have to be recorded, and a budget that records only the
coefficient has thrown away the part a reviewer needs: **the perturbation used**
and **the evidence that the estimate was stable across it**. A numerical
coefficient with no stated step is a number with no method behind it.

Where no plateau exists — where the estimate is unstable across every plausible
step — that is a finding rather than an obstacle. It says the response is not
locally smooth at the scale that matters, and a single coefficient is not going
to represent it. The defensible treatment is to carry the range the estimate
spans and say so.

## Where the first-order approximation stops being adequate {#s05}

The law of propagation truncates a Taylor expansion after the first term. It
works because measurement uncertainties are usually small compared with the
scale over which the model curves — not because models are linear.

Three signals that this budget may be one of the exceptions:

- **A large input uncertainty relative to the scale of curvature.** If the
  input can plausibly range over a region where the derivative visibly changes,
  the derivative at the estimate does not represent the region.
- **A derivative near zero.** At or near a turning point the first-order term
  vanishes and the second-order term is all there is. A budget here can report
  a contribution of nearly nothing for a quantity that genuinely moves the
  result.
- **A strongly nonlinear model over its working range** — exponentials,
  logarithms, high powers, ratios where the denominator can approach zero.

The direct test is to compute the result both ways and compare: propagate
numerically and see whether the answer differs from the linear one by an amount
that matters at the stated target. Supplement 1 defines this comparison as a
validation of the linear framework for a given model, and it is the only test
that settles the question rather than estimating it.

Two things about the comparison. It is a test of **this model at this operating
point**, not a general clearance for the technique. And the threshold is the
**target uncertainty**, not a fixed percentage: a ten per cent discrepancy is
irrelevant to a budget with a comfortable margin and decisive for one supporting
a tight conformity decision.

## What to do about significant curvature {#s06}

Two responses are available, they mostly agree where curvature is mild, and the
profession is genuinely divided about which to reach for first. Both positions
are recorded in this section's metadata.

**A higher-order term** keeps the budget in the form a reviewer already knows
and adds a correction derived from the second derivatives. The GUM gives the
expression and it is closed-form. The assumption to be aware of is that the
correction as given is derived for normally distributed inputs, which is a
constraint a budget reaching for it may have already violated.

**A numerical propagation** makes no linearity assumption and no assumption
about the shape of the output distribution. It requires the input distributions
to be specified — which is more than a first-order budget needs, and is
sometimes more than is actually known.

That last point is the case worth preparing for, because it is where neither
answer is available. If the curvature is significant *and* the input
distributions are not characterized well enough to justify propagating them,
then the higher-order term rests on a normality assumption that is not
supported and the numerical propagation rests on distributions that were
guessed. Nothing on the records settles it.

The defensible treatment there is not a better calculation. It is to carry the
first-order result, state that curvature is significant and by roughly how
much, state what would be needed to resolve it, and let the reader of the
certificate see that the figure has a known limitation rather than a hidden
one. A budget that quietly reports a higher-order number built on an
unsupported assumption has replaced a visible problem with an invisible one.
