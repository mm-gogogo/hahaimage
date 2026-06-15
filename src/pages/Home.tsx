import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdSlot } from '../components/AdSlot'
import { Icon } from '../components/Icon'
import { getRecentPaths } from '../lib/recent'
import { useInView } from '../lib/useInView'
import { allTools, categories, type ToolDef } from '../tools'

function ToolCard({ tool, catId, index }: { tool: ToolDef; catId: string; index: number }) {
  return (
    <Link to={tool.path} className="tool-card" data-cat={catId} style={{ '--i': index } as React.CSSProperties}>
      <span className="tool-icon">
        <Icon name={tool.icon} size={22} />
      </span>
      <span>
        <h3>{tool.name}</h3>
        <p>{tool.desc}</p>
      </span>
    </Link>
  )
}

function CategorySection({
  id,
  name,
  tools,
  labelId,
}: {
  id: string
  name: string
  tools: ToolDef[]
  labelId: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <section
      ref={ref}
      className={`cat-section${inView ? ' is-revealed' : ''}`}
      data-cat={id}
      aria-labelledby={labelId}
    >
      <h2 id={labelId}>
        {name}
        <span className="cat-count">{tools.length} 个工具</span>
      </h2>
      <div className="tool-grid">
        {tools.map((tool, i) => (
          <ToolCard key={tool.path} tool={tool} catId={tool.catId ?? id} index={i} />
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const [query, setQuery] = useState('')
  const recent = useMemo(
    () => getRecentPaths().map(p => allTools.find(t => t.path === p)).filter((t): t is ToolDef => t != null),
    [],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories
      .map(cat => ({
        ...cat,
        tools: cat.tools.filter(
          t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q),
        ),
      }))
      .filter(cat => cat.tools.length > 0)
  }, [query])

  return (
    <div className="container">
      <section className="home-hero">
        <h1>
          免费开源的在线<span className="accent">图片工具箱</span>
        </h1>
        <p className="sub">转换、压缩、裁剪、加水印、GIF 处理、视频转 GIF、AI 抠图——打开就能用。</p>
        <p className="privacy-pill">
          <Icon name="shield" size={16} />
          所有处理都在你的浏览器本地完成，文件不会上传到任何服务器
        </p>
        <div className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            className="search-input"
            placeholder="搜索工具，如：压缩、水印、GIF…"
            aria-label="搜索工具"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </section>

      <AdSlot id="home-top" />

      {!query.trim() && recent.length > 0 && (
        <CategorySection id="recent" name="最近使用" tools={recent} labelId="cat-recent" />
      )}

      {filtered.length === 0 && (
        <p className="msg msg-info" role="status">
          没有找到匹配「{query}」的工具。试试「压缩」「裁剪」「GIF」等关键词。
        </p>
      )}

      {filtered.map(cat => (
        <CategorySection key={cat.id} id={cat.id} name={cat.name} tools={cat.tools} labelId={`cat-${cat.id}`} />
      ))}

      <AdSlot id="home-bottom" />
    </div>
  )
}
