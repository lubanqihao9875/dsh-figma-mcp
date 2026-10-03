---
name: dsh-figma-mcp-skill
description: 在 DSH 对话中，当用户粘贴 Figma 链接（design / board / slides / make），或要求读取设计稿、提取文案/变量/样式、下载切图或截图、把设计稿生成为 React/Vue 等前端代码、修改或写入 Figma / FigJam / Slides 文件时，加载本 skill。
---

# dsh-figma-mcp-skill

本 skill 面向的是"已经连上 Figma 之后"，Agent 拿到 `mcp__figma__*` 工具如何选用，OAuth / token 展示 / 设置卡片由 dsh-figma-mcp 插件本体负责，不在本 skill 范围。

## 1. 拿到任务后的前 3 步

按顺序进行即可。

1. **解析链接**：从用户给的链接或描述中提取 `fileKey` 和 `nodeId`（参考 `references/flow-ids.md`）。
   若用户未提供链接但提及"我的 Figma 里有个组件…"等表述，先向用户索取链接。
2. **确认 token 状态**：写操作前应确认 token 仍有有效时长。引导用户前往 `设置 → DSH Figma MCP`
   查看卡片状态（参考 `references/auth-state.md`）。未连接或已过期时，暂停写操作。
3. **先读后写**：写操作前先用 `mcp__figma__get_metadata` 或 `mcp__figma__get_design_context`
   了解目标文件的结构，再决定是否调用 `use_figma`。

## 2. 3 类常见任务 → 推荐工具组合

| 任务 | 推荐路径 | 注意事项 |
|---|---|---|
| 读取设计稿内容（查看文件构成、提取 i18n 文案、获取节点信息等） | `get_metadata` → `get_design_context` → (可选) `download_assets` | 先通过 `get_design_context` 取得结构，再按需使用 `download_assets` 获取大图 |
| 将设计稿生成为本地 React / Vue 等代码 | `get_design_context` → 交由代码生成环节解读 → 本地落盘 | `get_design_context` 返回的代码为参考实现，应按用户项目的代码规范与组件体系调整 |
| 修改 Figma 上的现有设计 | `search_design_system`（查看是否已有设计系统）→ `use_figma` | 确认库中已有可复用的 component / variable；涉及架构性改动前与用户对齐方案。FigJam / Slides 无设计系统可查，直接用 `use_figma`（支持范围见 `references/flow-ids.md` 矩阵） |

## 3. 几个常见易错点

1. **`fileKey` 未确认前调用 `use_figma`**：`use_figma` 必须传入 `fileKey`。如尚未取得，应向用户索取。
2. **不当地覆盖 Figma 节点的 export 设置**：`download_assets` 等接口的 `defaultFormat` / `defaultScale`
   会覆盖用户在 Figma 中配置的导出设置，仅在用户明确要求时再传入。
3. **`nodeId` 格式错误**：API 调用使用 `123:456`（冒号），URL 中为 `1-2`（短横线）；branch 设计文件的
   `branchKey` 作为 fileKey 传入；Figma Make 文件的 `nodeId` 默认 `0:1`。
   详见 `references/flow-ids.md`。
4. **token 已失效或未连接时仍发起写操作**：此时应暂停操作，引导用户在设置卡片中重新连接或刷新
   授权（详见 `references/auth-state.md`）。

## 4. 不应触发本 skill 的场景

以下情形不属于本 skill 的覆盖范围，请交由 harness 自带 skill 或内置能力处理，避免重复加载：

- "帮我写个 Vue 组件" / "帮我改这段 CSS"——与 Figma 文件无关；
- "我想讨论一下 Figma 公司的产品策略"——不涉及工具调用；
- 已在 `frontend-design` / `canvas-design` 覆盖下的纯本地设计工作——避免双重加载；
- Code Connect 批量映射、shader 编写、plugin 创建等 DSH 插件开发任务——由 `dsh-plugin-development`
  skill 覆盖。

延伸参考：

- 工具用途、入口参数与适用 / 不适用场景速查：`references/tools.md`
- URL / fileKey / nodeId 解析规则与工具 × 文件类型支持矩阵：`references/flow-ids.md`
- 写操作前的 token 状态判断：`references/auth-state.md`