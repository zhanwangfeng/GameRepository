import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 读取 package.json 中的版本号，用于构建输出子目录 dist/{version}/
const version = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
).version

// 本地开发：默认走 mock 数据（VITE_USE_MOCK 不为 'false' 时）。
// 部署到同一域名使用真实接口时，设置 VITE_USE_MOCK=false。
export default defineConfig({
  // 相对 base：构建产物可整体拷贝到任意子目录（game_select_ps4 / ps5 / switch …）
  base: './',
  plugins: [react()],
  build: {
    // 输出到 dist/{version}/，便于按版本归档与回滚
    outDir: `dist/${version}`,
    emptyOutDir: true,
  },
  server: { port: 5173, host: true },
})
