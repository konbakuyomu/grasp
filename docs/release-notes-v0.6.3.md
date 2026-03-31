# Grasp v0.6.3 — Visible Runtime, Verifiable Extraction

Grasp `v0.6.3` is the release that makes the product easier to understand as an AI browser runtime instead of a background automation wrapper. It formalizes visible runtime boundaries and ships the first structured extraction path on top of the same route-aware browser loop.

## What is new?

### Visible Runtime Boundary
When Grasp can identify the active browser runtime instance, page-changing actions now require explicit confirmation of that instance first. This makes it clear whether the agent is working against a visible browser context or a headless endpoint, and it prevents silent drift across runtime boundaries.

### Structured Extraction
A new `extract_structured(fields=[...])` tool lets agents convert the current page into a field-based record without leaving the runtime loop. The result includes:

- a `record` for matched fields
- `missing_fields` when the page does not expose a requested value clearly enough
- extraction evidence for each matched field
- JSON export, plus optional Markdown export

### Batch Scraper Exports
The first AI Scraper path now extends beyond a single page. `extract_batch(urls=[...], fields=[...])` walks a list of URLs through the same runtime loop and writes:

- a CSV artifact for downstream spreadsheet use
- a JSON artifact for agents and automations
- an optional Markdown bundle for quick review and handoff

Blocked pages stay blocked in the output instead of being flattened into fake success rows.

### Share Layer and Explain Cards
The new `share_page(format="markdown" | "screenshot" | "pdf")` tool turns the current page projection into a shareable artifact. This is paired with `explain_share_card()`, which exposes how Grasp is laying out that human-facing share document.

When available, the explain layer uses Pretext-backed text layout estimation so the share card can reason about title and summary density without touching the current runtime page DOM.

### Plugin-based Fast-path Adapters
Host-specific fast reads are now routed through adapters instead of being welded into the core fast-path router. The built-in BOSS behavior stays intact, but local extensions can now be added without editing Grasp itself:

- drop a `.js` adapter into `~/.grasp/site-adapters`
- or point `GRASP_SITE_ADAPTER_DIR` at another adapter directory
- use a lightweight `.skill` manifest with `entry:` or `adapter:` pointing at a `.js` adapter

This keeps site-specific shortcuts extensible while preserving the same route-aware runtime loop.

### AI Browser Positioning
This release also tightens the public product story: Grasp is a route-aware AI browser runtime. It is not a promise to control arbitrary desktop state, and it is not just a headless browser wrapper. The visible browser context, the runtime boundary, and the verification loop are now treated as first-class product behavior.

## Why it matters

An AI browser should not act inside an invisible session that the user cannot verify. It should work inside a known browser context, explain where it is acting, verify the effect of actions, and keep the task continuous when human intervention is needed. `v0.6.3` makes that boundary legible while also delivering the first structured extraction flow that begins to look like an AI Scraper on top of the runtime.

## How to use it

1. Call `get_status` to confirm which runtime instance Grasp is attached to.
2. Call `confirm_runtime_instance(display="windowed")` or the mode you explicitly expect.
3. Use `entry(url, intent="extract")`, then `inspect`.
4. Call `extract_structured(fields=[...])` to collect a structured record and JSON / Markdown exports.
5. Call `extract_batch(urls=[...], fields=[...])` when the task needs the same structured output across multiple pages.
6. Call `share_page(format="pdf")` or another share format when the result needs to travel to humans.
7. Add a local fast-path adapter if a site needs a host-specific shortcut without touching core code.
8. Use `continue` or `explain_route` if the task needs to keep moving along the same runtime path.
