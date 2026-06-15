import { useEffect, useRef, useState } from 'react'
import { BatchRunner } from '../../components/BatchRunner'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, canvasToBlob, loadImage, replaceExt } from '../../lib/image'
import { useBatch } from '../../lib/useBatch'
import { usePersistedState } from '../../lib/usePersistedState'
import { POSITIONS, type Position, type WmType, renderWatermark } from '../../lib/watermark'

export default function Watermark() {
  const [files, setFiles] = useState<File[]>([])
  const [wmType, setWmType] = usePersistedState<WmType>('watermark.type', 'text')
  const [text, setText] = usePersistedState('watermark.text', '哈哈图片')
  const [color, setColor] = usePersistedState('watermark.color', '#ffffff')
  const [wmImage, setWmImage] = useState<File | null>(null)
  const [position, setPosition] = usePersistedState<Position>('watermark.position', 'se')
  const [opacity, setOpacity] = usePersistedState('watermark.opacity', 0.5)
  const [sizePct, setSizePct] = usePersistedState('watermark.sizePct', 6)
  const { results, busy, done, total, error, run, cancel, setError } = useBatch()

  const previewRef = useRef<HTMLCanvasElement>(null)
  const [previewSrc, setPreviewSrc] = useState<HTMLImageElement | null>(null)
  const [wmImgEl, setWmImgEl] = useState<HTMLImageElement | null>(null)

  // 第一张图作为实时预览源
  useEffect(() => {
    let cancelled = false
    if (files[0]) loadImage(files[0]).then(img => !cancelled && setPreviewSrc(img))
    else setPreviewSrc(null)
    return () => {
      cancelled = true
    }
  }, [files])

  // 水印图载入
  useEffect(() => {
    let cancelled = false
    if (wmImage) loadImage(wmImage).then(img => !cancelled && setWmImgEl(img))
    else setWmImgEl(null)
    return () => {
      cancelled = true
    }
  }, [wmImage])

  // 实时把水印画到预览 canvas（参数变化即重绘，缩放到合适显示尺寸）
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !previewSrc) return
    const full = renderWatermark(previewSrc, { type: wmType, text, color, position, opacity, sizePct, image: wmImgEl })
    const maxW = 640
    const scale = Math.min(1, maxW / full.width)
    canvas.width = Math.round(full.width * scale)
    canvas.height = Math.round(full.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(full, 0, 0, canvas.width, canvas.height)
  }, [previewSrc, wmType, text, color, position, opacity, sizePct, wmImgEl])

  const start = async () => {
    if (wmType === 'image' && !wmImage) {
      setError('请先上传水印图片')
      return
    }
    const wmImg = wmType === 'image' && wmImage ? await loadImage(wmImage) : null
    run(files, async file => {
      const img = await loadImage(file)
      const canvas = renderWatermark(img, { type: wmType, text, color, position, opacity, sizePct, image: wmImg })
      const mime = MIME_EXT[file.type] ? file.type : 'image/png'
      const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92)
      return { name: replaceExt(file.name, MIME_EXT[mime]), blob, original: file }
    })
  }

  return (
    <ToolPage title="图片加水印" desc="为图片添加文字或图片水印，支持九宫格定位与全图平铺，可批量处理多张图片。调整参数即可实时预览效果。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="要加水印的图片，可多选" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} />
      </div>

      <div className="panel">
        <h2>水印设置</h2>
        <div className="seg" role="group" aria-label="水印类型">
          <button aria-pressed={wmType === 'text'} onClick={() => setWmType('text')}>
            文字水印
          </button>
          <button aria-pressed={wmType === 'image'} onClick={() => setWmType('image')}>
            图片水印
          </button>
        </div>

        {wmType === 'text' ? (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="wm-text">水印文字</label>
              <input id="wm-text" className="input" value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="wm-color">文字颜色</label>
              <input id="wm-color" type="color" value={color} onChange={e => setColor(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="field">
            <label>水印图片{wmImage ? `：${wmImage.name}` : ''}</label>
            <FileDrop compact accept="image/*" onFiles={f => setWmImage(f[0])} label="选择水印图片（推荐透明 PNG）" />
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <label htmlFor="wm-pos">位置</label>
            <select id="wm-pos" className="input" value={position} onChange={e => setPosition(e.target.value as Position)}>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wm-size">大小：{sizePct}%（相对图片宽度）</label>
            <input id="wm-size" type="range" min={2} max={20} value={sizePct} onChange={e => setSizePct(Number(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="wm-op">不透明度：{Math.round(opacity * 100)}%</label>
          <input id="wm-op" type="range" min={5} max={100} value={Math.round(opacity * 100)} onChange={e => setOpacity(Number(e.target.value) / 100)} />
        </div>
        <BatchRunner
          label={`添加水印（${files.length} 个文件）`}
          busy={busy}
          done={done}
          total={total}
          error={error}
          disabled={files.length === 0}
          onRun={start}
          onCancel={cancel}
        />
      </div>

      {previewSrc && (
        <div className="panel">
          <h2>实时预览{files.length > 1 ? '（第一张）' : ''}</h2>
          <div className="preview-stage">
            <canvas ref={previewRef} className="wm-preview-canvas" aria-label="水印效果实时预览" />
          </div>
        </div>
      )}

      <ResultList items={results} zipName="watermarked.zip" />
    </ToolPage>
  )
}
