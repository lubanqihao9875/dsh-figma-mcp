/**
 * dsh-figma-mcp — home patch 文件读写（仅服务 Figma 一行）。
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const MARK_START = '# --- figma-mcp managed (auto-generated; do not edit) ---'
const MARK_END = '# --- end figma-mcp managed ---'

const resolveFigmaHome = () => process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')

const figmaPatchFile = () => join(resolveFigmaHome(), 'cordis.patch.yml')

const readFigmaLine = (block) => {
  const authMatch = block.match(/Authorization:\s*Bearer\s+(\S+)/)
  const expiresMatch = block.match(/^#\s*figma-token-expires:\s*(\S+)\s*$/m)
  return {
    ...(authMatch ? { token: authMatch[1] } : {}),
    ...(expiresMatch ? { expiresAt: expiresMatch[1] } : {}),
  }
}

const readRefreshBundle = (block) => {
  const m = block.match(/^#\s*figma-refresh-b64:\s*(\S+)\s*$/m)
  if (m === null) return undefined
  try {
    const json = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'))
    if (
      typeof json === 'object' &&
      json !== null &&
      typeof json.client_id === 'string' &&
      typeof json.client_secret === 'string' &&
      typeof json.refresh_token === 'string'
    ) return json
  } catch {
    /* malformed base64 / json */
  }
  return undefined
}

export const readFigmaStatus = () => {
  const file = figmaPatchFile()
  const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const lines = text.split('\n')
  const openIdx = lines.findIndex((line) => line.includes(MARK_START))
  if (openIdx === -1) return { connected: false }
  const closeIdx = lines.findIndex((line, index) => index > openIdx && line.includes(MARK_END))
  if (closeIdx === -1) return { connected: false }
  const block = lines.slice(openIdx + 1, closeIdx).join('\n')
  const { token, expiresAt } = readFigmaLine(block)
  const refresh = readRefreshBundle(block)
  return {
    connected: token !== undefined,
    ...(token !== undefined ? { token } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(refresh !== undefined ? { refresh } : {}),
  }
}

const encodeRefreshBundle = (b) =>
  '# figma-refresh-b64: ' + Buffer.from(JSON.stringify(b), 'utf8').toString('base64')

const renderBlock = (config, expiresAt, refresh) => {
  const refreshLine = refresh !== undefined ? [encodeRefreshBundle(refresh)] : []
  const lines = [
    '# figma-token-expires: ' + expiresAt,
    ...refreshLine,
    '- insert:',
    '    - id: mcp-figma',
    "      name: '@deepseek-ai/dsh-mcp-client'",
    '      config:',
    '        serverName: ' + config.serverName,
    '        transport: ' + config.transport,
    '        url: ' + config.url,
    '        headers:',
    '          Authorization: ' + config.headers.Authorization,
    '        toolCallTimeoutMs: ' + String(config.toolCallTimeoutMs),
    '        reconnect:',
    '          enabled: ' + String(config.reconnect.enabled),
    '          initialDelayMs: ' + String(config.reconnect.initialDelayMs),
    '          maxDelayMs: ' + String(config.reconnect.maxDelayMs),
    '          maxAttempts: ' + String(config.reconnect.maxAttempts),
  ]
  return lines.join('\n') + '\n'
}

const emptyBlock = () => '- insert: []\n'

export const spliceFigmaBlock = (text, inner) => {
  const lines = text.split('\n')
  const openIdx = lines.findIndex((line) => line.includes(MARK_START))
  const closeIdx = openIdx === -1 ? -1 : lines.findIndex((line, index) => index > openIdx && line.includes(MARK_END))
  const framed = MARK_START + '\n' + inner + MARK_END + '\n'
  if (openIdx === -1) {
    return text.replace(/\s*$/, '') + (text.trim() === '' ? '' : '\n') + '\n' + framed
  }
  if (closeIdx === -1) {
    return [...lines.slice(0, openIdx), ...framed.split('\n'), ...lines.slice(openIdx + 1)].join('\n')
  }
  return [...lines.slice(0, openIdx), ...framed.split('\n'), ...lines.slice(closeIdx + 1)].join('\n')
}

export const writeFigmaPatch = (config, expiresAt, refresh) => {
  const file = figmaPatchFile()
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '# dsh home patch layer\n'
  const next = spliceFigmaBlock(text, renderBlock(config, expiresAt, refresh))
  const tmp = join(dirname(file), '.cordis.patch.yml.' + process.pid + '.tmp')
  writeFileSync(tmp, next)
  renameSync(tmp, file)
}

export const clearFigmaPatch = () => {
  const file = figmaPatchFile()
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '# dsh home patch layer\n'
  const next = spliceFigmaBlock(text, emptyBlock())
  const tmp = join(dirname(file), '.cordis.patch.yml.' + process.pid + '.tmp')
  writeFileSync(tmp, next)
  renameSync(tmp, file)
}