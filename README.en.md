# dsh-figma-mcp

<div align="center">

<a href="LICENSE"><img src="https://img.shields.io/github/license/lubanqihao9875/dsh-figma-mcp?style=flat" alt="Apache-2.0 License"></a>
<a href="#"><img src="https://img.shields.io/badge/Figma-MCP%20Connector-F24E1E?style=flat&logo=figma&logoColor=white" alt="Figma MCP Connector"></a>
<a href="#"><img src="https://img.shields.io/badge/DSH-DeepSeek%20Harness-4176E6?style=flat" alt="DeepSeek Harness"></a>

</div>

[中文](./README.md)

## Overview

The one-click Figma MCP connector for DSH, paste a Figma link into chat, and the Agent can read/write nodes, layers, variables, and styles, generate React/Vue code, secure OAuth login, token stored locally, auto-reminded before expiry, with built-in workflow commands and Skill to guide the way.

## Install

### From npm

```bash
dsh plugin add dsh-figma-mcp
```

### From GitHub

```bash
dsh plugin add github:lubanqihao9875/dsh-figma-mcp
```

### Local development

Clone the repo and enter the directory first:

```bash
git clone https://github.com/lubanqihao9875/dsh-figma-mcp.git
cd dsh-figma-mcp
```

Then link the current directory into DSH:

```bash
# macOS / Linux
dsh plugin add link:$(pwd)

# Windows (PowerShell)
dsh plugin add link:"$PWD"
```

After installing, restart DSH. The "Settings → DSH Figma MCP" card appears — click "Connect Figma" to complete the authorization.

## Card

The card has two sections: "Connection" (authorization state) and "Skill" (whether the Figma MCP usage is injected into the Agent skill list)

### Connection

| Status chip | Meaning | Action |
|---|---|---|
| Not connected | Not yet authorized | Click "Connect Figma" to open the browser |
| Connected | Token is valid | Nothing to do |
| Expiring soon | Less than 24h left | Suggested: click "Refresh auth" |
| Expired | Token is no longer valid | Click "Reauthorize" |

After authorization the card switches from "Not connected" to "Connected" automatically.

### Skill

The "Skill" toggle controls whether `dsh-figma-mcp-skill` is injected into the Agent's skill list. `dsh-figma-mcp-skill` tells DSH how to pick the `mcp__figma__*` tools. It is on by default.

## Expiry and refresh

The token lifetime follows what Figma issues. As the token approaches expiry, the status chip turns yellow ("Expiring soon"). "Refresh auth" silently renews the token in the background without opening a browser; only when it is completely invalid do you need "Reauthorize" to go through the browser flow again.

## Disconnect and uninstall

"Disconnect" only clears local data: the token and refresh credentials in the patch file are deleted immediately. Click Disconnect before uninstalling the plugin, otherwise a still-valid token will remain in the patch file.

## Usage examples

After connecting, paste a Figma link directly into a DSH chat and tell the Agent what you want. The Agent automatically calls the `mcp__figma__*` tools to read content and run the task.You can also start a fixed workflow with `/dsh-figma-mcp <command> [extra context]`. When required information is missing, the Agent asks for it interactively one field at a time and continues automatically after each answer. Actions that write to Figma, download assets, or write local files ask for confirmation first.

### Read design content

> Show me what's in this design file: your Figma file URL (e.g. `https://www.figma.com/design/<file-id>`)

### Extract copy and build an i18n table

> Pull every button and heading label from the Figma file above and produce a Chinese/English i18n table

### Generate code from the design

> Convert the Figma page above into React code

## Troubleshooting

- Clicking "Connect Figma" does not open a browser: check whether a popup blocker stopped the OAuth window.
