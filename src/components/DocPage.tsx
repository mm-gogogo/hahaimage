import { type ReactNode, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AdSlot } from './AdSlot'
import { Icon } from './Icon'

/** 说明类页面的统一排版容器（关于 / FAQ / 隐私 / 社群） */
export function DocPage({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} - 哈哈图片`
    return () => {
      document.title = '哈哈图片 - 免费开源的在线图片工具箱'
    }
  }, [title])

  return (
    <div className="container">
      <article className="doc">
        <Link to="/" className="breadcrumb">
          <Icon name="back" size={16} />
          返回首页
        </Link>
        <h1>{title}</h1>
        {lead && <p className="doc-lead">{lead}</p>}
        <div className="doc-body">{children}</div>
      </article>
      <AdSlot id="tool-bottom" />
    </div>
  )
}
