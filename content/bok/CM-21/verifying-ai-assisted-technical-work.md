---
id: BOK-0008
title: Verifying references in AI-assisted technical work
subjects:
  - CM-21
status: draft
summary: >-
  Why a language model produces citations that look exactly like real ones,
  what checking a clause reference actually involves, and the failure that
  survives every check short of reading the clause — a reference that resolves
  to a real document and a real clause which does not say what it was cited
  for. Written because this project assumes practitioners use AI and designs
  assessment on that assumption, and because a corpus whose value is
  auditability is the worst possible place for an invented clause number.
sections:
  - id: s01
    heading: The assumption this rests on
    covers: >-
      That practitioners use AI assistance and that pretending otherwise
      produces worse guidance than engaging with it, and what that means for
      where the competence sits.
  - id: s02
    heading: Why a generated citation looks right
    covers: >-
      What a model is doing when it produces a clause number, why the output is
      well formed and plausible whether or not it is true, and why fluency
      carries no information about correctness.
  - id: s03
    heading: The four things that can be wrong with a reference
    covers: >-
      Document, edition, clause number and claim — four independent failure
      points, checkable by increasingly expensive means.
  - id: s04
    heading: The failure that survives checking
    covers: >-
      A reference that resolves to a real clause which does not support the
      claim it was attached to, why no structural check finds it, and what does.
    consensus: broadly-accepted
  - id: s05
    heading: Working practices that reduce the exposure
    covers: >-
      Citing only what you have read, recording the edition, separating claims
      that rest on a reference from claims that do not, and declining to cite
      rather than guessing.
citations:
  - source: ISO-IEC-17025-2017
    clause: "8.3.2"
    relevance: >-
      Control of documents of external origin. A clause reference that does not
      exist is an uncontrolled document at the point where it is relied on, and
      the framework already forbids that even though it says nothing about how
      the reference was produced.
  - source: ISO-IEC-17025-2017
    clause: "6.2.1"
    relevance: >-
      Personnel shall be competent for the activities they perform. Where a
      tool drafts and a person signs, the competence being exercised is
      verification, and it is the person's whatever produced the draft.
  - source: JCGM-100-2008
    clause: "4.3.1"
    relevance: >-
      Type B evaluation and the standing of the information it draws on. The
      most useful frame available for generated content: a source whose
      reliability has to be established rather than assumed, which is the
      ordinary metrological posture toward any unverified input.
currency:
  authorityStatus: interpretation
  volatility: volatile
  sourceRevision: "ISO/IEC 17025:2017"
  lastVerified: "2026-08-14"
  note: >-
    THIS IS THE PROJECT'S OWN READING, not anybody's requirement. No clause in
    the register says anything about AI-generated references; the clauses cited
    are the nearest existing obligations and the argument connecting them is
    the author's. Volatility is volatile because the tools change on a scale of
    months and parts of s02 will date faster than the rest.
authoring:
  createdOn: "2026-08-14"
---

This corpus assumes candidates use AI assistance during assessment and designs
items on that assumption. It follows that using it well is a competence, and
that the sharpest edge of using it well is knowing what a generated reference
is worth before putting your name to it.

## The assumption this rests on {#s01}

Two positions were available and only one of them survives contact with how
people actually work.

The first is to treat AI assistance as something to be prevented. It requires
proctoring, it fails, and it produces a credential that certifies performance
under conditions nobody works in.

The second is to assume the assistance is present and design around it — which
means items that cannot be passed by an assistant alone, and it means the
competence of *directing and checking* the assistant becomes assessable in its
own right. That is the position taken here.

One consequence is worth stating because it is easy to misread. Assuming the
tool is available is not endorsing its output. It shifts where the competence
sits: not in producing the sentence, but in being able to say whether the
sentence is true, and being answerable for it once it carries your name.

There is a distinction this project holds elsewhere and it applies here.
**AI is a subject and a working tool; it is not in the product.** No generated
output reaches a user as accreditation evidence without a person standing
behind it. That is a rule about the platform. The individual analogue is this
section: whatever drafted it, the signature is yours.

## Why a generated citation looks right {#s02}

A language model produces text that is likely given what came before. A clause
reference in technical prose has a strong shape — a standard's designation, a
number with two or three parts, a plausible subject — and the model reproduces
the shape reliably because the shape is what it has seen.

Whether that particular clause exists, and whether it says the thing, are
different questions, and nothing in producing well-formed text answers them.

The practical consequences are the ones to internalise:

- **A fabricated reference is not garbled.** It is formatted correctly, sits in
  the right numeric range, has a subject that fits the surrounding argument,
  and reads exactly like the real ones beside it. There is no tell in the text.
- **Fluency and confidence carry no signal.** A model states an invented clause
  in the same register as a correct one. Hedging, where it appears, does not
  correlate with the parts that are wrong.
- **The plausible ones are the dangerous ones.** An obviously wrong reference
  gets caught. A reference that is off by one subclause, or that names the
  right document and the wrong edition, passes a skim by somebody who knows the
  area — because it is *nearly* what they were expecting.
- **It gets worse as the source gets more obscure.** Widely quoted clauses tend
  to come out right. A clause from a document that is behind a paywall, rarely
  cited, or recently revised is where the failure concentrates — and that
  describes most of the standards a metrologist works from.

## The four things that can be wrong with a reference {#s03}

Four independent failure points. They cost different amounts to check, and the
cheap checks do not cover the expensive one.

**The document.** Does the standard exist, under that designation? Cheapest to
check and the least common failure. Watch for plausible composites — a real
committee, a real numbering scheme, a number nobody issued.

**The edition.** Does the edition cited exist, and is it the one in force?
A real document with an invented year, or a superseded edition cited as
current, is common and consequential, because clause numbers move between
editions. A reference that was correct in an earlier edition and is now wrong
is not a fabrication at all, and it fails in exactly the same way.

**The clause number.** Does that clause exist in that edition? This needs the
document. Numbers outside the document's range are catchable by someone who
knows it; numbers inside the range are not catchable by any means except
looking.

**The claim.** Does the clause say what it is cited for? This needs the
document open at that clause, and it is the subject of the next section.

The important structural point: **each check requires more access than the one
before, and only the last one is about whether the statement is true.** A
reference can pass the first three and fail the fourth, and the first three are
the ones that get done.

## The failure that survives checking {#s04}

The clause resolves. It exists. It is in the right document and the right
edition. And it does not say what the passage claims.

This is the failure worth building a competence around, because every check
short of reading the clause passes it. Someone verifying the reference confirms
it resolves and moves on, and the confirmation feels like verification while
having tested nothing about the claim.

It arises in recognisable forms:

- **A clause about a neighbouring subject.** The reference points at the
  requirement to identify uncertainty contributions and is cited for how to
  combine them. Adjacent, plausible, wrong.
- **A general clause cited for a specific requirement it does not contain.**
  The clause imposes an outcome; the passage attributes a method to it that the
  clause leaves entirely open. This is the most common form and the hardest to
  see, because the attributed method is usually good practice.
- **A clause that says less than claimed.** It recommends where the passage
  says requires, or applies to a case narrower than the one under discussion.
- **A note read as a requirement.** Notes in standards are frequently
  informative rather than normative, and the distinction disappears in a
  paraphrase.

**And this is not only an AI problem.** All four forms predate the tools and
appear throughout human technical writing, usually by inheritance — a citation
copied from a paper that copied it from another, nobody in the chain having
opened the standard. What the tools change is the *rate*, and the fact that the
usual defence, that a citation has been through several careful readers, no
longer holds.

The only check that finds it is reading the clause and asking whether it
supports the specific claim it is attached to. There is no cheaper substitute,
and the honest posture is to treat an unread citation as unverified regardless
of how it was produced.

This section is marked broadly-accepted rather than established for a narrow
reason: the *phenomenon* is not in dispute, and how much verification is
proportionate for routine internal work is a genuine and unsettled question of
professional practice.

## Working practices that reduce the exposure {#s05}

None of these is a rule anybody has published. They are the practices that
follow from the sections above.

**Cite what you have read, and not otherwise.** The strongest single practice
and the least followed. If the clause has not been opened, the reference is a
guess with formatting.

**Record the edition you consulted.** Clause numbers move. A reference without
an edition is unverifiable the moment the standard is revised, and it silently
becomes wrong rather than becoming obviously stale.

**Separate the claims that rest on a reference from the claims that do not.**
Much technical writing is the author's own reasoning, which needs no citation
and is weakened by a decorative one. Attaching a reference to a claim that did
not need it creates an obligation to verify that nobody asked for, and it is
where invented citations mostly appear.

**Decline to cite rather than guess.** Where a claim needs a reference and the
document is not to hand, the options are to get the document, to soften the
claim to what can be supported, or to mark the reference as unverified. Writing
a plausible clause number is not among them, and it converts a gap somebody
could have closed into a defect nobody will find.

**Treat generated output as an unverified source.** This is the ordinary
metrological posture and it needs no new framework: information whose
reliability has not been established is weighed accordingly, and the weight is
zero until somebody establishes it. What is new is only how much of it there
is, and how well formed.

**Check your own tooling's reach.** Automated checks tend to verify that a
cited source is *registered* rather than that the clause exists or supports the
claim — which is a check on the bibliography, not on the citation. Knowing
precisely which of the four failures in s03 your process actually catches is
more useful than a general intention to be careful, and most processes catch
the first two.
