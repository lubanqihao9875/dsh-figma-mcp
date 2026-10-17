/**
 * dsh-figma-mcp — Host 端 i18n。
 */

export const zh = {
  'callback.success.title': '已连接 Figma',
  'callback.success.withRemain': 'Token {remain}',
  'callback.success.saved': 'Token 已保存到本地',
  'callback.error.title': '授权失败',
  'callback.error.missingParams': '缺少 code 或 state 参数',
  'callback.error.sessionExpired': '授权会话已过期，请回到 DSH 重新发起登录',
  'callback.hint': '可以关闭此标签页',
  'time.inMinutes': '{n} 分钟后过期',
  'time.inHours': '{n} 小时后过期',
  'time.inDays': '{n} 天后过期',
  'time.agoMinutes': '{n} 分钟前过期',
  'time.agoHours': '{n} 小时前过期',
  'time.agoDays': '{n} 天前过期',
  'html.lang': 'zh-CN',
  'api.error.serverNotReady': 'OAuth callback server 尚未就绪，请稍后重试',
  'api.error.noRefreshBundle': 'no refresh bundle — 请重新授权',
}

export const en = {
  'callback.success.title': 'Figma connected',
  'callback.success.withRemain': 'Token {remain}',
  'callback.success.saved': 'Token saved locally',
  'callback.error.title': 'Authorization failed',
  'callback.error.missingParams': 'Missing code or state parameter',
  'callback.error.sessionExpired': 'The authorization session has expired. Please start login again from DSH.',
  'callback.hint': 'You can close this tab',
  'time.inMinutes': 'expires in {n} minutes',
  'time.inHours': 'expires in {n} hours',
  'time.inDays': 'expires in {n} days',
  'time.agoMinutes': 'expired {n} minutes ago',
  'time.agoHours': 'expired {n} hours ago',
  'time.agoDays': 'expired {n} days ago',
  'html.lang': 'en',
  'api.error.serverNotReady': 'OAuth callback server is not ready yet, please retry',
  'api.error.noRefreshBundle': 'no refresh bundle — please reauthorize',
}

/**
 * 简单插值：{name} -> value。
 * @param {Record<string, string>} dictionary
 * @param {string} key
 * @param {Record<string, string | number>=} values
 */
export function interpolate(dictionary, key, values) {
  let text = dictionary[key] ?? key
  if (values !== undefined) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

/**
 * 从 Accept-Language 头里选 zh / en。
 * @param {string | undefined} acceptLanguage
 */
export function pickLocale(acceptLanguage) {
  if (typeof acceptLanguage !== 'string') return zh
  const tag = acceptLanguage.toLowerCase()
  if (tag.includes('zh')) return zh
  if (tag.includes('en')) return en
  return zh
}

/** 直接根据 key 选字典并插值。 */
export function t(dictionary, key, values) {
  return interpolate(dictionary, key, values)
}
