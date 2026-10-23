# Orchestration activation — operator guide

This document describes the activated agent-orchestrator workflow for repository operators.
It covers the two-context model, required status checks, trust boundaries, and sensitive-path
release controls. It does not change any policy, workflow, dependency, or product code.

---

## Two-context model

The author and reviewer each run in a **separate, clean Anthropic API context** of the same
provider and configured model family. No author conversation or intermediate state crosses
into the reviewer context.

- **Author context** — receives the task file and file-editing tools. Produces a candidate
  commit on an isolated branch.
- **Reviewer context** — receives the task, acceptance criteria, the exact diff, and check
  evidence. It has **read-only tools only** and cannot alter the candidate. Its approval is
  bound to the exact `base_sha` and `head_sha` values recorded at review time.

A new commit to the candidate head, or a new review run, invalidates any previous approval.
Missing credentials, unavailable review, malformed verdicts, or failed checks never produce
an approval.

---

## Required status checks

Branch protection must require **both** of the following commit-status contexts:

| Status context | Workflow | Purpose |
|---|---|---|
| `agent-orchestrator/review` | `agent-review.yml` | Independent AI review and all configured checks pass |
| `agent-orchestrator/human-release` | `agent-release.yml` | Explicit human confirmation for sensitive changes |

Both statuses are invalidated (set to pending) at the start of every review run,
including on base-retarget events, before the candidate is inspected.

The reporter verifies the live same-repository open PR, default target branch, and exact
`base_sha`/`head_sha` values before posting either status.

---

## Ordinary vs. sensitive changes

**Ordinary changes** (no protected or manual-review paths touched) receive both
`agent-orchestrator/review: success` and `agent-orchestrator/human-release: success`
automatically when every required check passes and the reviewer approves.

**Sensitive changes** (any path matched by `protected_paths` or `manual_review_paths`
in `.agent-orchestrator.json`) may receive `agent-orchestrator/review: success` from
independent AI review while `agent-orchestrator/human-release` remains **pending**,
blocking merge.

### Human release gate

A human collaborator with write, maintain, or admin permission must trigger the
**Explicit human agent release** workflow (`agent-release.yml`) on the default branch,
supplying:

- The open PR number
- The exact independently reviewed `head_sha`
- The exact reviewed `base_sha`
- The decision `approve`

The release workflow checks out only trusted default-branch code, verifies live PR metadata,
confirms the current GitHub Actions AI-review provenance, and checks that the review run's
recorded PR, base, and head match the supplied values before posting
`agent-orchestrator/human-release: success`.

No future protected change is released automatically; each requires its own human release
action.

### Required CODEOWNER approval

Changes to workflow, orchestration, and policy paths also require explicit PR approval from
`@Everyway123`, as defined in `.github/CODEOWNERS`. This approval is a **separate decision**
from the human release status and must be given by a user other than the PR author when
the author is also the only eligible code owner.

Human release and CODEOWNER approval are independent gates; both must be satisfied before
a sensitive PR can be merged.

---

## Configured required checks

The project's single required check is defined in `.agent-orchestrator.json`:

| Check name | What it runs |
|---|---|
| `project-validation` | `npm test` (Playwright regression suite with locked Chromium) followed by `npm run build` |

Setup installs dependencies with `npm ci --ignore-scripts`, then downloads the Chromium
binary matching locked Playwright 1.62.1 into the candidate-local cache using the
Playwright 1.56.1 Noble image. No `.env` files or production credentials enter the check
environment.

Every configured required check must pass. A failed check blocks readiness. Checks are
never silently replaced with N/A, and a failed check result is never bypassed.

---

## Trust boundary

Repository **writers are trusted**. The required status contexts (`agent-orchestrator/review`
and `agent-orchestrator/human-release`) are pinned to the GitHub Actions App identity, not to
a specific workflow file. Trusted collaborators with repository write access can execute branch
workflows and may be able to post these status contexts.

This setup governs the constrained API agents. Instructions guide agent behavior; they do not
force every repository action through arbitrary UI paths, and they do not protect against
hostile write collaborators. Protecting against hostile writers requires a dedicated, separately
protected status identity beyond the scope of this configuration.

CODEOWNERS protects merging of sensitive path changes; it does not prevent execution of
unmerged workflows.

---

## Publication

The default result of a completed orchestration run is a reviewable pull request. Automatic
merging is not authorized. Publication of a Pages deployment to the live site is a separate
human release decision. Active reviewed SHA must equal the current PR head at publication time.
