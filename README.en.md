# dsh-figma-mcp

<div align="center">

<a href="LICENSE"><img src="https://img.shields.io/github/license/lubanqihao9875/dsh-figma-mcp?style=flat" alt="Apache-2.0 License"></a>
<a href="#"><img src="https://img.shields.io/badge/Figma-MCP%20Connector-F24E1E?style=flat&logo=figma&logoColor=white" alt="Figma MCP Connector"></a>
<a href="#"><img src="https://img.shields.io/badge/DSH-DeepSeek%20Harness-4176E6?style=flat" alt="DeepSeek Harness"></a>

</div>

[中文](./README.md)

One-click Figma MCP connector for DSH (DeepSeek Harness).

## Prerequisites

DSH ≥ 0.1.2-rc.1 (web profile) and a Figma account.

## Install

```bash
# macOS / Linux
dsh plugin --profile web add link:$(pwd)

# Windows (PowerShell)
dsh plugin --profile web add link:"$PWD"
```

Restart DSH. The "Settings → Plugins → Figma" card appears — click
"Connect Figma" to complete the authorization.

## Card states

Disconnected:

![Disconnected](assets/disconnected.png)

Connected:

![Connected](assets/connected.png)

| State | Meaning | Action |
|---|---|---|
| Not connected | Not yet authorized | Click "Connect Figma" |
| Connected (green) | Token is valid | Nothing to do |
| Expiring soon (yellow) | Less than 24h left | Suggested: click "Refresh auth" |
| Expired (red) | Token is no longer valid | Click "Reauthorize" (opens browser) |

The Token row shows a masked token. The "⧉ Copy" button next to it copies the
full token so you can configure it manually in another MCP client
(`Authorization: Bearer <token>`) — it is equivalent to your Figma account
credential, so don't share it with others.

## Expiry and refresh

Token lifetime follows what Figma issues. As the token approaches expiry, the
card turns yellow. "Refresh auth" silently renews the token in the background
without opening a browser. Only when the token is completely invalid do you
need "Reauthorize", which restarts the browser flow.

## Disconnect and uninstall

"Disconnect" only cleans up locally: the token and refresh credentials inside
the patch file are removed immediately. Disconnect before uninstalling the
plugin, otherwise the patch file will still hold a valid token.

## Usage examples

After connecting, paste a Figma link directly into a DSH chat and tell the
agent what you want. The agent automatically calls the `mcp__figma__*` tools
to read content and run the task.

### Read design content

> Show me what's in this design file: your Figma file URL (e.g. `https://www.figma.com/design/<file-id>`)

### Extract copy and build an i18n table

> Pull every button and heading label from the Figma file above and produce a Chinese/English i18n table.

### Generate code from the design

> Convert the Figma page above into React code.

A real call in action:

![Figma tool call in chat](assets/chat.png)

## Security

- The token is stored in plaintext inside the local patch file
  (`headers.Authorization: Bearer figu_...` — streamable-http transports do
  not support expression evaluation). The file is written atomically with
  `0o600` permissions. Do not share the patch file, the full token, or
  related screenshots.

## Troubleshooting

- "Connect Figma" does not open a browser: check whether a popup blocker
  stopped the OAuth window.
