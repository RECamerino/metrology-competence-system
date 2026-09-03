---
id: BOK-0005
title: Resolution, accuracy and what an instrument specification claims
subjects:
  - DP-08
  - CM-03
status: draft
summary: >-
  Three words that get used as though they meant the same thing and do not,
  what a digit count actually tells you, how a specification written as a
  percentage of reading plus a number of counts turns into a permitted error at
  an operating point, and the conditions a specification quietly depends on.
  Written for somebody at the start of the discipline. Getting these apart is
  the difference between reading an instrument and measuring with one, and an
  instrument with more digits than another is not thereby more accurate.
sections:
  - id: s01
    heading: Three words that are not synonyms
    covers: >-
      Accuracy, precision and resolution as separate properties, what each one
      does and does not tell you, and why an instrument can have any
      combination of them.
  - id: s02
    heading: Digits, counts and what a display can show
    covers: >-
      What a digit count or a count figure means, how it fixes the smallest
      increment at each range, and why that increment is a floor on what can be
      seen rather than a statement about correctness.
  - id: s03
    heading: What a specification promises
    covers: >-
      The percentage-of-reading plus counts form, why it has two parts, and
      which part dominates at the top and bottom of a range.
  - id: s04
    heading: Computing the permitted error at an operating point
    covers: >-
      Working the specification into a figure in the units of the measurement,
      and the limits it puts on the reading.
  - id: s05
    heading: The conditions a specification depends on
    covers: >-
      Temperature band, warm-up, time since calibration and range — the
      qualifiers that make a quoted figure conditional, and what happens
      outside them.
citations:
  - source: JCGM-200-2012
    clause: "2.13"
    relevance: >-
      Measurement accuracy — closeness of agreement between a measured value
      and a true value. The definition s01 separates from the other two, and
      the one most often used loosely to mean all three.
  - source: JCGM-200-2012
    clause: "2.14"
    relevance: >-
      Measurement trueness, which is the part of accuracy that concerns
      systematic departure. Needed in s01 because accuracy is commonly used
      when trueness is meant.
  - source: JCGM-200-2012
    clause: "2.15"
    relevance: >-
      Measurement precision — closeness of agreement between repeated
      measurements. Independent of trueness, which is the point s01 turns on.
  - source: JCGM-200-2012
    clause: "4.19"
    relevance: >-
      Resolution of a displaying device: the smallest difference in indication
      that can be meaningfully distinguished. What a digit count fixes, and
      what s02 is about.
  - source: JCGM-200-2012
    clause: "4.26"
    relevance: >-
      Maximum permissible measurement error — the extreme value permitted by
      specification for a given measuring instrument. What s03 and s04 compute.
  - source: JCGM-100-2008
    clause: "4.3.1"
    relevance: >-
      Type B evaluation and the pool of information it draws on. A
      manufacturer's specification is the commonest such source, which is why
      this article serves CM-03 as well as DP-08.
currency:
  authorityStatus: authoritative
  volatility: static
  sourceRevision: "JCGM 200:2012 (VIM 3rd edition)"
  lastVerified: "2026-08-14"
  note: >-
    The definitions are settled measurement science rather than a requirement
    anybody can be held to, which is why the standing is authoritative and not
    normative. The concepts do not change; the vocabulary document does, slowly.
relatedArticles:
  - BOK-0002
authoring:
  createdOn: "2026-08-14"
---

An instrument's datasheet is the first document most people in this discipline
have to read carefully, and it is written in a vocabulary that overlaps with
ordinary English in a way that misleads. Three of the words matter more than
the rest.

## Three words that are not synonyms {#s01}

**Resolution** is the smallest change the instrument can show you. It is a
property of the display and the conversion behind it. An instrument that reads
to a thousandth of a volt has a resolution of a thousandth of a volt, and that
is all that follows from it.

**Precision** is how closely repeated measurements of the same thing agree with
each other. It says nothing about whether they are right. An instrument that
reads the same wrong value every time is precise.

**Accuracy** is how close a measured value is to the true value. It is the
property people usually mean when they say any of the three, and it is the only
one of the three that cannot be established by looking at the instrument — it
requires comparison against something known.

The three are independent, and every combination occurs:

- **High resolution, poor accuracy.** A meter reading to six digits with a
  failed reference. This is common and it is dangerous, because the extra
  digits read as confidence.
- **Good precision, poor accuracy.** A meter with a stable offset. Repeat it
  all day and the scatter is tiny; every reading is wrong by the same amount.
  Only a comparison against a standard reveals it.
- **Good accuracy, poor precision.** A noisy instrument whose readings average
  to the right value. Any single reading may be some way off, and averaging
  helps in a way it cannot help the previous case.

A fourth term is worth having because it sits underneath accuracy.
**Trueness** is the systematic part — how close the *average* of many readings
comes to the true value. Accuracy in careful use covers both trueness and
precision together; in loose use it means trueness alone. Where the distinction
matters, say which one you mean.

## Digits, counts and what a display can show {#s02}

Instruments are sold by their digit count, and the figure is quoted in two
conventions.

**Digits, sometimes with a half.** A "5½-digit" meter shows five full digits
that run 0 to 9 and a leading digit with a restricted range — typically 0 or 1.
So it displays up to about 199999 rather than 999999.

**Counts.** The same thing said directly: the largest number the display can
show. A 200000-count meter and a 5½-digit meter are describing the same
capability.

Either way, the figure fixes the **resolution at each range**, and the
arithmetic is: range full-scale divided by the count. On a 2 V range a
200000-count meter resolves to about ten microvolts.

Two things follow that are missed constantly.

**Resolution is a floor on what you can see, not a statement about what is
correct.** The meter above resolves to ten microvolts on that range. Its
accuracy specification at the same range will be some multiple of that —
frequently a hundred times it. The last two or three digits are showing you
detail that the specification does not stand behind. They are not useless: they
let you see *changes* and *scatter* well below the accuracy figure, which is
exactly what you want when comparing two things or watching for drift. They are
simply not a claim about the absolute value.

**More digits does not mean more accurate.** A 6½-digit handheld can be less
accurate than a 4½-digit reference meter, and frequently is. The digit count is
one number and the accuracy specification is a different number, printed
elsewhere on the same page, and there is no relationship between them that you
can rely on.

## What a specification promises {#s03}

The usual form is two parts added together:

> ± ( a % of reading + b counts )

or the same idea written as a percentage of reading plus a percentage of range.
The two parts exist because instrument errors come in two shapes.

**The percent-of-reading part scales with what you are measuring.** It covers
gain error — the instrument's scale factor being slightly off. Measure twice as
much and this contribution doubles.

**The counts part does not scale.** It covers offset, noise and quantization —
errors that are the same size whatever you are measuring.

The consequence is the single most useful thing in this article: **the same
instrument is proportionally far worse at the bottom of a range than at the
top.** At full scale the reading term dominates and the counts term is
negligible. At a tenth of full scale the counts term is ten times larger as a
fraction of the reading. At a hundredth it dominates completely.

Which is why, when you have a choice, you measure on the lowest range that will
accommodate the signal — and why a reading of 0.02 V taken on a 1000 V range
may be worthless even though the display shows it perfectly happily.

## Computing the permitted error at an operating point {#s04}

Take the reading, take the range, apply both terms, add them.

Worked in the abstract, because the arithmetic is the easy part and the
bookkeeping is where it goes wrong:

1. **Compute the reading term.** The stated percentage, of the *reading* — not
   of the range, and not of full scale.
2. **Compute the counts term.** The stated number of counts, multiplied by the
   resolution *at the range in use*. This is where the digit count from s02 is
   actually needed, and where the error is usually made: the resolution differs
   per range, so the same "5 counts" is a different voltage on every range.
3. **Add them.** The result is the maximum permissible error at that point, in
   the units of the measurement.
4. **Turn it into limits** if that is what you need — the reading plus and
   minus the figure.

Two habits worth forming. Carry the units at every step, because the two terms
arrive in different forms and only convert into the same units at the end. And
state the range you assumed, because the answer is not defined without it and
somebody checking your work cannot reconstruct it.

## The conditions a specification depends on {#s05}

A quoted accuracy is conditional, and the conditions are printed somewhere less
prominent than the number.

- **A temperature band**, typically a narrow one around 23 °C. Outside it a
  temperature coefficient applies, quoted separately, and it is added to the
  figure from s04 rather than replacing it.
- **A warm-up period.** The specification applies after it, not before.
- **A time since calibration** — 90 days, one year, two years. The same
  instrument has several specifications differing only in this, and the
  one-year figure is often twice the 90-day figure. Quoting the tighter number
  for an instrument calibrated eleven months ago is a real and common error.
- **A range**, per s03.
- Sometimes a humidity band, a maximum lead resistance, or a requirement that
  the input be settled for a stated period.

None of this makes the specification unreliable. It makes it a **conditional
statement**, and the condition is part of the claim. An instrument used outside
its stated temperature band has not failed and its specification simply does not
apply — which is a different situation from an instrument that is out of
tolerance, and the two get confused.

The practical form: when you write down a permitted error, write down which
specification you took it from, including the calibration interval and the
temperature assumption. The number alone cannot be checked by anybody, and in
twelve months you will not remember which column you read.
