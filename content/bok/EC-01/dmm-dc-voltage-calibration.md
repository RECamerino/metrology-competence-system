---
id: BOK-0006
title: DC voltage calibration of a digital multimeter
subjects:
  - EC-01
  - DP-08
status: draft
summary: >-
  The DC voltage function of a multimeter, calibrated: what the standard has to
  be, how the test points are chosen across ranges, the connection effects that
  put microvolts into a measurement that cares about them, and what the
  as-found record for this function actually consists of. Deliberately about
  one function of one instrument class. The methodology of calibration —
  what as-found data is FOR, why both as-found and as-left are recorded —
  belongs to CM-06 and is not repeated here.
sections:
  - id: s01
    heading: What the job is
    covers: >-
      Verifying the meter's indication against applied values of known
      uncertainty across its DC voltage ranges, and what that does and does not
      establish about the instrument.
  - id: s02
    heading: The standard, and the ratio it has to achieve
    covers: >-
      What a multifunction calibrator must be to calibrate a given meter, how
      the ratio between the standard's uncertainty and the meter's
      specification is judged, and what to do when it is inadequate.
  - id: s03
    heading: Choosing the test points
    covers: >-
      Points across each range and across the ranges, why the bottom of a range
      is tested as well as the top, polarity, and zero.
  - id: s04
    heading: Connection, thermal EMF and lead effects
    covers: >-
      Where microvolts come from in a circuit nobody thought was thermal, and
      the practices that keep them below the level that matters.
  - id: s05
    heading: Loading and input impedance
    covers: >-
      What the meter's input impedance does to the applied value, when it
      matters, and the range-switching behaviour that catches people out.
  - id: s06
    heading: What as-found data for this function consists of
    covers: >-
      The specific record a DC voltage verification produces — applied value,
      indication, deviation, permitted error, and the conditions — as distinct
      from the general question of why as-found data is kept.
citations:
  - source: ISO-IEC-17025-2017
    clause: "6.4.1"
    relevance: >-
      The laboratory shall have access to equipment required for the correct
      performance of its activities. The obligation behind s02 — the calibrator
      is not a convenience, it is what makes the result a calibration.
  - source: ISO-IEC-17025-2017
    clause: "6.5"
    relevance: >-
      Metrological traceability. What makes the applied value a known value
      rather than a displayed one, and the reason the standard's own
      calibration status is part of this job rather than background to it.
  - source: ISO-IEC-17025-2017
    clause: "7.2.1.1"
    relevance: >-
      The laboratory shall use appropriate methods and procedures for all
      laboratory activities. The frame for the test-point selection in s03,
      which is a method decision and not a matter of habit.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
    relevance: >-
      Identifying the contributions to measurement uncertainty. The connection
      effects in s04 are contributions, and a budget for this calibration that
      omits thermal EMF has omitted a real one.
  - source: JCGM-200-2012
    clause: "4.26"
    relevance: >-
      Maximum permissible measurement error. What the meter's indication is
      compared against at each test point, and what a pass or fail statement
      rests on.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "ISO/IEC 17025:2017"
  lastVerified: "2026-08-14"
  note: >-
    The obligations cited are normative; how a DC voltage function is actually
    verified is accepted practice rather than a published requirement, and no
    clause specifies test points or connection technique. Recorded as
    accepted-practice for that reason.
relatedArticles:
  - BOK-0005
authoring:
  createdOn: "2026-08-14"
---

A digital multimeter arrives on the bench carrying eight or more measurement
functions, each with its own standard and its own way of going wrong. This
article is about one of them. DC voltage is where most people start, because it
is the function the others are usually referenced against and the one where the
technique is most exposed.

## What the job is {#s01}

Apply a known voltage. Record what the meter says. Compare the difference
against what the meter's specification permits at that point.

That is the whole of it, and stating it that plainly is worth doing because two
things follow that are not obvious.

**The result is about the instrument at those points, on that day, under those
conditions.** A meter verified at eleven points has been verified at eleven
points. The claim that it is within specification everywhere on those ranges is
an inference, resting on how the instrument is built and on how the points were
chosen — which is why s03 is a method question and not a habit.

**"Known voltage" is doing the load-bearing work.** The applied value is known
because the source is traceably calibrated and its uncertainty is small enough
relative to what is being judged. Take that away and the exercise is two
instruments disagreeing with no way to say which is wrong.

## The standard, and the ratio it has to achieve {#s02}

The calibrator has to be better than the meter, and "better" needs a number.

The usual expression is a ratio between the meter's permitted error at a test
point and the uncertainty of the applied value at that point. Historically the
target was 4:1; modern practice increasingly evaluates the decision risk
directly rather than relying on a fixed ratio, and where the ratio is
comfortable the two agree. Whichever the laboratory uses, it is a documented
decision and not a matter for the bench.

Three practical consequences.

**The ratio is computed per test point, not per instrument.** The meter's
permitted error varies across ranges and across each range (`BOK-0005` §s03),
and the calibrator's uncertainty varies too. A ratio that is comfortable at
full scale on a mid range can be inadequate at the bottom of the most sensitive
one, which is exactly where a marginal instrument fails.

**The calibrator's own calibration is part of this job.** Its certificate,
its date, and its specification at the points in use are inputs to the
uncertainty budget for the calibration you are performing. A calibrator out of
its own interval does not produce a slightly weaker result; it produces a
result with no traceability.

**Where the ratio cannot be met, that is a finding.** The honest responses are
to use a better standard, to restrict the reported scope to the points where
the ratio holds, or to report with a guardband and say so. Proceeding and
reporting a bare pass is the one option that is not available, because the
statement of conformity would rest on a comparison the numbers do not support.

## Choosing the test points {#s03}

Two dimensions: across the ranges, and within each range.

**Across the ranges**, every range in the reported scope needs points, because
ranges are separate signal paths with separate gain elements. A meter can be
perfect on its 10 V range and out of tolerance on its 100 mV range, and nothing
about the first tells you anything about the second.

**Within a range**, the reason to test at more than full scale comes straight
from the two-part specification. The percent-of-reading term dominates at the
top; the counts term dominates at the bottom. A single full-scale point
exercises the gain and leaves the offset almost untested. Points near full
scale and well down the range together separate the two.

Then:

- **Both polarities.** Positive and negative paths are not identical, and a
  polarity-dependent offset is a real failure mode that a single-polarity
  verification cannot see.
- **Zero, with the input shorted rather than open.** An open input on a
  high-impedance meter reads whatever it picks up. A short at the terminals
  gives the meter's own offset, which is the thing you are trying to observe.
- **Points the customer actually uses**, where they are known. A meter used
  exclusively around 1.5 V should be verified around 1.5 V, whatever the
  standard point list says.

Record why the points were chosen. In twelve months the list looks arbitrary
and somebody will change it.

## Connection, thermal EMF and lead effects {#s04}

On the higher ranges the connection is uncritical. On the millivolt ranges it
is most of the difficulty, and the source of the trouble is thermoelectric.

Wherever two dissimilar metals meet at a junction, a voltage appears that
depends on the junction's temperature. A copper-to-solder joint, a
copper-to-brass binding post, a plug in a socket — each is a junction, and each
produces some microvolts per degree. In a loop the junctions oppose each other
and cancel *if they are at the same temperature*, which is the condition that
quietly fails.

What breaks it, in order of how often it happens:

- **A hand on one terminal and not the other.** Body heat on one junction and
  not its partner produces a drift you can watch on the display.
- **Airflow across one side of the connection** — a vent, a door, a person
  walking past.
- **Dissimilar connectors at the two ends**, so the junctions are not the same
  pair of metals and cannot cancel even at equal temperature.
- **A recently handled or recently soldered lead** that has not come back to
  ambient.

The practices that follow are unglamorous and they work. Use leads with the
same connector type and metal at both ends. Let the connection sit until the
indication stops drifting rather than reading immediately. Keep the two
conductors together so they see the same thermal environment. Avoid touching
the terminals, and if you have, wait.

**And measure the residual rather than assuming it away.** With the input
shorted, the meter's indication on the most sensitive range is the sum of its
own offset and the loop's thermal EMF. That number is evidence, it belongs in
the record, and if it is comparable to the permitted error at the low test
points then the connection — not the meter — is what is being verified.

A reversal check separates the two: apply a value, record it, reverse the
polarity of the applied value, record again. A genuine thermal offset stays in
the same direction while the applied value flips, so it shows up in the average
of the two readings.

## Loading and input impedance {#s05}

The meter draws some current from whatever it is connected to, and the applied
value at the terminals is therefore not quite the value the calibrator intended.

Against a modern calibrator with a low output impedance this is usually
negligible, and the reason to know about it anyway is the range-switching
behaviour.

Many bench multimeters present a very high input impedance — ten gigohms or
more — on their lower DC ranges, and switch to a fixed ten megohms on the
higher ones. The switch happens at a range boundary. So a verification that
walks up through the ranges crosses a point where the meter's loading changes
by three orders of magnitude, and against a source with any significant output
impedance the deviation changes with it. Against a proper calibrator it will
not; against a resistive divider or a source under test, it will, and the
resulting pattern in the data looks like a range-dependent instrument fault.

Worth knowing for a second reason: it is the mechanism behind a common customer
complaint. A meter that agrees with another meter on one range and disagrees on
the next, measuring the same high-impedance source, is not necessarily faulty.

## What as-found data for this function consists of {#s06}

`CM-06` owns the question of what as-found data is *for* and why both as-found
and as-left are recorded. This section answers the narrower question: what the
record for a DC voltage verification actually contains.

Per test point:

- **The applied value**, and the calibrator's uncertainty for it at that point.
- **The meter's indication**, as displayed, before any adjustment and before
  any rounding of your own.
- **The deviation**, as a signed figure in the units of the measurement — the
  sign matters, because a consistent sign across points is a gain or offset
  error and a scattered one is not.
- **The permitted error at that point**, computed from the meter's
  specification and stated with the range and the interval it was taken from.
- **The range in use**, without which the counts term is undefined.

And once for the calibration:

- **The shorted-input indication** on the most sensitive range, per s04.
- **Ambient temperature**, because the meter's specification is conditional on
  it and a reader in two years cannot reconstruct it.
- **Warm-up time allowed**, for the same reason.
- **The identity and calibration status of the standard.**

The deviation and the permitted error are recorded as separate figures, not
collapsed into a pass or fail. A pass is a conclusion drawn from them, it
depends on which specification column was used, and a later reader who
disagrees with that choice needs the numbers to redo the comparison.
