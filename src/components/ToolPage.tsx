import { type ReactNode, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AdSlot } from './AdSlot'
import { Icon } from './Icon'

export function ToolPage({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} - 哈哈图片`
    return () => {
      document.title = '哈哈图片 - 免费开源的在线图片工具箱'
    }
  }, [title])

  return (
    <div className="container">
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
