# 哈哈图片 HahaImage

免费、开源的在线图片工具箱。**所有处理均在浏览器本地完成，文件不会上传到任何服务器。**

> 在线体验：<https://mm-gogogo.github.io/hahaimage/>（也可部署到 Vercel / Cloudflare Pages / Nginx 等任意静态托管）。

## 功能

**图片工具**
- 转换图片（PNG / JPG / WebP 互转，批量）
- 拼接图片（横向 / 纵向长图，统一尺寸、间距、背景色）
- 图片加水印（文字 / 图片水印，九宫格定位 + 平铺，批量）
- 调整图片尺寸（像素 / 百分比，批量）
- 裁剪图片（拖拽框选，常用比例约束）
- 压缩图片（质量 + 尺寸上限，批量）
- 压缩 JPG 并保留 EXIF（字节级回写 EXIF / ICC 段，自动校正方向标记）
- 压缩图片到指定大小（二分搜索质量，自动降尺寸兜底）
- 读取 EXIF（完整元数据 + GPS 地图链接）
- 分割图片（任意行列网格，朋友圈九宫格）

**GIF 工具**（基于 [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)）
- GIF 压缩（帧率 / 尺寸 / 颜色数，两段式调色板保画质）
- GIF 裁剪（拖拽框选）
- 提取 GIF 帧（逐帧导出 PNG，打包 ZIP）
- GIF 合并（自动等比缩放补边对齐）
- GIF 倒放
- GIF 转 WebP / APNG

**视频工具**
- 视频转 GIF（MP4 / WebM / MOV 等）
- 剪辑视频转 GIF（按时间段截取）

**AI 工具**（基于 [@imgly/background-removal](https://github.com/imgly/background-removal-js)）
- 批量抠图（浏览器本地运行 ONNX 模型，输出透明 PNG）

## 体验亮点

- **前后对比滑块**：压缩 / 转换 / 水印 / 调尺寸的结果可拖动滑块对比原图与处理后
- **水印实时预览**：调整文字 / 位置 / 透明度即时在画布上看到效果（大图自动降采样 + rAF 节流，丝滑不卡）
- **批量流式处理**：逐张出结果 + 实时进度，长任务（视频 / AI）可随时取消；结果区显示总体积变化
- **随手上传**：点击 / 拖拽 / 全局拖入 / Ctrl+V 粘贴截图均可
- **省心**：首页工具搜索与「最近使用」、按工具记住上次参数设置
- **可安装 PWA**、亮 / 暗双主题（跟随系统，可手动切换）、完整键盘可达与 skip link

## 技术架构

- Vite + React 19 + TypeScript，纯静态站点，无后端
- 路由级代码分割：每个工具页独立 chunk（2–5 KB），首屏只加载框架与首页
- 重型依赖全部按需懒加载：ffmpeg.wasm 核心（约 31 MB）与 AI 抠图模型（约 40 MB）仅在对应工具首次执行时从 CDN 下载，全站单例复用
- 图片类工具基于 Canvas API，零额外依赖
- 设计系统：OKLCH 设计 token，亮 / 暗双主题，遵循 WCAG 对比度与可访问性规范

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 构建到 dist/
npm run preview  # 预览构建产物
```

## 测试

Playwright E2E 测试覆盖全部 19 个工具的真实处理链路（上传 → 处理 → 校验输出文件魔数/字节）：

```bash
npm test         # 站点框架 + 图片工具 + ffmpeg 工具链（28 项）
npm run test:ai  # AI 抠图（需下载约 40MB 模型，默认跳过）
```

测试夹具均在浏览器内现场生成：Canvas 合成噪点 PNG、手工构造 EXIF 段的 JPEG（断言压缩后 EXIF 保留且方向归一）、MediaRecorder 录制 WebM 再经「视频转 GIF」产出真实 GIF 串联测试所有 GIF 工具（含 WebP 魔数与 APNG `acTL` 块校验）。推送与 PR 会自动跑 CI（`.github/workflows/ci.yml`）。

## 部署

构建产物是纯静态文件（`base: './'`，哈希路由），放到任意静态托管即可。

仓库自带 GitHub Pages 工作流：推送到 `main` 分支后自动构建部署（需在仓库 Settings → Pages 中把 Source 设为 "GitHub Actions"）。

## 站点配置（统计 / 广告）

无需改代码：把配置文件放到站点根目录（仓库 `public/site.config.json`）即可，运行时读取。可访问站内 `/#/admin` 页面可视化生成该文件，也可参考 [`public/site.config.example.json`](public/site.config.example.json)：

```jsonc
{
  "site": { "name": "哈哈图片", "footerText": "备案号等页脚文字" },
  "analytics": {
    "umami": { "src": "https://analytics.example.com/script.js", "websiteId": "…" },
    "googleAnalyticsId": "G-XXXXXXXXXX",
    "baiduId": "百度统计 id",
    "customScripts": ["https://example.com/other-analytics.js"]
  },
  "ads": {
    "enabled": true,
    "slots": {
      "home-top":    { "html": "<!-- 首页顶部广告代码，支持 <script> -->" },
      "home-bottom": { "html": "" },
      "tool-bottom": { "html": "<!-- 所有工具页底部 -->" }
    }
  }
}
```

- 统计：umami、Google Analytics 4、百度统计开箱即用，其他统计填脚本 URL 即可
- 广告位：内置 `home-top` / `home-bottom` / `tool-bottom` 三个槽位，未配置的槽位不渲染任何占位元素
- `/#/admin` 页的「保存到本浏览器预览」仅写入 localStorage，方便部署前本机预览效果

## 隐私

本项目没有服务器，所有文件处理（包括 AI 抠图）都在你的浏览器内完成。除按需从 CDN 加载 ffmpeg / AI 模型等公共组件外，不发起任何网络请求；统计与广告仅在部署者主动配置后启用。

## 致谢

功能清单参考了 [imagestool.com](https://imagestool.com/)。核心能力来自 ffmpeg.wasm、exifr、@imgly/background-removal、JSZip 等优秀开源项目。

## License

[MIT](LICENSE)
