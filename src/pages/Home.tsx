import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdSlot } from '../components/AdSlot'
import { Icon } from '../components/Icon'
import { categories } from '../tools'

export default function Home() {
  const [query, setQuery] = useState('')

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
        <h1>免费开源的在线图片工具箱</h1>
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

      {filtered.length === 0 && (
        <p className="msg msg-info" role="status">
          没有找到匹配「{query}」的工具。试试「压缩」「裁剪」「GIF」等关键词。
        </p>
      )}

      {filtered.map(cat => (
        <section key={cat.id} className="cat-section" aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`}>
            {cat.name}
            <span className="cat-count">{cat.tools.length} 个工具</span>
          </h2>
          <div className="tool-grid">
            {cat.tools.map(tool => (
              <Link to={tool.path} className="tool-card" key={tool.path}>
                <span className="tool-icon">
                  <Icon name={tool.icon} size={22} />
                </span>
                <span>
                  <h3>{tool.name}</h3>
                  <p>{tool.desc}</p>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <AdSlot id="home-bottom" />
    </div>
  )
}
