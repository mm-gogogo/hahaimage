import { useEffect, useMemo, useState } from 'react'
import { ToolPage } from '../components/ToolPage'
import { downloadBlob } from '../lib/download'
import { LOCAL_OVERRIDE_KEY, getConfig, isConfigLoaded, subscribeConfig, type SiteConfig } from '../lib/config'

const AD_SLOTS = [
  { id: 'home-top', label: '首页顶部（工具列表上方）' },
  { id: 'home-bottom', label: '首页底部' },
  { id: 'tool-bottom', label: '工具页底部（所有工具页）' },
]

interface FormState {
  siteName: string
  footerText: string
  umamiSrc: string
  umamiId: string
  gaId: string
  baiduId: string
  customScripts: string
  adsEnabled: boolean
  adHtml: Record<string, string>
}

function fromConfig(cfg: SiteConfig): FormState {
  return {
    siteName: cfg.site?.name ?? '',
    footerText: cfg.site?.footerText ?? '',
    umamiSrc: cfg.analytics?.umami?.src ?? '',
    umamiId: cfg.analytics?.umami?.websiteId ?? '',
    gaId: cfg.analytics?.googleAnalyticsId ?? '',
    baiduId: cfg.analytics?.baiduId ?? '',
    customScripts: (cfg.analytics?.customScripts ?? []).join('\n'),
    adsEnabled: cfg.ads?.enabled ?? false,
    adHtml: Object.fromEntries(AD_SLOTS.map(s => [s.id, cfg.ads?.slots?.[s.id]?.html ?? ''])),
  }
}

function toConfig(f: FormState): SiteConfig {
  const cfg: SiteConfig = {}
  if (f.siteName || f.footerText) {
    cfg.site = {}
    if (f.siteName) cfg.site.name = f.siteName
    if (f.footerText) cfg.site.footerText = f.footerText
  }
  const analytics: NonNullable<SiteConfig['analytics']> = {}
  if (f.umamiSrc && f.umamiId) analytics.umami = { src: f.umamiSrc, websiteId: f.umamiId }
  if (f.gaId) analytics.googleAnalyticsId = f.gaId
  if (f.baiduId) analytics.baiduId = f.baiduId
  const custom = f.customScripts.split('\n').map(s => s.trim()).filter(Boolean)
  if (custom.length) analytics.customScripts = custom
  if (Object.keys(analytics).length) cfg.analytics = analytics

  const slots = Object.fromEntries(
    Object.entries(f.adHtml)
      .filter(([, html]) => html.trim())
      .map(([id, html]) => [id, { html }]),
  )
  if (f.adsEnabled || Object.keys(slots).length) {
    cfg.ads = { enabled: f.adsEnabled, slots }
  }
  return cfg
}

export default function Admin() {
  const [form, setForm] = useState<FormState>(() => fromConfig(getConfig()))
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (isConfigLoaded()) setForm(fromConfig(getConfig()))
    return subscribeConfig(() => setForm(fromConfig(getConfig())))
    // 仅初始化与配置到达时同步一次，不随表单编辑回写
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const json = useMemo(() => JSON.stringify(toConfig(form), null, 2), [form])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <ToolPage
      title="站点配置"
      desc="为部署者提供的配置生成器：填写统计与广告设置后，把生成的 site.config.json 放到站点根目录（仓库 public/ 目录）即可生效，无需重新构建。也可以保存到本浏览器实时预览效果。"
    >
      <div className="panel">
        <h2>站点信息</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ad-name">站点名称（可选）</label>
            <input id="ad-name" className="input" value={form.siteName} onChange={e => set('siteName', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ad-footer">页脚附加文字（如备案号，可选）</label>
            <input id="ad-footer" className="input" value={form.footerText} onChange={e => set('footerText', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>统计分析</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ad-umami-src">umami 脚本地址</label>
            <input id="ad-umami-src" className="input" placeholder="https://analytics.example.com/script.js" value={form.umamiSrc} onChange={e => set('umamiSrc', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ad-umami-id">umami Website ID</label>
            <input id="ad-umami-id" className="input" placeholder="xxxxxxxx-xxxx-…" value={form.umamiId} onChange={e => set('umamiId', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ad-ga">Google Analytics 4 ID</label>
            <input id="ad-ga" className="input" placeholder="G-XXXXXXXXXX" value={form.gaId} onChange={e => set('gaId', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ad-baidu">百度统计 ID</label>
            <input id="ad-baidu" className="input" placeholder="hm.js? 后面的一串" value={form.baiduId} onChange={e => set('baiduId', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ad-custom">其他统计脚本 URL（每行一个，可选）</label>
          <textarea id="ad-custom" className="input" rows={2} value={form.customScripts} onChange={e => set('customScripts', e.target.value)} />
        </div>
      </div>

      <div className="panel">
        <h2>广告位</h2>
        <label className="check">
          <input type="checkbox" checked={form.adsEnabled} onChange={e => set('adsEnabled', e.target.checked)} />
          启用广告位
        </label>
        {AD_SLOTS.map(slot => (
          <div className="field" key={slot.id}>
            <label htmlFor={`ad-slot-${slot.id}`}>{slot.label}</label>
            <textarea
              id={`ad-slot-${slot.id}`}
              className="input"
              rows={3}
              placeholder="粘贴广告代码（HTML，支持 <script>，如 AdSense）"
              value={form.adHtml[slot.id] ?? ''}
              onChange={e => set('adHtml', { ...form.adHtml, [slot.id]: e.target.value })}
            />
          </div>
        ))}
        <p className="help" style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
          未填写代码的槽位不会渲染任何占位元素。
        </p>
      </div>

      <div className="panel">
        <h2>生成的 site.config.json</h2>
        <textarea className="input" rows={10} readOnly value={json} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} />
        <div className="row">
          <button className="btn btn-primary" onClick={() => downloadBlob(new Blob([json], { type: 'application/json' }), 'site.config.json')}>
            下载配置文件
          </button>
          <button
            className="btn"
            onClick={() => {
              localStorage.setItem(LOCAL_OVERRIDE_KEY, json)
              setSavedMsg('已保存到本浏览器，刷新页面后生效（仅本机预览，正式部署请把文件放到 public/ 目录）')
            }}
          >
            保存到本浏览器预览
          </button>
          <button
            className="btn"
            onClick={() => {
              localStorage.removeItem(LOCAL_OVERRIDE_KEY)
              setSavedMsg('已清除本浏览器中的预览配置，刷新页面后恢复')
            }}
          >
            清除本机预览
          </button>
        </div>
        {savedMsg && <p className="msg msg-ok" role="status">{savedMsg}</p>}
      </div>
    </ToolPage>
  )
}
