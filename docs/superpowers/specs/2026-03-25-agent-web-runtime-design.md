# Agent Web Runtime Design

## Summary

Grasp should be positioned as an `Agent Web Runtime`, not as a single-site automation tool and not as a generic scraping API.

The product exists to let agents continue real web tasks across persistent browser sessions while also being able to discover and extract public web information efficiently. That means the product needs two coordinated engines under one interface:

- a `Runtime Engine` for real browser execution
- a `Data Engine` for public-web discovery and extraction

Sites such as BOSS, WeChat Official Accounts, and Xiaohongshu are validation surfaces for the runtime. They are not the product boundary.

## Product Thesis

### One-Line Position

Grasp is an Agent Web Runtime that lets agents enter, continue, and recover real web tasks across persistent browser sessions.

### What the Product Is

- a runtime for authenticated, stateful, browser-native work
- a low-token projection layer for page understanding
- a task system that keeps session identity and recovery state
- a unified MCP and skill surface over browser execution and public-web data access

### What the Product Is Not

- not a BOSS automation product
- not a WeChat or Xiaohongshu vertical SaaS
- not a generic scrape API clone
- not a search-only substitute for browsing
- not a local `npm` CLI story

## External Signals

Three market signals help define the product boundary:

1. Products like Dokobot emphasize real-browser access, persistent sessions, browser isolation, low-token extraction, and concurrency. That validates the demand for browser-native agent runtime capabilities.
2. Products like XCrawl emphasize public-web extraction, scale, structured output, and anti-bot infrastructure. That validates the need for a separate public-web data plane.
3. Community excitement around browser-access agent projects reflects a real pain cluster:
- search is an incomplete substitute for browsing
- agents lose login state too often
- agents compete with humans for the same browser
- single-threaded browser work feels slow and fragile

These signals do not imply that Grasp should copy any one product directly. They imply that the correct product boundary sits above single-site automation and above raw scraping.

## Design Principles

### 1. Real Browser First

When work depends on login state, JavaScript-heavy pages, internal tools, or irreversible actions, the default path should be real browser access rather than search or scrape substitutions.

### 2. Session Is the Product

Persistent session identity is not an implementation detail. The runtime should explicitly own:

- browser/profile identity
- task identity
- site/session metadata
- recovery and handoff state

### 3. Projection Over Raw HTML

The product should return compact, structured page projections instead of large raw page dumps whenever possible. This reduces latency, token cost, and model confusion.

### 4. One Interface, Two Engines

The user-facing interface should stay simple. MCP tools and skills should expose one coherent task surface while the runtime decides whether a task should use browser execution or public-web extraction.

### 5. Shared Projection Layer

Page projection and compaction should be treated as a shared product concern above both engines. The Runtime Engine and Data Engine may gather information differently, but they should both feed the agent through the same low-token, structured projection contract.

## Architecture Direction

### Runtime Engine

The Runtime Engine handles:

- persistent browser sessions
- dedicated browser isolation
- active tab and target ownership
- login continuity
- handoff and resume
- browser-native task actions

This engine is the foundation for authenticated workflows and stateful tasks.

### Data Engine

The Data Engine handles:

- public-web discovery
- search and result gathering
- structured extraction
- public content collection at higher concurrency
- context acquisition for agents before entering the browser when browser access is unnecessary

This engine is the foundation for broad public-web coverage without forcing every task through a full browser path.

For `v0.6`, the Data Engine is a product boundary and interface direction, not a full in-house system that must be built out completely. `v0.6` only needs enough public-web capability to support the runtime story cleanly.

### MCP Layer

The MCP layer exposes a stable tool contract over both engines. It should present task-oriented capabilities such as:

- session lifecycle
- open, read, act
- search and extract
- task state and recovery

The MCP layer should hide engine choice when possible.

### Skill Layer

Skills compose MCP tools into workflows such as:

- collect public candidates, then enter a browser session for follow-up
- resume a logged-in publishing task
- draft before send

Skills are workflow packaging, not product identity.

## v0.6 Scope

`v0.6` should focus on four product capabilities:

1. persistent authenticated sessions
2. browser isolation
3. real-browser-first runtime behavior
4. basic parallel task foundations

For `v0.6`, “parallel” means the runtime can keep more than one task/session identity alive, inspect their state separately, and switch or resume them without collapsing everything into one active task.

`v0.6` should not attempt:

- broad site coverage
- a hosted orchestration platform
- a full visual dashboard
- full package or repo renaming
- a generalized cloud scheduler

## Wedge Strategy

The narrowest correct wedge is not “BOSS support.”

The narrowest correct wedge is:

`persistent browser runtime for high-friction authenticated tasks, with a shared public-web data plane for discovery`

That wedge is broad enough to stay true to the vision and narrow enough to ship.

The first validation workflow classes remain:

- authenticated outreach
- authenticated publishing
- creator-side authenticated workflows

Representative examples today include BOSS, WeChat Official Accounts, and Xiaohongshu creator surfaces. These examples prove the runtime. They do not define it.

## Differentiation

Relative to browser access products, Grasp should differentiate by emphasizing:

- MCP-native tool access
- skill-driven task composition
- human handoff and recovery continuity
- unified browser runtime plus public-web data access

Relative to scraping APIs, Grasp should differentiate by emphasizing:

- authenticated workflows
- session continuity
- browser-native actions
- task recovery instead of one-shot extraction

## Acceptance Criteria

This product direction is successful if:

- a new reader understands Grasp as an Agent Web Runtime
- the product story no longer collapses into BOSS or any single site
- the product story no longer collapses into scraping
- the architecture direction clearly separates runtime work from data-plane work
- `v0.6` scope remains centered on the four core capabilities rather than site sprawl

## Follow-Up Questions After This Spec

- should the Data Engine be built in-house first or integrated from external providers
- what minimal unified MCP contract best hides the dual-engine split
- which two or three authenticated workflows best demonstrate the runtime in `v0.6`
