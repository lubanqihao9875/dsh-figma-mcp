# 工具速查表（`mcp__figma__*`）

本 reference 是**工具视角**的字典：按类别列出 DSH 当前会话可见的 `mcp__figma__*` 工具，
逐条说明其用途、适用与不适用场景。SKILL.md 第 2 节（3 类常见任务 → 推荐工具组合）从**任务视角**
给出推荐路径，二者配合使用——遇到具体任务时先查 SKILL.md 第 2 节，落到工具细节再回到本表。

完整参数以 Figma 官方 MCP 文档为准。

> **本地 MCP 为准**：DSH 通过 `https://mcp.figma.com/mcp`（streamable-http + Bearer token）挂载 Figma 官方
> MCP server，harness 可能按需过滤或扩展工具集。**以当前会话实际可见的 `mcp__figma__*` 工具列表为准**；
> Figma 官方文档
> （[developers.figma.com/docs/figma-mcp-server/tools-and-prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts)）
> 提供全集参考，遇到工具缺失或参数差异以官方 page 为准。Figma 官方推荐在每个写工具调用前加载对应 skill
> （`figma-use` / `figma-create-new-file` / `figma-use-figjam` / `figma-generate-design` 等），本 skill
> 在未安装官方 skill 时承担其编排职责。

工具分组目录：

1. [节点 / 文件元信息（读）](#1-节点--文件元信息读)
2. [资产](#2-资产)
3. [写入 / 编辑](#3-写入--编辑)
4. [设计系统搜索](#4-设计系统搜索)
5. [捕获 / 第三方导入](#5-捕获--第三方导入)
6. [动效 / Shader / Plugin](#6-动效--shader--plugin)
7. [Weave（计费）](#7-weave计费)
8. [其它](#8-其它)
9. [常见调用错误](#常见调用错误)

---

## 1. 节点 / 文件元信息（读）

- `get_design_context`：返回节点结构、参考代码与截图，是"读取设计稿内容"任务的核心工具，
  同时也是"将设计稿生成为本地代码"任务的入口。
  会同时返回 screenshot URL；如不需要可显式传入 `excludeScreenshot`。
- `get_metadata`：返回纯 XML 结构概览（节点 ID、类型、名称、位置、尺寸），成本低于
  `get_design_context`，适合作为"读取设计稿内容"任务的轻量入口。
- `get_variable_defs`：返回变量、颜色、间距、字号等 token，在修改设计前查阅库内已有变量时使用。
- `get_motion_context`：返回关键帧动画信息（CSS / @keyframes / motion.dev），用于处理交互动效。
- `get_context_for_code_connect`：针对**单个**已知组件获取其 variant 属性定义与完整的 descendants 树，
  供编写 Code Connect 模板时使用。
  与 `list_file_components_for_code_connect` 的区别：后者返回整文件的平面 component 图
  （含跨组件依赖、每个 component 的 variant 选项与依赖关系），适用于"按依赖顺序批量生成"；
  二者不可互换。
- `get_code_connect_suggestions`（**只读**）：由 AI 为节点推荐代码映射，输出仍需人工 review 后通过
  `send_code_connect_mappings` 落库。
- `get_code_connect_map`（**只读**）：获取**单个节点**当前已存在的 Code Connect 映射，
  在修改或删除映射前宜先查看现状。

---

## 2. 资产

- `download_assets`：单节点导出，返回原始图像与 SVG icon 集合。**默认遵循节点自身的 export 设置**，
  仅在用户明确指定时再传入 `defaultFormat` / `defaultScale`（具体缘由参见 SKILL.md 第 3 节第 2 条）。
  返回的图像 URL 为临时链接，需及时下载。
- `get_screenshot`：节点截图。`maxDimension` 默认 1024，细节不足时可上调；能取 URL 时无需开启 base64
  （同上）。`/make/` 路径下的 Make 文件不支持。
- `upload_assets`：将图像上传至 Figma（支持 PNG / JPG / GIF / WebP / SVG）。SVG 将作为可编辑矢量节点树导入，
  其它格式作为 fill。可通过 `nodeIds` 让上传图像直接落到现有节点上，避免后续手工对位。
  `scaleMode`（`FILL` / `FIT` / `TILE`）描述**上传时**图像填入节点的拉伸方式，与 export 设置无关，
  按需显式传入即可。SVG 上传时 `nodeIds` 与 `scaleMode` 不生效。
- `export_video`：将 timeline 帧序列导出为 MP4。暂不支持 GIF 与动画 SVG。`nodeId` 须为最外层 frame
  （在 Slides 中即为 slide 本身，而非 slide 内的子节点）。返回 URL 的有效期受 `ttlSeconds` 控制。
  **首次调用可能返回 `status: "processing"` 并附带 `jobId`**——这表示渲染仍在 server 端排队，
  并非失败；可在 10–15 秒后以 `{ fileKey, jobId }`（不传 `nodeId`）轮询，直至取得 URL。

---

## 3. 写入 / 编辑

- `use_figma`：通用写工具，由 host 端执行 JS 以调用 Plugin API。**需先取得 `fileKey`**；
  涉及架构性改动（重排页面结构、批量调整主题）前宜与用户对齐方案。复杂的插件开发任务不在本 skill
  范围内，请使用 `dsh-plugin-development`。
- `create_new_file`：创建新文件。调用前宜先调用 `whoami` 取得 planKey；用户拥有多个 plan 时应先确认写入目标。
- Code Connect 全套工具，按用途区分：
  - `get_code_connect_suggestions` / `get_code_connect_map`（**只读**）见上一节；
  - `add_code_connect_map`：为**单个**节点建立 `component_browser` 类型的简单映射（仅含
    componentName 与 source）；
  - `send_code_connect_mappings`：**批量**保存一组映射；支持通过 `template` 字段生成 `figmadoc`
    类型的完整 Code Connect 模板（附带 `templateDataJson` 元数据）；
  - `list_file_components_for_code_connect`：列出整文件已发布的 component（flat graph，含依赖顺序），
  适用于盘库与批量生成。**仅本地、未发布的 component 不会被列出**；
  - `get_context_for_code_connect` 见上一节。

---

## 4. 设计系统搜索

- `search_design_system`：在已订阅的库内搜索 component、variable 或 style。
  在修改 Figma 现有设计前宜先查询，以复用库内已有样式。
  `queries` 应为对象数组（每项含 `entity` 与 `query`），而非字符串数组。
- `get_libraries`：返回当前文件已订阅或可订阅的库清单（含 community UI kit 与 organization library）。
  在配置库或了解可用资源时使用。

---

## 5. 捕获 / 第三方导入

- `generate_figma_design`：将网页（localhost 或外网 URL）抓取并写入现有 Figma 设计文件。
  流程：必要时先调用 `create_new_file` → 调用 `generate_figma_design` 取得 `captureId` → 轮询直至
  `completed`。本地 dev 服务可直接抓取；外网 URL 应通过 Playwright MCP 抓取后再传入。
  `/board/`（FigJam）与 `/slides/` 文件不支持。
- `generate_diagram`：在 FigJam 中绘制 Mermaid 图（flowchart、sequence、gantt、ER）。
  不应用于绘制 Figma 设计稿。

---

## 6. 动效 / Shader / Plugin

- `create_shader` / `update_shader` / `get_shader` / `list_shaders`：用于 shader effect 与 fill。
  `kind` 须匹配（effect 或 fill），更新时 `id` 与 `kind` 应一致。
- `create_generative_plugin` / `update_generative_plugin` / `list_generative_plugins` / `get_generative_plugin`：
  用于生成式插件（plugin、custom tool）。调用前宜先调用 `whoami` 取得 planKey
  （**形如 `team::123` 或 `organization::123`**，而非 `plan_xxx`）。

---

## 7. Weave（计费）

Weave AI 模型与工作流相关工具。**任何 run 都应遵循"先 quote → 用户确认 → 回传 `acknowledgedCost`"流程**：

- `weave_find_model`：按模型名（如 "nano banana 2"、"veo 3"）取得运行合约。
- `weave_run_model`：首次调用**不传 `acknowledgedCost`**——仅进行 quote，不扣费，接口返回
  `cost_confirmation_required` 与 `cost`；将 cost 展示给用户并取得明确同意后，再原样回传
  `acknowledgedCost` 运行（dynamic-cost 工具传 `-1`）。**不应跳过 quote 直接传入 `acknowledgedCost`**。
- `weave_get_model_run_output`：取得 `weave_run_model` 的输出，按 `predictionIds` 查询。
- `weave_list_tools`：列出当前用户可运行的 published Weave 工作流（非模型）。
- `weave_get_tool_inputs`：运行工作流前调用以查看 input contract（名称、类型、必填项、可选值、取值范围）。
  工具合约可能变动，宜按合约填写。
- `weave_run_tool`：运行 published 工作流。**同样遵循 quote → 用户确认 → `acknowledgedCost` 流程**。
  每个 `input` 均应通过 `weave_get_tool_inputs` 核对；用户未提供的信息宜向用户索取。
- `weave_get_tool_run_output`：取得 `weave_run_tool` 的输出，按 `recipeId` 与 `runIds` 查询。
  不传 `runIds` 时返回最近一次运行的结果。
- `weave_cancel_tool_run`：取消正在进行的运行。取消操作不可撤销。
- `weave_upload_asset`：将本地图（image / video）上传并取得 asset 对象，再作为 image/video 输入传入。
  **若用户可提供 https URL，或媒体已在对话中，应直接传入 URL——无需走上传流程**。

---

## 8. 其它

- `whoami`：返回当前用户的 plan 列表与 seat 数。`create_new_file`、`create_shader`、
  `create_generative_plugin` 调用前宜先调用。
- `list_file_shaders`：列出文件中使用的 shader，适用于盘库与文档化。
- `get_figjam`：FigJam 节点的 UI 代码生成。仅支持 `/board/` 文件，不应用于 design 文件。

---

## 常见调用错误

- `nodeId is required`：未传入 nodeId，或传成了 URL 中的 `1-2` 而非 API 用的 `123:456`。
- `file not found`：fileKey 错误；branch URL 应以 branchKey 作为 fileKey。
- `permission denied`：token 缺少对应文件的权限，请检查 Figma 文件共享设置。
- `Make files not supported`：调用了仅支持 design 文件的工具；可查阅 `references/flow-ids.md` 中的支持矩阵。
- `node not found`：nodeId 已过期或文件结构发生变化；建议重新调用 `get_metadata`。
- `export settings overridden`：不当地传入了 `defaultFormat` / `defaultScale`；参见 SKILL.md 第 3 节第 2 条。
- `export_video` 返回 `processing` 与 `jobId`：**非失败**。10–15 秒后以 `{ fileKey, jobId }` 轮询。
  同一轮询请求中不可同时传入 `nodeId` 与 `jobId`，否则会被拒绝。