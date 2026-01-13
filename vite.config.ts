import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [uni()],
    define: {
      'process.env.VITE_APP_MODE': JSON.stringify(
        env.VITE_APP_MODE || process.env.VITE_APP_MODE || ''
      )
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 抑制 Sass 弃用警告
          silenceDeprecations: ['legacy-js-api', 'import']
        }
      }
    }
  }
})
