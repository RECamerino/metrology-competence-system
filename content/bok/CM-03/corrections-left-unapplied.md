---
id: BOK-0012
title: Known corrections left unapplied
subjects:
  - CM-03
status: draft
summary: >-
  The Guide assumes a result has been corrected for every recognised
  significant systematic effect, and most of uncertainty evaluation is written
  on that assumption. Real laboratories sometimes do not correct — because the
  correction varies across a range and only one figure can be quoted, or
  because applying it per result costs more than it is worth. Covers the case
  where a correction is genuinely negligible, the case where it is not and is
  left unapplied anyway, why enlarging the uncertainty to absorb it is warned
  against, and the one treatment the Guide sets out for the situation it does
  contemplate.
sections:
  - id: s01
    heading: The default, and why the rest of the method depends on it
    covers: >-
      That a recognised significant systematic effect is quantified and
      compensated by a correction, that the expectation of the residual error
      is then zero, and why almost every later step assumes this has been done.
  - id: s02
    heading: When a correction is small enough to leave out
    covers: >-
      The legitimate case — a correction, or the uncertainty of a correction,
      insignificant relative to the combined standard uncertainty — and why
      this is a different situation from the one the rest of the article is
      about, despite looking identical in the finished budget.
  - id: s03
    heading: Enlarging the uncertainty instead, and the warning against it
    covers: >-
      The practice of leaving a known correction unapplied and inflating the
      reported uncertainty to cover it, the Guide's position that this should
      be avoided and is for very special circumstances only, and the confusion
      it invites between an uncertainty and a safety limit.
  - id: s04
    heading: The situation the Guide does contemplate
    covers: >-
      A measurand defined over a range of a parameter, where the correction and
      the uncertainty both vary with it and only a single uncertainty figure can
      be quoted for the whole range; the practice of reporting the maxima of
      both added together; and the economic argument that is honestly conceded
      rather than dismissed.
  - id: s05
    heading: The mean-correction treatment
    covers: >-
      The approach the Guide offers as consistent with its own principles — a
      single mean correction over the range of interest, applied to every
      estimate, with a combined variance assembled from three separate terms —
      and what each term accounts for.
  - id: s06
    heading: Saying what was done
    covers: >-
      Why an unapplied correction is invisible in a finished result, what the
      record has to carry for a later reader to know the decision was taken,
      and what a downstream user needs in order to correct the result
      themselves.
  - id: s07
    heading: Whether the added-maxima practice is defensible at all
    covers: >-
      The disagreement over reporting a result with the maximum uncertainty and
      the maximum correction summed, given that the Guide describes the practice
      in one place and warns against its general form in another.
    consensus: contested
    alternativeViews:
      - position: >-
          Where the conditions the Guide describes genuinely hold, summing the
          maxima is an acceptable and conservative treatment, and the warning
          elsewhere is aimed at the casual use of uncertainty to absorb bias
          rather than at this specific situation.
        basis: >-
          The Guide sets out the situation, states the conditions under which
          the practice is followed, and offers an alternative without
          prohibiting what it has just described. The result errs in the
          direction that does not flatter the laboratory, and a reader who
          knows the convention can interpret the interval.
        heldBy: >-
          Common where a calibration curve is supplied to many users at once
          and no per-result computation is possible.
      - position: >-
          Summing the maxima produces a quantity that is not an uncertainty and
          should not be presented as one, and the mean-correction treatment
          should be used wherever the data exist to compute it.
        basis: >-
          An interval built from two worst cases has no stated coverage
          probability and cannot be propagated into any later calculation.
          Combining it with other uncertainties, which a downstream user will
          do, produces a number with no defensible meaning — and the warning
          against confusing an uncertainty with a safety limit is aimed at
          exactly this.
        heldBy: >-
          Common where results feed further computation, and among those who
          read the Guide's warning as controlling over its description.
citations:
  - source: JCGM-100-2008
    clause: "3.2.3"
    relevance: >-
      That a recognised systematic effect is quantified and compensated by a
      correction or correction factor, and that the expectation of the error
      arising from it is then zero. The baseline s01 describes.
  - source: JCGM-100-2008
    clause: "3.2.4"
    relevance: >-
      The stated assumption that the result has been corrected for all
      recognised significant systematic effects. Its second note is the pointer
      to the two places the unapplied case is treated, and is why this article
      exists.
  - source: JCGM-100-2008
    clause: "3.4.4"
    relevance: >-
      That the uncertainty of a correction may be ignored where its
      contribution is insignificant, and the correction itself where it is
      insignificant relative to the combined standard uncertainty. The
      legitimate case s02 separates out.
  - source: JCGM-100-2008
    clause: "6.3.1"
    relevance: >-
      The note stating that taking a known systematic effect into account by
      enlarging the assigned uncertainty should be avoided and is for very
      special circumstances only, and that evaluating uncertainty is not to be
      confused with assigning a safety limit. The basis of s03 and the second
      position in s07.
  - source: JCGM-100-2008
    clause: "F.2.4.5"
    relevance: >-
      The specific case of corrections from a calibration curve left unapplied,
      the conditions under which it arises, the added-maxima practice, and the
      mean-correction treatment offered as consistent with the Guide's
      principles. s04 and s05 rest entirely on it.
  - source: JCGM-100-2008
    clause: "7.2.7"
    relevance: >-
      Reporting each component and how it was obtained, which s06 extends to the
      correction that was evaluated and then deliberately not applied.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
    relevance: >-
      The obligation to identify the contributions to measurement uncertainty. A
      correction left unapplied has been identified and then handled, which is a
      different claim from one never identified, and only the record separates
      them.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "JCGM 100:2008; ISO/IEC 17025:2017"
  lastVerified: "2026-08-17"
  note: >-
    Tracks the GUM. A revision of JCGM 100 should wake this article; nothing on
    a calendar should. The GUM revision effort is itself a subject in CM-03-104.
relatedArticles:
  - BOK-0004
  - BOK-0011
authoring:
  createdOn: "2026-08-17"
---

Almost everything written about uncertainty evaluation assumes the result has
already been corrected for every recognised significant systematic effect. The
assumption is stated once, early, and then relied on throughout. Laboratories
do not always meet it, and the interesting question is what happens to the
uncertainty statement when they do not.

## The default, and why the rest of the method depends on it {#s01}

A systematic effect arising from a recognised influence quantity can be
quantified. Where it is significant relative to the accuracy the measurement
requires, a correction or correction factor is applied to compensate for it,
and after correction the expectation of the error arising from that effect is
taken to be zero.

That last clause is doing the structural work. Once the expectation is zero,
what remains of the effect is uncertainty — the imperfect knowledge of the
correction's own value — and uncertainty is a thing the method knows how to
combine. Everything downstream, from combining contributions to choosing a
coverage factor to interpreting the resulting interval, is built on the
assumption that the estimate sits at the centre of its distribution rather than
displaced to one side of it.

Correcting is also not optional in the sense a reader might assume from how
briefly it is stated. The Guide assumes both that the result has been corrected
for all recognised significant systematic effects, and that every effort has
been made to identify such effects in the first place. The two obligations are
separate: an effect nobody looked for is a completeness failure, treated in
`BOK-0004`, while an effect found, quantified and then not applied is this
article's subject.

One point of vocabulary matters here, because it is a common confusion. Adjusting
or calibrating an instrument against a measurement standard removes systematic
effects, but the uncertainties associated with those standards do not vanish
along with them. They must still be accounted for.

## When a correction is small enough to leave out {#s02}

There is a legitimate case for not applying a correction, and it needs
separating from the rest of this article because a finished budget looks
identical either way.

Where the uncertainty of a correction contributes insignificantly to the
combined standard uncertainty, it may be ignored. Where the value of the
correction itself is insignificant relative to the combined standard
uncertainty, it too may be ignored. This is not a departure from the method; it
is the method acknowledging that a contribution below the resolution of the
final answer changes nothing.

The word carrying the weight is *insignificant*, and it is relative — to the
combined standard uncertainty of this measurement, not to the correction's own
size or to some general threshold. A correction that is negligible for a working
instrument may dominate for a reference standard, and the same effect can
therefore be legitimately dropped in one budget and required in another.

The distinction from the sections that follow is the whole point. Here the
correction is not applied because applying it would not change the result. In
what follows it is not applied although applying it would.

## Enlarging the uncertainty instead, and the warning against it {#s03}

The practice at issue is this: a known correction for a significant systematic
effect is not applied to the reported result, and instead the uncertainty
assigned to that result is enlarged in an attempt to take the effect into
account.

The Guide's position on the general form of this practice is not
neutral. It should be avoided, and only in very special circumstances should
corrections for known significant systematic effects not be applied. That is
about as close to a prohibition as the document comes on a matter of judgement.

The reason is stated alongside it, and it is the sharper half. Evaluating the
uncertainty of a measurement result is not to be confused with assigning a
safety limit to some quantity. An uncertainty is a statement about a
distribution — it has a coverage probability, it propagates into later
calculations, and a reader may act on it as such. An interval widened to swallow
a known displacement is none of those things. It looks like an uncertainty,
combines like an uncertainty in any spreadsheet that receives it, and is not
one.

The damage is therefore not confined to the certificate. A downstream user who
combines the inflated figure with their own contributions produces a result
whose meaning nobody can reconstruct, and nothing in the number itself warns
them.

## The situation the Guide does contemplate {#s04}

Against that warning sits a specific situation the Guide sets out in detail, and
the tension between the two is real enough that practitioners disagree about it
— see s07.

The situation has a definite shape. The measurand is defined over a range of
values of some parameter, as with a calibration curve for a temperature sensor.
Both the correction and the expanded uncertainty depend on that parameter. And
only a single value of uncertainty is to be quoted for all estimates of the
measurand across the whole range.

Under those conditions the practice sometimes followed is to report the result
as the estimate plus or minus the sum of two maxima: the largest expanded
uncertainty over the range, and the largest known correction over the range.

The Guide recommends corrections be applied for known significant systematic
effects, and then concedes something worth noticing — that in a situation of
this kind it may not always be feasible, because of the unacceptable expense of
calculating and applying an individual correction, and calculating and using an
individual uncertainty, for each value across the range. The concession is
economic rather than metrological, and it is stated plainly rather than dressed
up.

## The mean-correction treatment {#s05}

For this situation the Guide offers an approach it describes as comparatively
simple and consistent with its own principles, and it is the constructive part
of the answer.

Rather than leaving the correction out entirely, a **single mean correction** is
computed over the range of interest — the average of the correction function
across the interval bounded by the two parameter values that define the range.
Every estimate is then adjusted by that one mean correction, so the reported
best estimate is the uncorrected estimate plus the mean, and no per-result
computation is required. That is what makes it affordable, which was the
objection in the first place.

The uncertainty then assembles from three distinct terms, and keeping them
apart is what makes the treatment defensible:

- the **mean variance of the estimate** arising from every source other than
  this correction — the ordinary budget, averaged across the range;
- the **mean variance of the correction** due to its own determination, which is
  the uncertainty the correction would have carried had it been applied
  individually;
- the **variance associated with the mean correction itself**, which accounts
  for the fact that a single average is standing in for a function that varies
  across the range.

The third term is the one that exists only because of the decision, and it is
the price of the shortcut expressed as an uncertainty rather than hidden. That
is precisely what the added-maxima practice does not do. A result treated this
way is corrected, carries a combined standard uncertainty assembled from stated
components, and propagates like any other.

## Saying what was done {#s06}

An unapplied correction leaves no trace in a finished result. The number looks
like every other number, and a reader who was not told has no way to recover the
decision from the value.

The Guide's general obligation is to report each uncertainty component and how
it was obtained, and the same obligation reaches the correction that was
evaluated and then deliberately not applied. What the record has to carry is the
effect identified, the correction's value or function, the decision not to apply
it, the reasoning, and the treatment adopted in its place.

There is a second reader to think about beyond the assessor. A downstream user
who knows the correction was not applied, and knows its value, can apply it
themselves for their own purpose. A user given only a widened interval cannot
recover anything. The difference between a defensible decision and an
indefensible one is often just whether the record lets somebody else undo it.

## Whether the added-maxima practice is defensible at all {#s07}

The Guide describes the added-maxima practice in one place and warns against
enlarging an uncertainty to absorb a known effect in another, without
reconciling them explicitly. Practitioners divide on which reading controls, and
both positions are set out in this article's `alternativeViews`.

What is not in dispute is worth stating separately, because it is more than the
argument suggests. The conditions in s04 are narrow and all of them must hold; a
correction left unapplied for convenience, outside that situation, is not
defended by either position. And under both readings the decision and the
correction's value must be recorded, because the disagreement is about which
treatment to adopt and never about whether to tell anyone.
