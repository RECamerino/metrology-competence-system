# Trust and provenance

**Status: designed, not written up here. Phase 2 continuing.**

This document will hold the trust-registry criteria that [`GOVERNANCE.md`](../GOVERNANCE.md) already points at. The underlying model is decided and implemented in the schemas; what is missing is the admission policy and the DID method.

## What is already decided

Recorded in [`00-context.md`](00-context.md) and enforced in `schemas/credential.schema.json`:

- **Five provenance tiers**, always visible on the credential: self-study, peer-reviewed, organization, accredited-body, authority. A reader sees not only what was demonstrated but who stood behind it. Suppressing the tier in a renderer defeats the design.
- **Offline verification** against a signed issuer trust registry distributed as a file. No ledger, no network call to the issuer.
- **ECDSA P-256**, for FIPS 140-3 environments. Adding a suite is possible; removing one effectively never is.
- **Semantic pinning** — `definitionRef` and `knowledgeSnapshot`, decision 39. A credential records what the element meant and what knowledge it rested on at the time it was issued.

## What this document still has to answer

- **The DID method.** Constrained: the Personal edition runs with no server and no registrar, so a purely cryptographic method has to remain viable.
- **Trust registry admission.** On what basis an issuer is admitted, who decides, and how removal works. `GOVERNANCE.md` states admission is not automatic and not for sale; the criteria themselves belong here.
- **Registry distribution and revocation** in air-gapped deployments, where "fetch the current registry" is not available.

## The limit that must be stated wherever self-study is described

In the Personal edition the holder owns the machine, the ledger and the signing key. A self-study attempt history is **self-asserted**: the holder can truncate their own chain and it verifies clean, and there is a test asserting exactly that. Only an external anchor — a signoff by somebody who is not the holder — fixes history.

This is not a defect to be engineered away; it is why the self-study tier exists and why it sits at the bottom. **Any public description of self-study credentials must carry this limit plainly**, or the tier will be read as stronger than it is.
