# Metrology Body of Knowledge & Credentialing Platform

An open, organization-agnostic body of knowledge for metrology — and a platform that turns demonstrated competence into a portable, cryptographically verifiable credential that **the individual owns**.

> **Status: pre-alpha.** Phase 0 (foundation). No usable application yet. The corpus is being authored. See [Roadmap](#roadmap).

---

## Why this exists

Metrology knowledge is scattered across NMI publications, accreditation bodies, standards developers, and proprietary corporate training. No one can point at a single place and say: *this is what the field expects a person to know, at what depth, for what role, and here is how you prove it.*

Meanwhile, competence records live in whatever system your employer happens to run. Change jobs and the evidence of everything you learned stays behind. A résumé line is not evidence.

This project addresses both:

1. **The corpus** — an encyclopedic, freely-licensed BOK spanning measurement science and the adjacent competencies that get missed: statistics, technical writing, data visualization, auditing, software development, teaching, project management, ethics.
2. **The credential** — every signoff produces a signed, artifact-backed attestation you keep. A future employer verifies it offline, against cryptography, without contacting anyone.
3. **The competence infrastructure** — serving ISO/IEC 17025:2017 §6.2 personnel-competence obligations, and giving accreditation bodies a verifiable basis for evaluating assessors against a specific scope.

## Principles

**No single person should hold all of it.** The corpus is deliberately larger than any individual — a lifetime's pursuit, not a checkbox.

**Nothing gates entry.** No employer, no budget, no professional network required. Install it, do the work, produce real capstone evidence, arrive at an interview with verifiable proof. The Personal edition is the *full* platform, free, and runs with no server.

**Assessment mirrors practice.** A working metrologist has GUM, the internet, and an AI assistant open. Assessment here is open-resource by design and measures judgment, not recall. There is no proctoring anywhere in the system — integrity is carried by item design: every candidate gets differently-parameterized problems, so a shared answer key is worthless.

**Deployable where the work actually happens.** Air-gapped is the default build. No CDN, no telemetry, no external runtime calls. FIPS 140-3 crypto, CAC/PIV adapter, and a NIST SP 800-171 / CMMC control mapping ship with it.

**Knowledge is for everyone.** Content under CC BY-SA 4.0, code under Apache-2.0.

## How the credential works

Each signoff produces a [W3C Verifiable Credential](https://www.w3.org/TR/vc-data-model-2.0/) (Open Badges 3.0 compatible) that you hold:

> *Person X demonstrated element `CM-03-014` at Level 4 on 2026-08-08, via reviewer-conducted defense, evidenced by artifact `sha256:…`, reviewed by two credentialed reviewers, issued by org O.*

Verification is a signature check against the issuer's public key, distributed in a signed trust registry file. **No network. No third party. No blockchain** — that would add a network dependency, put immutable personal data somewhere it can never be erased, and be rejected outright by the regulated environments this must run in.

Credentials carry visible provenance — `Self-study`, `Peer-reviewed`, `Organization`, `Accredited body`, `Authority` — so a hiring manager sees not just *what* you demonstrated but *who stood behind it*. A peer-reviewed capstone with a hash-verified artifact is honestly worth less than an accredited lab's signoff, and vastly more than a résumé line. The difference is legible rather than hidden.

## Editions

| Edition | Runs on | For |
|---|---|---|
| **Personal** | PWA with in-browser SQLite, or a Tauri desktop build. No server, no account, no cost. | The full platform for an individual. Dashboards, gaps, training, assessment, signoffs, wallet. |
| **Organization** | Fastify + SQLite or Postgres, pluggable auth, air-gap default. | Assignment, signoff workflow, team and department rollups, accreditation evidence. |
| **Commons** | Optional, separately deployed. Never in air-gap builds. | Reviewer directory and matching, discussion, trust-registry distribution, shareable verified profiles. |

All three run the **same core engine**. A wallet moves between them intact.

## Repository layout

```
docs/          Design documents, handoff playbook, compliance mapping
schemas/       JSON Schema — the frozen contracts everything validates against
content/       The BOK corpus: taxonomy, elements, roles, modules, assessments
packages/      core, assessment, credentials, exchange, compiler, validator
apps/          viewer, personal, desktop, web, server, commons
tools/         Build and maintenance scripts
```

Start with [`docs/00-context.md`](docs/00-context.md) for the design rationale, and [`docs/handoff-playbook.md`](docs/handoff-playbook.md) if you intend to author content.

## Roadmap

| Phase | Deliverable | State |
|---|---|---|
| 0 | Foundation — scaffold, licenses, schemas, CI, source register | In progress |
| 1 | Taxonomy skeleton — all domains, competency areas, element IDs | Not started |
| 2 | Proficiency rubric, evidence model, credential and protocol design | Not started |
| 3 | Guardrail kit — frozen schemas, validators, gold reference set | Not started |
| 4 | Cross-cutting core content (`CM-01`…`CM-22`) | Not started |
| 5 | Discipline packs (`DP-01`…`DP-20`) | Not started |
| 6 | Credential and exchange engine | Not started |
| 7 | Assessment engine | Not started |
| 8 | Personal edition | Not started |
| 9 | Organization edition | Not started |
| 10 | Dashboards | Not started |
| 11 | Training modules | Not started |
| 12 | Commons, accreditation-body support, compliance package | Not started |

## Standards this is built on

JCGM 100 (GUM) and supplements · JCGM 200 (VIM) · BIPM SI Brochure · ISO/IEC 17025:2017 · ISO/IEC 17011 · ANSI/NCSLI Z540-1 and Z540.3 · NCSLI RP-1 · ASME Y14.5 · ILAC and IAF policy documents · EURAMET calibration guides · UKAS M3003 · NIST SP 811, TN 1297, Handbook 143 · OIML recommendations.

Every element in the corpus carries precise clause-level citations. Where a source's license permits, short attributed quotations are included as typed data objects; where it does not, the citation points you to your own licensed copy. See [`docs/source-license-register.md`](docs/source-license-register.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Content contributions are validated in CI against the schemas — an element without a citation, without role ratings, or with an over-limit quotation will not merge.

## License

Code: [Apache-2.0](LICENSE). Content and documentation: [CC BY-SA 4.0](LICENSE-CONTENT). Third-party standards remain the property of their publishers; see [NOTICE](NOTICE).
