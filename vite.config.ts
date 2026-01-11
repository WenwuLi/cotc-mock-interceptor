import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import fs from 'fs'
import path from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.',
        },
      ],
    }),
    {
      name: 'fix-html-paths-and-move',
      generateBundle(_options, bundle) {
        // 在 generateBundle 中修复 HTML 路径
        Object.keys(bundle).forEach((fileName) => {
          const file = bundle[fileName]
          if (file.type === 'asset' && fileName.endsWith('.html')) {
            let content = file.source as string
            // 修复资源路径：从绝对路径改为相对路径
            content = content.replace(/href="\/assets\//g, 'href="../assets/')
            content = content.replace(/src="\/assets\//g, 'src="../assets/')
            file.source = content
          }
        })
      },
      writeBundle(_options, bundle) {
        // 在 writeBundle 中移动文件
        Object.keys(bundle).forEach((fileName) => {
          const file = bundle[fileName]
          if (file.type === 'asset' && fileName.endsWith('.html')) {
            // 如果 HTML 文件在 src/options/ 目录下，移动到 options/
            if (fileName.includes('src/options/')) {
              const distPath = path.resolve(__dirname, 'dist')
              const oldPath = path.join(distPath, fileName)
              const newPath = path.join(distPath, 'options', 'index.html')
              
              // 确保目标目录存在
              const newDir = path.dirname(newPath)
              if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true })
              }
              
              // 读取文件内容（因为路径已经修复）
              if (fs.existsSync(oldPath)) {
                let content = fs.readFileSync(oldPath, 'utf-8')
                // 再次确保路径正确
                content = content.replace(/href="\/assets\//g, 'href="../assets/')
                content = content.replace(/src="\/assets\//g, 'src="../assets/')
                
                // 写入新位置
                fs.writeFileSync(newPath, content, 'utf-8')
                
                // 删除旧文件
                fs.unlinkSync(oldPath)
                
                // 删除空的 src 目录
                try {
                  const srcOptionsDir = path.dirname(oldPath)
                  if (fs.existsSync(srcOptionsDir) && fs.readdirSync(srcOptionsDir).length === 0) {
                    fs.rmdirSync(srcOptionsDir)
                  }
                  const srcDir = path.dirname(srcOptionsDir)
                  if (fs.existsSync(srcDir) && fs.readdirSync(srcDir).length === 0) {
                    fs.rmdirSync(srcDir)
                  }
                } catch (e) {
                  // 忽略删除目录的错误
                }
              }
            }
          }
        })
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.html'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background/service-worker') {
            return 'background/service-worker.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') {
            const inputName = assetInfo.names?.[0] || ''
            if (inputName === 'options') {
              return 'options/index.html'
            }
          }
          return 'assets/[name]-[hash].[ext]'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
