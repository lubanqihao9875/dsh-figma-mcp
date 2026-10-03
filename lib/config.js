/**
 * dsh-figma-mcp — plugin 自维护配置。
 */
import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const resolveFigmaHome = () => process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')

const figmaConfigDir = () => join(resolveFigmaHome(), 'figma-mcp')
const figmaConfigFile = () => join(figmaConfigDir(), 'config.json')

const DEFAULTS = Object.freeze({ skillEnabled: true })

export const readConfig = () => {
  const file = figmaConfigFile()
  if (!existsSync(file)) return { ...DEFAULTS }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ...DEFAULTS }
    return {
      skillEnabled: parsed.skillEnabled !== false,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export const writeConfig = (next) => {
  const file = figmaConfigFile()
  const merged = { ...DEFAULTS, ...next }
  const text = JSON.stringify(merged, null, 2) + '\n'
  mkdirSync(dirname(file), { recursive: true })
  const tmp = join(dirname(file), '.config.json.' + process.pid + '.tmp')
  writeFileSync(tmp, text)
  renameSync(tmp, file)
  return merged
}
