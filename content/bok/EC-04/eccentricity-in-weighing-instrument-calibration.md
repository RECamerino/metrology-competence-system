---
id: BOK-0013
title: The eccentricity test in weighing instrument calibration
subjects:
  - EC-04
  - DP-02
status: draft
summary: >-
  Whether a weighing instrument's indication depends on where the load sits on
  the receptor, and how that is established: the load positions, the size of
  the test load, the four ways the test can be run, and which of them an
  instrument's own drift forces you into. Deliberately about one test on one
  instrument class. What as-found data is FOR, and why a calibration records
  both as-found and as-left, belongs to CM-06 and is not repeated here.
sections:
  - id: s01
    heading: What the test establishes, and what it does not
    covers: >-
      Why an instrument that is correct at the centre of its receptor may not
      be correct anywhere else, and what a calibration that reports only
      centred loads fails to tell the person who will use it.
  - id: s02
    heading: The load positions
    covers: >-
      The five positions the load's centre of gravity is required to take, and
      the cases where the shape of the receptor or the design of the instrument
      changes them.
  - id: s03
    heading: Sizing the test load, and when it has to be a calibrated weight
    covers: >-
      How large the test load should be, which range it is applied in on a
      multiple-range instrument, and the one circumstance that turns the test
      load from an arbitrary mass into a reference value.
  - id: s04
    heading: The four methods, and what drift does to the choice
    covers: >-
      Zeroing, taring, removing between positions, and returning to the centre
      each time — and why an instrument that drifts across the test leaves only
      two of the four available.
  - id: s05
    heading: Zero-setting and zero-tracking, and the failure that leaves no trace
    covers: >-
      Why two of the four methods require the automatic zero devices to be off
      for the whole test, and why forgetting produces a record that looks
      entirely normal.
  - id: s06
    heading: From indications to the eccentricity result
    covers: >-
      Which centre indication each off-centre indication is differenced
      against, and how using the wrong one reintroduces exactly the drift the
      method was chosen to remove.
citations:
  - source: EURAMET-CG-18
    clause: "5.3"
    relevance: >-
      The eccentricity test itself — the load positions, the size of the test
      load, the four procedural variants, and the conditions attached to each.
      Sections s02 through s05 rest on this clause.
  - source: EURAMET-CG-18
    clause: "6.3"
    relevance: >-
      The evaluation of the indications the test produces, including the three
      difference expressions and the pairing each method requires. Section s06
      rests on this clause.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "EURAMET cg-18 v4.0 (11/2015)"
  lastVerified: "2026-09-05"
  note: >-
    EURAMET cg-18 is a guideline rather than a normative document — its own
    front matter says the approaches it presents are not mandatory. It is
    nonetheless the reference this test is performed against across European
    calibration practice and well beyond it, which is why the standing recorded
    here is accepted-practice rather than normative. A revision of cg-18 should
    wake this article.
relatedArticles:
  - BOK-0001
authoring:
  createdOn: "2026-09-05"
---

## What the test establishes, and what it does not {#s01}

A weighing instrument is asked one question in use: what is the mass of the
thing on the pan. The calibration that answers it usually applies the load at
the centre of the receptor, because that is where a careful technician puts it
and because it is the condition under which the instrument is most likely to be
right.

Nobody uses an instrument that way. A load arrives somewhere on the platter,
and where it arrives is decided by its shape, by what else is on the pan, and by
how much of a hurry the operator is in. A load applied away from the centre
applies a moment as well as a force, and whether the instrument rejects that
moment is a property of its mechanical design and its condition — not something
that can be inferred from how well it performs when the load is centred.

So the eccentricity test asks a different question from the rest of the
calibration: not *is the indication correct*, but *does the indication depend on
where the load is*. An instrument can pass every test for errors of indication
and still be unusable for a job where the load cannot be centred, and a
certificate reporting only centred results does not contain the information that
would have said so.

What the test does not establish is how the instrument will behave under a load
of a different size, or on a receptor loaded in a way the five test positions do
not represent. It characterizes the effect; it does not bound every case of it.

## The load positions {#s02}

The test comprises placing one test load at a series of positions on the load
receptor such that the **centre of gravity of the applied load** takes each
position as closely as possible. That qualification is the part most often lost:
the position is defined by where the load's centre of gravity sits, not by where
its edge or its footprint sits, and a large or awkwardly shaped test load placed
"at the front left" may have its centre of gravity somewhere quite different.

Five positions are used: the centre, and four off-centre positions — front left,
back left, back right, and front right.

Two departures are provided for, and both are ordinary rather than exceptional.
Where an application makes it impossible to place the test load at or near the
centre of the receptor, it is sufficient to use the remaining positions. And the
number of off-centre positions may deviate from the pattern depending on the
shape of the platter — a round receptor and a long rectangular one do not divide
into the same regions.

Beyond that, the manufacturer's advice where it is available, and limitations
obvious from the design of the instrument, are to be considered; special load
receptors are treated separately in the legal-metrology documents cg-18 points
at rather than in cg-18 itself.

## Sizing the test load, and when it has to be a calibrated weight {#s03}

The test load should be about one third of the instrument's maximum capacity or
higher. Where a reduced weighing range has been agreed, the equivalent applies
to that range: a third of the way up from its minimum to its maximum, or higher.

A load much smaller than that risks producing differences comparable to the
instrument's resolution, so the test measures the resolution rather than the
eccentricity. There is no corresponding reason to keep it small, which is why
the requirement is a floor rather than a band.

On a **multiple-range** instrument the test is performed only in the range with
the largest capacity identified by the client. Running it in every range is not
more thorough; it answers the same mechanical question repeatedly while
consuming bench time the rest of the calibration needs.

**The test load need not be calibrated or verified — with one exception.** The
eccentricity test compares indications against each other, so a load of unknown
conventional mass serves perfectly: whatever error it carries appears in every
position and cancels in the difference. The exception is when the same
indications are also used to determine the errors of indication. At that moment
the load stops being an arbitrary mass and becomes a reference value, its own
error no longer cancels, and it must be a calibrated weight.

That combination is attractive precisely because it saves a loading, and it is
where the requirement is most often missed.

## The four methods, and what drift does to the choice {#s04}

The test can be carried out in four ways, and they differ in what happens
between one position and the next.

1. **Zero, then move the load.** The indication is set to zero before the test.
   The load is placed at the centre, then moved to the four off-centre positions
   in arbitrary order, and the indication is recorded at each.
2. **Tare at the centre, then move the load.** The load is placed at the centre,
   the instrument is tared, and the load is then moved to the other positions.
3. **Remove between positions.** The indication is set to zero, and the load is
   placed at a position and removed again before being placed at the next. After
   each removal the indication is checked and may be reset to zero if it does not
   read zero; recording the no-load indications is advisable.
4. **Return to the centre between positions.** The load is placed at the centre
   and the instrument tared; the load is then moved to the next position and back
   to the centre, and so on. The centre indication is recorded individually for
   each off-centre indication.

Methods 1 and 2 are the quick ones and they assume something: that the
instrument's zero is stable enough over the duration of the test that a single
centre reading taken at the start still represents the centre at the end. For a
well-behaved instrument in a settled environment that assumption holds.

**Methods 3 and 4 exist for instruments that show substantial drift during the
test.** Both interleave a reference — a re-checked zero in method 3, a re-taken
centre indication in method 4 — so that drift accumulating across the test is
removed from each difference rather than being counted as eccentricity. An
instrument that drifts, tested by method 1, reports an eccentricity that is
partly a clock.

Recognizing that an instrument is drifting, and choosing accordingly, is the
part of this test that is a judgement rather than a procedure.

## Zero-setting and zero-tracking, and the failure that leaves no trace {#s05}

For methods 2 and 4, zero-setting and zero-tracking devices must be switched off
for the **complete** eccentricity test.

The reason is specific. Both of those methods tare — they establish the centre
reading as the reference the off-centre readings are measured against. An
automatic zero-tracking device does something that looks similar and is not: it
watches for small departures from zero and quietly removes them. What counts as
a small departure is exactly the size of the effect an eccentricity test is
trying to measure.

So the device absorbs the thing being measured. The instrument reports smaller
eccentricity differences than it actually has, and it reports them consistently,
across all four positions, in a record that looks entirely unremarkable. There
is no ragged data, no failed check, no value out of family. **Nothing in the
numbers afterwards distinguishes a genuinely well-behaved instrument from one
whose eccentricity was removed by its own zero tracking**, which is why the
requirement is a precondition of the method rather than something to be
confirmed from the results.

A record showing suspiciously small and remarkably uniform differences on an
instrument nobody switched the tracking off on is the case to have in mind; it
reads as a good instrument.

## From indications to the eccentricity result {#s06}

The result of the test is a set of differences, one for each off-centre
position, and which indications are subtracted depends on the method used.

For **methods 1 and 2**, each off-centre indication is differenced against the
single centre indication recorded at the start.

For **method 3**, the no-load indication recorded at that position is first
subtracted from the off-centre indication, and the result is then differenced
against the centre indication — the two-stage form is what makes the recorded
no-load readings worth taking.

For **method 4**, each off-centre indication is differenced against **its own**
centre indication: the one recorded immediately alongside it, not a single
centre reading shared by all four.

The pairing is not a presentational detail. Method 4 is chosen because the
instrument drifts; differencing its off-centre indications against one shared
centre reading discards the interleaving and reintroduces precisely the drift the
method was selected to remove — while producing a table that is the right shape,
the right size, and wrong. A reviewer reading the certificate cannot detect it,
because the intermediate centre indications are not what gets reported.
