# Evidence and assessment

**Status: partly built. This document is the index; the contracts are the schemas.**

[`CONTRIBUTING.md`](../CONTRIBUTING.md) points here for writing assessment items. Until this is written out, the authoritative sources are:

| For | Read |
|---|---|
| Item format and why it is archetypes plus bindings | `schemas/item-archetype.schema.json`, `schemas/item-binding.schema.json`, decision 36 |
| Worked examples | `content/competence/items/archetypes/ARC-0001…0003.yaml` and their rubrics |
| The proficiency ladder and what evidence each level costs | `content/competence/taxonomy/proficiency.yaml` |
| Attempt ledger, no-retake rule, exposure control | `schemas/attempt-ledger.schema.json`, `packages/validator/src/ledger.ts` |
| Authoring rules | [`handoff-playbook.md`](handoff-playbook.md) |

## The constraints that will not change

**Every assessment is open-resource and there is no proctoring anywhere.** A working metrologist has GUM, the internet and an AI assistant open; testing recall measures the wrong thing. Integrity is carried by item design instead of surveillance.

**An item answerable by lookup, or by pasting the prompt into an AI assistant, is a defective item** and is rejected in review. Every archetype must state, in `lookupResistance`, why it survives that test — and "the numbers differ per candidate" is explicitly not sufficient, because an assistant solves a novel arithmetic draw instantly.

**Parameters divide into two kinds.** A `prompt` parameter is rendered to the candidate; a `generator` parameter shapes the artifact and must never appear in the prompt. Naming the injected defect hands over the answer, and the validator enforces both directions.

## Still to write

- Blueprint weighting: how a level's assessment is composed across an element's units.
- Exposure-control policy beyond the per-archetype limit.
- The challenge-exam procedure end to end.
- Scoring calibration for reviewers — see [`06-reviewer-program.md`](06-reviewer-program.md).
