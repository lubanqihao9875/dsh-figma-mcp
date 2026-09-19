/**
 * dsh-figma-mcp — 宿主半体。
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import {
  buildAuthUrl,
  computeExpiresAt,
  exchangeCode,
  generatePkce,
  generateState,
  refreshAccessToken,
  registerClient,
} from './oauth.js'
import {
  clearFigmaPatch,
  readFigmaStatus,
  writeFigmaPatch,
} from './patch.js'
import { pickLocale, t as i18nT, zh, en } from './i18n.js'

export const name = 'figma-mcp'
export const inject = ['settings', 'webServer']

const LOGIN_TIMEOUT_MS = 60_000

const defaultConfig = () => ({
  serverName: 'figma',
  transport: 'streamable-http',
  url: 'https://mcp.figma.com/mcp',
  headers: { Authorization: '' },
  toolCallTimeoutMs: 60_000,
  reconnect: { enabled: true, initialDelayMs: 500, maxDelayMs: 30_000, maxAttempts: 10 },
})

const readJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const writeJson = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const writeHtml = (res, body) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(body)
}

const PAGE_BG = '#ffffff'
const PAGE_FG = '#1f1f1f'
const PAGE_MUTED = '#6b6b6b'

const renderCallbackPage = (dictionary, headline, subline) => {
  const headlineHtml = String(headline)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sublineHtml = String(subline)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const hint = i18nT(dictionary, 'callback.hint')
  return '<!doctype html><html lang="' + i18nT(dictionary, 'html.lang') + '"><head><meta charset="utf-8"><title>Figma</title>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>' +
    'html,body{margin:0;padding:0;background:' + PAGE_BG + ';color:' + PAGE_FG + ';' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}' +
    '.wrap{max-width:420px;margin:0 auto;padding:80px 24px 40px;text-align:center}' +
    'h1{font-size:18px;font-weight:600;margin:0 0 8px;letter-spacing:-.2px}' +
    '.sub{font-size:14px;color:' + PAGE_MUTED + ';line-height:1.55;margin:0 0 32px}' +
    '.hint{margin-top:18px;font-size:12px;color:' + PAGE_MUTED + ';opacity:.85}' +
    '</style></head><body><div class="wrap">' +
    '<h1>' + headlineHtml + '</h1>' +
    '<p class="sub">' + sublineHtml + '</p>' +
    '<p class="hint">' + hint + '</p>' +
    '</div></body></html>'
}

const fmtRemainFromIso = (dictionary, iso) => {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return ''
  const diff = parsed - Date.now()
  const day = 86400_000, hour = 3600_000
  if (diff < 0) {
    const abs = -diff
    if (abs < day) return i18nT(dictionary, 'time.agoHours', { n: Math.round(abs / hour) })
    return i18nT(dictionary, 'time.agoDays', { n: Math.round(abs / day) })
  }
  if (diff < hour) return i18nT(dictionary, 'time.inMinutes', { n: Math.max(1, Math.round(diff / 60_000)) })
  if (diff < day) return i18nT(dictionary, 'time.inHours', { n: Math.round(diff / hour) })
  return i18nT(dictionary, 'time.inDays', { n: Math.round(diff / day) })
}

const renderCallbackSuccess = (dictionary, expiresAt) => {
  const remain = fmtRemainFromIso(dictionary, expiresAt)
  return renderCallbackPage(
    dictionary,
    i18nT(dictionary, 'callback.success.title'),
    remain
      ? i18nT(dictionary, 'callback.success.withRemain', { remain })
      : i18nT(dictionary, 'callback.success.saved'),
  )
}

const renderCallbackError = (dictionary, msg) =>
  renderCallbackPage(dictionary, i18nT(dictionary, 'callback.error.title'), String(msg))

const writeFigmaFromTokens = (accessToken, refreshToken, expiresIn, refresh, fallbackRefreshToken) => {
  const expiresAt = computeExpiresAt(expiresIn)
  const config = defaultConfig()
  config.headers.Authorization = 'Bearer ' + accessToken
  // refresh grant 可能不返 refresh_token，沿用上一次的
  const nextRefreshToken = refreshToken ?? fallbackRefreshToken
  const bundle = refresh ?? (nextRefreshToken !== undefined
    ? { client_id: '', client_secret: '', refresh_token: nextRefreshToken }
    : undefined)
  writeFigmaPatch(config, expiresAt, bundle)
  return expiresAt
}

// 状态视图：给前端用的版本。前端拿到完整 token 用于 mask 显示 + 复制按钮。
const toPublicStatus = (s) => {
  if (!s.connected) return { connected: false }
  const out = { connected: true }
  if (s.token !== undefined) out.accessTokenFull = s.token
  if (s.expiresAt !== undefined) out.expiresAt = s.expiresAt
  return out
}

const serveClientBundle = (res) => {
  try {
    const req = createRequire(import.meta.url)
    const url = req.resolve('./client.js')
    const content = readFileSync(url, 'utf8')
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' })
    res.end(content)
  } catch {
    writeJson(res, 500, { error: 'client bundle not found' })
  }
}

export function apply(ctx) {
  let settingsRef = null
  // 注册 settings namespace（ctx.inject + ctx.settings.register）
  ctx.inject(['settings'], (settingsCtx) => {
    settingsRef = settingsCtx.settings
    const SCHEMA_JSON = { type: 'object', additionalProperties: false, properties: {} }
    const emptySchema = Object.assign(
      (raw) => (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}),
      { toJSON: () => SCHEMA_JSON },
    )
    settingsRef.register('figma-mcp', emptySchema)
  })

  const readActiveLocale = (acceptLanguage) => {
    try {
      const section = settingsRef !== null ? settingsRef.get('locale') : undefined
      if (section !== undefined && typeof section === 'object' && typeof section.preference === 'string') {
        const tag = section.preference.toLowerCase()
        if (tag.startsWith('en')) return en
        if (tag.startsWith('zh')) return zh
      }
    } catch { /* 退化到 Accept-Language */ }
    return pickLocale(acceptLanguage)
  }

  const pendingLogins = new Map()

  // 独立 OAuth listener（localhost:OS 随机端口，仅接 /callback）
  const oauthServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const acceptDictionary = pickLocale(req.headers['accept-language'])
      if (req.method !== 'GET' || url.pathname !== '/callback') {
        writeHtml(res, '<h1>not found</h1>')
        return
      }
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      if (typeof code !== 'string' || typeof state !== 'string') {
        const dict = readActiveLocale(req.headers['accept-language'])
        writeHtml(res, renderCallbackError(dict, i18nT(dict, 'callback.error.missingParams')))
        return
      }
      const pending = pendingLogins.get(state)
      if (pending === undefined) {
        writeHtml(res, renderCallbackError(acceptDictionary, i18nT(acceptDictionary, 'callback.error.sessionExpired')))
        return
      }
      pendingLogins.delete(state)
      clearTimeout(pending.timer)
      const dictionary = pending.locale ?? acceptDictionary
      try {
        const tokens = await exchangeCode(code, pending.pkce.verifier, pending.creds, pending.redirectUri)
        const expiresAt = writeFigmaFromTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
          { client_id: pending.creds.client_id, client_secret: pending.creds.client_secret, refresh_token: tokens.refresh_token },
        )
        writeHtml(res, renderCallbackSuccess(dictionary, expiresAt))
      } catch (err) {
        writeHtml(res, renderCallbackError(dictionary, err instanceof Error ? err.message : String(err)))
      }
    } catch (err) {
      const fallback = pickLocale(req.headers['accept-language'])
      writeHtml(res, renderCallbackError(fallback, err instanceof Error ? err.message : String(err)))
    }
  })

  let redirectBaseUrl = null

  const startListener = () => new Promise((resolve, reject) => {
    const onError = (e) => {
      oauthServer.removeListener('error', onError)
      reject(e)
    }
    oauthServer.once('error', onError)
    oauthServer.listen(0, '127.0.0.1', () => {
      oauthServer.removeListener('error', onError)
      const addr = oauthServer.address()
      if (typeof addr === 'object' && addr !== null && typeof addr.port === 'number') {
        resolve(addr.port)
      } else {
        reject(new Error('oauth server address unavailable'))
      }
    })
  })

  startListener().then(
    (port) => {
      redirectBaseUrl = 'http://127.0.0.1:' + port
      console.log('[dsh-figma-mcp] OAuth callback on ' + redirectBaseUrl + '/callback (build: 2026-01-20-callback-v2)')
    },
    (err) => {
      console.error('[dsh-figma-mcp] listener error:', err)
    },
  )

  // 4 个 JSON API 注册到 DSH webServer
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.webServer
    const routes = [
      {
        kind: 'exact',
        path: '/api/figma/status',
        handler: (_req, res) => { writeJson(res, 200, toPublicStatus(readFigmaStatus())) },
      },
      {
        kind: 'exact',
        path: '/api/figma/login/start',
        handler: async (req, res) => {
          const dictionary = readActiveLocale(req.headers['accept-language'])
          try {
            if (redirectBaseUrl === null) {
              throw new Error(i18nT(dictionary, 'api.error.serverNotReady'))
            }
            const redirectUri = redirectBaseUrl + '/callback'
            const pkce = generatePkce()
            const state = generateState()
            const creds = await registerClient(redirectUri)
            const authUrl = buildAuthUrl({ client_id: creds.client_id, redirect_uri: redirectUri, state, code_challenge: pkce.challenge })
            const timer = setTimeout(() => pendingLogins.delete(state), LOGIN_TIMEOUT_MS)
            pendingLogins.set(state, { pkce, creds, redirectUri, timer, locale: dictionary })
            writeJson(res, 200, { ok: true, authUrl, state })
          } catch (err) {
            writeJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
        },
      },
      {
        kind: 'exact',
        path: '/api/figma/refresh',
        handler: async (req, res) => {
          // refresh 凭证从 patch 内部读，前端不需要传
          const dictionary = readActiveLocale(req.headers['accept-language'])
          const status = readFigmaStatus()
          if (!status.connected || !status.refresh) {
            writeJson(res, 400, { ok: false, error: i18nT(dictionary, 'api.error.noRefreshBundle') })
            return
          }
          const { client_id, client_secret, refresh_token } = status.refresh
          try {
            const tokens = await refreshAccessToken(refresh_token, { client_id, client_secret })
            const expiresAt = writeFigmaFromTokens(
              tokens.access_token,
              tokens.refresh_token,
              tokens.expires_in,
              tokens.refresh_token !== undefined
                ? { client_id, client_secret, refresh_token: tokens.refresh_token }
                : { client_id, client_secret, refresh_token },
              refresh_token,
            )
            writeJson(res, 200, { ok: true, expiresAt })
          } catch (err) {
            writeJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
        },
      },
      {
        kind: 'exact',
        path: '/api/figma/disconnect',
        handler: async (_req, res) => {
          clearFigmaPatch()
          writeJson(res, 200, { ok: true })
        },
      },
      {
        kind: 'exact',
        path: '/plugins/dsh-figma-mcp/client.js',
        handler: (_req, res) => { serveClientBundle(res) },
      },
    ]
    const disposers = routes.map((r) => webServer.register(r))
    ctx.effect(() => () => {
      for (const d of disposers) {
        try { d() } catch { /* 释放失败不阻塞 */ }
      }
    }, 'figma-mcp: dispose webServer routes')
  })

  ctx.effect(() => () => {
    oauthServer.close()
    for (const pending of pendingLogins.values()) clearTimeout(pending.timer)
    pendingLogins.clear()
  }, 'figma-mcp: close oauth listener')
}