import { type ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { recordRecent } from '../lib/recent'
import { allTools } from '../tools'
import { AdSlot } from './AdSlot'
import { Icon } from './Icon'

export function ToolPage({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  const { pathname } = useLocation()
  const catId = allTools.find(t => t.path === pathname)?.catId ?? 'image'

  useEffect(() => {
    document.title = `${title} - 哈哈图片`
    if (pathname !== '/admin') recordRecent(pathname)
    return () => {
      document.title = '哈哈图片 - 免费开源的在线图片工具箱'
    }
  }, [title, pathname])

  return (
    <div className="container" data-cat={catId}>
      <header className="tool-head">
        <Link to="/" className="breadcrumb">
          <Icon name="back" size={16} />
          全部工具
        </Link>
        <h1>{title}</h1>
        <p className="desc">{desc}</p>
      </header>
      <div className="tool-body">{children}</div>
      <AdSlot id="tool-bottom" />
    </div>
  )
}
