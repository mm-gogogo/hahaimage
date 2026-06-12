import { defineConfig } from '@playwright/test'

// 本机代理（http_proxy 等）会拦截 webServer 健康检查导致误判，强制 localhost 直连
process.env.NO_PROXY = [process.env.NO_PROXY, 'localhost', '127.0.0.1', '::1'].filter(Boolean).join(',')
process.env.no_proxy = process.env.NO_PROXY

export default defineConfig({
  testDir: 'tests',
  // ffmpeg 测试串行执行，共享浏览器 HTTP 缓存（31MB 核心只下载一次）
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4523',
    // CDN（jsdelivr）下载 ffmpeg 核心需要直连网络；本地代理只影响终端，不影响浏览器
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4523 --strictPort',
    url: 'http://localhost:4523',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
