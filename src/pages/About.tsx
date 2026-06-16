import { Link } from 'react-router-dom'
import { DocPage } from '../components/DocPage'
import { allTools, categories } from '../tools'

const REPO_URL = 'https://github.com/mm-gogogo/hahaimage'

export default function About() {
  return (
    <DocPage
      title="关于哈哈图片"
      lead="一个免费、开源的在线图片工具箱——把日常会用到的图片、GIF、视频处理，做成打开即用、无需注册、不上传文件的网页工具。"
    >
      <h2>为什么做它</h2>
      <p>
        网上的图片工具大多要上传文件到服务器，处理慢、有隐私顾虑，还常被广告和会员墙包围。哈哈图片把所有处理都放在你自己的浏览器里完成：图片不离开你的设备，没有上传、没有排队、没有账号。
      </p>

      <h2>它能做什么</h2>
      <p>目前提供 {allTools.length} 个工具，覆盖 {categories.length} 个分类：</p>
      <ul>
        {categories.map(cat => (
          <li key={cat.id}>
            <strong>{cat.name}</strong>：{cat.tools.map(t => t.name).join('、')}
          </li>
        ))}
      </ul>

      <h2>它如何工作</h2>
      <p>
        图片类工具基于浏览器的 Canvas 能力；GIF 与视频工具使用在本地运行的 <code>ffmpeg.wasm</code>；AI
        抠图使用在浏览器内运行的开源模型。这些较大的组件按需加载、用过即缓存，因此首页打开很快，只有真正用到某个工具时才会加载它需要的部分。
      </p>

      <h2>开源与免费</h2>
      <p>
        哈哈图片完全开源（MIT 协议），代码托管在 GitHub。欢迎提交问题、建议或贡献代码。如果它帮到了你，给项目点个 Star 就是最好的支持。
      </p>
      <p className="doc-actions">
        <a className="btn btn-primary" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub 源码
        </a>
        <Link className="btn" to="/faq">
          常见问题
        </Link>
        <Link className="btn" to="/privacy">
          隐私说明
        </Link>
      </p>
    </DocPage>
  )
}
