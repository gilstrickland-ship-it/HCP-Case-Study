# Spec Kit — single source of the spec-driven work

This folder is the **one home for all Spec Kit artifacts** behind the AI Collections
Teammate prototype. The build was driven spec-first; this is where the spec, plan,
tasks, and governing principles live.

## What's here

| Path | What it is |
|---|---|
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | The **constitution** — non-negotiable principles (guardrails-in-code, never-autopilot, the cardinal-failure P0 gate, honest mock data). |
| [`specs/001-collections-teammate/spec.md`](specs/001-collections-teammate/spec.md) | Feature specification — user stories, requirements, success criteria. |
| [`specs/001-collections-teammate/plan.md`](specs/001-collections-teammate/plan.md) | Implementation plan — stack, architecture, structure decision. |
| [`specs/001-collections-teammate/tasks.md`](specs/001-collections-teammate/tasks.md) | Ordered, dependency-aware task breakdown. |
| [`specs/001-collections-teammate/data-model.md`](specs/001-collections-teammate/data-model.md) | Entities and the weighted-recovery derivation. |
| [`specs/001-collections-teammate/contracts/api.md`](specs/001-collections-teammate/contracts/api.md) | API route contracts. |
| [`specs/001-collections-teammate/quickstart.md`](specs/001-collections-teammate/quickstart.md) | Run + demo script. |
| `.specify/templates`, `.specify/scripts` | The Spec Kit engine (templates + helper scripts) used to generate the above. |

These artifacts are grounded in the case-study docs in
[`../../Case Study Artifacts/`](../../Case%20Study%20Artifacts/) (problem framing, PRD,
eval spec) — the spec references them rather than re-deriving them.

## Note on tooling

Spec Kit's CLI and `/speckit.*` slash commands conventionally expect `.specify/` at the
**repository root**. It was moved here deliberately to keep all spec-driven work in one
place. To run Spec Kit commands again, either operate from inside this `speckit/`
directory (the engine resolves its root by the `.specify/` folder) or re-run
`specify init` at the repo root.
