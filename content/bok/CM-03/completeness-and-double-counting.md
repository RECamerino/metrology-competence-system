---
id: BOK-0004
title: Completeness and double-counting in an uncertainty budget
subjects:
  - CM-03
status: draft
summary: >-
  The two defects that arithmetic cannot find: a contribution that should be in
  the budget and is not, and one physical effect entered twice under two names.
  Covers why an absence is invisible from inside a budget, the searches that
  find one anyway, the specific overlap between a Type A repeatability
  evaluation and a specification that already includes it, and the partial
  overlap that has no clean answer. Every line present can be correct and the
  budget still be wrong, in either direction, by a factor that matters.
sections:
  - id: s01
    heading: Why a missing contribution is the hardest defect to find
    covers: >-
      That an absence leaves no trace in the table, that every check operating
      on what is present will pass, and what follows for how a budget must be
      reviewed.
  - id: s02
    heading: Searching for what is not there
    covers: >-
      Structured searches that generate candidates independently of the
      existing budget — the measurement walk-through, cause-and-effect
      analysis, the influence-quantity sweep, and comparison against a
      published budget for the same measurement.
  - id: s03
    heading: Testing the budget against the measurement's own behaviour
    covers: >-
      Using observed reproducibility, interlaboratory comparison and check
      standard history as external evidence that a budget is too small, and
      what such a discrepancy does and does not prove.
  - id: s04
    heading: The opposite defect — one effect counted twice
    covers: >-
      How a single physical effect acquires two lines under different names,
      why the resulting budget looks careful, and the direction of the error.
  - id: s05
    heading: Where Type A and Type B overlap
    covers: >-
      The specific and common case of a repeatability contribution evaluated
      from observations while a specification already covering it is carried
      alongside, and how to tell whether the observations captured the effect.
  - id: s06
    heading: Partial overlap, and why it has no clean answer
    covers: >-
      The case where a specification covers some but not all of what the
      observations captured, and the disagreement about how to treat it.
    consensus: contested
    contestedBasis: source-silent
    contestedBasisNote: >-
      The GUM addresses double-counting where an effect is wholly
      covered twice (3.4.8). It does not reach the partial overlap,
      where a specification covers some but not all of what the
      observations captured, and that is the case the disagreement is
      about.
    alternativeViews:
      - position: >-
          Where the overlap is partial and cannot be resolved from the
          records, both contributions should be carried in full and the
          resulting overstatement accepted.
        basis: >-
          A reasoned partial allowance is a number the laboratory invented,
          and the amount removed is chosen by the person whose result it
          improves. Carrying both errs in the direction that does not flatter
          the laboratory, and the overstatement is visible to anyone reading
          the budget rather than buried in a judgement.
        heldBy: >-
          Common where the budget must survive external assessment and the
          margin against the target is comfortable.
      - position: >-
          Carrying both in full is not conservative but simply wrong, and a
          reasoned partial allowance with its basis recorded is the better
          estimate.
        basis: >-
          Deliberately reporting an uncertainty known to be too large is as
          much a misstatement as reporting one known to be too small, and it
          has consequences — a capable measurement declared incapable, a
          conformity decision refused, work sent elsewhere. An allowance with
          its reasoning recorded is reviewable; a knowing overstatement
          presented as the evaluated uncertainty is not.
        heldBy: >-
          Common where the measurement supports a tight conformity decision
          and the overlapping term is dominant.
  - id: s07
    heading: Recording what was considered and rejected
    covers: >-
      Why the list of sources examined and dismissed is part of the budget,
      and what it lets a later reader do that the table alone does not.
citations:
  - source: JCGM-100-2008
    clause: "3.4.8"
    relevance: >-
      States the double-counting problem directly, including the condition
      under which a Type B component may be carried alongside an observed
      variability. The clause s04 and s05 are built on.
  - source: JCGM-100-2008
    clause: "3.4.1"
    relevance: >-
      That an evaluation can only account for the effects recognised, which is
      the limitation s01 describes and the reason a completeness search has to
      be generated from outside the budget.
  - source: JCGM-100-2008
    clause: "7.2.7"
    relevance: >-
      Reporting each component and how it was obtained. s07 argues the same
      obligation reaches the components that were considered and left out.
  - source: JCGM-100-2008
    clause: "Annex F.2"
    relevance: >-
      Practical guidance on evaluating Type B components, including the
      influence quantities that are most often overlooked in the sweep s02
      describes.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
    relevance: >-
      The obligation to identify the contributions to measurement uncertainty.
      Identification is the step completeness is about, and it precedes every
      calculation the budget contains.
  - source: ISO-IEC-17025-2017
    clause: "7.7.1"
    relevance: >-
      Monitoring the validity of results, including check standards and
      interlaboratory comparison — the external evidence s03 uses to test a
      budget against the measurement's actual behaviour.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "JCGM 100:2008; ISO/IEC 17025:2017"
  lastVerified: "2026-08-14"
  note: >-
    Tracks the GUM and ISO/IEC 17025. A revision of either should wake this
    article; nothing on a calendar should.
relatedArticles:
  - BOK-0001
  - BOK-0002
  - BOK-0003
authoring:
  createdOn: "2026-08-14"
---

Arithmetic errors in uncertainty budgets are rare and, when they happen, they
are found. Two other defects are common and are not found, because neither
leaves any trace in the table: a contribution that belongs in the budget and is
absent, and one physical effect entered twice under two names. The first
understates the uncertainty and the second overstates it, and a budget can
contain both at once.

## Why a missing contribution is the hardest defect to find {#s01}

Every review technique that operates on the budget as written will pass a
budget with a source missing. The divisors are right, the coefficients are
right, the combination is right, the units carry through. Nothing is wrong. The
defect is that something is not there, and nothing in the table refers to it.

This is not a failure of care by reviewers. It is structural. A reviewer
reading a budget is answering "is each of these lines correct?", and the
question that would find the defect is "what should be here that is not?" —
which cannot be answered from the document being reviewed. It has to be
answered from the measurement.

The consequence is that **a completeness check must generate its candidate list
independently of the budget**, and then look for each candidate in the table.
Reading the budget and asking whether anything seems to be missing is a
different and much weaker exercise: it produces the sources the reader happens
to think of, which correlate strongly with the sources the author thought of.

The framework is explicit that an evaluation accounts for the effects that were
recognised. It offers no method for the ones that were not, and there is none —
only searches with better and worse coverage.

## Searching for what is not there {#s02}

Four searches, each generating candidates from a different starting point. They
overlap, which is the point: a source missed by one is often caught by another.

**The measurement walk-through.** Follow the measurement from the arrival of
the item to the number on the certificate — setup, stabilisation, zeroing,
each reading, each correction applied, the calculation, the rounding. At each
step ask what could differ if the same measurement were repeated tomorrow by
someone else. This finds procedural and operator contributions that no
instrument-based list contains.

**Cause-and-effect analysis.** Take the measurand and branch outward into the
standard, the item, the instrument, the method, the environment and the
operator, then branch each of those again. The structure forces attention onto
branches that would otherwise be skipped — the item's own contributions are the
ones most often thin, because the budget was written around the equipment.

**The influence-quantity sweep.** Go through the physical influences that
affect this measurement type — temperature and gradients, pressure, humidity,
buoyancy, vibration, electromagnetic interference, thermal EMF, alignment and
cosine effects, elastic deformation, drift since calibration — and for each,
decide explicitly whether it matters here. Most will not. Deciding is the
point; leaving them unconsidered is what the search exists to prevent.

**Comparison against a published budget.** Calibration guides and accreditation
body documents publish worked budgets for common measurements. Reading one
alongside your own is the fastest way to find a line you have never carried,
and it has the specific advantage of being written by someone whose blind spots
are not yours.

The sources most often absent are consistent enough to name: thermal gradients
as distinct from temperature offset; buoyancy in mass work; thermal EMF in
low-level DC measurement; the item's own stability and its geometric departure
from the ideal the model assumes; drift of the reference since its last
calibration; and the resolution of the display, which is small, easy, and
skipped precisely because it is small.

## Testing the budget against the measurement's own behaviour {#s03}

The searches in s02 generate candidates. There is also evidence available from
outside the budget entirely, and it works in the opposite direction — it does
not name the missing source, but it can demonstrate that one exists.

If the measurement's observed reproducibility over time is larger than the
budget's stated uncertainty, something real is not in the budget. Check
standard history, interlaboratory comparison results, and repeat measurements
separated by weeks rather than minutes all supply this evidence, and the
comparison is one of the few genuinely objective tests a budget can be put to.

Two limits on what the discrepancy proves. It shows that the budget is too
small; it does not say which line is missing, and the search still has to
happen. And the reverse observation proves much less than it appears to:
observed scatter smaller than the budget is consistent with a correct budget,
with an overstated one, and with a set of repeats too closely spaced to have
exercised the effects that matter.

That last case is worth spelling out, because it is the bridge to the rest of
this article. Ten readings taken in five minutes will not reveal drift, will
not reveal a thermal cycle, and will not reveal anything that varies between
setups. A Type A evaluation from those readings has captured short-term noise
and nothing else — which matters for what follows, because whether it captured
an effect decides whether carrying that effect separately is duplication.

## The opposite defect — one effect counted twice {#s04}

The same physical effect can enter a budget twice under two different names,
and the resulting budget reads as thorough rather than defective.

It happens in a few recognisable ways. A quantity is carried both as its own
line and inside a manufacturer's overall accuracy figure that already
encompasses it. A correction is applied to the result *and* its full magnitude
is carried as an uncertainty, when what belongs in the budget is the
uncertainty of the correction. A drift allowance is carried alongside a
calibration uncertainty that was itself derived over the same interval. Two
lines from different documents describe one effect in different vocabulary —
"repeatability" on one and "short-term stability" on the other.

The error overstates the uncertainty, which is why it survives. It looks
cautious, an assessor is unlikely to challenge a budget for being too large,
and nobody is harmed in an obvious way. The harm is real but indirect: a
capable measurement is reported as less capable than it is, conformity
decisions are refused that should have passed, and the laboratory's stated
capability understates what it can actually do.

There is also a subtler cost. A budget with duplicated lines has lost its
correspondence to the physical measurement, and the next person to revise it
has no reliable way to tell which line represents what.

## Where Type A and Type B overlap {#s05}

The specific case that dominates in practice: repeatability evaluated from
observations, and a manufacturer's specification carried alongside that already
includes repeatability within it.

The framework addresses this directly. A Type B component may be carried
alongside an observed variability only to the extent that it covers an effect
the observations did not capture. Where the observations already captured it,
carrying it again is duplication.

So the question is not whether the specification mentions the effect. It is
**whether the Type A observations actually exercised it**, and that turns on
how the observations were taken:

- Repeats taken back-to-back without disturbing the setup capture instrument
  noise and short-term variation, and nothing else. A specification covering
  setup-to-setup variation is covering something they did not.
- Repeats across setups, operators, days or a temperature cycle capture
  correspondingly more, and a specification covering those is duplicating.
- Repeats within one session against a single reference capture nothing about
  the reference, whatever the specification says about it.

The practical test is to write down what each observation actually varied, and
compare that against what the specification claims to cover. Where they
coincide, one of the two contributions goes. Where the specification reaches
something the observations held fixed, both stay and the budget should say why.

Which one to remove, where they coincide, is usually the specification: a Type
A evaluation from this instrument in this laboratory is evidence about the
measurement in hand, and a population specification is not.

## Partial overlap, and why it has no clean answer {#s06}

The case that is neither: the specification covers some of what the
observations captured but not all of it, and the records do not say how much.

Removing the specification discards a real contribution. Keeping it in full
counts part of one effect twice. There is no third option available from the
records, and no calculation resolves it — the fraction of overlap is exactly
what is not known.

Practitioners divide here, and the two positions are recorded in this section's
metadata: carry both and accept the overstatement, or make a reasoned partial
allowance and record its basis. The disagreement is substantive rather than a
gap in anyone's knowledge, and it turns on which error a laboratory considers
worse — an uncertainty knowingly too large, or a reduction chosen by the party
that benefits from it.

Two things are not in dispute. Whichever route is taken, the budget must say
which, because the two produce different numbers from the same evidence and a
reader cannot tell them apart from the result. And the underlying condition is
fixable: the ambiguity exists because the Type A observations were not designed
to isolate the effect, and a repeat programme that varies the right thing
removes the question entirely for every future budget of that measurement.

## Recording what was considered and rejected {#s07}

A budget records the contributions that were included. The searches in s02
produce something else — a list of candidates examined and dismissed — and that
list is worth keeping.

Two lines per rejected source is enough: what it was, and why it was judged not
to matter. "Buoyancy — item and standard of similar density and volume,
contribution below one part in ten to the smallest term." "Vibration — measured
at the bench during setup, below the resolution of the indication."

Three things this makes possible that the table alone does not.

**A reviewer can see the search.** Without it, a budget with no buoyancy line
and a budget where buoyancy was assessed and dismissed are the same document. A
reviewer who cannot tell them apart has to redo the search or accept the result
on trust, and neither is what a review is for.

**A change in conditions can be re-examined.** A source dismissed as negligible
against a comfortable target stops being negligible when the target tightens or
the range extends. If the reasoning is recorded, the decision can be revisited
against the new target in minutes. If it is not, the only route is a fresh
search — which will be run by someone who does not know the first one happened.

**The judgement is attributable.** A dismissal with its reasoning is a
professional decision somebody made and can defend. An absence is not
attributable to anyone, and cannot be distinguished from an oversight, which is
the position s01 describes and the whole of this article exists to get out of.
