/**
 * dsh-figma-mcp — 浏览器半体。
 */
window.__ModuleLoader__.load({
  id: 'dsh-figma-mcp',
  factory: (require) => {
    const exports = {}
    const React = require('react')
    const { jsx, jsxs, Fragment } = require('react/jsx-runtime')
    const { useState, useEffect, useCallback, useRef, useMemo } = React

    /* ============================================================ i18n */

    const zh = {
      'section.heading': 'DSH Figma MCP',
      'section.description': '授权一次可让 DSH 直接读写你的 Figma 设计文件、查询资源、读取样式。',
      'section.label': 'DSH Figma MCP',
      'connection.title': '连接',
      'skill.title': 'Skill',
      
      'row.status.label': '授权状态',
      'row.expires.label': '过期时间',
      'row.skill.label': '加载本插件内置 Skill',
      
      'state.loading': '加载中',
      'state.connected': '已连接',
      'state.expiring': '即将过期',
      'state.disconnected': '未连接',
      'state.expired': '已过期',

      'btn.connect': '连接 Figma',
      'btn.reauth': '重新授权',
      'btn.disconnect': '断开',
      'btn.disconnect.confirm': '确认断开',
      'btn.refresh': '刷新授权',
      'btn.cancel': '取消',

      'modal.disconnect.title': '断开 Figma',
      'modal.disconnect.desc': '已连接的 Figma 会立即失效',

      'error.refresh': '刷新失败：{message}',
      'error.network': '网络错误,请检查连接',
      'toast.refreshed': 'Token 已更新',

      'time.todayExpire': '今天 {time} 过期',
      'time.inMinutes': '{n} 分钟后过期',
      'time.inHours': '{n} 小时后过期',
      'time.inDays': '{n} 天后过期',
      'time.agoMinutes': '{n} 分钟前过期',
      'time.agoHours': '{n} 小时前过期',
      'time.agoDays': '{n} 天前过期',
    }

    const en = {
      'section.heading': 'DSH Figma MCP',
      'section.description': 'Authorize once so DSH can read and write your Figma files, query assets, and read styles.',
      'section.label': 'Figma',
      'connection.title': 'Connection',
      'skill.title': 'Skill',
      
      'row.status.label': 'Authorization',
      'row.expires.label': 'Expires',
      'row.skill.label': 'Load this plugin\'s built-in skill',
      
      'state.loading': 'Loading',
      'state.connected': 'Connected',
      'state.expiring': 'Expiring soon',
      'state.disconnected': 'Not connected',
      'state.expired': 'Expired',

      'btn.connect': 'Connect Figma',
      'btn.reauth': 'Reauthorize',
      'btn.disconnect': 'Disconnect',
      'btn.disconnect.confirm': 'Confirm disconnect',
      'btn.refresh': 'Refresh auth',
      'btn.cancel': 'Cancel',

      'modal.disconnect.title': 'Disconnect Figma',
      'modal.disconnect.desc': 'The active Figma connection will be invalidated immediately',

      'error.refresh': 'Refresh failed: {message}',
      'error.network': 'Network error, please check your connection',
      'toast.refreshed': 'Token updated',

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
          try { locale.register('dsh-figma-mcp', { zh, en }) } catch { /* 已注册过 */ }
        }
        if (typeof locale.bind === 'function') {
          setRuntimeTranslate(locale.bind('dsh-figma-mcp'))
        }
        if (typeof locale.subscribe === 'function' && typeof window !== 'undefined') {
          window.__DSH_LOCALE__ = locale
        }
      } catch {
        /* locale 服务不可用，保持 fallback */
      }
    }

    /* ============================================================ CSS */

    const CSS = [
      // ===== page shell =====
      '.setPage{box-sizing:border-box;max-width:720px;margin:0 auto;padding:0}',
      '.pageHeading{margin:0 0 6px;font-size:18px;line-height:26px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.pageIntro{margin:0 0 28px;max-width:66ch;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary)}',

      // ===== section card =====
      '.setSection{display:flex;flex-direction:column;gap:14px;padding:18px 20px 16px;margin:0 0 16px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}',
      '.setSection:last-child{margin-bottom:0}',
      '.setSectionTitle{margin:0;font-size:14px;line-height:22px;font-weight:600;color:var(--dsw-alias-label-primary);letter-spacing:.1px}',

      // ===== row =====
      '.setRow{display:flex;align-items:center;gap:14px;padding:14px 0}',
      '.setRow + .setRow{border-top:0.5px solid var(--dsw-alias-border-l1)}',
      '.setLabelBox{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}',
      '.setLabel{font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}',
      '.setRowAction{flex:none;display:inline-flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap;justify-content:flex-end}',

      // ===== status indicator =====
      '.statusTag{flex:none;display:inline-flex;align-items:center;border-radius:999px;corner-shape:round;padding:2px 10px;font-size:12px;line-height:18px;font-weight:500;white-space:nowrap}',
      '.statusTagLoading{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 12%, transparent);color:var(--dsw-alias-label-tertiary);animation:tagPulse 1.4s ease-in-out infinite}',
      '.statusTagConnected{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);color:var(--dsw-alias-state-success-primary)}',
      '.statusTagExpiring{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);color:var(--dsw-alias-state-warn-primary)}',
      '.statusTagExpired{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}',
      '.statusTagDisconnected{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}',
      '@keyframes tagPulse{0%,100%{opacity:.6}50%{opacity:1}}',

      '.ok{color:var(--dsw-alias-state-success-primary)}',
      '.warn{color:var(--dsw-alias-state-warn-primary)}',
      '.severityError{color:var(--dsw-alias-state-error-primary)}',
      '.muted{color:var(--dsw-alias-label-tertiary)}',

      // ===== actions =====
      '.setActions{border-top:0.5px solid var(--dsw-alias-border-l1);justify-content:flex-end;align-items:center;gap:12px;padding:14px 0 4px;display:flex}',

      // ===== inline error =====
      '.err{display:flex;align-items:flex-start;gap:8px;padding:10px 14px;margin:0 0 16px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-state-error-bg-soft,rgba(231,72,72,.10));color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px;border:0.5px solid var(--dsw-alias-state-error-primary)}',
      '.errIcon{flex:none;width:16px;height:16px}',

      // ===== button =====
      '.btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:var(--dsw-radius-md);cursor:pointer;font:inherit;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);background:transparent;padding:0 14px;transition:background .12s,color .12s,border-color .12s;font-weight:500}',
      '.btnSizeMd{height:36px}',
      '.btnSizeSm{height:28px;font-size:12px;line-height:18px;padding:0 12px}',
      '.btn:disabled{cursor:not-allowed;opacity:.4}',
      '.btn:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.btnPrimary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}',
      '.btnPrimary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}',
      '.btnOutline{border:0.5px solid var(--dsw-alias-border-l3);background:transparent}',
      '.btnOutline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.btnGhost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.btnGhost:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}',
      '.btnDanger{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-state-error-bg-soft,rgba(231,72,72,.06));border:0.5px solid var(--dsw-alias-state-error-primary)}',
      '.btnDanger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground);border-color:var(--dsw-alias-state-error-primary)}',

      // ===== switch =====
      '.sw{box-sizing:border-box;position:relative;flex:none;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);cursor:pointer;color:inherit;font:inherit;appearance:none;-webkit-appearance:none;transition:background .15s}',
      '.swOn{background:var(--dsw-alias-state-business-primary)}',
      '.sw:disabled{cursor:not-allowed;opacity:.6}',
      '.sw:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.swThumb{background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:16px;height:16px;display:block;box-shadow:0 1px 2px rgba(0,0,0,.18),0 0 0 0.5px rgba(0,0,0,.04);transition:transform .15s cubic-bezier(.4,0,.2,1)}',
      '.swOn .swThumb{transform:translateX(16px)}',

      // ===== modal =====
      '@keyframes mDialogIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}',
      '@keyframes mMaskIn{from{opacity:0}to{opacity:1}}',
      '.mRoot{pointer-events:auto;position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:max(24px,var(--dsh-frame-top-clearance,24px)) 24px}',
      '.mMask{position:absolute;inset:0;backdrop-filter:var(--dsw-mask-blur);background:var(--dsw-alias-bg-mask-1);animation:mMaskIn .12s ease-out}',
      '.mDialog{position:relative;z-index:1;display:flex;flex-direction:column;gap:18px;width:380px;max-width:calc(100vw - 48px);padding:0 0 24px;overflow:hidden;border:0;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent);animation:mDialogIn .14s cubic-bezier(.4,0,.2,1)}',
      '.mHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:22px 14px 12px 24px}',
      '.mTitle{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.mClose{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;cursor:pointer;color:var(--dsw-alias-label-secondary);transition:background .12s}',
      '.mClose:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.mClose:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
      '.mBody{display:flex;flex-direction:column;min-width:0;padding:0 24px;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}',
      '.mFooter{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:0 24px}',

      // ===== sr-only =====
      '.srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',

      // ===== shimmer =====
      '.shimmer{position:relative;display:inline-block;width:80px;height:12px;border-radius:4px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
      '.shimmer::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04)) 50%,transparent 100%);animation:shimmerSlide 1.4s linear infinite}',
      '@keyframes shimmerSlide{from{transform:translateX(-100%)}to{transform:translateX(100%)}}',

      // ===== toast =====
      '.toast{position:fixed;top:40px;left:50%;z-index:1100;pointer-events:none;display:flex;align-items:center;gap:10px;width:max-content;max-width:min(640px,calc(100vw - 48px));padding:12px 16px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-toast-bg);color:var(--dsw-alias-toast-label);font-size:14px;line-height:22px;box-shadow:var(--dsw-shadow-lv3);transform:translateX(-50%);animation:dsh-toast-in 160ms ease-out,dsh-toast-fade 1000ms ease var(--dsh-toast-hold,3000ms) forwards}',
      '.toastIcon{display:grid;place-items:center;flex:none;color:var(--dsw-alias-state-success-primary)}',
      '.toastText{min-width:0}',
      '@keyframes dsh-toast-in{from{opacity:0;transform:translate(-50%,-6px)}to{opacity:1;transform:translate(-50%,0)}}',
      '@keyframes dsh-toast-fade{to{opacity:0;visibility:hidden}}',
      '@media (prefers-reduced-motion:reduce){.toast{animation:dsh-toast-fade 1000ms ease var(--dsh-toast-hold,3000ms) forwards}}',
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

    /* ============================================================ UI primitives */

    function Button({ variant, danger, size, className, children, ...rest }) {
      const sizeCls = size === 'sm' ? ' btnSizeSm' : ' btnSizeMd'
      const cls = 'btn'
        + sizeCls
        + (variant === 'primary' ? ' btnPrimary' : '')
        + (variant === 'outline' ? ' btnOutline' : '')
        + (variant === 'ghost' ? ' btnGhost' : '')
        + (danger ? ' btnDanger' : '')
        + (className ? ' ' + className : '')
      return jsx('button', { type: 'button', className: cls, ...rest, children })
    }

    function Switch({ checked, disabled, onToggle, ariaLabel }) {
      const onKeyDown = (e) => {
        if (disabled) return
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle()
        }
      }
      return jsx('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': ariaLabel,
        disabled,
        className: 'sw' + (checked ? ' swOn' : ''),
        onClick: () => { if (!disabled) onToggle() },
        onKeyDown,
        children: [
          jsx('span', { className: 'swThumb', key: 't' }),
          jsx('span', { className: 'srOnly', key: 'sr', children: checked ? t('state.connected') : t('state.disconnected') }),
        ],
      })
    }

    function Modal({ open, onClose, title, description, footer }) {
      const dialogRef = useRef(null)
      const lastFocusRef = useRef(null)

      useEffect(() => {
        if (!open) return
        lastFocusRef.current = document.activeElement
        const onKey = (e) => {
          if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
          if (e.key === 'Tab' && dialogRef.current) {
            const focusables = dialogRef.current.querySelectorAll(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
            if (focusables.length === 0) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
          }
        }
        window.addEventListener('keydown', onKey)
        const t = setTimeout(() => {
          if (dialogRef.current) {
            const f = dialogRef.current.querySelector('button:not([disabled])')
            if (f) f.focus()
          }
        }, 30)
        return () => {
          window.removeEventListener('keydown', onKey)
          clearTimeout(t)
          if (lastFocusRef.current && typeof lastFocusRef.current.focus === 'function') {
            try { lastFocusRef.current.focus() } catch { /* ignore */ }
          }
        }
      }, [open, onClose])

      if (!open) return null
      return jsx('div', {
        className: 'mRoot',
        onClick: (e) => { if (e.target === e.currentTarget) onClose() },
        children: jsxs(Fragment, {
          children: [
            jsx('div', { className: 'mMask', onClick: onClose }),
            jsxs('div', {
              ref: dialogRef,
              className: 'mDialog',
              role: 'dialog',
              'aria-modal': 'true',
              'aria-labelledby': 'mTitle-' + (title || '').replace(/\s+/g, '_'),
              children: [
                jsxs('div', { className: 'mHeader', children: [
                  jsx('h3', { id: 'mTitle-' + (title || '').replace(/\s+/g, '_'), className: 'mTitle', children: title }),
                  jsx('button', {
                    type: 'button',
                    className: 'mClose',
                    onClick: onClose,
                    'aria-label': t('btn.cancel'),
                    children: jsx('svg', {
                      width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
                      xmlns: 'http://www.w3.org/2000/svg',
                      children: jsx('path', {
                        d: 'M4 4L12 12M12 4L4 12',
                        stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round',
                      }),
                    }),
                  }),
                ] }),
                description
                  ? jsx('div', { className: 'mBody', children: description })
                  : null,
                jsx('div', { className: 'mFooter', children: footer }),
              ],
            }),
          ],
        }),
      })
    }

    /* ============================================================ StatusTag */

    function StatusTag({ kind, label }) {
      const cls = 'statusTag '
        + (kind === 'loading' ? 'statusTagLoading'
          : kind === 'connected' ? 'statusTagConnected'
          : kind === 'expiring' ? 'statusTagExpiring'
          : kind === 'expired' ? 'statusTagExpired'
          : 'statusTagDisconnected')
      return jsx('span', { className: cls, children: label })
    }

    /* ============================================================ SectionCard */

    function SectionCard({ title, children }) {
      return jsxs('div', { className: 'setSection', children: [
        title ? jsx('h4', { className: 'setSectionTitle', children: title }) : null,
        jsx('div', { children }),
      ] })
    }

    /* ============================================================ Row */

    function Row({ label, action, ariaRole, ariaLive }) {
      const lblBox = jsx('div', { className: 'setLabelBox', children:
        jsx('div', { className: 'setLabel', children: label }),
      })
      return jsxs('div', {
        className: 'setRow',
        role: ariaRole || null,
        ...(ariaLive ? { 'aria-live': ariaLive } : {}),
        children: [
          lblBox,
          action ? jsx('div', { className: 'setRowAction', children: action }) : null,
        ],
      })
    }

    /* ============================================================ FigmaCard */

    function FigmaCard(props) {
      props = props || {}
      const [status, setStatus] = useState(null)
      const [error, setError] = useState('')
      const [confirmDisconnect, setConfirmDisconnect] = useState(false)
      const [skillEnabled, setSkillEnabled] = useState(true)
      const [skillInitial, setSkillInitial] = useState(false)
      const [skillSaving, setSkillSaving] = useState(false)
      const [pending, setPending] = useState(false)

      const mountedRef = useRef(true)
      const abortRef = useRef(null)

      const fetchStatus = useCallback(async (signal) => {
        try {
          const r = await fetch('/api/figma/status', {
            headers: { accept: 'application/json' },
            signal: signal || null,
          })
          if (!r.ok) throw new Error('status ' + r.status)
          const j = await r.json()
          if (mountedRef.current) setStatus(j)
          return j
        } catch (e) {
          if (e && e.name === 'AbortError') return null
          return null
        }
      }, [])

      const fetchConfig = useCallback(async (signal) => {
        try {
          const r = await fetch('/api/figma/config', {
            headers: { accept: 'application/json' },
            signal: signal || null,
          })
          if (!r.ok) throw new Error('config ' + r.status)
          const j = await r.json()
          if (!mountedRef.current) return null
          if (j && typeof j.skillEnabled === 'boolean') setSkillEnabled(j.skillEnabled)
          return j
        } catch (e) {
          if (e && e.name === 'AbortError') return null
          return null
        } finally {
          if (mountedRef.current) setSkillInitial(true)
        }
      }, [])

      const initialFetch = useCallback(() => {
        if (abortRef.current) abortRef.current.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl
        Promise.all([fetchStatus(ctrl.signal), fetchConfig(ctrl.signal)]).catch(() => {})
      }, [fetchStatus, fetchConfig])

      useEffect(() => {
        mountedRef.current = true
        ensureStyle()
        initialFetch()
        return () => {
          mountedRef.current = false
          if (abortRef.current) abortRef.current.abort()
        }
      }, [initialFetch])

      const toggleSkill = useCallback(async () => {
        if (skillSaving) return
        const next = !skillEnabled
        setSkillSaving(true)
        try {
          const r = await fetch('/api/figma/config', {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ skillEnabled: next }),
          })
          const j = await r.json().catch(() => ({}))
          if (r.ok && j && typeof j.skillEnabled === 'boolean') setSkillEnabled(j.skillEnabled)
        } catch { /* 写失败 */ } finally {
          if (mountedRef.current) setSkillSaving(false)
        }
      }, [skillEnabled, skillSaving])

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

      const [justRefreshed, setJustRefreshed] = useState(false)
      const refreshToastTimerRef = useRef(null)
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
          setJustRefreshed(true)
          if (refreshToastTimerRef.current !== null) clearTimeout(refreshToastTimerRef.current)
          refreshToastTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setJustRefreshed(false)
            refreshToastTimerRef.current = null
          }, 3000)
        } catch (e) {
          setError(t('error.refresh', { message: e instanceof Error ? e.message : String(e) }))
        }
      }, [status, fetchStatus])
      useEffect(() => () => {
        if (refreshToastTimerRef.current !== null) clearTimeout(refreshToastTimerRef.current)
      }, [])

      useEffect(() => {
        if (!pending) return undefined
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

      const hasToken = status !== null && status.connected === true
      const expiresText = hasToken && status.expiresAt ? fmtRelative(status.expiresAt) : ''

      const statusValue = jsx(StatusTag, {
        kind,
        label: kind === 'loading' ? '—' : stateLabel,
      })

      const expiresValue = !expiresText
        ? jsx('span', { className: 'muted', children: '—' })
        : jsxs('span', {
            className: kind === 'expired' ? 'severityError' : kind === 'expiring' ? 'warn' : '',
            children: expiresText,
          })

      const connectionActions = (() => {
        if (kind === 'disconnected' || kind === 'loading') {
          return jsx(Button, {
            variant: 'primary',
            onClick: doLogin,
            disabled: kind === 'loading',
            children: t('btn.connect'),
          })
        }
        if (kind === 'expired') {
          return jsxs(Fragment, { children: [
            jsx(Button, { variant: 'primary', onClick: doLogin, children: t('btn.reauth') }),
            jsx(Button, { variant: 'outline', danger: true, onClick: () => setConfirmDisconnect(true), children: t('btn.disconnect') }),
          ] })
        }
        return jsxs(Fragment, { children: [
          jsx(Button, {
            variant: kind === 'expiring' ? 'primary' : 'ghost',
            onClick: doRefresh,
            children: t('btn.refresh'),
          }),
          jsx(Button, { variant: 'outline', danger: true, onClick: () => setConfirmDisconnect(true), children: t('btn.disconnect') }),
        ] })
      })()

      const connectionSection = jsx(SectionCard, {
        title: t('connection.title'),
        children: jsxs(Fragment, { children: [
          jsx(Row, {
            label: t('row.status.label'),
            action: statusValue,
          }),
          jsx(Row, {
            label: t('row.expires.label'),
            action: expiresValue,
          }),
          connectionActions
            ? jsx('div', { className: 'setActions', children: connectionActions })
            : null,
        ] }),
      })

      const skillSection = skillInitial
        ? jsx(SectionCard, {
            title: t('skill.title'),
            children: jsx(Row, {
              label: t('row.skill.label'),
              action: jsx(Switch, {
                checked: skillEnabled,
                disabled: skillSaving,
                onToggle: toggleSkill,
                ariaLabel: t('row.skill.label'),
              }),
            }),
          })
        : null

      const errorBlock = error
        ? jsxs('div', { className: 'err', role: 'alert', children: [
            jsx('svg', {
              className: 'errIcon', viewBox: '0 0 16 16', fill: 'none', key: 'i',
              children: jsx('path', {
                d: 'M8 1.5L15 14H1L8 1.5zM8 6v4M8 12v.5',
                stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
              }),
            }),
            jsx('span', { key: 't', children: error }),
          ] })
        : null

      const toast = justRefreshed
        ? jsx('div', { className: 'toast', role: 'status', 'aria-live': 'polite', children:
            t('toast.refreshed'),
          })
        : null

      return jsxs(Fragment, {
        children: [
          jsxs('div', { className: 'setPage', 'data-locale-version': localeVersion, children: [
            jsx('h2', { className: 'pageHeading', children: t('section.heading') }),
            jsx('p', { className: 'pageIntro', children: t('section.description') }),
            errorBlock,
            connectionSection,
            skillSection,
          ] }),
          toast,
          jsx(Modal, {
            open: confirmDisconnect,
            onClose: () => setConfirmDisconnect(false),
            title: t('modal.disconnect.title'),
            description: t('modal.disconnect.desc'),
            footer: jsxs(Fragment, { children: [
              jsx(Button, { variant: 'ghost', onClick: () => setConfirmDisconnect(false), children: t('btn.cancel') }),
              jsx(Button, {
                variant: 'primary',
                danger: true,
                onClick: () => { setConfirmDisconnect(false); doDisconnect() },
                children: t('btn.disconnect.confirm'),
              }),
            ] }),
          }),
        ],
      })
    }

    exports.inject = ['slots', 'locale']
    exports.apply = (ctx) => {
      try { wireLocale(ctx) } catch { /* 保持 fallback */ }

      ctx.slots.inject('settings.section', () => {
        try {
          const unregister = ctx.slots.register(
            {
              name: 'settings.section',
              id: 'figma-mcp',
              label: t('section.label'),
              locale: 'dsh-figma-mcp',
              order: 100,
              inject: () => ({}),
            },
            () => React.createElement(FigmaCard),
          )
          return () => { try { unregister() } catch { /* 卸载时静默 */ } }
        } catch {
          return () => {}
        }
      })
    }

    return exports
  },
})