# Grasp

[English](./README.md) · [简体中文](./README.zh-CN.md) · [GitHub](https://github.com/Yuzc-001/grasp) · [Issues](https://github.com/Yuzc-001/grasp/issues)

[![Version](https://img.shields.io/badge/version-v0.6.8-0B1738?style=flat-square)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-23C993?style=flat-square)](./LICENSE)
[![Validated](https://img.shields.io/badge/validated-Claude%20Code%20%7C%20Codex%20%7C%20Cursor%20%7C%20Alma-5B6CFF?style=flat-square)](./README.zh-CN.md#快速开始)

> **Grasp 是一个会先选路的 agent 浏览器运行时。它不是只帮 AI 打开网页，而是帮助 AI 在真实浏览器里，把任务持续做下去。**

真实网页任务很少沿着理想路径一次完成。它会跨过登录态、工作台页面、真实表单和受限页面，也会因为检查点、人工接力或中途打断而停下来。很多工具都能打开一个页面，甚至顺着流程走完几步；难的是当任务开始变真实时，系统还能不重来、不误判、不丢失上下文。

Grasp 就是为这一层而做的。给它一个 URL 和任务意图，它会先选出最合适的路径，在专属的本地浏览器运行时里执行，并用真实页面状态来验证动作结果；当流程需要人工接一下，或者必须稍后继续时，它也能带着证据回到同一个浏览器上下文，把任务接着做下去。

它是一个面向真实网页任务的运行时：让任务在浏览器里持续推进，并且可验证、可恢复。

- 当前包版本：`v0.6.8`
- 展示单页：[docs/browser-runtime-landing.html](./docs/browser-runtime-landing.html)
- 文档入口：[docs/README.md](./docs/README.md)
- 发布说明：[CHANGELOG.md](./CHANGELOG.md)

---

## 为什么 Grasp 存在

打开网页不难。让真实网页任务持续推进，才难。

现实里的网页任务不会停留在一次顺利的路径里。它们会遇到登录态、检查点、动态页面、真实表单、工作台边界，以及必须有人临时接手的一步。如果系统每次遇到这些情况都只能从头再来，或者默认“应该已经成功了”，那它就还停留在一次性网页操作，而不是真正可托付的任务系统。

Grasp 解决的是另一层问题：当任务开始依赖状态、遇到受阻页面或被中途打断时，agent 怎么还能在真实浏览器环境里继续工作。它要先选路，再进入页面；先确认当前状态，再决定动作；动作之后检查页面是否真的发生了预期变化；需要人工接力时保留证据，并在同一个浏览器上下文里恢复继续。

---

## Grasp 真正不同的地方

Grasp 的重点不是“网页能力更多”，而是把真正决定任务能不能继续的部分放在前面：

- **连续性**：任务跨登录态、检查点和上下文切换后仍能继续，而不是整段重来
- **可验证性**：动作不是默认成功，而是要以真实页面状态变化为准
- **契约真实性**：任务状态是显式的（`ready`、`blocked_for_handoff`、`ready_to_resume`、`resumed`、`needs_attention`、`warmup`、`mixed`），混合结果会保持为 mixed，而不是被抹平成“成功”
- **可恢复性**：人工接力不是异常分支，而是工作流的一部分
- **先选路**：用户和 agent 不需要自己判断某个 URL 该走哪条底层路径

这也是为什么 Grasp 不只是“能操作网页”，而是更接近一个可以承接真实网页任务的运行时。

---

## 运行时最小证明

Grasp 最小的证明，不是它能打开一个页面，而是同一个任务可以在真实浏览器上下文里持续推进：

```text
entry(url, intent)
inspect()
request_handoff(...)
mark_handoff_done()
resume_after_handoff()
continue()
```

如果一个任务可以跨过人工步骤，回到同一个浏览器上下文，并基于页面证据继续推进，而不是重新开始，这就是运行时行为。

它不承诺：

- 通用验证码绕过
- 所有高风控站点都能全自动完成
- 没有页面证据也能判断恢复成功
- 某一个具体流程就等于整个产品

---

## 快速开始

### 1. 本地启动 Grasp

```bash
npx -y @yuzc-001/grasp
```

Grasp 会检测 Chrome 或 Edge，启动专属的 `chrome-grasp` 浏览器配置目录，建立本地可见的浏览器运行时，并帮助你把它接到 AI 客户端上。

默认情况下，这里连接的是 Grasp 自己的 CDP runtime。除非你显式指定别的 CDP endpoint，否则它不是“当前用户随手正在使用的任意浏览器窗口”。

如果你已经安装了 CLI，`grasp connect` 也能完成同样的本地启动步骤。

Bootstrap 同时也会建立 Grasp 所需的 remote debugging / CDP 连接；在正常本地路径里，用户不需要额外手动准备这一层。

### 2. 接入你的 AI 客户端

Claude Code：

```bash
claude mcp add grasp -- npx -y @yuzc-001/grasp
```

Claude Desktop / Cursor：

```json
{
  "mcpServers": {
    "grasp": {
      "command": "npx",
      "args": ["-y", "@yuzc-001/grasp"]
    }
  }
}
```

Codex CLI：

```toml
[mcp_servers.grasp]
type = "stdio"
command = "npx"
args = ["-y", "@yuzc-001/grasp"]
```

### 3. 拿到第一次真实成功

让你的 AI：

1. 调用 `get_status`
2. 用 `entry(url, intent)` 进入一个真实页面
3. 调用 `inspect`
4. 根据当前路径继续 `extract`、`extract_structured`、`continue`，或者进入 handoff / resume 流程
5. 需要时调用 `explain_route` 或运行 `grasp explain`

第一次成功不只是“页面能打开”，而是系统已经能先选路、理解当前状态，并在任务开始变复杂时继续留在同一个运行时里推进。

参考：

- [docs/reference/mcp-tools.md](./docs/reference/mcp-tools.md)
- [docs/reference/smoke-paths.md](./docs/reference/smoke-paths.md)

---

## 核心工作流

### 真实浏览优先

只要能进入真实页面和真实会话，就优先从当前浏览器状态读取和操作，而不是先退化成更重的观察链路或搜索式替代路径。

### 公开读取

页面已公开可读时，用：

```text
entry(url, intent="extract") -> inspect -> extract
```

你会拿到：

- route decision
- 当前页面状态
- 可读取内容
- 建议的下一步动作

### 结构化抽取

当你希望把当前页面直接转成字段记录时，用 `extract_structured(fields=[...])`，同时保持在同一条 runtime 路径上。

你会拿到：

- 字段化的 `record`
- 页面没能明确提供的 `missing_fields`
- 每个命中字段对应的标签与抽取策略证据
- JSON 导出，以及可选的 Markdown 导出

当你希望对一组 URL 连续执行同一套结构化抽取时，用 `extract_batch(urls=[...], fields=[...])`。

你会拿到：

- 每个 URL 一条结构化 `record`
- 导出的 `CSV` 和 `JSON` artifact，以及可选的 Markdown 汇总
- 对受阻页面保留真实 contract 状态；批次聚合会明确暴露混合态（`meta.status = mixed`），而不是把失败假装成“抓取成功”
- 批次摘要会放在 `meta.result.batch_summary`，恢复建议会放在 `meta.result.recovery_plan`
- 每条记录自己的 route / task / verification 真实性会放在 `meta.result.records[*]`

### 分享层

当结果需要转发给别人，而原始页面链接本身并不适合直接分享时，用 `share_page(format="markdown" | "screenshot" | "pdf")`。

你会拿到：

- 一个本地可分享 artifact
- 由当前页面投影生成的干净分享文档，而不是整页原始网页外壳
- 和 runtime 保持一致的可追溯性，能回到当时的页面与路径解释

当你想在导出前先理解分享卡片会如何布局时，用 `explain_share_card()`。这层会在可用时使用 Pretext 做文本布局估计，从而在不触碰当前页面 DOM 的前提下解释标题和摘要的密度。

### 实时会话

当任务依赖当前登录态、真实工作台或表单流程时，用 `entry(url, intent="act" | "workspace" | "submit")` 先判路。

`entry` 现在会返回这类证据：

- 选中了哪个 mode
- 置信度是多少
- fallback 链路是什么
- 是否需要人工接力

### 接力与恢复

当流程必须有人来接一下时，不要假装系统已经全自动，而是把它纳入连续工作流：

1. `entry` 或 `continue` 发现页面受阻
2. `request_handoff` 记录人工步骤
3. `mark_handoff_done` 标记人工步骤完成
4. `resume_after_handoff` 带着延续性证据重新接回页面
5. `continue` 判断接下来该继续、等待，还是再次接力

---

## 真实表单

当页面是真实表单时，优先使用专门的表单运行时表面：

```text
form_inspect -> fill_form / set_option / set_date -> verify_form -> safe_submit
```

默认行为是保守的：

- `fill_form` 只写 `safe` 字段
- `review` 和 `sensitive` 字段会保留出来，便于显式查看
- `safe_submit` 默认先走 preview，先看阻塞项再决定是否真正提交

表单表面参考：[docs/reference/mcp-tools.md](./docs/reference/mcp-tools.md)

---

## 认证工作台

当当前页面是动态认证 workspace 时，先用 `workspace_inspect` 查看当前状态和下一步建议。

典型循环是：

```text
workspace_inspect -> select_live_item -> workspace_inspect -> draft_action -> workspace_inspect -> execute_action -> verify_outcome
```

默认情况下，Grasp 会先草拟内容，对不可逆操作要求显式确认，并验证 workspace 是否真的进入了下一状态。

这些 workspace 流程只是 browser runtime 的例子。BOSS 是一个例子，微信公众号和小红书也是同类例子，但都不构成产品边界。

---

## 产品原则

### 看 mode，不看 provider

Grasp 面向 agent 保持同一接口。它的核心承诺不是“对很多网站做了很多适配”，而是“任意真实网页都能进入同一套路由与任务模型”。

对外公开的是 mode，而不是 provider 名字：

- `public_read`
- `live_session`
- `workspace_runtime`
- `form_runtime`
- `handoff`

Provider 和 adapter 选择留在内部。用户看到的应该是路径、证据、风险和 fallback，而不是底层实现拼装。

### 一个运行时，多种交付面

产品本身是 route-aware Agent Web Runtime。

- `npx -y @yuzc-001/grasp` / `grasp connect`：负责把本地运行时启动起来
- MCP 工具：公共运行时接口
- skill：建立在同一运行时之上的推荐任务层

CLI、MCP、skill 都只是同一运行时的交付面，不是彼此独立的产品身份。

### Fast-path 站点适配器

站点特定的快速读取逻辑不需要继续硬编码在核心 router 里。当前支持：

- 直接把 `.js` adapter 放进 `~/.grasp/site-adapters`
- 或者通过 `GRASP_SITE_ADAPTER_DIR` 指向别的 adapter 目录
- 用一个轻量 `.skill` 文件作为入口清单，通过 `entry:` 或 `adapter:` 指向对应的 `.js` adapter

一个 `.js` adapter 只需要两件事：

- `matches(url)` 或 `match(url)`
- `read(page)`

`.skill` 文件在这里仅仅是一个本地入口清单，不是新的运行时层。

---

## 高级运行时原语

高层运行时表面是默认入口；需要更细粒度控制时，底层运行时原语仍然保留。

常用高级原语：

- 导航与状态：`navigate`、`get_status`、`get_page_summary`
- 可见 runtime 标签页：`list_visible_tabs`、`select_visible_tab`
- 交互地图：`get_hint_map`
- 可验证动作：`click`、`type`、`hover`、`press_key`、`scroll`
- 观察：`watch_element`
- 会话策略与接力辅助：`preheat_session`、`navigate_with_strategy`、`session_trust_preflight`、`suggest_handoff`、`request_handoff_from_checkpoint`、`request_handoff`、`mark_handoff_in_progress`、`mark_handoff_done`、`resume_after_handoff`、`clear_handoff`

完整说明见：[docs/reference/mcp-tools.md](./docs/reference/mcp-tools.md)

---

## CLI

| 命令 | 说明 |
|:---|:---|
| `grasp` / `grasp connect` | 初始化本地浏览运行时 |
| `grasp status` | 查看连接状态、当前标签页和最近活动 |
| `grasp explain` | 解释最近一次 route decision |
| `grasp logs` | 查看审计日志（`~/.grasp/audit.log`） |
| `grasp logs --lines 20` | 查看最近 20 行日志 |
| `grasp logs --follow` | 实时跟随日志 |

---

## 文档

- [docs/README.md](./docs/README.md)
- [浏览器运行时说明](./docs/product/browser-runtime-for-agents.md)
- [docs/reference/mcp-tools.md](./docs/reference/mcp-tools.md)
- [docs/reference/smoke-paths.md](./docs/reference/smoke-paths.md)
- [skill/SKILL.md](./skill/SKILL.md)

## 发布

- [CHANGELOG.md](./CHANGELOG.md)
- [docs/release-notes-v0.6.8.md](./docs/release-notes-v0.6.8.md)
- [docs/release-notes-v0.6.3.md](./docs/release-notes-v0.6.3.md)
- [docs/release-notes-v0.6.1.md](./docs/release-notes-v0.6.1.md)
- [docs/release-notes-v0.6.0.md](./docs/release-notes-v0.6.0.md)
- [docs/release-notes-v0.55.0.md](./docs/release-notes-v0.55.0.md)
- [docs/release-notes-v0.5.2.md](./docs/release-notes-v0.5.2.md)

## 许可证

MIT — 见 [LICENSE](./LICENSE)

## Star 历史

[![Star History Chart](./star-history.svg)](https://www.star-history.com/#Yuzc-001/grasp&Date)
