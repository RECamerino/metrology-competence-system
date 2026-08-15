---
id: BOK-0010
title: Digital calibration certificate structure and content
subjects:
  - DP-20
status: draft
summary: >-
  What a machine-readable calibration certificate has to carry, why the hard
  part is representing a quantity with its unit and uncertainty rather than
  moving a PDF into XML, and which parts of the design the field has settled
  and which it has not. The reporting obligations a DCC carries are normative
  and unchanged — a certificate is a certificate whatever its format. How to
  represent them so that software can act on them is emerging, and this article
  says which is which at every point.
sections:
  - id: s01
    heading: The problem a DCC solves
    covers: >-
      Why a PDF is not data, what a receiving laboratory currently does by
      hand, and the specific errors that survive because a human retypes a
      number.
  - id: s02
    heading: What has to be in it, and where that comes from
    covers: >-
      The reporting requirements a calibration certificate carries regardless
      of format, and why the DCC's content model is fixed by them rather than
      by a schema designer's judgement.
  - id: s03
    heading: Representing a quantity
    covers: >-
      Value, unit and uncertainty as one object rather than three fields, why
      the unit has to be machine-interpretable rather than a string, and what
      breaks when it is not.
  - id: s04
    heading: Identity, traceability and signature
    covers: >-
      Identifying the item, the standards and the issuing laboratory so a
      consumer can resolve them, and what a signature over the document does
      and does not establish.
  - id: s05
    heading: What is settled and what is not
    covers: >-
      The parts of DCC design that are stable enough to build against, and the
      parts still moving — uncertainty representation beyond a single expanded
      figure, conformity statements, and how a consumer validates what it
      receives.
    consensus: contested
    alternativeViews:
      - position: >-
          A DCC should carry a rich machine-readable model of the measurement,
          including the uncertainty budget and the correlation structure, so
          that a consumer can propagate the result correctly into its own
          budget.
        basis: >-
          A single expanded uncertainty with a coverage factor discards
          everything a downstream user needs to combine the result correctly,
          and the whole point of machine-readable data is that the consumer is
          software that could act on the richer model if it were given one.
        heldBy: >-
          Common in national metrology institute work and in the digital-SI
          community.
      - position: >-
          A DCC should carry what a paper certificate carries, in a form
          software can parse, and no more. The richer model belongs in an
          optional extension.
        basis: >-
          Requiring a full budget in every certificate imposes a cost on every
          issuing laboratory for a capability few consumers can use, and a
          schema that mandates content laboratories cannot supply will be
          populated with placeholders — which is worse than omitting it.
        heldBy: >-
          Common in accredited commercial calibration and among laboratory
          information system vendors.
citations:
  - source: ISO-IEC-17025-2017
    clause: "7.8.2"
    relevance: >-
      Common requirements for reports. The content a certificate must carry,
      which is format-independent and therefore fixes what a DCC has to be able
      to express. Section s02 rests on this.
  - source: ISO-IEC-17025-2017
    clause: "7.8.4"
    relevance: >-
      Specific requirements for calibration certificates, including reporting
      the measurement uncertainty and the traceability of results. The clause
      s03 and s04 have to be satisfiable by whatever representation is chosen.
  - source: ISO-IEC-17025-2017
    clause: "7.8.6"
    relevance: >-
      Reporting statements of conformity and the decision rule applied. One of
      the parts s05 identifies as unsettled — the obligation is clear and the
      machine-readable form of it is not.
  - source: JCGM-200-2012
    clause: "1.1"
    relevance: >-
      Quantity, and the structure of a quantity value as a number and a
      reference. The conceptual basis for treating value, unit and uncertainty
      as one object rather than three independent fields.
  - source: JCGM-100-2008
    clause: "7.2.1"
    relevance: >-
      Reporting uncertainty, including what must accompany a stated figure for
      it to be interpretable. What a DCC's uncertainty representation has to
      preserve, and the reason a bare number in a field is insufficient.
currency:
  authorityStatus: emerging
  volatility: volatile
  sourceRevision: "ISO/IEC 17025:2017"
  lastVerified: "2026-08-14"
  reviewDue: "2027-02-14"
  note: >-
    EMERGING, and the distinction matters here more than usual. The reporting
    obligations cited are normative and stable. The machine-readable
    representation of them is not settled, schemas are actively changing, and
    parts of s03 and s05 will date within a year. A six-month review is set
    explicitly rather than inherited from volatility.
authoring:
  createdOn: "2026-08-14"
---

A calibration certificate is a document that a person reads and then retypes
into something else. Every laboratory that receives one does this, and the
retyping is where a measurable share of downstream error comes from.

A digital calibration certificate is the same certificate as data. That
sentence is easy to say and it hides where the difficulty actually is, which is
not the file format.

## The problem a DCC solves {#s01}

A PDF certificate contains the information and does not make it available. A
receiving laboratory reads the value, the uncertainty and the calibration date,
and enters them into an asset system, an uncertainty budget or a procedure.

Four things go wrong in that step, and none of them is exotic:

- **Transcription.** A digit dropped, transposed or misread. The commonest, and
  the least likely to be caught because the source document is filed and never
  compared again.
- **Unit and prefix.** Microvolts entered as millivolts. Survives because the
  number looks reasonable in either.
- **Coverage.** An expanded uncertainty entered where a standard uncertainty
  was wanted, or the reverse, because the field the value went into does not
  say which it holds. This is `BOK-0002` §s04 as a data-entry problem.
- **Silent staleness.** A certificate superseded by a recalibration, with the
  old figure still living in a budget nobody revisited.

Machine-readable data removes the first two by construction and makes the
second two detectable. That is the case for a DCC, and it is worth being
precise that it is an *error-rate* argument rather than a modernisation one.

## What has to be in it, and where that comes from {#s02}

The content of a calibration certificate is fixed by the reporting requirements
in ISO/IEC 17025, and those requirements say nothing about format. A
certificate is a certificate whether it is printed, a PDF, or XML.

So the DCC's content model is not a design question. It has to be able to
express, at minimum:

- **Identification** of the laboratory, the customer, the item and the
  certificate itself.
- **What was done** — the method, the conditions, the date of calibration.
- **The results**, each as a value with its unit.
- **The measurement uncertainty** for each result, with what is needed to
  interpret it.
- **Evidence of metrological traceability** for the results reported.
- **Statements of conformity** where given, with the decision rule applied.
- **Who authorised the release.**

This is worth stating plainly because DCC discussions drift quickly into schema
design, and the requirements are settled. What is being designed is a
representation of a known content model — not the content model.

## Representing a quantity {#s03}

Here is the actual difficulty, and it is the part that surprises people coming
from ordinary document engineering.

A measured result is not a number. It is a number, a unit, and an uncertainty,
and the three are meaningless apart. Storing them as three fields in a record
invites exactly the failures in s01: a consumer reads the number, applies its
own assumption about the unit, and has no way to know what the uncertainty
figure is on.

So the object has to travel together, and each part needs care:

**The unit must be machine-interpretable, not a string.** "mV" is a string that
a human resolves and software does not. Two laboratories writing "µV" and "uV"
have written different strings for the same unit, and a consumer comparing them
finds a mismatch. What is needed is a representation software can reason
about — one that knows millivolts and volts are the same kind of thing in a
fixed ratio, and that volts and amperes are not.

**The uncertainty must carry its own interpretation.** A number is not enough.
At minimum a consumer needs to know whether it is standard or expanded, the
coverage factor or probability if expanded, and whether it is absolute or
relative. Every one of those is a field that a paper certificate conveys in
prose and that software cannot infer.

**Relative and absolute must be distinguishable.** A figure of 0.001 attached
to a result of 10 V is a millivolt or a hundredth of a volt depending on a flag
that a human reads from context.

The general principle: **anything a human reader resolves from context has to
be explicit, because the consumer has no context.** Most of the work in a DCC
schema is enumerating those.

## Identity, traceability and signature {#s04}

Three identification problems, in increasing difficulty.

**The item.** A manufacturer, model and serial number, in separate fields
rather than one line, so that a consumer can match it against its own asset
record without parsing.

**The traceability chain.** The standards used, identified well enough that a
consumer can resolve them — which usually means referring to the certificates
those standards hold. Done well this is what makes a chain automatically
traversable, and it is the capability that most distinguishes a DCC from a PDF.
Done as free text it is a PDF with angle brackets.

**The issuing laboratory**, including its accreditation, identified so that a
consumer can check it rather than recognise it.

Then the signature. A cryptographic signature over the document establishes
that it has not been altered since signing and that it was signed by the holder
of a particular key. That is worth having and it is narrower than it sounds:

- It says nothing about whether the *content* is correct.
- It says nothing about whether the signer was competent or accredited to issue
  it — that requires resolving the signer's identity against something that
  records their standing, which is a separate infrastructure.
- Its value depends entirely on the consumer being able to resolve the key
  offline, at the time they read it, which may be years later.

Those constraints are not specific to certificates and are the same ones any
signed-credential system faces.

## What is settled and what is not {#s05}

Settled enough to build against: the content model, per s02; the need for
machine-interpretable units; the separation of value, unit and uncertainty as
one object; and identification of item, laboratory and standards.

Not settled, and worth knowing before committing to an implementation:

**How much of the uncertainty to carry.** A single expanded figure with a
coverage factor is what a paper certificate gives and is what most schemas
require. Whether a DCC should carry the budget itself — contributions,
sensitivity coefficients, correlation structure — is genuinely disputed, and
both positions are recorded in this section's metadata. The disagreement is
about cost and adoption as much as about metrology.

**Conformity statements.** The obligation to state the decision rule is clear.
Representing a decision rule in a form software can apply is not, and it runs
into the same difficulty as `authorization.scope` elsewhere in this project: a
rule that participates in computation cannot exist only as prose.

**Validation on receipt.** What a consuming laboratory should check, and what
it should do when a certificate is well formed but incomplete, has no agreed
answer. Schema validity is not sufficiency, and the gap between them is where
implementations currently differ most.

**Versioning and amendment.** Certificates get amended. How an amended DCC
refers to what it replaces, and how a consumer discovers that a certificate it
holds has been superseded, is under-specified nearly everywhere.

None of this argues against adopting a DCC. It argues for knowing which parts
of an implementation are resting on settled ground and which are a bet, and the
list above is the honest division as of this article's review date.
