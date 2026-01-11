import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        // 抑制 Sass 弃用警告
        silenceDeprecations: ['legacy-js-api', 'import']
      }
    }
  }
})
