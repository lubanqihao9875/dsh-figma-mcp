/**
 * dsh-figma-mcp — Figma OAuth 流程。
 */
import { createHash, randomBytes } from 'node:crypto'

const FIGMA_BASE = 'https://api.figma.com'
const OAUTH_BASE = 'https://www.figma.com/oauth/mcp'
const SCOPE = 'mcp:connect'

const b64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const generatePkce = () => {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export const generateState = () => b64url(randomBytes(16))

export const registerClient = async (redirectUri, clientName = 'Claude Code') => {
  const body = JSON.stringify({
    client_name: clientName,
    redirect_uris: [redirectUri],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
    scope: SCOPE,
  })
  const res = await fetch(FIGMA_BASE + '/v1/oauth/mcp/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
  if (!res.ok) throw new Error('register failed: ' + res.status + ' ' + (await res.text()))
  const json = await res.json()
  if (typeof json.client_id !== 'string' || typeof json.client_secret !== 'string') {
    throw new Error('register response missing client_id/client_secret')
  }
  return { client_id: json.client_id, client_secret: json.client_secret }
}

export const buildAuthUrl = (parts) => {
  const u = new URL(OAUTH_BASE)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('client_id', parts.client_id)
  u.searchParams.set('redirect_uri', parts.redirect_uri)
  u.searchParams.set('scope', SCOPE)
  u.searchParams.set('state', parts.state)
  u.searchParams.set('code_challenge', parts.code_challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}

const exchange = async (body) => {
  const res = await fetch(FIGMA_BASE + '/v1/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = await res.text()
  if (!res.ok) throw new Error('token exchange failed: ' + res.status + ' ' + text)
  let json
  try { json = JSON.parse(text) } catch { throw new Error('token response not JSON: ' + text.slice(0, 200)) }
  if (typeof json.access_token !== 'string' || typeof json.expires_in !== 'number') {
    throw new Error('token response missing access_token/expires_in: ' + text.slice(0, 200))
  }
  return {
    access_token: json.access_token,
    refresh_token: typeof json.refresh_token === 'string' ? json.refresh_token : undefined,
    expires_in: json.expires_in,
  }
}

export const exchangeCode = (code, verifier, creds, redirectUri) =>
  exchange(
    'grant_type=authorization_code' +
    '&code=' + encodeURIComponent(code) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&client_id=' + encodeURIComponent(creds.client_id) +
    '&client_secret=' + encodeURIComponent(creds.client_secret) +
    '&code_verifier=' + encodeURIComponent(verifier),
  )

export const refreshAccessToken = (refreshToken, creds) =>
  exchange(
    'grant_type=refresh_token' +
    '&refresh_token=' + encodeURIComponent(refreshToken) +
    '&client_id=' + encodeURIComponent(creds.client_id) +
    '&client_secret=' + encodeURIComponent(creds.client_secret),
  )

export const computeExpiresAt = (expiresIn, obtainedAt = Date.now()) =>
  new Date(obtainedAt + expiresIn * 1000).toISOString()