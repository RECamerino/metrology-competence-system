# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Use GitHub's private vulnerability reporting on this repository ("Security" → "Report a vulnerability"). If that is unavailable to you, open a public issue containing *only* a request for a private contact channel — no details.

Please include: affected component and version, what an attacker can achieve, reproduction steps, and whether the issue is already public.

You will get an acknowledgement, an assessment, and credit in the advisory unless you prefer otherwise.

## What matters most in this project

This is a credentialing system. The threat model is not primarily data theft — it is **false attestation**. A vulnerability that lets someone claim competence they do not have damages every credential in circulation, including the honest ones.

Highest severity, in order:

1. **Credential forgery** — issuing a valid-verifying credential without the issuer's private key, or altering a credential's element, level, provenance, or reviewer set without breaking verification.
2. **Attempt-ledger bypass** — retaking a no-retake challenge exam, or making an attempt record disappear. The ledger's integrity is what makes "one attempt" mean anything.
3. **Signoff-integrity bypass** — self-signoff, circumventing reciprocal-review limits, or a reviewer attesting at a level they do not hold.
4. **Item-bank exposure** — leaking parameter generators, answer keys, or rubrics in a way that lets a candidate pass without competence. Includes exposure-control failures that let items repeat predictably.
5. **Trust-registry poisoning** — getting a rogue issuer accepted, or a legitimate issuer's key substituted.
6. **Evidence-archive tampering** — altering an archived artifact without breaking its hash, which would defeat the re-review mechanism.
7. **Unauthorized disclosure** — reading another person's competency record, or an accreditation-body dossier view, outside policy or without audit logging.
8. **Egress in an air-gapped build** — any external network call reaching a build that is supposed to have none. This is a security defect here, not a bug.

## Cryptographic scope

Signature suite is ECDSA P-256 (FIPS 186-5), chosen for FIPS 140-3 validated deployment. Reports concerning key handling, signature verification, canonicalization, or status-list handling are in scope and treated as high severity.

Note that verification is designed to work **offline**, against a distributed signed trust registry. Any finding that makes verification silently depend on network reachability, or that causes verification to fail open, is in scope.

## Out of scope

- Vulnerabilities in an organization's own deployment configuration, identity provider, or infrastructure.
- Social engineering of reviewers. Collusion between real humans is addressed by the integrity controls and the auditable re-review mechanism, not by software — report suspected collusion through the credential challenge process instead.
- Findings that require an attacker to already hold an issuer's private key.
- Denial of service against an optional Commons instance.

## Disclosure

Coordinated disclosure. We will agree a timeline with you; the default is public advisory once a fix is available, or 90 days, whichever comes first. Because deployments include air-gapped environments that cannot auto-update, advisories will state clearly whether an offline mitigation exists.
