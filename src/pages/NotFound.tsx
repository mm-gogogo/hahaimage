import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

export default function NotFound() {
  useEffect(() => {
    document.title = '页面不存在 - 哈哈图片'
    return () => {
      document.title = '哈哈图片 - 免费开源的在线图片工具箱'
    }
  }, [])

  return (
    <div className="container">
      <div className="notfound">
        <span className="notfound-code">404</span>
        <h1>没有找到这个页面</h1>
        <p>你访问的工具或页面不存在，可能链接已变动。</p>
        <Link to="/" className="btn btn-primary">
          <Icon name="back" size={16} />
          返回全部工具
        </Link>
      </div>
    </div>
  )
}
