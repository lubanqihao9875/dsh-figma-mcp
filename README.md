# dsh-figma-mcp

<div align="center">

<a href="LICENSE"><img src="https://img.shields.io/github/license/lubanqihao9875/dsh-figma-mcp?style=flat" alt="Apache-2.0 许可证"></a>
<a href="#"><img src="https://img.shields.io/badge/Figma-MCP%20Connector-F24E1E?style=flat&logo=figma&logoColor=white" alt="Figma MCP 连接器"></a>
<a href="#"><img src="https://img.shields.io/badge/DSH-DeepSeek%20Harness-4176E6?style=flat" alt="DeepSeek Harness"></a>

</div>

[English](./README.en.md)

## 简介

DSH 的 Figma MCP 一键连接插件，对话中粘贴链接，Agent 即可读写节点/图层/变量/样式，生成 React/Vue 代码，OAuth 安全登录，Token 本机存储，临近过期自动提醒，内置 Skill 引导使用。

## 安装

### 从 npm 安装

```bash
dsh plugin add dsh-figma-mcp
```

### 从 GitHub 安装

```bash
dsh plugin add github:lubanqihao9875/dsh-figma-mcp
```

### 本地开发

先克隆仓库并进入目录：

```bash
git clone https://github.com/lubanqihao9875/dsh-figma-mcp.git
cd dsh-figma-mcp
```

再把当前目录链接到 DSH：

```bash
# macOS / Linux
dsh plugin add link:$(pwd)

# Windows（PowerShell）
dsh plugin add link:"$PWD"
```

安装后重启 DSH，「设置 → DSH Figma MCP」卡片出现，点「连接 Figma」完成授权即可。


## 卡片

卡片分为两个组：「连接」（授权状态）和「Skill」（是否把 Figma MCP 用法注入到Agent skill 列表）

### 连接

| 状态标签 | 含义 | 该做什么 |
|---|---|---|
| 未连接 | 尚未授权 | 点「连接 Figma」弹出浏览器 |
| 已连接 | token 有效 | 什么都不用做 |
| 即将过期 | 剩余不足 24 小时 | 建议点「刷新授权」 |
| 已过期 | token 已失效 | 点「重新授权」 |

授权完成后卡片会自动从「未连接」切到「已连接」。

### Skill

「Skill」开关控制是否把 `dsh-figma-mcp-skill` 注入 Agent 的技能列表， `dsh-figma-mcp-skill` 告诉 DSH 怎么选 `mcp__figma__*` 工具，默认开启。

## 过期与刷新

token 有效期以 Figma 下发为准。临近过期状态标签会变成黄色「即将过期」。「刷新授权」是后台静默续期，不开浏览器；只有完全失效才需要「重新授权」重走一次浏览器流程。

## 断开与卸载

「断开」只清本地：patch 文件里的 token 和刷新凭据立即删除。卸载插件前先点断开，否则 patch 文件里会残留一条仍然有效的 token。

## 使用示例

连接成功后，在 DSH 对话里直接把 Figma 链接贴进 prompt，告诉 Agent 你想做什么，Agent 会自动调用 `mcp__figma__*` 工具读取内容并执行任务。

### 阅读设计稿内容

> 帮我看这个设计稿里有什么内容：你的 Figma 文件链接（如 `https://www.figma.com/design/<文件ID>`）

### 提取文案做 i18n

> 从上面这个 Figma 文件里把所有按钮和标题文案抽出来，做成中英文 i18n 表

### 基于设计稿生成代码

> 把上面这个 Figma 页面转成 React 代码

## 常见问题

- 点「连接 Figma」浏览器没弹出来：检查是否被弹窗拦截器拦截。
