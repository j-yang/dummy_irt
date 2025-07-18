import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 用于构建可嵌入的独立版本
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist-embed',
    rollupOptions: {
      input: {
        embed: resolve(__dirname, 'src/embed.ts')
      },
      output: {
        entryFileNames: 'flowchart-embed.js',
        chunkFileNames: 'flowchart-[name].js',
        assetFileNames: 'flowchart-[name].[ext]'
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})
