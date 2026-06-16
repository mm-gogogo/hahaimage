import { DocPage } from '../components/DocPage'

const FAQS: { q: string; a: string }[] = [
  {
    q: '我的图片会被上传到服务器吗？',
    a: '不会。所有处理都在你的浏览器本地完成，图片自始至终不离开你的设备。你甚至可以在断网（首次加载组件后）的情况下继续使用。',
  },
  {
    q: '需要注册或付费吗？',
    a: '都不需要。哈哈图片完全免费、无需账号、无使用次数限制，也没有会员墙。',
  },
  {
    q: '处理大文件或大批量会卡吗？',
    a: '因为在本地处理，速度取决于你的设备性能。普通图片几乎瞬间完成；超大图片、长视频或大量文件会更吃内存与 CPU，建议分批处理，或先把视频剪短再转 GIF。',
  },
  {
    q: '第一次用 GIF / 视频 / 抠图工具时为什么要等一会？',
    a: 'GIF 与视频工具需要加载约 31MB 的 ffmpeg 组件，AI 抠图需要加载模型文件。它们按需加载、加载一次后会被浏览器缓存，再次使用就很快了。',
  },
  {
    q: '支持哪些格式？',
    a: '图片支持 PNG / JPG / WebP 互转与处理，也能读取 GIF / BMP / HEIC 等；动图支持 GIF、动态 WebP、APNG；视频支持 MP4 / WebM / MOV 等常见格式。',
  },
  {
    q: '压缩后图片反而变大了？',
    a: '本就很小或已高度压缩的图片，重新编码可能略微变大——这时结果会如实显示「增大 N%」，你可以保留原图。对于普通照片，压缩通常能显著减小体积。',
  },
  {
    q: '可以在手机上用吗？',
    a: '可以。页面针对手机、平板做了适配，也支持「添加到主屏幕」当作 App 使用。',
  },
  {
    q: '能自己部署一份吗？',
    a: '可以。项目开源（MIT），是纯静态站点，可部署到 GitHub Pages、Vercel、Cloudflare Pages、Nginx 等任意静态托管，并可通过配置文件接入自己的统计与广告。',
  },
]

export default function Faq() {
  return (
    <DocPage title="常见问题" lead="关于隐私、格式、性能与使用方式的常见疑问。">
      <div className="faq-list">
        {FAQS.map((item, i) => (
          <details className="faq-item" key={i} open={i === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </DocPage>
  )
}
