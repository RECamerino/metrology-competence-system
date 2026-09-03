---
id: BOK-0011
title: From CMC to the uncertainty reported on a certificate
subjects:
  - CM-03
status: draft
summary: >-
  A CMC is what a laboratory can achieve on the best device a customer could
  bring. The uncertainty on a certificate is what it achieved on the device
  that actually arrived. The two are related by a substitution — the
  contributions evaluated for the best existing device are replaced by those of
  the customer's device — and by a floor, because a laboratory may not report
  better than the capability it is accredited for. Copying the CMC onto every
  certificate satisfies the floor and fails the substitution, which is why it
  is among the most common findings an assessor writes.
sections:
  - id: s01
    heading: What a CMC claims, and what it does not
    covers: >-
      The CMC as a capability available to customers under normal conditions,
      expressed on a scope of accreditation or in the KCDB; the four things a
      scope entry must state; and why a capability is not a prediction about
      any particular calibration.
  - id: s02
    heading: The best existing device
    covers: >-
      Why a capability figure needs a device to be realizable against, what
      counts as the best existing device, the allowance for a repeatability
      contribution of zero, and the fixed contributions that remain even then.
  - id: s03
    heading: The substitution at the certificate
    covers: >-
      The operation that converts a CMC into a reported uncertainty — the same
      contribution set, with the components evaluated for the best existing
      device replaced by those of the device presented — and why the reported
      figure therefore tends to be the larger of the two.
  - id: s04
    heading: The floor, and why it points the other way
    covers: >-
      That an accredited laboratory may not report an uncertainty smaller than
      its CMC, how that interacts with the substitution, and the asymmetry
      between the two constraints.
  - id: s05
    heading: What the laboratory cannot know
    covers: >-
      Contributions arising outside the calibration — transport, handling, the
      customer's own use — the default that they are excluded, and the
      obligation to say so when they are expected to matter.
  - id: s06
    heading: When there is no best existing device
    covers: >-
      The exceptional case, the conditions for excluding device contributions
      from the CMC, and the requirement that the scope of accreditation make
      the exclusion visible rather than leaving a reader to infer it.
  - id: s07
    heading: How aggressively the repeatability allowance may be read
    covers: >-
      The disagreement over treating the best existing device's repeatability
      contribution as zero — whether it is the intended reading of a stated
      allowance or a way of publishing a capability the laboratory does not
      routinely achieve.
    consensus: contested
    contestedBasis: source-ambiguous
    contestedBasisNote: >-
      ILAC P14 states the allowance and does not bound it. Whether a
      repeatability contribution of zero for the best existing device is
      the intended reading or an over-reach turns on what 'demonstrably
      realizable' demands as evidence, which the policy leaves to the
      reader.
    alternativeViews:
      - position: >-
          Where a best existing device could genuinely contribute nothing from
          repeatability, taking that contribution as zero is the intended
          reading, and a laboratory that declines to do so publishes a
          capability worse than its equipment supports.
        basis: >-
          The allowance is stated deliberately and applies to the best device,
          not a typical one. A CMC is by construction a best case; building
          typical-device behaviour into it confuses the capability figure with
          the reported figure, which is exactly the conflation the
          substitution exists to prevent. The conservatism belongs on the
          certificate, where the substitution puts it.
        heldBy: >-
          Common in electrical and dimensional calibration, where a stable
          transfer standard genuinely exists and is routinely seen.
      - position: >-
          Taking the contribution as zero is defensible only where a device
          that behaves that way is actually seen in the laboratory, and
          otherwise produces a capability that is demonstrable on paper and
          never realized.
        basis: >-
          The requirement is that the claim be demonstrably realizable, which
          is a statement about evidence rather than about arithmetic. A zero
          taken from a device the laboratory has never calibrated cannot be
          demonstrated, and the resulting figure misleads a customer comparing
          scopes — the comparison a scope of accreditation exists to support.
        heldBy: >-
          Common among assessors, and in disciplines where no device is stable
          enough for the question to be theoretical.
citations:
  - source: ILAC-P14-2020
    clause: "2.1"
    relevance: >-
      The agreed definition of a CMC as a capability available to customers
      under normal conditions, as described on a scope of accreditation or
      published in the KCDB. The definition s01 is built on.
  - source: ILAC-P14-2020
    clause: "4.1"
    relevance: >-
      The four things a scope entry must express — measurand, method and
      instrument type, range, and measurement uncertainty. s01 uses this to
      distinguish a capability from a prediction about a particular job.
  - source: ILAC-P14-2020
    clause: "4.3"
    relevance: >-
      That the CMC quoted shall include the contribution from a best existing
      device such that the claim is demonstrably realizable, and that the
      figure is an expanded uncertainty at approximately 95 percent. The basis
      of s02.
  - source: ILAC-P14-2020
    clause: "5.4"
    relevance: >-
      The substitution itself — certificate uncertainty covers the same
      contributions as the CMC except that components evaluated for the best
      existing device are replaced with those of the customer's device, and
      the consequence that reported uncertainties tend to be larger. s03 and
      s05 rest on this clause.
  - source: ILAC-P14-2020
    clause: "5.5"
    relevance: >-
      That an accredited laboratory shall not report a smaller measurement
      uncertainty than the uncertainty described by its CMC. The floor s04
      describes.
  - source: ISO-IEC-17025-2017
    clause: "7.6.1"
    relevance: >-
      The obligation to identify the contributions to measurement uncertainty.
      The substitution is a change of which contributions apply, so it is an
      identification step before it is a calculation.
  - source: JCGM-100-2008
    clause: "7.2.7"
    relevance: >-
      Reporting each component and how it was obtained. What makes a
      substitution auditable rather than a number a reader must take on trust.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "ILAC-P14:09/2020; ISO/IEC 17025:2017"
  lastVerified: "2026-08-17"
  note: >-
    Tracks ILAC P14 and ISO/IEC 17025. A revision of either should wake this
    article; nothing on a calendar should. P14 was last revised in 2020 to
    reflect the 2017 editions of ISO/IEC 17025 and 17011.
relatedArticles:
  - BOK-0004
authoring:
  createdOn: "2026-08-17"
---

A laboratory holds one capability figure per scope entry and issues many
certificates against it. The relationship between the two is not equality, and
treating it as equality is among the most common uncertainty findings an
assessor writes. The capability describes the best the laboratory can do; the
certificate describes what it did, to the thing that arrived.

## What a CMC claims, and what it does not {#s01}

A calibration and measurement capability is a capability available to customers
under normal conditions, published either on a scope of accreditation granted
by a signatory to the ILAC Arrangement or in the BIPM key comparison database.
The definition is agreed jointly between ILAC and the CIPM, which matters
because a scope entry is meant to be comparable across laboratories and across
economies; a figure that meant something different in each would not support
the comparison it exists for.

The names have moved and the concept has not. On 1 January 2026 ILAC and the
International Accreditation Forum merged into Global Accreditation Cooperation
Incorporated, and the ILAC Arrangement and the IAF Multilateral Recognition
Arrangement became a single Global ACI arrangement. P14 was written before that
and still says *ILAC Arrangement*, so this article uses the policy's own wording
where it cites the policy — a document is not renamed by its publisher merging.
A reader working today should take *a signatory to the ILAC Arrangement* to mean
a signatory to the arrangement that succeeded it, and should expect to keep
meeting both predecessor marks: they remain valid until the Global ACI mark is
fully adopted.

A scope entry expresses four things: the measurand, the calibration method or
procedure and the type of instrument it applies to, the measurement range with
any additional parameters, and the measurement uncertainty. All four are load
bearing. A capability quoted without the instrument type is not resolvable
against a real job, and a capability quoted without the range invites
interpolation the laboratory never claimed.

The word *capability* is doing precise work. The figure is not a prediction
about any individual calibration, and it is not an average over the
laboratory's customers. It is the smallest uncertainty the laboratory can be
expected to achieve, under normal conditions, on a device that does not
obstruct it. Everything about how it is derived follows from that, and so does
everything about why the certificate figure differs.

Older scopes carry the term *best measurement capability*. It is the same
concept under the name used before ILAC and the BIPM harmonized the vocabulary
on CMC, and a scope still using it is not making a different claim.

## The best existing device {#s02}

A capability figure cannot be evaluated in the abstract. Uncertainty is a
property of a measurement, and a measurement requires something measured — so
a laboratory deriving a CMC must decide what it is calibrating, and the answer
is the best existing device.

That term has a specific meaning: a device to be calibrated that is
commercially or otherwise available to customers. It may have unusually good
stability and it may have a long calibration history, but it must be a device a
customer could actually present. It is not a hypothetical perfect artefact, and
it is not the laboratory's own reference standard.

Where such a device could contribute nothing from repeatability, the evaluation
may take that contribution as zero. This is a narrow allowance and it is often
misread as a general one. It reaches the repeatability contribution only: the
other fixed uncertainties associated with the best existing device remain in the
budget, and a CMC that has quietly dropped them is not the figure the policy
describes. Section s07 records a live disagreement about how far the allowance
should be pushed.

The governing test is that the CMC claimed be *demonstrably realizable*. That is
an evidential standard, not an arithmetical one. It asks whether the laboratory
could show an assessor a calibration in which the figure was achieved, and a
budget assembled from favourable assumptions about a device nobody has seen does
not meet it.

## The substitution at the certificate {#s03}

The operation that converts a capability into a reported uncertainty is a
substitution, and it is worth stating as a procedure because it is short enough
to be done wrongly by omission.

The uncertainty stated on the certificate covers the same contributions that
were included in the CMC evaluation, with one change: the components evaluated
for the best existing device are **replaced** by the corresponding components
for the customer's device. To those are added the relevant short-term
contributions present during that calibration, and any other contribution
reasonably attributable to the device that arrived.

Three consequences follow, and the third is the one that gets missed.

First, the reported uncertainty tends to be **larger** than the CMC. The
customer's device is by construction no better than the best existing one, so
each replaced component is at least as large as the component it replaces.
A laboratory whose certificates routinely report exactly its CMC is either
calibrating only best-in-class devices or has not performed the substitution.

Second, the substitution is a replacement, not an addition. The customer
device's contributions do not sit alongside the best existing device's; they
stand in their place. Adding them produces a figure that double counts the
device, which is the same defect in the opposite direction and is treated in
`BOK-0004`.

Third, the substitution is per certificate, not per scope entry. Two customers
sending different instruments against the same scope line receive different
uncertainties, and that is the intended behaviour rather than an inconsistency.
A laboratory that finds this administratively inconvenient has identified a real
cost of accreditation, not an argument against the rule.

## The floor, and why it points the other way {#s04}

Because the definition of a CMC is what it is, an accredited laboratory shall
not report a measurement uncertainty smaller than the uncertainty described by
the CMC for which it is accredited.

The constraint is easy to state and easy to misapply, because it points in the
opposite direction from the substitution and the two are often met at the same
moment. The substitution says the reported figure moves *up* from the CMC as the
device gets worse. The floor says it may never move *down*, whatever the
arithmetic produces.

A budget that comes out below the CMC is therefore not a happy result; it is a
signal. Either the calculation has lost a contribution, or the laboratory is
genuinely working better than its accredited capability and the scope entry is
out of date. The first is a defect and the second is an administrative task, but
neither is resolved by reporting the smaller number.

The asymmetry is deliberate. Reporting too small an uncertainty transfers risk
to the customer, who may accept a result that should have been questioned.
Reporting too large a figure costs the laboratory work. Only one of those
errors is borne by somebody who did not make it.

## What the laboratory cannot know {#s05}

Some contributions belong to the device's life outside the calibration:
transport to and from the laboratory, handling, storage, and the conditions of
its use afterwards. These cannot be known by the laboratory and are normally
excluded from the uncertainty statement.

The exclusion is a default rather than a licence. Where a laboratory
anticipates that such contributions will significantly affect the uncertainties
it has attributed, the customer should be notified — through the ordinary
provisions for tenders and contract review — rather than left to discover it. A
transport contribution that dominates the reported uncertainty and appears
nowhere in the conversation is a defensible certificate attached to a misleading
result.

This is the boundary between what the certificate asserts and what the customer
must manage. The certificate speaks about the device as presented, at the time
of calibration. Everything after that is the holder's, and saying so plainly is
part of reporting well.

## When there is no best existing device {#s06}

In a small number of cases — evidenced in a limited number of CMCs in the
KCDB — a best existing device does not exist, or the contributions attributable
to the device may significantly affect the uncertainty in a way that has no
representative value.

Where the device's contributions can be separated from the others, they may then
be excluded from the CMC statement. This is the one route by which a CMC
legitimately does not include a device contribution, and it comes with a
condition: the scope of accreditation shall clearly identify that the
contributions from the device are not included.

The condition is the substance of the exception, not a formality attached to it.
A CMC excluding device contributions and a CMC including them are different
kinds of claim, and a reader comparing two scopes has no way to tell them apart
unless the scope says so. An unmarked exclusion produces a figure that looks
better than a competitor's while describing less, which is precisely the
comparison a scope of accreditation exists to make possible.

## How aggressively the repeatability allowance may be read {#s07}

Practitioners disagree about how far to press the allowance described in s02,
and the disagreement is recorded here rather than resolved because it turns on
what a laboratory can evidence rather than on what the policy says.

Both positions are set out in this article's `alternativeViews`. The reading
that permits a zero repeatability contribution treats the allowance as
deliberate and holds that conservatism belongs on the certificate, where the
substitution puts it. The reading that restricts it holds that *demonstrably
realizable* is an evidential test which a device nobody has calibrated cannot
pass.

What is not in dispute is narrower than the argument suggests, and is worth
separating out. The allowance reaches repeatability only. The other fixed
contributions associated with the best existing device remain in the budget
under either reading, and a CMC that has dropped them is not defended by either
position.
