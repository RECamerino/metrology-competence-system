# Reviewer programme

**Status: not yet designed. Phase 2 remaining work.**

[`GOVERNANCE.md`](../GOVERNANCE.md) already relies on this document for reviewer standing and for the challenge and revocation process. Those claims currently outrun the machinery, and this file exists so that gap is visible rather than discovered by somebody following a link.

## What is already decided

- **Reviewer authority is itself a verifiable credential**, with a public service record (decision 32). Reviews given to unaffiliated individuals are counted separately and displayed prominently; that count is the prestige signal and it travels onto a CV.
- **No self-signoff, ever** — enforced in `packages/validator/src/credentials.ts`, including the disguised form where one signer is counted twice.
- **Reciprocal review inside a blocking window is flagged** rather than silently allowed. A warning, not an error, because the legitimate case exists in thin domains.
- **Signoff requirements per level** live in `content/competence/taxonomy/proficiency.yaml`, which is steward-controlled.

## What this document has to answer

**The bootstrap problem, first.** As shipped, L3 requires a signer holding L4, L4 requires L5, and L5 requires L5. At launch nobody holds anything, so **only L1 and L2 can be issued and the ladder cannot start**. Whatever the answer is — a founding cohort admitted on demonstrated standing, an authority-tier issuer, or something else — it must be written down before any real credential is issued, and the resulting credentials must carry a permanently visible marker. A bootstrap signer is not the same as a peer-reviewed signer and the two must never look identical.

Then:

- How reviewer standing is earned per element, and how it is lost.
- Calibration and double-scoring procedure at L4–L5, and the disagreement-resolution path.
- The challenge process: who may challenge a credential, how it is evaluated against the archived artifact, and what revocation follows.
- **Reviewer supply in thin domains.** `DP-21-A05` may have a few dozen qualified reviewers worldwide. Open decision 5.
- **Reviewer scoring load.** Rubric-scoring is turning out to be the norm rather than the exception, which raises the human cost of the bank considerably. Open decision 6.
