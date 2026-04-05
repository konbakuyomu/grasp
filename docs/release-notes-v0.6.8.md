# Grasp v0.6.8

This release makes the task contract truthful enough to drive real multi-step work, not just single-page demos.

The big change is simple:

- mixed outcomes now stay mixed
- blocked URLs stay blocked
- partial extraction stays partial
- recovery guidance is explicit instead of implied

That sounds obvious. It is not. Without this, an agent sees a batch that "worked" when half of it actually needs handoff or manual follow-up.

## What Shipped

### 1. Normalized Task Contract Statuses

High-level runtime responses now align around one explicit task-facing status set:

- `ready`
- `blocked_for_handoff`
- `ready_to_resume`
- `resumed`
- `needs_attention`
- `warmup`
- `mixed`

This is the status language the runtime now speaks across gateway, handoff, and batch work.

### 2. Honest Batch Contracts

`extract_batch(urls=[...], fields=[...])` now returns a richer, schedulable contract:

- `result.batch_summary`
- `result.records[*].route`
- `result.records[*].task`
- `result.records[*].verification`
- `result.recovery_plan`

That means callers can tell:

- which URLs are ready right now
- which URLs are incomplete
- which URLs are blocked
- which URLs need handoff
- which URLs should be inspected manually

### 3. Mixed Means Mixed

When a batch contains both:

- a URL that is extractable
- and a URL that is still gated

the response now stays honest:

- `meta.status = mixed`
- `meta.task.status = mixed`
- `meta.verification.status = partial`

It no longer collapses into a fake success or gets overwritten by the tail page's checkpoint state.

### 4. Real Route Drift Fixes on Public Marketing Pages

This release also fixes a real route/surface drift bug on pages like GitHub home.

Previously, a public navigation-heavy page could drift across:

- `entry -> form_runtime`
- `inspect -> form_runtime`
- `continue -> public_read`
- `task.next_step -> workspace_inspect`

That is exactly the kind of thing that makes a runtime feel fake.

The fix tightens page grasp and continuation logic so public marketing pages:

- do not inherit fake workspace evidence from weak text signals
- do not collapse into form pages just because they have many controls
- do not upgrade to workspace continuation without real workspace evidence

### 5. Fresh-Profile Challenge Validation

This release was validated against a fresh visible browser profile, not only a warmed local session.

On a fresh visible profile, the Cloudflare challenge path now truthfully reports:

- `entry = blocked_for_handoff`
- `inspect = blocked_for_handoff`
- `continue = blocked_for_handoff`
- route = `handoff`
- next step = `request_handoff`

That is the correct behavior.

## Real Validation Gate

The final release gate for this slice was:

1. `https://chatgpt.com/`
2. `https://github.com/`
3. fresh-profile `https://www.scrapingcourse.com/cloudflare-challenge`

Observed outcomes:

- ChatGPT stays consistent on `form_runtime`
- GitHub stays consistent on `public_read`
- fresh-profile challenge stays consistent on `handoff`

That is enough to call this release real.

## Why This Matters

There is a huge difference between:

- "the browser can fetch pages"

and:

- "the runtime returns a contract an agent can trust"

`v0.6.8` is about that second thing.

It pushes Grasp a step closer to being AI-native in the way that actually matters:

- not just more browser power
- more truthful progress
- more truthful blockage
- more truthful recovery

That is what shipped here.
