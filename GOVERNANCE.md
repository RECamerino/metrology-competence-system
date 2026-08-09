# Governance

This project issues credentials that people will put on their CVs and that organizations will rely on for ISO/IEC 17025 §6.2 competence evidence. That raises the stakes above a typical open-source project: a governance failure here does not just produce bad software, it devalues credentials that real people earned.

This document describes how decisions get made. It is deliberately conservative about the things that are hard to reverse.

## Roles

**Contributors** — anyone who opens an issue or a pull request. No formal status required.

**Content maintainers** — review and merge content changes within one or more domains. Appointed by consensus of existing maintainers. Expected to hold, or be working toward, demonstrated competence in the domains they steward.

**Software maintainers** — review and merge code.

**Stewards** — a small group holding final authority over the irreversible decisions listed below. Stewards are named in `docs/stewards.md`.

## Ordinary decisions

Content corrections, new elements within an approved competency area, new assessment items, training modules, bug fixes, and features follow normal pull-request review. One maintainer approval, CI green, merge. Disagreements escalate to the relevant maintainers, then to stewards.

## Decisions requiring steward approval

These are the ones that cannot be undone, or that would break credentials already in circulation.

### 1. The ID registry

`content/taxonomy/domains/*.yaml` is **append-only**. IDs may be added. **IDs may never be renamed or removed.**

Once a credential attests competence in `CM-03-014`, that identifier must mean the same thing permanently, or the credential becomes unverifiable and its holder is harmed. Elements that turn out to be wrong, redundant, or badly scoped are **deprecated and superseded**, with an explicit `supersededBy` pointer — never deleted. CI enforces this; stewards may not waive it.

Adding a new top-level domain or competency area requires steward approval, because it changes the shape of everyone's gap analysis.

### 2. The source license register

Changes to `content/sources/registry.yaml` — adding a source, changing a tier, changing a quotation limit — require steward approval. Tier reclassification of an existing source additionally requires a documented basis (publisher terms, license text, or legal advice) recorded in the commit.

The project's default posture is conservative: when a source's terms are unclear, it is Tier 3.

### 3. Schema changes after freeze

Schemas are frozen at the end of Phase 3. After that, additive changes (new optional fields) follow ordinary review. **Breaking changes require steward approval and a migration path**, because content, credentials, and third-party overlays all validate against them.

### 4. The cryptographic suite

The signature suite (ECDSA P-256, FIPS 186-5) may not be changed without steward approval and a documented migration that preserves verifiability of every credential already issued. Adding a suite is possible; removing one is effectively never.

### 5. The trust registry

Which issuers appear in the distributed trust registry, and on what basis, is a steward decision. The criteria are published in `docs/05-trust-and-provenance.md`. Admission is not automatic and is not for sale.

### 6. Proficiency levels, evidence ladder, and integrity rules

Changing what a level *means*, what evidence it requires, or the anti-collusion rules retroactively changes what existing credentials assert. Steward approval, with an explicit statement of how existing credentials are affected.

## Conflict of interest

Anyone with a commercial interest in a particular outcome — selling training, selling calibration services, publishing a standard, or employing people whose credentials are affected — must disclose it when participating in a decision that touches that interest, and recuse from steward votes on it.

The corpus is organizationally agnostic. Content that steers readers toward a particular vendor, service, or commercial training provider will be rejected.

## Credential integrity: challenge and revocation

Any person may challenge a credential they believe was improperly issued. Challenges are evaluated against the archived evidence artifact — which is why artifacts are hashed and retained. A sustained challenge results in revocation via the signed status list.

Reviewers whose issued credentials are repeatedly revoked lose reviewer standing. This process is documented in `docs/06-reviewer-program.md`.

Stewards do not adjudicate technical disputes about metrology. Those go to credentialed reviewers with standing in the relevant element.

## Forking

The content is CC BY-SA 4.0 and the code is Apache-2.0. Anyone may fork. Note that a fork's credentials verify against the fork's own issuer keys — forking the corpus is easy, forking the trust network is not, and that asymmetry is intentional.

## Amending this document

Steward approval, with a public issue open for comment for at least fourteen days first.
