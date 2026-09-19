/**
 * dsh-figma-mcp — home patch 文件读写（仅服务 Figma 一行）。
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const MARK_START = '# --- figma-mcp managed (auto-generated; do not edit) ---'
const MARK_END = '# --- end figma-mcp managed ---'

const HOME_CANDIDATES = () => [
  process.env.DSH_HOME?.trim() || '',
  join(homedir(), 'AppData', 'Roaming', 'dsh-desktop', 'harness'),
  join(homedir(), '.dsh'),
].filter(Boolean)

const resolveHomeDir = () =>
  HOME_CANDIDATES().find((dir) => existsSync(join(dir, 'cordis.patch.yml')))

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
  const home = resolveHomeDir()
  if (home === undefined) return { connected: false }
  const path = join(home, 'cordis.patch.yml')
  const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const start = text.indexOf(MARK_START)
  const end = start === -1 ? -1 : text.indexOf(MARK_END, start)
  if (start === -1 || end === -1) return { connected: false }
  const block = text.slice(start + MARK_START.length, end)
  const { token, expiresAt } = readFigmaLine(block)
  const refresh = readRefreshBundle(block)
  return {
    connected: token !== undefined,
    ...(token !== undefined ? { token } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(refresh !== undefined ? { refresh } : {}),
  }
}

export const encodeRefreshBundle = (b) =>
  '# figma-refresh-b64: ' +
  Buffer.from(JSON.stringify(b), 'utf8').toString('base64')

const renderBlock = (config, expiresAt, refresh) => {
  const lines = [
    MARK_START,
    '# figma-token-expires: ' + expiresAt,
    ...(refresh !== undefined ? [encodeRefreshBundle(refresh)] : []),
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
    MARK_END,
  ]
  return lines.join('\n') + '\n'
}

const emptyBlock = () =>
  [MARK_START, '- insert: []', MARK_END, ''].join('\n')

export const writeFigmaPatch = (config, expiresAt, refresh) => {
  const home = resolveHomeDir()
  if (home === undefined) throw new Error('DSH home not found in candidates')
  const path = join(home, 'cordis.patch.yml')
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '# dsh home patch layer\n'
  const start = text.indexOf(MARK_START)
  const end = start === -1 ? -1 : text.indexOf(MARK_END, start)
  const next = start === -1 || end === -1
    ? text.replace(/\s*$/, '') + '\n\n' + renderBlock(config, expiresAt, refresh)
    : text.slice(0, start) + renderBlock(config, expiresAt, refresh) + text.slice(end + MARK_END.length)
  const tmp = join(home, '.cordis.patch.yml.' + process.pid + '.tmp')
  writeFileSync(tmp, next, { mode: 0o600 })
  renameSync(tmp, path)
}

export const clearFigmaPatch = () => {
  const home = resolveHomeDir()
  if (home === undefined) throw new Error('DSH home not found in candidates')
  const path = join(home, 'cordis.patch.yml')
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '# dsh home patch layer\n'
  const start = text.indexOf(MARK_START)
  const end = start === -1 ? -1 : text.indexOf(MARK_END, start)
  const next = start === -1 || end === -1
    ? text.replace(/\s*$/, '') + '\n\n' + emptyBlock()
    : text.slice(0, start) + emptyBlock().slice(0, -1) + text.slice(end + MARK_END.length)
  const tmp = join(home, '.cordis.patch.yml.' + process.pid + '.tmp')
  writeFileSync(tmp, next, { mode: 0o600 })
  renameSync(tmp, path)
}