---
id: BOK-0017
title: Adjustment before a weighing instrument calibration
subjects:
  - EC-04
  - CM-06
status: draft
summary: >-
  What adjusting a balance does to the instrument and to the record, and when
  cg-18's default — adjust before calibrating — is the right thing to do. The
  preconditions a calibration rests on, the requirement to adjust by the means
  the client normally uses, the high-resolution case, and whose setting decides
  the automatic zero devices. What as-found and as-left data are FOR belongs to
  CM-06 and is not repeated here; this is what a balance's adjustment does to
  them.
sections:
  - id: s01
    heading: The preconditions a calibration rests on
    covers: >-
      The seven conditions that have to hold before a calibration should be
      performed at all, and why exercising the instrument is among them.
  - id: s02
    heading: The default is to adjust first, and it is not vandalism
    covers: >-
      Which instruments should be adjusted before calibration, why the state
      being characterized is the state the instrument is used in, and the
      agreement that can displace the default.
  - id: s03
    heading: By the client's means, not the laboratory's better ones
    covers: >-
      Why the adjustment is performed the way the client performs it, following
      the manufacturer where available, and what an improved adjustment would
      quietly misrepresent.
  - id: s04
    heading: High-resolution balances, adjusted either side of the calibration
    covers: >-
      The resolution threshold above which adjustment immediately before the
      calibration and immediately before use is the suitable procedure, and what
      that implies about the interval between them.
  - id: s05
    heading: The automatic zero devices, and whose setting decides
    covers: >-
      Calibrating with a zero-setting or zero-tracking device operative or not
      as the client sets it, and how that sits beside the requirement two of the
      eccentricity variants make.
  - id: s06
    heading: What "as found" is being asked to mean
    covers: >-
      The two readings of as-found data that the default reconciles in one
      direction, the case in which a client needs the other, and what each
      choice costs them. Contested, and the guide is silent on when to depart.
    consensus: contested
    contestedBasis: source-silent
    contestedBasisNote: >-
      cg-18 states the default plainly and names the agreement that displaces it
      — "unless otherwise agreed with the client" — and then says nothing at all
      about the conditions under which that agreement should be sought. It is
      not that the guide is ambiguous or self-conflicting; it is that the
      question of which reading of "as found" a given client needs is left
      entirely outside the document, and practice has filled the gap in two
      directions.
    alternativeViews:
      - position: >-
          A calibration should characterize the instrument in the state it is
          used in. An instrument its user adjusts before every weighing is never
          in the unadjusted state while real work is done, so calibrating it
          unadjusted describes a condition that does not occur in service and
          produces a certificate about an instrument nobody uses. Adjust first,
          as the guide's default says, and treat the untouched state as an
          artifact of transport rather than as evidence.
        basis: >-
          The purpose of a calibration is to let a user attach an uncertainty to
          measurements they will make, and those measurements will be made on
          the adjusted instrument. Data describing any other state does not
          support the inference the user actually needs.
        heldBy: >-
          The prevailing reading in laboratories calibrating routinely adjusted
          analytical and high-resolution balances, and the one cg-18's default
          expresses.
      - position: >-
          As-found data should be taken before anything is touched. A client
          whose measurements since the last calibration are in question has only
          one source of evidence about how the instrument was performing during
          that period, and it is the unadjusted instrument sitting on the bench.
          Adjusting first destroys it permanently and no later test recovers it.
        basis: >-
          Retrospective assessment of work already done is a recognized purpose
          of calibration, and it is the purpose most exposed to being lost by
          accident: the loss is silent, irreversible, and discovered only when
          somebody asks a question the record can no longer answer.
        heldBy: >-
          Common where a laboratory's clients operate under a quality system
          that requires the validity of previous results to be evaluated when
          equipment is found out of tolerance.
citations:
  - source: EURAMET-CG-18
    clause: "4.1.3"
    relevance: >-
      The preconditions for a calibration; the rule that instruments routinely
      adjusted before use should be adjusted before calibration unless the
      client agrees otherwise; adjustment by the client's own means; the
      high-resolution procedure; and the automatic zero devices. Sections s01 to
      s05 rest on this clause and s06 on what it leaves open.
  - source: EURAMET-CG-18
    clause: "4.2.1"
    relevance: >-
      The basic relation between load and indication, in which the adjustment
      factor appears explicitly as a multiplier. What adjustment actually
      changes, and why it is a change to the instrument rather than to the
      record.
currency:
  authorityStatus: accepted-practice
  volatility: stable
  sourceRevision: "EURAMET cg-18 v4.0 (11/2015)"
  lastVerified: "2026-09-05"
  note: >-
    cg-18 is a guideline. The section marked contested here is contested because
    the guide names an escape from its own default and says nothing about when
    to take it — the divergence is in practice, not in the document.
relatedArticles:
  - BOK-0013
  - BOK-0014
  - BOK-0015
  - BOK-0016
authoring:
  createdOn: "2026-09-05"
---

## The preconditions a calibration rests on {#s01}

A calibration should not be performed at all unless seven things hold, and they
are worth reading as a checklist rather than as prose because a laboratory that
skips one produces a certificate describing something other than what it thinks.

The instrument can be readily identified. Its functions are free from the
effects of contamination or damage, and the functions the calibration depends on
operate as intended. The presentation of weight values is unambiguous and the
indications are easily readable. The normal conditions of use — air currents,
vibration, the stability of the weighing site — are suitable for the instrument
being calibrated. The instrument has been energized for an appropriate period,
which means the warm-up time the manufacturer specifies or the one the user
actually applies. It is levelled, where levelling applies.

And it has been **exercised**: loaded approximately up to the largest test load
at least once, with repeated loading advised. That one is the least obvious and
the most often skipped. An instrument that has sat unloaded settles, and the
first loading of a session behaves differently from the tenth; exercising it
moves that transient out of the data rather than into the first test point.

## The default is to adjust first, and it is not vandalism {#s02}

Instruments that are **intended to be regularly adjusted before use** should be
adjusted before the calibration — unless otherwise agreed with the client.

That reads, on first encounter, like destroying the evidence. It is not, and the
reason is worth being precise about: a calibration characterizes the instrument
in the state it is used in. An instrument that its user adjusts before every
weighing is *never* in the unadjusted state while real work is being done, so
calibrating it unadjusted would characterize a condition that does not occur in
service. The certificate would describe an instrument nobody uses.

Adjustment is a change to the instrument, not to the record. The relation
between load and indication carries an **adjustment factor** as a multiplier;
adjusting resets that factor, and everything the instrument reads afterwards is
read through it. That is why the question is *when* to do it relative to the
calibration rather than whether it is permitted.

The escape is explicit and it is an agreement rather than a discretion:
*unless otherwise agreed with the client*. What that agreement is for is s06.

## By the client's means, not the laboratory's better ones {#s03}

The adjustment should be performed with the means that are **normally applied
by the client**, and following the manufacturer's instructions where they are
available. It may be done with external weights or with built-in ones.

The constraint is the interesting part. A calibration laboratory arriving with
better standards than the client owns could perform a better adjustment than the
client ever will — and doing so would produce a certificate that overstates how
the instrument performs in the client's hands. The instrument would be
characterized in a condition it reaches only when a calibration laboratory is in
the room.

So the laboratory adjusts the way the client adjusts, with what the client uses.
Where the client uses the built-in weights, the built-in weights are used, even
if external ones are on the van.

## High-resolution balances, adjusted either side of the calibration {#s04}

For high-resolution balances — those whose relative resolution is better than
one part in a hundred thousand of full scale — the most suitable operating
procedure is to adjust the balance **immediately before the calibration, and
also immediately before use**.

Both halves matter and the second is the one that reaches beyond the
laboratory. At that resolution the adjustment factor does not hold still for
long: temperature drift and time between adjustments move it by amounts
comparable to what is being measured. A calibration performed immediately after
an adjustment describes the instrument at its best, and that description is only
transferable to the user's measurement if the user also adjusts immediately
before measuring.

Which means the calibration certificate for such a balance carries an implicit
condition of use. A user who adjusts weekly and weighs daily is not operating the
instrument the certificate describes.

## The automatic zero devices, and whose setting decides {#s05}

Instruments fitted with an automatic zero-setting device or a zero-tracking
device should be calibrated with the device **operative or not, as set by the
client**.

The principle is the same one running through this whole clause: the instrument
is characterized as it is used, and how the client leaves those devices set is
part of how it is used.

That sits beside, and does not contradict, the requirement in BOK-0013 that the
devices be switched off for two of the four eccentricity variants. The scopes
differ. The client's setting governs the instrument's configuration for the
calibration as a whole; the eccentricity requirement governs one test whose
method would otherwise measure the device instead of the instrument. A candidate
who reads the second as licence to override the first has changed what the
calibration describes; one who reads the first as forbidding the second has
produced an eccentricity result that means nothing.

Recording which way the devices were set is what lets a reader tell those cases
apart afterwards, and it is why BOK-0014 asks for the status to be recorded.

## What "as found" is being asked to mean {#s06}

**This section is contested.** The guide states a default and names an agreement
that displaces it, and says nothing about the conditions under which the
agreement should be sought. The divergence is in practice rather than in the
document, and a practitioner has to hold a position.

The default answers one reading of "as found": *the instrument as it is found in
service*, which for a routinely adjusted instrument is the adjusted state. On
that reading, adjusting before calibrating is not merely permitted but required
for the certificate to describe anything useful.

The other reading is *the instrument as it was found on arrival, untouched* —
and it exists because a client often needs something the first reading cannot
give them. If measurements made since the last calibration are in question, the
only evidence of how the instrument was performing during that period is its
unadjusted state, and adjusting it destroys that evidence permanently. No
subsequent test recovers it.

The two readings cannot both be served by one loading. What a laboratory can do
is notice which one the client needs before touching the instrument, which is
why the agreement exists — and why the decision has to be made before the work
starts rather than discovered in the middle of it.