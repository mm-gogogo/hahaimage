export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function downloadZip(
  items: { name: string; data: Blob | Uint8Array }[],
  zipName: string,
): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const item of items) zip.file(item.name, item.data)
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, zipName)
}
