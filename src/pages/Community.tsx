import { useSyncExternalStore } from 'react'
import { DocPage } from '../components/DocPage'
import { Icon } from '../components/Icon'
import { getConfig, subscribeConfig } from '../lib/config'

const REPO_URL = 'https://github.com/mm-gogogo/hahaimage'

export default function Community() {
  const config = useSyncExternalStore(subscribeConfig, getConfig)
  const community = config.community
  const links = community?.links ?? []

  return (
    <DocPage
      title={community?.title || '加入社群'}
      lead={community?.description || '欢迎加入交流：反馈问题、提出想做的新工具，或和其他用户交流使用技巧。'}
    >
      {links.length > 0 ? (
        <div className="community-grid">
          {links.map((l, i) => (
            <a className="community-card" href={l.url} target="_blank" rel="noreferrer" key={i}>
              <span className="community-icon">
                <Icon name="merge" size={22} />
              </span>
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="community-empty">
          <p>社群入口即将开放。在此之前，你可以通过 GitHub 与我们交流：</p>
          <p className="doc-actions">
            <a className="btn btn-primary" href={`${REPO_URL}/discussions`} target="_blank" rel="noreferrer">
              GitHub 讨论区
            </a>
            <a className="btn" href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
              提交问题或建议
            </a>
          </p>
          <p className="doc-note">
            部署方可在 <code>site.config.json</code> 的 <code>community</code> 字段填入微信群、QQ 群、Telegram、Discord 等入口，它们会自动显示在这里和页脚。
          </p>
        </div>
      )}
    </DocPage>
  )
}
