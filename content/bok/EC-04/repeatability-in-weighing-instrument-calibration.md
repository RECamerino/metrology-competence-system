---
id: BOK-0014
title: The repeatability test in weighing instrument calibration
subjects:
  - EC-04
  - DP-02
status: draft
summary: >-
  What a weighing instrument does when the same load is put on it again: the
  repeated deposition, the conditions that have to stay identical for the number
  to mean anything, how many depositions are enough, and what the result is used
  for. The companion to BOK-0013 — the two tests share an instrument, a bench
  and a set of provisions, and differ in what the witness has to watch.
sections:
  - id: s01
    heading: What repeatability establishes
    covers: >-
      What the scatter of repeated indications is a property of, why it is the
      first test performed, and what it feeds afterwards.
  - id: s02
    heading: Repeated deposition, and what identical handling excludes
    covers: >-
      Why the load has to come off and go back on rather than be read again,
      what counts as identical conditions of handling, and why a single body is
      preferred to a stack.
  - id: s03
    heading: Sizing the load and choosing how many depositions
    covers: >-
      Relating the test load to capacity and resolution, the cases that shift
      it, and the minimum number of depositions and what changes it.
  - id: s04
    heading: Zero between depositions, and the zero device
    covers: >-
      Checking and resetting zero after each removal, recording the no-load
      indications, and the requirement to record the status of the zero-setting
      or zero-tracking device — which is not the same requirement the
      eccentricity test makes.
  - id: s05
    heading: From indications to a standard deviation
    covers: >-
      The experimental standard deviation of the recorded indications, and what
      the divisor is.
citations:
  - source: EURAMET-CG-18
    clause: "5.1"
    relevance: >-
      The test itself: repeated deposition under identical handling, the
      preference for a single body, sizing the test load against capacity and
      resolution, the minimum number of depositions and the load above which it
      changes, the zero check between depositions, and the requirement to
      record the status of the zero device. Sections s02 through s04 rest on
      this clause.
  - source: EURAMET-CG-18
    clause: "6.1"
    relevance: >-
      The evaluation: the experimental standard deviation of the indications
      recorded at a test load, and its divisor. Section s05 rests on this
      clause.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "EURAMET cg-18 v4.0 (11/2015)"
  lastVerified: "2026-09-05"
  note: >-
    EURAMET cg-18 is a guideline and says so; it is nonetheless what this test
    is performed against across European calibration practice and well beyond
    it, so the standing recorded here is accepted-practice. A revision of cg-18
    should wake this article, BOK-0013 and the elements resting on both.
relatedArticles:
  - BOK-0013
  - BOK-0001
authoring:
  createdOn: "2026-09-05"
---

## What repeatability establishes {#s01}

Put the same load on an instrument twice and it will not read the same twice.
The repeatability test measures how much it does not, and it is the first of the
measurement methods performed because almost everything else in the calibration
is read against it: an error of indication smaller than the instrument's own
scatter has not been observed, it has been guessed at.

What the scatter is a property of is worth being precise about. It is not a
property of the instrument alone. It is a property of the instrument, the load,
the operator's handling, and the environment, taken together over the minutes the
test occupies — which is why the conditions have to be held identical rather than
merely similar, and why a repeatability figure obtained by one person on a settled
bench does not transfer to another person on a busy one.

The test does not establish that the instrument is correct. An instrument can be
beautifully repeatable and consistently wrong; repeatability and error of
indication are different questions asked of the same instrument, and the guide
keeps them in separate clauses for that reason.

## Repeated deposition, and what identical handling excludes {#s02}

The test consists of the **repeated deposition of the same load** on the load
receptor, under identical conditions of handling the load and the instrument,
and under constant test conditions.

Every word of that is doing work, and the first is the one that gets lost.
*Deposition* means the load comes off the receptor and goes back on. Reading the
display several times with the load sitting where it was is a different
measurement entirely — it observes the stability of the electronics and nothing
about the mechanical repeatability of putting a mass on a pan, which is the
thing being weighed in real use.

**A record of five indications looks exactly the same either way.** That is the
single most important fact about this test, and it is why the scatter it reports
is trivially easy to make small.

*Identical conditions of handling* excludes the ordinary variations that feel
harmless: placing the load at the centre one time and a little off-centre the
next, lowering it gently once and setting it down briskly after, changing which
hand or which tool moves it, varying how long it rests before the reading is
taken. Each of those adds a component the number will be read as though it were
the instrument's.

The test load should, as far as possible, consist of a **single body**. A stack
of several weights can shift between depositions, and it is handled differently
from a single mass — so the stack contributes its own variability and the result
stops being about the instrument.

## Sizing the load and choosing how many depositions {#s03}

At least one test load is used, selected in reasonable relation to the maximum
capacity and the resolution of the instrument, so that the result actually
appraises the instrument's performance rather than its scale interval.

For an instrument with a constant scale interval, a load between about half of
capacity and capacity is common. That is frequently reduced where such a load
would run to several tonnes, for the obvious practical reason. On a
multi-interval instrument a load below and close to the top of the relevant
partial range may be preferred; on a multiple-range instrument, a load below and
close to the capacity of the range with the smallest scale interval may be
sufficient — that range is where the scatter matters most. A different value may
be agreed where a specific application justifies it.

The test may also be performed at more than one test point, with a load for
each.

**The number of depositions is at least five — or at least three where the test
load is 100 kg or more.** The reduction is a concession to handling large
masses, not a statement that three is as good as five: the standard deviation
from three depositions is a much poorer estimate, and a laboratory that takes
the concession where it does not apply has weakened its own uncertainty budget
for no reason.

As with the eccentricity test, the test load need not be calibrated or verified
— unless the same indications also serve to determine the errors of indication,
at which point it becomes a reference value and must be a calibrated weight.

## Zero between depositions, and the zero device {#s04}

The indication is set to zero before the test begins. After **each** removal of
the load the indication is checked, and may be reset to zero if it does not read
zero; recording the no-load indications is advisable.

In addition, the status of the zero-setting or zero-tracking device, if one is
fitted, **should be recorded**.

That is a different requirement from the one the eccentricity test makes, and
the difference is worth holding on to. For the taring variants of the
eccentricity test the automatic zero devices must be **switched off**, because
they would absorb the effect being measured. For repeatability the requirement is
to **record their status** — the test is a comparison of like with like, so a
device operating consistently across all the depositions does not corrupt the
comparison in the same way, but a reader of the result needs to know whether one
was operating, because it changes what the scatter means.

A candidate who has learned the eccentricity rule and applies it here has not
made a serious error. A candidate who records nothing about the device has left
the result ambiguous in a way nothing downstream can repair.

## From indications to a standard deviation {#s05}

The result is the experimental standard deviation of the indications recorded at
a given test load: the root of the sum of squared deviations from their mean,
divided by one less than the number of indications.

The divisor is the number of depositions minus one, not the number of
depositions. With five depositions that is a difference of twenty-five per cent
in the variance, and with the three permitted for heavy loads it is fifty per
cent — which is the arithmetic behind the warning in s03 about taking the
concession lightly.

Where the test has been performed at only one test load, the index identifying
which load a result belongs to may be dropped. Where it has been performed at
several, it may not: a single standard deviation quoted for an instrument tested
at three points is three results collapsed into one, and which point it came from
is exactly what a reader needs.
