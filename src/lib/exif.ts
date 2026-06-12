/**
 * JPEG 元数据段（EXIF APP1 / ICC APP2）的提取与回写。
 * 用于"压缩 JPG 并保留 EXIF"：Canvas 重新编码会丢弃所有元数据，
 * 这里从原文件按字节抽出元数据段，再插回新编码的 JPEG。
 */

const SOI = 0xffd8
const APP1 = 0xffe1
const APP2 = 0xffe2
const SOS = 0xffda

function isJpeg(view: DataView): boolean {
  return view.byteLength > 4 && view.getUint16(0) === SOI
}

/** 提取 EXIF(APP1) 与 ICC(APP2) 完整段（含 marker 与长度字段） */
export function extractJpegMetaSegments(buf: ArrayBuffer): Uint8Array[] {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  const segments: Uint8Array[] = []
  if (!isJpeg(view)) return segments

  let off = 2
  while (off + 4 <= view.byteLength) {
    if (view.getUint8(off) !== 0xff) break
    const marker = view.getUint16(off)
    if (marker === SOS) break
    const size = view.getUint16(off + 2)
    if (marker === APP1 || marker === APP2) {
      const sig = String.fromCharCode(...bytes.slice(off + 4, off + 8))
      if ((marker === APP1 && sig === 'Exif') || (marker === APP2 && sig === 'ICC_')) {
        segments.push(bytes.slice(off, off + 2 + size))
      }
    }
    off += 2 + size
  }
  return segments
}

/**
 * 将 EXIF 段中 IFD0 的 Orientation(0x0112) 改为 1。
 * Canvas 解码时浏览器已应用方向校正，若原样回写旧方向值会被看图软件二次旋转。
 */
export function normalizeOrientation(seg: Uint8Array): void {
  // APP1 段布局: FFE1 | len(2) | "Exif\0\0"(6) | TIFF...
  const tiff = 10
  if (seg.length < tiff + 8) return
  const view = new DataView(seg.buffer, seg.byteOffset, seg.byteLength)
  const littleEndian = view.getUint16(tiff) === 0x4949 // "II"
  if (view.getUint16(tiff + 2, littleEndian) !== 42) return
  const ifd0 = tiff + view.getUint32(tiff + 4, littleEndian)
  if (ifd0 + 2 > seg.length) return
  const count = view.getUint16(ifd0, littleEndian)
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12
    if (entry + 12 > seg.length) return
    if (view.getUint16(entry, littleEndian) === 0x0112) {
      view.setUint16(entry + 8, 1, littleEndian)
      return
    }
  }
}

/** 将元数据段插入到新 JPEG 的 SOI 之后 */
export function insertJpegSegments(jpeg: Uint8Array, segments: Uint8Array[]): Uint8Array {
  if (segments.length === 0) return jpeg
  const total = jpeg.length + segments.reduce((s, x) => s + x.length, 0)
  const out = new Uint8Array(total)
  out.set(jpeg.slice(0, 2), 0)
  let off = 2
  for (const seg of segments) {
    out.set(seg, off)
    off += seg.length
  }
  out.set(jpeg.slice(2), off)
  return out
}

/** 压缩 JPEG 同时保留 EXIF / ICC 元数据 */
export async function compressJpegKeepExif(
  file: File,
  opts: { quality: number; maxEdge?: number },
): Promise<Blob> {
  const { compressImage } = await import('./image')
  const [origBuf, compressed] = await Promise.all([
    file.arrayBuffer(),
    compressImage(file, { type: 'image/jpeg', quality: opts.quality, maxEdge: opts.maxEdge }),
  ])
  const segments = extractJpegMetaSegments(origBuf)
  for (const seg of segments) {
    if (seg[1] === 0xe1) normalizeOrientation(seg)
  }
  const newBytes = new Uint8Array(await compressed.arrayBuffer())
  return new Blob([insertJpegSegments(newBytes, segments) as BlobPart], { type: 'image/jpeg' })
}
