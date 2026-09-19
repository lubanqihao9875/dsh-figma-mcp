/**
 * dsh-figma-mcp — 浏览器半体。
 */
window.__ModuleLoader__.load({
  id: 'dsh-figma-mcp',
  factory: (require) => {
    const exports = {}
    const React = require('react')
    const { jsx, jsxs, Fragment } = require('react/jsx-runtime')
    const { useState, useEffect, useCallback, useRef } = React
    const UI = require('@deepseek-ai/dsh-client-ui-primitives')
    const Modal = UI.Modal
    const Button = UI.Button

    /* ============================================================ i18n */

    const zh = {
      'card.name': 'DSH Figma MCP',
      'card.desc': '授权一次可让 DSH 直接读写你的 Figma 设计文件、查询资源、读取样式。',
      'card.copy': '⧉ 复制',
      'card.copy.title': '复制完整 token',
      'card.copied': '已复制',

      'row.status.label': '授权状态',
      'row.status.hint': 'Figma授权连接状态',
      'row.token.label': 'Token',
      'row.token.hint': '访问令牌',
      'row.expires.label': '过期时间',
      'row.expires.hint': '访问令牌失效时间',

      'state.loading': '加载中',
      'state.connected': '已连接',
      'state.expiring': '即将过期',
      'state.disconnected': '未连接',
      'state.expired': '已过期',

      'btn.connect': '连接 Figma',
      'btn.reauth': '重新授权',
      'btn.disconnect': '断开',
      'btn.refresh': '刷新授权',
      'btn.cancel': '取消',

      'modal.disconnect.title': '断开 Figma',
      'modal.disconnect.desc': '已连接的 Figma 会立即失效',

      'error.refresh': '刷新失败：{message}',

      'time.todayExpire': '今天 {time} 过期',
      'time.inMinutes': '{n} 分钟后过期',
      'time.inHours': '{n} 小时后过期',
      'time.inDays': '{n} 天后过期',
      'time.agoMinutes': '{n} 分钟前过期',
      'time.agoHours': '{n} 小时前过期',
      'time.agoDays': '{n} 天前过期',
    }

    const en = {
      'card.name': 'DSH Figma MCP',
      'card.desc': 'Authorize once so DSH can read and write your Figma files, query assets, and read styles.',
      'card.copy': '⧉ Copy',
      'card.copy.title': 'Copy full token',
      'card.copied': 'Copied',

      'row.status.label': 'Authorization',
      'row.status.hint': 'Status of Figma connection',
      'row.token.label': 'Token',
      'row.token.hint': 'Access token',
      'row.expires.label': 'Expires',
      'row.expires.hint': 'When access token becomes invalid',

      'state.loading': 'Loading',
      'state.connected': 'Connected',
      'state.expiring': 'Expiring soon',
      'state.disconnected': 'Not connected',
      'state.expired': 'Expired',

      'btn.connect': 'Connect Figma',
      'btn.reauth': 'Reauthorize',
      'btn.disconnect': 'Disconnect',
      'btn.refresh': 'Refresh auth',
      'btn.cancel': 'Cancel',

      'modal.disconnect.title': 'Disconnect Figma',
      'modal.disconnect.desc': 'The active Figma connection will be invalidated immediately',

      'error.refresh': 'Refresh failed: {message}',

      'time.todayExpire': 'today at {time}',
      'time.inMinutes': 'expires in {n} minutes',
      'time.inHours': 'expires in {n} hours',
      'time.inDays': 'expires in {n} days',
      'time.agoMinutes': 'expired {n} minutes ago',
      'time.agoHours': 'expired {n} hours ago',
      'time.agoDays': 'expired {n} days ago',
    }

    const interpolate = (dictionary, key, values) => {
      let text = dictionary[key] !== undefined ? dictionary[key] : key
      if (values !== undefined) {
        for (const name in values) {
          if (Object.prototype.hasOwnProperty.call(values, name)) {
            text = text.split('{' + name + '}').join(String(values[name]))
          }
        }
      }
      return text
    }

    let runtimeT = undefined

    const setRuntimeTranslate = (fn) => { runtimeT = fn }

    const pickDictionary = () => {
      if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang
        if (lang && lang.toLowerCase().startsWith('en')) return en
      }
      return zh
    }

    const t = (key, values) => {
      if (runtimeT !== undefined) return runtimeT(key, values)
      return interpolate(pickDictionary(), key, values)
    }

    const wireLocale = (ctx) => {
      try {
        const locale = ctx && (ctx.locale || (ctx.get && ctx.get('locale')))
        if (locale === undefined || locale === null) return
        if (typeof locale.register === 'function') {
          // 注册到 dsh-figma-mcp namespace；return 的 dispose 留给 host 的 ctx.effect
          try { locale.register('dsh-figma-mcp', { zh, en }) } catch { /* 已注册过 */ }
        }
        if (typeof locale.bind === 'function') {
          setRuntimeTranslate(locale.bind('dsh-figma-mcp'))
        }
      } catch {
        /* locale 服务不可用，保持 fallback */
      }
    }

    /* ============================================================ CSS */

    const CSS = [
      // 卡片外壳
      '.setCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}',
      '.setCard:hover{border-color:var(--dsw-alias-label-dimmed)}',
      '.setCardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}',

      // header：全宽可点击按钮
      '.setHeader{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}',
      '.setHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',

      // header 内部：名称 + 描述
      '.setHeadText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}',
      '.setName{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}',
      '.setDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}',

      // chevron：右侧展开箭头，展开时旋转 180°
      '.setChevron{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex;transition:transform .16s;align-items:center;justify-content:center}',
      '.setChevronOpen{transform:rotate(180deg)}',

      // body：内容区
      '.setBody{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}',

      // row：行布局，行间用 border-top 分隔
      '.setRow{display:flex;align-items:center;gap:12px;padding:12px 0}',
      '.setRow + .setRow{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.setLabelBox{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}',
      '.setLabel{font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}',
      '.setHint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}',
      '.setRowAction{flex:none;display:inline-flex;align-items:center;gap:6px;min-width:0}',

      // value 状态色（连 / 即将过期 / 已过期）—— 只换色，不加粗
      '.ok{color:var(--dsw-alias-state-success-primary)}',
      '.warn{color:var(--dsw-alias-state-warn-primary)}',
      '.severityError{color:var(--dsw-alias-state-error-primary)}',
      '.muted{color:var(--dsw-alias-label-tertiary)}',

      // Token —— 单色背景 pill
      '.token{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;padding:2px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);letter-spacing:.2px}',
      '.copyBtn{appearance:none;background:transparent;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:3px;line-height:1.5}',
      '.copyBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.copied{color:var(--dsw-alias-state-success-primary);font-size:11px;font-weight:600;opacity:1;transition:opacity .4s;margin-left:2px}',
      '.copied[data-fade]{opacity:0}',

      // actions：操作按钮区，靠右对齐
      '.setActions{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}',

      // error
      '.err{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;margin:8px 0;white-space:pre-wrap;word-break:break-all}',

      // danger button：危险操作按钮（outline 改色）
      '.dangerBtn.dangerBtn{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.dangerBtn.dangerBtn:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:#fff;border-color:var(--dsw-alias-state-error-primary)}',
    ].join('\n')

    let styleInjected = false
    const ensureStyle = () => {
      if (styleInjected) return
      const el = document.createElement('style')
      el.setAttribute('data-plugin', 'dsh-figma-mcp')
      el.textContent = CSS
      document.head.appendChild(el)
      styleInjected = true
    }

    /* ============================================================ helpers */

    const classifyStatus = (status) => {
      if (status === null) return 'loading'
      if (!status.connected) return 'disconnected'
      const parsed = Date.parse(status.expiresAt || '')
      if (!Number.isFinite(parsed)) return 'connected'
      const now = Date.now()
      if (parsed < now) return 'expired'
      if (parsed - now < 24 * 60 * 60 * 1000) return 'expiring'
      return 'connected'
    }

    const maskToken = (token) => {
      if (typeof token !== 'string' || token.length < 8) return token || ''
      return token.slice(0, 4) + '…' + token.slice(-4)
    }

    const fmtRelative = (iso) => {
      const parsed = Date.parse(iso)
      if (!Number.isFinite(parsed)) return ''
      const diff = parsed - Date.now()
      const abs = Math.abs(diff)
      const min = 60_000, hour = 60 * min, day = 24 * hour
      if (diff >= 0 && diff < day) {
        const d = new Date(parsed)
        const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
        return t('time.todayExpire', { time })
      }
      if (abs < hour) {
        return diff >= 0
          ? t('time.inMinutes', { n: Math.max(1, Math.round(abs / min)) })
          : t('time.agoMinutes', { n: Math.max(1, Math.round(abs / min)) })
      }
      if (abs < day) {
        return diff >= 0
          ? t('time.inHours', { n: Math.round(abs / hour) })
          : t('time.agoHours', { n: Math.round(abs / hour) })
      }
      return diff >= 0
        ? t('time.inDays', { n: Math.round(abs / day) })
        : t('time.agoDays', { n: Math.round(abs / day) })
    }

    /* ============================================================ Card */

    function CopyButton({ value }) {
      const [phase, setPhase] = useState('idle') // idle | copied | fading
      const timerRef = useRef(null)
      useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

      const onClick = async () => {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value)
          } else {
            const ta = document.createElement('textarea')
            ta.value = value
            ta.style.position = 'fixed'
            ta.style.left = '-9999px'
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
          }
          setPhase('copied')
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setPhase('fading'), 1100)
          timerRef.current = setTimeout(() => setPhase('idle'), 1600)
        } catch {
          /* 复制失败静默 */
        }
      }

      return jsxs(Fragment, {
        children: [
          jsx('button', {
            className: 'copyBtn',
            onClick,
            title: t('card.copy.title'),
            children: t('card.copy'),
          }),
          phase !== 'idle'
            ? jsx('span', { className: 'copied', 'data-fade': phase === 'fading' ? 'true' : null, children: t('card.copied') })
            : null,
        ],
      })
    }

    function FigmaCard(props) {
      props = props || {}
      const [status, setStatus] = useState(null) // {connected, accessTokenFull, expiresAt} | null
      const [error, setError] = useState('')
      const [pending, setPending] = useState(false) // 用户点了连接，host 在等回调；不渲染任何"等待"UI
      const [confirmDisconnect, setConfirmDisconnect] = useState(false)
      const [expanded, setExpanded] = useState(false) // 默认折叠；首次拿到 connected 状态时自动展开
      const userExpandedRef = useRef(false) // 用户手动 toggle 后，跟随用户意图
      const mountedRef = useRef(true)
      const pollTimerRef = useRef(null)

      const fetchStatus = useCallback(async () => {
        try {
          const r = await fetch('/api/figma/status', { headers: { accept: 'application/json' } })
          if (!r.ok) throw new Error('status ' + r.status)
          const j = await r.json()
          if (mountedRef.current) setStatus(j)
          return j
        } catch {
          return null
        }
      }, [])

      useEffect(() => {
        mountedRef.current = true
        ensureStyle()
        fetchStatus()
        return () => {
          mountedRef.current = false
          if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        }
      }, [fetchStatus])

      // 拿到状态后：用户未手动 toggle 过，且有 token 信息（connected/expiring/expired），自动展开
      useEffect(() => {
        if (userExpandedRef.current) return
        if (status === null) return
        const k = classifyStatus(status)
        if (k === 'connected' || k === 'expiring' || k === 'expired') {
          setExpanded(true)
        }
      }, [status])

      // pending 期间 silent polling；卡片不显示任何"等待"提示
      useEffect(() => {
        if (!pending) return
        let cancelled = false
        const tick = async () => {
          while (!cancelled && mountedRef.current) {
            await new Promise((res) => setTimeout(res, 1500))
            if (cancelled || !mountedRef.current) return
            const s = await fetchStatus()
            if (s && s.connected && Date.parse(s.expiresAt || '') > Date.now()) {
              setPending(false)
              setError('')
              return
            }
          }
        }
        tick()
        return () => { cancelled = true }
      }, [pending, fetchStatus])

      const doLogin = useCallback(async () => {
        setError('')
        try {
          const r = await fetch('/api/figma/login/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          })
          if (!r.ok) throw new Error('HTTP ' + r.status)
          const j = await r.json()
          if (!j.ok) throw new Error(j.error || 'login start failed')
          window.open(j.authUrl, '_blank', 'noopener,noreferrer')
          setPending(true)
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e))
        }
      }, [])

      const doDisconnect = useCallback(async () => {
        setError('')
        setPending(false)
        try {
          await fetch('/api/figma/disconnect', { method: 'POST' })
          await fetchStatus()
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e))
        }
      }, [fetchStatus])

      const askDisconnect = useCallback(() => {
        setConfirmDisconnect(true)
      }, [])

      const cancelDisconnect = useCallback(() => {
        setConfirmDisconnect(false)
      }, [])

      const doRefresh = useCallback(async () => {
        if (!status || !status.connected) return
        setError('')
        try {
          const r = await fetch('/api/figma/refresh', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          })
          const j = await r.json().catch(() => ({}))
          if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status))
          await fetchStatus()
        } catch (e) {
          setError(t('error.refresh', { message: e instanceof Error ? e.message : String(e) }))
        }
      }, [status, fetchStatus])

      const [localeVersion, setLocaleVersion] = useState(0)
      useEffect(() => {
        const locale = (typeof window !== 'undefined' && window.__DSH_LOCALE__) || null
        if (locale === null || typeof locale.subscribe !== 'function') return undefined
        return locale.subscribe(() => setLocaleVersion((v) => v + 1))
      }, [])

      const kind = classifyStatus(status)

      const stateLabel = (() => {
        if (kind === 'loading') return t('state.loading')
        if (kind === 'connected') return t('state.connected')
        if (kind === 'expiring') return t('state.expiring')
        if (kind === 'expired') return t('state.expired')
        return t('state.disconnected')
      })()

      const stateClass = kind === 'connected' ? 'ok'
        : kind === 'expiring' ? 'warn'
        : kind === 'expired' ? 'severityError'
        : 'muted'

      const hasToken = status !== null && status.connected === true && typeof status.accessTokenFull === 'string' && status.accessTokenFull.length > 0

      const full = hasToken ? status.accessTokenFull : ''
      const masked = hasToken ? maskToken(full) : ''
      const expiresText = hasToken && status.expiresAt ? fmtRelative(status.expiresAt) : ''

      // setRow：label+hint 在左，action 在右；多行靠 +.setRow border-top 隔开
      const row = (label, hint, action) =>
        jsxs('div', { className: 'setRow', children: [
          jsxs('div', { className: 'setLabelBox', children: [
            jsx('div', { className: 'setLabel', children: label }),
            hint ? jsx('div', { className: 'setHint', children: hint }) : null,
          ] }),
          action ? jsx('div', { className: 'setRowAction', children: action }) : null,
        ] })

      const stateValue = jsx('span', { className: stateClass, children: stateLabel })

      const rows = jsxs(Fragment, { children: [
        row(t('row.status.label'), t('row.status.hint'), stateValue),
        row(t('row.token.label'), t('row.token.hint'),
          hasToken
            ? jsxs(Fragment, { children: [
                jsx('span', { className: 'token', children: masked }),
                jsx(CopyButton, { value: full }),
              ] })
            : jsx('span', { className: 'muted', children: '—' }),
        ),
        row(t('row.expires.label'), t('row.expires.hint'),
          expiresText
            ? jsx('span', { children: expiresText })
            : jsx('span', { className: 'muted', children: '—' }),
        ),
      ] })

      const actions = (() => {
        if (kind === 'disconnected') {
          return jsx(Button, { variant: 'primary', onClick: doLogin, children: t('btn.connect') })
        }
        if (kind === 'expired') {
          return jsxs(Fragment, { children: [
            jsx(Button, { variant: 'primary', onClick: doLogin, children: t('btn.reauth') }),
            jsx(Button, { variant: 'outline', onClick: askDisconnect, className: 'dangerBtn', children: t('btn.disconnect') }),
          ] })
        }
        if (kind === 'connected' || kind === 'expiring') {
          return jsxs(Fragment, { children: [
            jsx(Button, {
              variant: 'ghost',
              onClick: doRefresh,
              children: t('btn.refresh'),
            }),
            jsx(Button, { variant: 'outline', onClick: askDisconnect, className: 'dangerBtn', children: t('btn.disconnect') }),
          ] })
        }
        return null
      })()

      const ChevronIcon = UI.IconChevronDownOutline14

      return jsxs(Fragment, {
        children: [
          jsxs('div', { className: 'setCard' + (expanded ? ' setCardOpen' : ''), 'data-locale-version': localeVersion, children: [
            jsx('button', {
              type: 'button',
              className: 'setHeader',
              onClick: () => { userExpandedRef.current = true; setExpanded((v) => !v) },
              'aria-expanded': expanded,
              children: [
                jsxs('div', { className: 'setHeadText', children: [
                  jsx('div', { className: 'setName', children: t('card.name') }),
                  jsx('div', { className: 'setDesc', children: t('card.desc') }),
                ] }),
                jsx(ChevronIcon, { size: 14, className: 'setChevron' + (expanded ? ' setChevronOpen' : '') }),
              ],
            }),
            expanded ? jsx('div', { className: 'setBody', children: jsxs(Fragment, { children: [
              rows,
              actions ? jsx('div', { className: 'setActions', children: actions }) : null,
              error ? jsx('div', { className: 'err', children: error }) : null,
            ] }) }) : null,
          ] }),
          jsx(Modal, {
            open: confirmDisconnect,
            onClose: cancelDisconnect,
            title: t('modal.disconnect.title'),
            description: t('modal.disconnect.desc'),
            footer: jsxs(Fragment, { children: [
              jsx(Button, { variant: 'ghost', onClick: cancelDisconnect, children: t('btn.cancel') }),
              jsx(Button, {
                variant: 'primary',
                onClick: () => { setConfirmDisconnect(false); doDisconnect() },
                children: t('btn.disconnect'),
              }),
            ] }),
          }),
        ],
      })
    }

    exports.inject = ['slots', 'locale']
    exports.apply = (ctx) => {
      try { wireLocale(ctx) } catch { /* 保持 fallback */ }
      try {
        const locale = ctx && (ctx.locale || (ctx.get && ctx.get('locale')))
        if (locale && typeof locale.subscribe === 'function' && typeof window !== 'undefined') {
          window.__DSH_LOCALE__ = locale
        }
      } catch { /* 保持 fallback */ }
      ctx.slots.inject('settings.plugin.item', () =>
        ctx.slots.register(
          {
            name: 'settings.plugin.item',
            key: 'figma-mcp',
            locale: 'figma-mcp',
            inject: () => ({}),
          },
          () => React.createElement(FigmaCard),
        ),
      )
    }

    return exports
  },
})
