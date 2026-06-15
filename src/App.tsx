import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { DropOverlay } from './components/DropOverlay'
import { Icon } from './components/Icon'
import { getConfig, subscribeConfig } from './lib/config'
import Home from './pages/Home'
import { allTools } from './tools'

const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('hahaimage.theme', theme)
  }, [theme])

  return (
    <>
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <DropOverlay />
      <header className="site-header">
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

      <footer className="site-footer">
        <div className="container">
          <p>
            哈哈图片是一个开源项目，所有图片处理均在浏览器本地完成，不收集、不上传你的任何文件。
          </p>
          <div className="links">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub 源码
            </a>
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
              反馈问题
            </a>
            <Link to="/admin">站点配置</Link>
          </div>
          <FooterExtra />
        </div>
      </footer>
    </>
  )
}

function FooterExtra() {
  const config = useSyncExternalStore(subscribeConfig, getConfig)
  const text = config.site?.footerText
  return text ? <p>{text}</p> : null
}
