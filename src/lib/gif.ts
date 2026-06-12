/** GIF 输出共用的调色板滤镜链（palettegen/paletteuse 两段式，画质远好于默认） */
export function paletteFilter(pre: string, colors = 256): string {
  const chain = pre ? `${pre},` : ''
  return `${chain}split[a][b];[a]palettegen=max_colors=${colors}[p];[b][p]paletteuse=dither=bayer:bayer_scale=5`
}

/** 由原文件名生成安全的 ffmpeg 虚拟文件名（保留扩展名以便探测格式） */
export function safeInputName(file: File, fallbackExt: string): string {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `input.${ext || fallbackExt}`
}
