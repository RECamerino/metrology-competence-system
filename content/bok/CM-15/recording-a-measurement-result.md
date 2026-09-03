---
id: BOK-0007
title: Recording a measurement result so somebody else can rely on it
subjects:
  - CM-15
status: draft
summary: >-
  What a technical record has to contain, why each part is there, how to
  correct an entry without destroying what it said before, and the part no
  clause specifies — writing for the person who reads it next rather than for
  yourself. The record is the only thing that survives the measurement. Nobody
  who reads it later can ask you what you meant, and by then you will not
  remember.
sections:
  - id: s01
    heading: Who the record is for
    covers: >-
      The four readers a technical record actually has, what each needs from
      it, and why the author is not one of them.
  - id: s02
    heading: What it has to contain
    covers: >-
      The categories a technical record must carry to let the measurement be
      repeated and the result be defended — item, method, conditions,
      equipment, observations, person, date.
  - id: s03
    heading: Units, figures and unambiguous notation
    covers: >-
      Writing a value so that only one reading of it is possible, and the
      notations that routinely produce two.
  - id: s04
    heading: Correcting an entry without obscuring it
    covers: >-
      Why the original has to remain legible, what a correction has to carry
      with it, and the difference between correcting a record and rewriting
      one.
  - id: s05
    heading: Writing for the person who reads it next
    covers: >-
      The craft part, which no clause specifies — deciding what the reader will
      need, and noticing which of your entries only make sense to you.
    consensus: broadly-accepted
citations:
  - source: ISO-IEC-17025-2017
    clause: "7.5.1"
    relevance: >-
      Technical records shall contain the results, report, and sufficient
      information to facilitate identification of factors affecting the result
      and its uncertainty, and to enable repetition. The clause s02 unpacks.
  - source: ISO-IEC-17025-2017
    clause: "7.5.2"
    relevance: >-
      Amendments to technical records shall be traceable to previous versions,
      with the original and amended data retained. The requirement behind s04,
      and the reason overwriting is not correcting.
  - source: ISO-IEC-17025-2017
    clause: "7.8.1.2"
    relevance: >-
      Results shall be provided accurately, clearly, unambiguously and
      objectively. The nearest a clause comes to the craft in s05 — it states
      the obligation and specifies nothing about how to meet it.
  - source: ISO-IEC-17025-2017
    clause: "6.2.1"
    relevance: >-
      Personnel competence for the activities they perform. Recording is one of
      those activities, and treating it as clerical rather than technical is
      how a laboratory ends up with records nobody can use.
  - source: NIST-SP-811-2008
    clause: "7"
    relevance: >-
      Rules and style conventions for expressing values of quantities. The
      conventions s03 relies on for notation that admits only one reading.
      Cited at section level deliberately: s03 draws on the section as a whole
      rather than on one rule within it.
currency:
  authorityStatus: normative
  volatility: controlled
  sourceRevision: "ISO/IEC 17025:2017"
  lastVerified: "2026-08-14"
  note: >-
    Sections s01 to s04 track normative clauses of ISO/IEC 17025. Section s05
    does not and is marked broadly-accepted — no clause requires anybody to
    write well, and the profession nonetheless agrees that it matters.
relatedArticles:
  - BOK-0005
authoring:
  createdOn: "2026-08-14"
---

The measurement ends. The item goes back to the customer, the setup is broken
down, and what remains is what somebody wrote down. Every later question — was
this right, can we do it again, what did we actually promise — is answered from
the record or is not answered.

This is treated as clerical work in a lot of laboratories and it is not. It is
the last technical step of the measurement, and it is the one where the
competence of everything before it either survives or is lost.

## Who the record is for {#s01}

Four readers, and the author is not one of them.

**Somebody repeating the measurement.** Possibly you, in a year, with no
memory of it. They need enough to set the same thing up again and get the same
answer — which is a higher bar than describing what happened.

**Somebody defending the result.** An assessor, a customer's engineer, an
expert in a dispute. They are not asking what you did; they are asking whether
what you did supports the number, and they will look for the conditions, the
equipment, and the judgements you made.

**Somebody investigating a problem found later.** A standard turns out to have
been drifting. Every result it touched has to be reassessed, and the question
is which ones those were and by how much. This reader needs identifiers and
dates, and they need them to be exact.

**Somebody continuing the work.** A colleague picking up a job half done,
who needs to know where you got to and what was still uncertain.

The common thread is that **none of them can ask you**. The record either
carries it or it is gone. Writing as though the reader shares your context is
the single failure that produces all the others.

## What it has to contain {#s02}

The requirement is expressed as an outcome rather than a form: enough to
identify the factors affecting the result and its uncertainty, and enough to
repeat the measurement. Worked into categories, that means:

- **The item.** What was measured, identified unambiguously — a serial number,
  not a description. "The 10 kΩ resistor" identifies nothing in a laboratory
  that owns forty.
- **The method.** Which procedure, at which revision. A procedure reference
  without a revision points at whatever the document says today, which is not
  what was followed.
- **The equipment used**, by identifier, so that a later problem with any of it
  can be traced to the results it touched. This is the entry that makes the
  third reader in s01 possible, and it is the one most often reduced to
  "calibrator".
- **The conditions** the result depends on — temperature and humidity where
  they matter, and they matter more often than people record. A specification
  conditional on 23 °C is unusable without knowing the temperature.
- **The observations as taken.** Raw indications, before correction and before
  rounding. A record that carries only the final value has discarded the
  evidence that the calculation was right.
- **The calculation**, or a reference to the sheet that performed it, including
  which corrections were applied.
- **The result with its uncertainty**, and which is which.
- **Who did it and when.** A date and a person, because both are how anything
  else gets reconstructed.
- **Anything that departed from the plan** — see s05, and record it at the time
  rather than at the end.

The test to apply before closing a record: *could somebody with this document,
the procedure and access to the equipment get my answer without speaking to
me?* If not, something in the list above is missing or is written in a way only
you can read.

## Units, figures and unambiguous notation {#s03}

A value is written so that exactly one reading of it is possible. The failures
are boring and they recur.

**A number without a unit is not a value.** "Reading: 10.004" is a defect,
however obvious the unit seems in context — context is what the reader lacks.

**Digits that outrun the measurement.** Recording an indication to more digits
than the instrument displayed is fabrication. Recording a *result* to more
digits than the uncertainty supports is a claim the measurement does not back:
if the uncertainty is in the third decimal, the sixth decimal is noise
presented as information. Keep raw indications exactly as displayed, and round
the result against its uncertainty.

**Ambiguous separators.** A decimal comma and a thousands comma are the same
character to a reader who does not know which convention you used. Where a
record may be read outside its own laboratory, a space as the thousands
separator removes the ambiguity entirely.

**Unit symbols written casually.** Case is meaningful — a millivolt and a
megavolt differ by nine orders of magnitude and by one keystroke. Symbols are
not abbreviations and do not take a plural or a full stop.

**A sign left off.** A deviation without a sign has lost half its information,
and the half that says whether the instrument reads high or low is the half
somebody will need.

**An entry with two possible referents.** "Reading taken after adjustment" —
adjustment of what, and was the earlier reading before or after? Name the
thing.

## Correcting an entry without obscuring it {#s04}

Records get things wrong and the process for fixing them is fixed, for a
reason that is worth stating plainly: **a record whose history can be edited
cannot be relied on by anybody, including the person who edited it honestly.**
The value of the whole record rests on nobody being able to change it silently,
so the correction procedure protects the author as much as the reader.

On paper: strike the original through with a single line so it stays legible,
write the correction beside it, and add who made it and when. The original
value has to remain readable — an obliterated entry destroys the one thing an
investigator needs, which is what the record said before somebody decided it
was wrong.

Electronically: the system retains both versions with the date, the change and
the person. If it does not, it is not a system for technical records.

**A reason, where the reason is not obvious.** "Transcription error, checked
against instrument log" turns a suspicious alteration into a documented one.
Corrections without reasons are the ones that get questioned years later, when
nobody can supply the reason any more.

And the distinction that matters most: **correcting a record is not rewriting
it.** Copying a messy sheet out neatly and discarding the original destroys the
record and replaces it with a clean document of unknown provenance — even when
every number is faithfully carried across, and even though it looks more
professional. The messy original is the record. The neat copy is a copy.

## Writing for the person who reads it next {#s05}

Everything above can be complied with fully and still produce a record nobody
can use. This section is the part no clause specifies.

The obligation in the standard is that results be clear and unambiguous. That
is an outcome, and it says nothing about how to reach it. What follows is
accepted practice — widely agreed on, nowhere required.

**Decide who the next reader is, and write for them.** A record read only
inside a team that runs this measurement weekly can lean on shared vocabulary.
A record that will be read by a customer's engineer, or an assessor who has
never seen this method, cannot. Most records are written as though the first
case were true, because that is who the author has in mind.

**Notice the entries that only make sense to you.** Abbreviations you coined.
A column heading that means something to whoever set the sheet up. "As usual",
"per SOP", "same as above" — each is a pointer to context that is not in the
document.

**Write the departure at the time.** Something always deviates from the
procedure: an extra stabilization period, a substituted lead, a reading
discarded and retaken. Recorded when it happens, it is an ordinary technical
note. Reconstructed at the end of the day, it is incomplete, and reconstructed
during an investigation it looks like an excuse.

**Say what you were uncertain about.** A record that reports only conclusions
hides the places where a later reader should look hardest. "Third reading
unstable, allowed to settle a further two minutes before recording" is worth
more than a clean column of numbers, because it tells the next person where the
measurement is fragile.

The test, and it is a genuinely useful one: **hand the record to a competent
colleague who was not there, and ask them what they would need to ask you.**
Every question is a defect, and the exercise takes five minutes. Almost nobody
does it.
