# Source Licence Register — Policy

> **Not legal advice.** This document describes an engineering policy designed to keep the project defensible. It has not been reviewed by counsel. See [Pending review](#pending-review).

## The problem

Metrology cannot be taught without reference to the documents that define it. Some of those documents are freely licensed — the GUM, the VIM, the SI Brochure, NIST publications. Others are the commercial product of standards developers, and their text cannot be redistributed: ISO/IEC 17025, ASME Y14.5, the ANSI/NCSLI Z540 series.

A body of knowledge that cannot mention ISO/IEC 17025 is useless. A repository that reproduces it cannot be forked, redistributed, or deployed by the organizations that need it. Both failure modes are fatal to the project.

## The resolution

Separate two things that are usually conflated.

**Referencing is universal and mandatory.** Every element in the corpus carries at least one precise, clause-level citation — `ISO/IEC 17025:2017 §7.6.1`, not "see the standard". Citations are statements of fact about where a requirement lives. They require no permission from anyone, they survive every build, and CI rejects an element that lacks one.

**Quoting is separate, optional, and tier-gated.** A quotation is stored as a *typed data object* — source, edition, clause, text, commentary — never as prose baked into a paragraph. Because quotations are data, the build can strip them mechanically, and a report can enumerate every one of them.

That structural choice is what makes the whole thing work. One corpus produces two distributions:

```bash
npm run build:bok -- --strip-tier2   # redistributable: all citations, no restricted text
npm run build:bok                    # full: for organizations holding the licences
```

Both contain every citation. Only the quoted text differs.

## Tiers

| Tier | Meaning | Examples |
|---|---|---|
| **1** | Verbatim quotation permitted within recorded limits | NIST publications (US Government works), JCGM 100/101/102/104/106, JCGM 200 (VIM3), BIPM SI Brochure, ILAC policy documents |
| **2** | Fully referenceable; bounded quotation only; stripped from the redistributable build | ISO/IEC 17025, ISO/IEC 17011, ISO 9001, ISO 10012, ANSI/NCSL Z540-1, ANSI/NCSLI Z540.3, NCSLI RP-1, ASME Y14.5, ISO GPS series, UKAS M3003, EURAMET guides |
| **3** | Reference only. No quotation at all | OIML documents (pending terms review), ASTM standards |

**The default is Tier 3.** A source whose terms are unclear is reference-only until someone documents a basis for promoting it. Promotion requires steward approval and a recorded `termsBasis`.

### Restricted-tier quotation limits

For Tier 2 sources the project-wide defaults are:

- **≤ 25 words** per quotation
- **≤ 2 quotations** from that source within a single element
- **Mandatory commentary** — a quotation must accompany the author's own analysis, never substitute for the clause
- **Mandatory edition and clause** on every quotation
- **Never a complete normative requirement**

These are enforced by the validator, reading the limits from `content/sources/registry.yaml`. They are not style guidance and cannot be waived in review.

Some Tier 1 and Tier 2 sources carry different limits — freely-licensed material gets more room, freely-*downloadable but copyrighted* material like UKAS M3003 gets less than the fully open sources but more than nothing. The register is the authority in every case.

## Why limits live in the register, not the schema

A publisher can change its terms. When that happens it should be a **data change with a documented basis and a review date**, reviewable in a diff by someone who is not a programmer — not a code change buried in a validator. Every entry records:

- `termsBasis` — the documented reason for the classification
- `termsReviewedOn` — when that basis was last checked

A tier assignment without a stated basis is not reviewable, and the schema rejects it.

## What the tooling gives you

```bash
npm run report:quotes
```

Produces a complete manifest of every quotation in the corpus: source, edition, clause, word count, and the element containing it. This is the artifact you hand to counsel. It is not a sample — it is all of them.

```bash
npm run validate
```

Fails the build on: a citation to an unregistered source, a quotation from a Tier 3 source, an over-length quotation, too many quotations from one source in one element, a restricted quotation without commentary, or an element with no citation at all.

## Rules for authors

1. **When in doubt, cite instead of quoting.** A citation is always safe.
2. **Write your own prose.** A paraphrase that tracks the source clause by clause is a copy wearing a disguise, and no validator can catch it.
3. **Never reproduce figures, tables, or diagrams** from a restricted source, under any tier. The quotation limits govern text. Describe the figure in your own words and cite it by number. This matters most in DP-01, where GD&T is intensely figure-dependent.
4. **Cite against a specific edition.** Clause numbering moves. `ISO/IEC 17025:2017 §7.6.1` is a reference; "ISO 17025 section 7.6" is a guess.
5. **If a clause matters and you cannot quote it, explain it.** Tier 3 elements should be *more* substantive, not less — the reader has no quoted text to fall back on, so your explanation is doing all the work.

## Organizations holding licensed copies

An organization that holds ISO/IEC 17025 may inject the actual clause text into its own local deployment through the overlay pipeline described in [`org-data-integration.md`](org-data-integration.md). The overlay is local data, never distributed upstream, and never enters the public repository. This is the same mechanism used for proprietary internal procedures.

## Pending review

Every entry in the register whose classification rests on an interpretation rather than an explicit licence grant is flagged `CONFIRM-WITH-COUNSEL` in its `notes`. **No quotation should be authored against a flagged entry until that review is complete.** Citations are unaffected.

That prohibition is now **executable** rather than advisory: 26 of the 32 entries carry `quotation.blockedPendingCounsel: true`, and the validator rejects a quotation against any of them regardless of the word and count limits recorded beside it. The limits stay in place deliberately — they are the ceiling that takes effect the moment counsel reports, not a claim that quotation is permitted now. Until #31 the marker was prose in `notes` that no code read, while the machine-readable fields next to it said 80 words were fine.

Priority for review, in order:

1. **ISO/IEC 17025:2017** — the most frequently cited restricted source in the corpus.
2. **JCGM documents** — the Tier 1 classification carries the most quotation volume and rests on reading the JCGM copyright statement.
3. **ASME Y14.5** — figure-heavy, and DP-01 depends on it.
4. **BIPM SI Brochure** — verify the Creative Commons statement on the specific edition.
5. **ILAC, UKAS, EURAMET, OIML** — free availability is not the same as a reproduction licence, and the distinction determines their tier.
6. **IEC 60601-1 and IEC 62353** — the weakest classification in the register, and flagged as such in their own `termsBasis`. Tier 2 was assigned **by analogy** with ISO/IEC 17025 rather than from IEC's own terms, which were not reviewed. That is an interpretation of an interpretation. If counsel reaches only one thing on this list beyond item 1, reaching these would convert a guess into a decision.

Record the outcome in each entry's `termsBasis` and `termsReviewedOn`, and remove the flag.
