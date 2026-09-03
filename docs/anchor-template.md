# The per-element anchor template

An anchor says what a person can be **seen to do** for one element at one level. The proficiency ladder in `content/competence/taxonomy/proficiency.yaml` says what a level means in general; the anchor makes it concrete for this element and nothing else.

This template was written after authoring `CM-03-053` rather than before, because the progression it describes was discovered by writing five real anchors and noticing what actually changed between them.

---

## The four axes

What separates L1 from L5 is not "more knowledge". It is four things, and a good anchor moves along them deliberately.

| Axis | L1 | L5 |
|---|---|---|
| **Who frames the problem** | Framed for them, and they are told what to look for | They frame it, including recognizing there is a problem |
| **What is supplied** | Inputs, values and method all given | They select inputs and method, and justify the selection |
| **How covered the case is** | Routine, and the procedure covers it | No established approach settles it |
| **What they answer for** | Nothing — someone else checks | They defend it under challenge, and can bring another person to the same standard |

Written out, the progression reads:

- **L1** — does the thing with the situation framed and the target pointed out.
- **L2** — does it on a supplied artifact using supplied values, and can say what the result means.
- **L3** — does it unaided on a case they have not met before, and records the basis for the choices they made.
- **L4** — handles the case the procedure does not cover, and defends the treatment against someone probing it, including saying what would change their approach.
- **L5** — resolves the case where no established approach gives an answer, states what the remaining assumption costs, and brings another practitioner to the point of doing it unaided.

**L5 requires mentoring** because the ladder says so — `requiresMentoring` is true at that level. An L5 anchor that describes only technical depth is incomplete.

---

## Match the verb to the `kind`

The element's `kind` decides what evidence proves attainment, so it decides what the anchor may describe.

| Kind | The anchor describes | Verbs that fit | Never |
|---|---|---|---|
| `knowledge` | What they can explain, relate, distinguish, analyze | explains, distinguishes, relates, derives, traces, contrasts | Performing a task |
| `skill` | What they can be observed producing or doing | constructs, produces, performs, measures, sets up, demonstrates | Understanding the theory |
| `judgment` | What they decide under ambiguity and how they defend it | decides, selects and defends, resolves, concedes, weighs | Recalling the rule that decides it for them |

The commonest error is a knowledge anchor on a skill element. "Understands the effect of stylus geometry on a measured form error" is knowledge. The skill version is "selects and qualifies a stylus for a given feature, and demonstrates the result is insensitive to the choice."

**If you cannot write an anchor of the declared kind, the kind is wrong.** Fix `tools/kind-plan.json`; do not bend the anchor.

### The upper rungs are phrased for `skill` and `judgment` — read them differently for `knowledge`

The progression above says L4 *handles the case the procedure does not cover* and L5 *resolves the case where no established approach gives an answer*. Both describe someone acting. `resolves` is listed in the table you just read as a **judgment** verb, and the same table says a `knowledge` anchor never describes performing a task.

So the two halves of this document contradict each other for a knowledge element above L3, and following either one alone produces a bad anchor. This was found by authoring `CM-08-038` and `DP-20-002`, both `knowledge` at ceiling 5, and both needing the same fix.

**For `knowledge`, the upper levels are about giving an account, not reaching a verdict.**

| | `skill` / `judgment` | `knowledge` |
|---|---|---|
| **L4** | Handles the case the procedure does not cover, and defends the treatment | **Explains why the established accounts diverge on this case**, contrasts what each treats as the thing that matters, and traces the divergence to its actual source rather than to one being stricter |
| **L5** | Resolves the case no approach settles, states what the assumption costs | **Gives an account of a genuinely unsettled question** — states each position as its holders would recognize it, says what turns on each, and says what evidence would settle it and why none currently does |

L5 still requires mentoring, on knowledge exactly as on the others.

This is a real competence and not a weaker substitute for deciding: knowing a live disagreement well enough to argue either side, and to say what would end it, is what distinguishes someone who has read the field from someone who has read one paper. It is also what keeps the boundary clean — `CM-08-038` (`knowledge`) gives the account, `CM-08-039` (`judgment`) makes the call, and an item that asks a candidate to *choose* is testing the second one.

**The check to apply:** if a knowledge element's L4 or L5 anchor could be satisfied by picking a side, it has drifted into judgment. Either rewrite it, or the `kind` is wrong.

**Scale, so this is not treated as an edge case:** 953 elements are `knowledge`, 17.6 % of the corpus, and 108 of them carry a ceiling of 5.

---

## Unobservable phrasing is rejected mechanically

CI fails an anchor containing *understands*, *familiar with*, *aware of*, *has knowledge of*, *appreciates*, *expert in*, or *proficient in*.

These describe a state of mind. Nobody can observe them, two assessors will not agree on them, and an anchor built from them cannot be tested by any item. The last two are worse than vague: they restate the level's name instead of saying what the person does at it.

This is a lint, not a judgement. Passing it does not make an anchor observable — only that it avoids the phrases that guarantee it is not.

---

## Working from a real element

`CM-03-053` — correlated input quantities, `kind: skill`, ceiling 5.

> **L1** — *Given a budget in which two inputs are traceable to the same reference standard, and having been told what to look for, flags the pair as correlated rather than carrying them as independent lines.*

Framed for them; the target is pointed out; the action is a single observable one.

> **L3** — *Constructs a budget containing a covariance term for a measurement they have not worked on before: identifies the correlated inputs without being prompted, selects a correlation coefficient, records the basis for that selection…*

Novel case; nothing supplied; the basis is recorded, which is what makes it reviewable.

> **L5** — *Resolves a budget where the correlation structure cannot be estimated from data and a full bound would make the result unusable: produces a defensible treatment, states plainly what is assumed and what the assumption costs, and brings another practitioner to the point of doing the same work unaided.*

No established approach settles it; the cost of the assumption is stated; and the mentoring requirement is met.

---

## Ceilings below 5

Most elements stop at 3. Write the anchors for the levels that exist and stop — the validator rejects an anchor above `levelCeiling`, and inventing an L5 for an element with no expert practice is how ceilings get inflated.

**The test for an L5 ceiling is now sharper than "can I write an anchor".** If no *item* can be bound at L5 that a competent practitioner could genuinely fail, the element is not L5. `ARC-0003` — defend a choice against a stated alternative — exists for that shape: an element that cannot support a defensible disagreement probably has no expert practice in it.

---

## Before you commit

- One anchor per level from 1 to `levelCeiling`, none above it.
- Every anchor describes an action somebody could watch.
- The verbs match the declared `kind`.
- The L5 anchor, if there is one, includes bringing someone else to competence.
- Each level differs from the one below on at least one of the four axes — not merely in adjectives.
