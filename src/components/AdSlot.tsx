import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getConfig, subscribeConfig } from '../lib/config'

/**
 * 可配置广告位。未配置时不渲染任何内容（零占位、零布局抖动来源于
 * 配置在首屏前异步到达，因此仅在工具区下方等非首屏关键位置使用）。
 * 支持包含 <script> 的广告代码（innerHTML 中的脚本需手动重建执行）。
 */
export function AdSlot({ id }: { id: string }) {
  const config = useSyncExternalStore(subscribeConfig, getConfig)
  const ref = useRef<HTMLDivElement>(null)
  const slot = config.ads?.enabled ? config.ads.slots?.[id] : undefined
  const html = slot?.html?.trim()

  useEffect(() => {
    const host = ref.current
    if (!host || !html) return
    host.innerHTML = ''
    const tpl = document.createElement('template')
    tpl.innerHTML = html
    for (const node of Array.from(tpl.content.childNodes)) {
      if (node instanceof HTMLScriptElement) {
        const s = document.createElement('script')
        for (const attr of Array.from(node.attributes)) s.setAttribute(attr.name, attr.value)
        s.textContent = node.textContent
        host.appendChild(s)
      } else {
        host.appendChild(node)
      }
    }
    return () => {
      host.innerHTML = ''
    }
  }, [html])

  if (!html) return null
  return (
    <div className="ad-slot" data-slot={id}>
      <span className="ad-slot-label">广告</span>
      <div ref={ref} />
    </div>
  )
}
