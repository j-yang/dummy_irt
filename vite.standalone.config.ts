import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
      // 内联所有资源，包括favicon
      inlinePattern: ['**/*']
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist-standalone',
    target: 'esnext',
    assetsInlineLimit: 100000000, // 100mb - 内联所有资源
    cssCodeSplit: false,
    // 禁用复制 public 文件夹中的文件
    copyPublicDir: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        // 强制所有输出都内联到HTML中
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk.js',
        assetFileNames: 'asset.[ext]'
      }
    },
    sourcemap: false,
    // 确保所有资源都被内联
    assetsDir: ''
  }
})
