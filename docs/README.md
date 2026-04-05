# Grasp Docs

Public docs for Grasp, a browser runtime for agents built to keep real web tasks moving.

Current package release: `v0.6.8`

This release theme focuses on batch contract truthfulness, especially mixed-task honesty.

---

## Start here

If you are new to Grasp, start with these in order:

1. [Project README](../README.md)
2. [中文 README](../README.zh-CN.md)
3. [Browser Runtime for Agents](./product/browser-runtime-for-agents.md)
4. [MCP Tools](./reference/mcp-tools.md)

If you want the fastest visual overview first, open the [Browser Runtime Landing](./browser-runtime-landing.html).

---

## What these docs are about

Grasp is built for real web work that has to continue across login state, gated pages, form flows, workspace surfaces, human handoff, and later recovery in the same browser context.

The docs are organized around that product story:

- real-page entry on any webpage the browser can open
- route selection before execution starts
- persistent browser context the agent can return to
- verified actions against real page state
- handoff and resume with evidence
- specialized surfaces for real forms and authenticated workspaces
- one task model across runtime work and public-web read paths

The core idea is simple: opening a page is easy; keeping real web tasks continuous, verifiable, and recoverable is the hard part.

---

## Product overview

Read these when you want the product model and the reasoning behind it:

- [Browser Runtime for Agents](./product/browser-runtime-for-agents.md)
- [AI Browser Gateway](./product/ai-browser-gateway.md)

Key product ideas:

- one URL, one best path
- continuity across login, handoff, and recovery
- visible runtime boundaries over a confirmed browser instance
- verified actions against actual page state
- resumed work in the same browser context
- modes over providers: users and agents should reason about route, evidence, risk, and fallback, not implementation wiring

Canonical proof loop:

- `entry` → `inspect` → `request_handoff` → `mark_handoff_done` → `resume_after_handoff` → `continue`

---

## Agent surface

Grasp reaches agents through one runtime, with multiple delivery surfaces:

1. bootstrap the local runtime
2. use MCP tools as the public runtime surface
3. use the skill when you want the recommended task-facing layer

These are delivery surfaces for the same runtime, not separate product identities.

References:

- [MCP Tools](./reference/mcp-tools.md)
- [Agent Skill](../skill/SKILL.md)

Supported agent clients in the current release surface:

- Claude Code
- Codex CLI
- Cursor / Claude Desktop style MCP clients
- Alma

---

## Quick references

Use these when you already know the product story and want the operational details:

- [MCP Tools](./reference/mcp-tools.md)
- [Smoke Paths](./reference/smoke-paths.md)
- [CHANGELOG](../CHANGELOG.md)
- [CONTRIBUTING](../CONTRIBUTING.md)

---

## Releases

- [CHANGELOG](../CHANGELOG.md)
- [v0.6.8 release notes](./release-notes-v0.6.8.md)
- [v0.6.7 release notes](./release-notes-v0.6.7.md)
- [v0.6.3 release notes](./release-notes-v0.6.3.md)
- [v0.6.1 release notes](./release-notes-v0.6.1.md)
- [v0.6.0 release notes](./release-notes-v0.6.0.md)
- [v0.55.0 release notes](./release-notes-v0.55.0.md)
- [v0.5.2 release notes](./release-notes-v0.5.2.md)
