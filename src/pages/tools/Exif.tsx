import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ToolPage } from '../../components/ToolPage'
import { formatBytes } from '../../lib/image'

function formatValue(v: unknown): string {
  if (v instanceof Date) return v.toLocaleString()
  if (v instanceof Uint8Array) return `<${v.length} 字节二进制数据>`
  if (Array.isArray(v)) return v.map(x => formatValue(x)).join(', ')
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  if (typeof v === 'object' && v !== null) return JSON.stringify(v)
  return String(v)
}

export default function Exif() {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [entries, setEntries] = useState<[string, string][]>([])
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [empty, setEmpty] = useState(false)

  const pick = async (files: File[]) => {
    const file = files[0]
    setBusy(true)
    setError('')
    setEmpty(false)
    setEntries([])
    setGps(null)
    setFileInfo({ name: file.name, size: file.size })
    try {
      const exifr = (await import('exifr')).default
      const data: Record<string, unknown> | undefined = await exifr.parse(file, true)
      if (!data || Object.keys(data).length === 0) {
        setEmpty(true)
        return
      }
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setGps({ lat: data.latitude, lng: data.longitude })
      }
      setEntries(
        Object.entries(data)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, formatValue(v)] as [string, string]),
      )
    } catch (e) {
      setError(`解析失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="读取 EXIF" desc="查看照片的完整元数据：相机型号、拍摄参数、时间、GPS 位置等。所有解析都在本地进行，隐私无忧。">
      <div className="panel">
        <FileDrop accept="image/*,.heic,.heif" onFiles={pick} hint="支持 JPG / TIFF / PNG / HEIC 等" />
      </div>

      {busy && (
        <p className="msg msg-info" role="status">
          <span className="spinner" />
          解析中…
        </p>
      )}
      {error && <p className="msg msg-error">{error}</p>}
      {empty && <p className="msg msg-info">这张图片不包含 EXIF 元数据（可能已被社交软件或截图工具移除）。</p>}

      {fileInfo && entries.length > 0 && (
        <div className="panel">
          <h2>
            {fileInfo.name}（{formatBytes(fileInfo.size)}）· 共 {entries.length} 项
          </h2>
          {gps && (
            <p className="msg msg-info">
              GPS 位置：{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} ·{' '}
              <a href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`} target="_blank" rel="noreferrer">
                在地图中查看
              </a>
            </p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="kv-table">
              <tbody>
                {entries.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ToolPage>
  )
}
