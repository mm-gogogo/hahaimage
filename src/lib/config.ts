/**
 * 站点运行时配置：广告位 + 统计分析。
 * 部署者编辑 public/site.config.json 即可启用，无需改代码、无需重新构建。
 * 也可在 /#/admin 页面可视化生成配置（写入 localStorage 可本地预览）。
 */

export interface AdSlotConfig {
  /** 广告 HTML 片段，支持 <script>（如 AdSense / 联盟代码） */
  html: string
}

export interface SiteConfig {
  site?: {
    name?: string
    /** 备案号等页脚附加文字 */
    footerText?: string
  }
  analytics?: {
    /** umami：脚本地址 + website id */
    umami?: { src: string; websiteId: string }
    /** Google Analytics 4 measurement id，如 G-XXXXXXX */
    googleAnalyticsId?: string
    /** 百度统计 hm.js 的站点 id */
    baiduId?: string
    /** 其他任意统计脚本 URL 列表 */
    customScripts?: string[]
  }
  ads?: {
    enabled?: boolean
    /** 槽位 id -> 广告代码；内置槽位：home-top / home-bottom / tool-bottom */
    slots?: Record<string, AdSlotConfig>
  }
  ai?: {
    /** AI 抠图模型资源基址；设为本地（如 "./imgly/dist/"）即完全本地托管，留空用官方 CDN */
    modelBaseUrl?: string
  }
  /** 加入社群入口：在页脚与「社群」页展示 */
  community?: {
    title?: string
    description?: string
    links?: { label: string; url: string }[]
  }
}

export const LOCAL_OVERRIDE_KEY = 'hahaimage.config.override'

let config: SiteConfig = {}
let loaded = false
const listeners = new Set<() => void>()

export function getConfig(): SiteConfig {
  return config
}

export function isConfigLoaded(): boolean {
  return loaded
}

export function subscribeConfig(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) fn()
}

export async function loadConfig(): Promise<void> {
  let fileConfig: SiteConfig = {}
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}site.config.json`, { cache: 'no-cache' })
    if (res.ok) fileConfig = await res.json()
  } catch {
    /* 配置文件不存在或网络失败时使用默认空配置 */
  }
  let override: SiteConfig = {}
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDE_KEY)
    if (raw) override = JSON.parse(raw)
  } catch {
    /* 忽略损坏的本地配置 */
  }
  config = { ...fileConfig, ...override }
  loaded = true
  notify()
  initAnalytics(config)
}

let analyticsInjected = false

function addScript(src: string, attrs: Record<string, string> = {}): void {
  const s = document.createElement('script')
  s.src = src
  s.defer = true
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v)
  document.head.appendChild(s)
}

export function initAnalytics(cfg: SiteConfig): void {
  if (analyticsInjected) return
  const a = cfg.analytics
  if (!a) return
  analyticsInjected = true

  if (a.umami?.src && a.umami.websiteId) {
    addScript(a.umami.src, { 'data-website-id': a.umami.websiteId })
  }
  if (a.googleAnalyticsId) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(a.googleAnalyticsId)}`)
    const inline = document.createElement('script')
    inline.textContent = [
      'window.dataLayer = window.dataLayer || [];',
      'function gtag(){dataLayer.push(arguments);}',
      "gtag('js', new Date());",
      `gtag('config', ${JSON.stringify(a.googleAnalyticsId)});`,
    ].join('\n')
    document.head.appendChild(inline)
  }
  if (a.baiduId) {
    addScript(`https://hm.baidu.com/hm.js?${encodeURIComponent(a.baiduId)}`)
  }
  for (const src of a.customScripts ?? []) addScript(src)
}
