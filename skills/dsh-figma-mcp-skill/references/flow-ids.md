# fileKey / nodeId 解析

本 reference 与 SKILL.md 第 2 节（任务视角）配合使用：当任务需要访问特定文件或节点时，
依据此处规则从用户给出的链接或描述中提取 `fileKey` 与 `nodeId`。

## URL 形态表

| 用户提供的链接 | fileKey 取值 | nodeId 取值 | 说明 |
|---|---|---|---|
| `figma.com/design/<key>/<name>?node-id=1-2` | `<key>` | `1:2`（短横线转为冒号） | 标准 design 文件 |
| `figma.com/design/<key>/branch/<branchKey>/<name>?node-id=1-2` | **`<branchKey>`** | `1:2` | branch 设计；branchKey 取代 fileKey |
| `figma.com/make/<makeFileKey>/<makeFileName>` | `<makeFileKey>` | 未给出时使用 `0:1`（Make 文件的固定根） | Figma Make；仅部分工具支持 |
| `figma.com/board/<key>/<name>?node-id=1-2` | `<key>` | `1:2`（API 形式） | FigJam；仅 `get_figjam` 等 FigJam 工具支持 |
| `figma.com/slides/<key>/<name>?node-id=1-2` | `<key>` | `1:2` | Slides；`get_screenshot` / `download_assets` 通用支持 |
| `figma.com/files/project/<projectId>` | — | — | 文件夹视图，非具体文件，无 fileKey；需向用户索取具体链接 |
| `figma.com/files/<orgId>/project/<projectId>` | — | — | 同上 |
| `figma.com/files/team/<teamId>/project/<projectId>` | — | — | 同上 |

## nodeId 格式细节

- URL 中为 `1-2`（短横线），调用 `mcp__figma__*` 时应转换为 `1:2`（冒号）；
- 复合选择使用 `I<scope>:<id>;I<scope>:<id>`（用于多 selection），普通节点选择不涉及；
- Make 文件未提供 `node-id` 参数时，**默认使用 `0:1`**，其余 ID 不可推断；
- 未带 `node-id` 的 design 链接：多数工具允许仅传 fileKey、不传 nodeId（如 `get_metadata`、
  `get_libraries`）；
- 调用 `get_metadata` 而不传 nodeId 会返回顶层 page 列表（`guid + name`），这是浏览文件结构的常规入口。

## 跨格式支持矩阵（工具 × 文件类型）

| 工具 | design | branch | Make | FigJam | Slides |
|---|---|---|---|---|---|
| `get_metadata` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `get_design_context` | ✅ | ✅ | ✅（默认 `0:1`） | ❌ | ❌ |
| `get_variable_defs` / `get_motion_context` / `get_context_for_code_connect` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `download_assets` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `get_screenshot` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `upload_assets` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `use_figma` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `create_new_file` | ✅ | — | ❌ | ✅ | ✅ |
| `search_design_system` / `get_libraries` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `generate_figma_design`（捕获网页） | ✅ | ✅ | ❌ | ❌ | ❌ |
| `generate_diagram`（Mermaid） | ❌ | ❌ | ❌ | ✅ | ❌ |
| `get_figjam` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `export_video` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `create_shader` / `update_shader` / `list_file_shaders` / `get_shader` | ✅ | ✅ | ❌ | ❌ | ✅ |

> **以本地 MCP 工具集与 Figma 官方 tools-and-prompts 页面为准**。DSH 通过 `mcp.figma.com/mcp`
> 接入 Figma 官方 server，harness 可能对其加以过滤或扩展；上表依据 Figma 官方文档
> （[developers.figma.com/docs/figma-mcp-server/tools-and-prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts)）
> 标注的文件类型支持整理（branch 设计文件视同 design），最终以本地实际可见工具与调用时返回的
> 错误信息为准。Figma 更新 server 时该矩阵可能随之变化。

## 谁拥有 plan

- `whoami` 返回的是 plan 列表（team / organization），并非文件列表；
- `create_new_file` / `create_shader` / `create_generative_plugin` 需传入 `planKey`，
  形如 `team::123` 或 `organization::123`；
- 用户拥有多个 plan 时，应先与用户确认写入目标，再选择对应的 planKey。

## 拿不到链接时的方法

- 用户描述中出现 `/My Project/Frame 27/` 这类路径——并非 fileKey / nodeId，应向用户索取 Figma 链接；
- 用户表述为"在那个按钮里"——不可解析为 nodeId，需用户补充链接或 `?node-id=` 参数；
- 取得 fileKey 但无 nodeId 时，可调用的工具包括：`get_metadata`、`get_variable_defs`、`get_libraries`、
  `list_file_components_for_code_connect`、`list_file_shaders`，以及无需 nodeId 的 `create_new_file`。