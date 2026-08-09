# Contributing

Thank you for considering a contribution. This project has an unusually strict content pipeline, and the reasons are worth understanding before you start.

## The two hard rules

**1. Every element must carry a precise, clause-level normative reference.**
Not "see ISO/IEC 17025" — `ISO/IEC 17025:2017 §7.6.1`. CI rejects an element without at least one citation. Referenceability is universal and non-negotiable; it is what makes the corpus auditable and what lets a reader go verify you.

**2. Never paste text from a standard you do not have the right to redistribute.**
Quotation is a separate, tier-gated capability layered on top of citation. It is governed by [`content/sources/registry.yaml`](content/sources/registry.yaml) and explained in [`docs/source-license-register.md`](docs/source-license-register.md). CI enforces the limits mechanically, but CI cannot catch a paraphrase so close to the source that it is effectively a copy. Write your own prose.

If you are unsure whether something may be quoted, cite it instead. A citation is always safe.

## Ways to contribute

| Contribution | Start here |
|---|---|
| Author or correct a BOK element | [`docs/handoff-playbook.md`](docs/handoff-playbook.md) |
| Write an assessment item or rubric | `docs/03-evidence-and-assessment.md` |
| Write a training module | `docs/handoff-playbook.md` |
| Report a factual error | Open an issue with the element ID and the citation that contradicts it |
| Propose a new element or competency area | Open an issue *before* writing — IDs are append-only, see below |
| Software | Below |

## Content contributions

Content lives in `content/`, one file per element: YAML frontmatter for structured fields, Markdown below for prose.

```bash
npm run validate
```

This must pass. It checks schema conformance, citation presence, role-rating completeness, proficiency anchors, prerequisite-graph integrity, quotation limits, and that every cited source is in the register.

```bash
npm run report:coverage
```

Shows where the corpus is thin.

### The ID registry is append-only

The taxonomy in `content/taxonomy/domains/*.yaml` is an immutable ID registry. **IDs may be added. IDs may never be renamed or removed.** CI fails on either.

This is not bureaucracy. Once a credential has been issued attesting competence in `CM-03-014`, that identifier must mean the same thing forever, or the credential becomes unverifiable. Deprecate, supersede, and cross-reference — never rename.

### Writing quality bar

Look at the gold reference elements before writing your own. They set the standard:

- Explain the *why*, not just the *what*. A definition anyone can look up adds nothing.
- Proficiency anchors describe what someone can be **observed to do** at that level for *this specific element*. "Understands uncertainty budgets" is not an anchor. "Constructs a budget for a multi-parameter measurement, correctly identifies correlated inputs, and defends the choice of coverage factor" is.
- Assume the reader has references and an AI assistant open. Write what those cannot give them: judgment, context, failure modes, and the things practitioners learn the hard way.

## Assessment items

Items are **open-resource by design**. There is no proctoring anywhere in this system. An item that a competent person can answer by looking it up, or by pasting it into an AI assistant, is a defective item and will be rejected.

Prefer, in order:

1. **Parameterized worked problems** — supply a parameter generator and a deterministic scoring function, so every candidate gets different numbers.
2. **Error-finding** — a flawed uncertainty budget, procedure, or certificate to diagnose.
3. **Scenario judgment** — a defensible-or-not call requiring justification.
4. **Data-driven analysis and interpretation.**
5. **Position-and-defend.**
6. **Multiple choice** — only for genuine terminology and convention checks.

Every non-auto-scored item ships with its rubric in the same commit. An item without a rubric or a parameter spec fails CI.

## Software contributions

- TypeScript throughout. One language, deliberately — it keeps the contributor pool wide.
- **`packages/core` must have zero server assumptions.** It runs identically in a browser and on a server; that constraint is what makes the Personal edition a full platform rather than a stripped-down viewer. No `fs`, no `process`, no Node-only APIs. Storage goes through the adapter interface.
- **No external runtime calls in the default build.** No CDN links, no fonts fetched at runtime, no telemetry, no analytics, no license check-in. CI scans build output and fails on any external reference. Features requiring egress are separate modules that are *absent* from the build when unconfigured, not merely disabled.
- **Crypto is ECDSA P-256.** Not Ed25519, despite it being the ecosystem default — FIPS 140-3 validation is required for the environments this must run in, and the signature suite cannot be changed after credentials exist.

```bash
npm install
npm run validate
npm test
```

## Pull requests

- One logical change per PR. A domain of content is one logical change; twelve unrelated fixes are not.
- CI must be green.
- For content, say in the PR description which sources you worked from and whether you hold licensed copies of any Tier-2 documents you cited.
- Contributions are accepted under the repository licenses: Apache-2.0 for code, CC BY-SA 4.0 for content. By opening a PR you confirm you have the right to contribute the material under those terms.

## Reporting security issues

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
