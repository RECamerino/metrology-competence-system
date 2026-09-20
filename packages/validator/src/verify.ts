/**
 * One entry point for one credential, and a verdict that says what it checked.
 *
 * THE DEFECT THIS CLOSES. External review findings A-19 and A-21, which are one
 * finding: the validator has seventeen exported entry points and no authoritative
 * one. Six of them are never composed by anything, so a caller validating a
 * credential has to KNOW to call `checkCredential`, `verifyAgainstRegistry`,
 * `checkDefinitionDrift`, `verifyCredentialAttempt`, `checkChallengeProvenance`,
 * `checkExperienceAcrossCredentials` and `checkReciprocity` by hand — and the
 * no-retake rule, the drift check and the trust verdict are among the ones they
 * must remember.
 *
 * The project's own words, from `credentials.ts`: *a rule enforced only by the
 * code that happens to call it is a rule that fails the first time someone
 * writes a second caller.* Every individual guardrail here is good. Nothing
 * stopped a caller running half of them and reporting a pass.
 *
 * VALID AND VERIFIED ARE DIFFERENT WORDS, and the review was right that the
 * system needs to stop using them interchangeably. A verdict therefore records a
 * STATE PER LAYER rather than a boolean:
 *
 *   `checked`        the inputs were there and the layer was examined
 *   `not-supplied`   the caller did not provide what the layer needs
 *   `not-applicable` the layer does not apply to this credential
 *
 * **`not-supplied` is never silently a pass.** That is the single lesson of
 * every fix made against this review: `signatureVerified` defaults to false, an
 * unresolved authority chain does not satisfy a rung, a tier that needs the
 * registry cannot be supported without one. A caller who omits an input gets a
 * verdict that says so, in the statement and in a finding, and a renderer that
 * drops findings still has the layer states.
 *
 * WHAT THIS IS NOT. It is not an issuance engine and it does not decide whether
 * to issue — that is Phase 6, and `packages/credentials` is still empty. It
 * composes the checks that exist so that forgetting one stops being possible.
 */

import type { Finding } from './checks.ts';
import {
  type BootstrapCohort,
  type BootstrapContext,
  type Credential,
  type SignoffPolicy,
  checkCredential,
  checkExperienceAcrossCredentials,
  checkReciprocity,
} from './credentials.ts';
import { type ArticleLike, type ElementLike, checkDefinitionDrift } from './definitions.ts';
import { type Ledger, checkChallengeProvenance, verifyCredentialAttempt } from './ledger.ts';
import {
  type CounterStatement,
  type TrustBasis,
  type TrustRegistry,
  verifyAgainstRegistry,
} from './trust.ts';

export type VerificationLayer =
  | 'credential-rules'
  | 'lifecycle'
  | 'issuer-trust'
  | 'signature'
  | 'definition-drift'
  | 'attempt-chain'
  | 'experience-across-wallet'
  | 'reciprocity';

export type LayerState = 'checked' | 'not-supplied' | 'not-applicable';

export interface VerificationInputs {
  /** The level's signoff policy. Without it, only the rules that need no policy run. */
  policy?: SignoffPolicy;
  /** The trust registry snapshot. Without it the issuer is unresolved and the upper tiers unsupported. */
  registry?: TrustRegistry;
  /** The signers' own credentials. Without them no standing is `proven`. */
  backing?: Credential[];
  cohort?: BootstrapCohort;
  bootstrapContext?: BootstrapContext;
  /** The candidate's attempt ledger, for the no-retake rule and challenge provenance. */
  ledger?: Ledger;
  counterStatements?: CounterStatement[];
  /** Everything else the holder carries, for the cross-credential experience check. */
  wallet?: Credential[];
  /** Prior signoffs between these parties, for reciprocity. */
  priorSignoffs?: Array<{ signer: string; subject: string; on: string }>;
  reciprocityWindowDays?: number;
  /** The element as it stands today, and the articles it points at, for drift. */
  element?: ElementLike;
  articles?: ArticleLike[];
  proficiency?: Record<string, unknown> | null;
  /** Whether the CALLER cryptographically verified the proof. Nothing here does. */
  signatureVerified?: boolean;
  asOf?: string;
}

export interface CredentialVerdict {
  findings: Finding[];
  layers: Record<VerificationLayer, LayerState>;
  /** What was established and what was not, in one sentence a renderer can show. */
  statement: string;

  /*
   * WHAT THE ISSUER ANSWER WAS DECIDED AGAINST, present whenever the trust layer
   * ran. External review finding R-04, second half.
   *
   * Rule 8c: every verdict carries `registryAgeDays` and what that age leaves
   * unknowable, and a bare verdict with no such statement IS the defect. This
   * type carried `findings`, `layers` and `statement` and dropped `TrustBasis`
   * on the floor — so the entry point built to be authoritative reintroduced
   * the exact defect the rule was written about. The age appeared in neither
   * the statement nor any finding; `signatureVerified` and `registrySigned`
   * survived only because `verifyAgainstRegistry` also pushes them as warnings,
   * and the age had no such luck.
   *
   * Composing checks means carrying what they established, not just whether
   * they complained.
   */
  basis?: TrustBasis;
}

const LAYER_LABEL: Record<VerificationLayer, string> = {
  'credential-rules': 'the credential’s own rules',
  lifecycle: 'whether its currency has lapsed',
  'issuer-trust': 'the issuer against a trust registry',
  signature: 'the signature',
  'definition-drift': 'whether the element has moved since issue',
  'attempt-chain': 'the attempt ledger and the no-retake rule',
  'experience-across-wallet': 'the experience claim across the wallet',
  reciprocity: 'reciprocal signing between these parties',
};

export function verifyCredential(
  credential: Credential,
  inputs: VerificationInputs = {},
): CredentialVerdict {
  const findings: Finding[] = [];
  const layers: Record<VerificationLayer, LayerState> = {
    'credential-rules': 'checked',
    lifecycle: 'not-supplied',
    'issuer-trust': 'not-supplied',
    signature: 'not-supplied',
    'definition-drift': 'not-supplied',
    'attempt-chain': 'not-supplied',
    'experience-across-wallet': 'not-supplied',
    reciprocity: 'not-supplied',
  };
  const at = (msg: string): string => `${credential.id}: ${msg}`;

  let basis: TrustBasis | undefined;

  /*
   * Why a layer went unchecked, where the generic sentence would be false.
   *
   * The loop below tells a caller they "supplied nothing to check it against",
   * which is true of every layer but one: a caller can supply a registry and
   * still be missing the date it has to be read at. Telling them they supplied
   * nothing would send them to find the thing they already have.
   */
  const reasons: Partial<Record<VerificationLayer, string>> = {};

  // -- The credential's own rules -------------------------------------------
  findings.push(
    ...checkCredential(
      credential,
      inputs.policy,
      inputs.cohort,
      inputs.bootstrapContext,
      inputs.backing ?? [],
      inputs.registry,
    ),
  );

  /* -- Is it still current? --------------------------------------------------
   *
   * External review finding A-12: nothing read the credential's own `expiresOn`
   * or `status` — only the trust registry's revocation list — so a holder
   * presenting a credential that says on its face that it is revoked, to a
   * verifier with no registry, got a clean answer.
   *
   * REVOCATION AND EXPIRY ARE NOT THE SAME KIND OF FACT, and the schema settles
   * the difference rather than leaving it to be decided here. Expiry says: "An
   * expired credential is not a false one: it remains true that the competence
   * was demonstrated on the date it was demonstrated. Verifiers decide what
   * weight to give currency." So this REPORTS currency and does not rule on it,
   * which is the drift treatment and the counter-statement treatment arriving a
   * third time.
   *
   * THE REVOCATION USED TO BE CHECKED HERE AND IS NOT ANY MORE. Second-pass
   * finding R-03: it does not belong behind a date gate. Revocation says the
   * attestation should not stand, and nothing about a calendar makes that truer
   * or falser — so a credential read with no `asOf` reported `Checked 1 of 8
   * layers with nothing failing` while carrying `reason: 'fraud'` on its face.
   * It is now refused by `checkCredential`, which had already been reading
   * `status.revoked` for its date contradictions.
   *
   * What is left here genuinely needs the reader's date, and a caller who does
   * not say when they are asking has not asked.
   */
  if (inputs.asOf) {
    layers.lifecycle = 'checked';

    if (credential.expiresOn && inputs.asOf > credential.expiresOn) {
      findings.push({
        level: 'warn',
        message: at(`expired on ${credential.expiresOn} and is being read as of ${inputs.asOf}. NOT A FALSE CREDENTIAL — it remains true that the competence was demonstrated on ${credential.attainedOn ?? 'the date recorded'}; what has lapsed is the currency, and what weight to give that is the reader's to decide. It must not be rendered as current.`),
      });
    }

    if (credential.attainedOn && inputs.asOf < credential.attainedOn) {
      findings.push({
        level: 'warn',
        message: at(`is being read as of ${inputs.asOf}, before it was attained on ${credential.attainedOn}. The question was asked about a time when this did not exist.`),
      });
    }
  }

  /* -- The issuer, and what the snapshot leaves unknowable -------------------
   *
   * THE DATE IS AN INPUT, NOT SOMETHING TO SUBSTITUTE FOR. External review
   * finding R-04. This used to pass `inputs.asOf ?? credential.attainedOn ?? ''`
   * — and `attainedOn` is not the date of the question, it is the date of the
   * answer being questioned. Every current registry snapshot postdates every
   * credential already in a wallet, so the substitution made the ORDINARY call
   * report a negative registry age and, worse, `overdue: false` on a snapshot
   * years past its own replacement date.
   *
   * A caller who does not say when they are asking has not asked. That is the
   * sentence the lifecycle layer above already lives by, and the issuer layer
   * is the one where it matters most, because staleness is the whole reason
   * this module exists.
   *
   * Refusing the layer rather than guessing costs a caller nothing: they always
   * know today's date, and `asOf` is a parameter only so the answer is
   * reproducible. What it buys is that the age in the verdict is an age.
   */
  if (inputs.registry && inputs.asOf) {
    layers['issuer-trust'] = 'checked';
    const verdict = verifyAgainstRegistry(
      credential as never,
      inputs.registry,
      inputs.asOf,
      inputs.counterStatements ?? [],
      inputs.signatureVerified ?? false,
    );
    findings.push(...verdict.findings);
    basis = verdict.basis;
    layers.signature = verdict.basis.signatureVerified ? 'checked' : 'not-supplied';
  } else if (inputs.registry) {
    reasons['issuer-trust'] =
      'the caller supplied a registry snapshot but not `asOf`, the date the question is being asked. Without it the snapshot’s age cannot be computed, and an age is not a detail of this answer — it is what separates “this issuer is admitted” from “this issuer was admitted as far as a file of unknown vintage knows”.';
  }

  // -- Has the element moved since this was issued? -------------------------
  if (inputs.element) {
    layers['definition-drift'] = 'checked';
    findings.push(
      ...checkDefinitionDrift(
        credential as never,
        inputs.element,
        inputs.articles ?? [],
        inputs.proficiency ?? null,
      ),
    );
  }

  // -- The ledger: no retake, and a challenge that was anchored --------------
  if (inputs.ledger) {
    layers['attempt-chain'] = 'checked';
    const attemptRef = credential.assessment?.attemptRef;
    if (attemptRef) findings.push(...verifyCredentialAttempt(inputs.ledger, attemptRef));
    findings.push(...checkChallengeProvenance(credential as never, inputs.ledger));
  }

  // -- Hours that grow to meet whichever threshold is in front of them -------
  if (inputs.wallet && inputs.wallet.length > 0) {
    layers['experience-across-wallet'] = 'checked';
    findings.push(...checkExperienceAcrossCredentials([credential, ...inputs.wallet]));
  }

  // -- Reciprocal signing ----------------------------------------------------
  if (inputs.priorSignoffs) {
    layers.reciprocity = 'checked';
    findings.push(
      ...checkReciprocity(credential, inputs.priorSignoffs, inputs.reciprocityWindowDays ?? 365),
    );
  }

  /*
   * Every layer the caller did not supply gets a finding, not just a state.
   *
   * A renderer that shows findings and ignores `layers` must still be unable to
   * present this as verified, and a renderer that reads `layers` and drops
   * findings must still see it. Saying it twice is deliberate: this is the exact
   * shape that let `basis.statement` open with the word "Verified" while nothing
   * had been cryptographically checked.
   */
  const missing = (Object.keys(layers) as VerificationLayer[]).filter(
    (layer) => layers[layer] === 'not-supplied',
  );

  for (const layer of missing) {
    const why = reasons[layer] ?? 'the caller supplied nothing to check it against';
    findings.push({
      level: 'warn',
      message: at(`${LAYER_LABEL[layer]} was NOT checked — ${why}. This verdict establishes what is listed as checked and no more.`),
    });
  }

  const checked = (Object.keys(layers) as VerificationLayer[]).filter(
    (layer) => layers[layer] === 'checked',
  );
  const errors = findings.filter((f) => f.level === 'error').length;

  const statement =
    missing.length === 0
      ? `Every layer was checked${errors > 0 ? `, and ${errors} error(s) stand` : ' and nothing failed'}.`
      : `Checked ${checked.length} of ${checked.length + missing.length} layers${
          errors > 0 ? `, ${errors} error(s) stand` : ' with nothing failing'
        }. NOT CHECKED: ${missing.map((layer) => LAYER_LABEL[layer]).join('; ')}. A credential is not verified by the checks nobody ran.`;

  /*
   * The age is appended VERBATIM rather than re-worded. `basis.statement` is
   * the sentence rule 8c requires, and a second phrasing of one fact here is
   * two copies that drift — the argument that derived experience hours from the
   * activities rather than carrying a total beside them.
   */
  return {
    findings,
    layers,
    statement: basis ? `${statement} ${basis.statement}` : statement,
    ...(basis ? { basis } : {}),
  };
}
