import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base 使用相对路径，便于部署到 GitHub Pages 或任意静态托管
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    // ffmpeg.wasm 自带 worker，不能被预打包
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
