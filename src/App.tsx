import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { DropOverlay } from './components/DropOverlay'
import { Icon } from './components/Icon'
import { getConfig, subscribeConfig } from './lib/config'
import Home from './pages/Home'
import { allTools } from './tools'

const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))
const About = lazy(() => import('./pages/About'))
const Faq = lazy(() => import('./pages/Faq'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Community = lazy(() => import('./pages/Community'))

const REPO_URL = 'https://github.com/mm-gogogo/hahaimage'

type Theme = 'light' | 'dark'

function initTheme(): Theme {
  const saved = localStorage.getItem('hahaimage.theme')
  if (saved === 'light' || saved === 'dark') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function ScrollReset() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    // 首次加载不抢焦点，保证第一次 Tab 命中 skip link；
    // 后续路由切换才把焦点移到主内容（便于屏幕阅读器播报新页面）
    if (first.current) {
      first.current = false
      return
    }
    document.querySelector('main')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

/** 路由内容：按路径 key 重放淡入上浮过渡 */
function RoutedContent() {
  const { pathname } = useLocation()
  return (
    <Suspense fallback={<Fallback />}>
      <div className="route-fade" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/community" element={<Community />} />
          <Route path="/admin" element={<Admin />} />
          {allTools.map(tool => (
            <Route key={tool.path} path={tool.path} element={<tool.component />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Suspense>
  )
}

function Fallback() {
  return (
    <div className="suspense-fallback" role="status">
      <span className="spinner" />
      加载中…
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initTheme)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('hahaimage.theme', theme)
  }, [theme])

  // 页面下滚后让头部浮起一层阴影，增强层次
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <DropOverlay />
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Icon name="image" size={18} />
            </span>
            哈哈图片
            <span className="brand-tag">本地处理 · 开源免费</span>
          </Link>
          <div className="header-actions">
            <button
              className="btn btn-icon"
              aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <a className="btn btn-icon" href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub 源码">
              <Icon name="github" size={18} />
            </a>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
        <ScrollReset />
        <RoutedContent />
      </main>

      <SiteFooter />
    </>
  )
}

function SiteFooter() {
  const config = useSyncExternalStore(subscribeConfig, getConfig)
  const community = config.community
  const communityLinks = community?.links ?? []
  const footerText = config.site?.footerText

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Icon name="image" size={18} />
            </span>
            哈哈图片
          </Link>
          <p>免费开源的在线图片工具箱，所有处理都在你的浏览器本地完成，文件不会上传。</p>
        </div>

        <nav className="footer-col" aria-label="说明">
          <h3>了解</h3>
          <Link to="/about">关于</Link>
          <Link to="/faq">常见问题</Link>
          <Link to="/privacy">隐私说明</Link>
        </nav>

        <nav className="footer-col" aria-label="社群">
          <h3>社群</h3>
          {communityLinks.length > 0 ? (
            communityLinks.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))
          ) : (
            <Link to="/community">加入社群</Link>
          )}
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
            反馈问题
          </a>
        </nav>

        <nav className="footer-col" aria-label="项目">
          <h3>项目</h3>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub 源码
          </a>
          <a href={`${REPO_URL}/discussions`} target="_blank" rel="noreferrer">
            讨论区
          </a>
          <Link to="/admin">站点配置</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>开源免费 · MIT 协议</span>
        {footerText && <span>{footerText}</span>}
      </div>
    </footer>
  )
}
