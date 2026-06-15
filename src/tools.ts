import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconName } from './components/Icon'

export interface ToolDef {
  path: string
  name: string
  desc: string
  icon: IconName
  component: LazyExoticComponent<ComponentType>
  /** 所属分类 id，构建 allTools 时回填（用于"最近使用"的分类配色） */
  catId?: string
}

export interface ToolCategory {
  id: string
  name: string
  tools: ToolDef[]
}

/* 全部工具页按路由懒加载，首屏只包含首页与框架代码 */
export const categories: ToolCategory[] = [
  {
    id: 'image',
    name: '图片工具',
    tools: [
      {
        path: '/convert',
        name: '转换图片',
        desc: '在 PNG / JPG / WebP 之间互转，支持批量',
        icon: 'convert',
        component: lazy(() => import('./pages/tools/Convert')),
      },
      {
        path: '/stitch',
        name: '拼接图片',
        desc: '多张图片横向或纵向拼成长图',
        icon: 'stitch',
        component: lazy(() => import('./pages/tools/Stitch')),
      },
      {
        path: '/watermark',
        name: '图片加水印',
        desc: '文字或图片水印，支持平铺与批量',
        icon: 'watermark',
        component: lazy(() => import('./pages/tools/Watermark')),
      },
      {
        path: '/resize',
        name: '调整图片尺寸',
        desc: '按像素或百分比缩放，支持批量',
        icon: 'resize',
        component: lazy(() => import('./pages/tools/Resize')),
      },
      {
        path: '/crop',
        name: '裁剪图片',
        desc: '拖拽框选区域，支持常用比例',
        icon: 'crop',
        component: lazy(() => import('./pages/tools/Crop')),
      },
      {
        path: '/compress',
        name: '压缩图片',
        desc: '调节质量减小体积，支持批量',
        icon: 'compress',
        component: lazy(() => import('./pages/tools/Compress')),
      },
      {
        path: '/compress-exif',
        name: '压缩 JPG 并保留 EXIF',
        desc: '压缩同时保留拍摄信息与色彩配置',
        icon: 'exif',
        component: lazy(() => import('./pages/tools/CompressExif')),
      },
      {
        path: '/compress-to-size',
        name: '压缩到指定大小',
        desc: '自动调节质量，压到目标 KB 以内',
        icon: 'target',
        component: lazy(() => import('./pages/tools/CompressToSize')),
      },
      {
        path: '/exif',
        name: '读取 EXIF',
        desc: '查看拍摄参数、GPS 等元数据',
        icon: 'exif',
        component: lazy(() => import('./pages/tools/Exif')),
      },
      {
        path: '/split',
        name: '分割图片',
        desc: '按行列切成九宫格或任意网格',
        icon: 'split',
        component: lazy(() => import('./pages/tools/Split')),
      },
    ],
  },
  {
    id: 'gif',
    name: 'GIF 工具',
    tools: [
      {
        path: '/gif-compress',
        name: 'GIF 压缩',
        desc: '降帧率、缩尺寸、减色减小体积',
        icon: 'compress',
        component: lazy(() => import('./pages/tools/GifCompress')),
      },
      {
        path: '/gif-crop',
        name: 'GIF 裁剪',
        desc: '框选区域裁剪动图画面',
        icon: 'crop',
        component: lazy(() => import('./pages/tools/GifCrop')),
      },
      {
        path: '/gif-extract',
        name: '提取 GIF 帧',
        desc: '把每一帧导出为 PNG 图片',
        icon: 'frames',
        component: lazy(() => import('./pages/tools/GifExtract')),
      },
      {
        path: '/gif-merge',
        name: 'GIF 合并',
        desc: '多个 GIF 首尾相接合成一个',
        icon: 'merge',
        component: lazy(() => import('./pages/tools/GifMerge')),
      },
      {
        path: '/gif-reverse',
        name: 'GIF 倒放',
        desc: '让动图倒着播放',
        icon: 'reverse',
        component: lazy(() => import('./pages/tools/GifReverse')),
      },
      {
        path: '/gif-convert',
        name: 'GIF 转 WebP / APNG',
        desc: '转成更小更清晰的动图格式',
        icon: 'webp',
        component: lazy(() => import('./pages/tools/GifConvert')),
      },
    ],
  },
  {
    id: 'video',
    name: '视频工具',
    tools: [
      {
        path: '/video-to-gif',
        name: '视频转 GIF',
        desc: '把 MP4 等视频转成 GIF 动图',
        icon: 'video',
        component: lazy(() => import('./pages/tools/VideoToGif')),
      },
      {
        path: '/video-clip-gif',
        name: '剪辑视频转 GIF',
        desc: '截取视频片段后转成 GIF',
        icon: 'scissors',
        component: lazy(() => import('./pages/tools/VideoClipGif')),
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI 工具',
    tools: [
      {
        path: '/remove-bg',
        name: '批量抠图',
        desc: 'AI 自动去除背景，本地运行不上传',
        icon: 'magic',
        component: lazy(() => import('./pages/tools/RemoveBg')),
      },
    ],
  },
]

export const allTools: ToolDef[] = categories.flatMap(c =>
  c.tools.map(t => ({ ...t, catId: c.id })),
)
