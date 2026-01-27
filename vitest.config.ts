import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom', // 使用 jsdom 模拟浏览器环境
    globals: true, // 启用全局测试 API
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'uniCloud-aliyun/',
        '**/*.d.ts',
        '**/*.config.*',
        'test/setup.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      // 覆盖率目标：核心业务70%+
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70
    },
    include: ['src/**/*.{test,spec}.{js,ts,vue}', 'test/**/*.{test,spec}.{js,ts,vue}'],
    exclude: ['node_modules', 'dist', 'uniCloud-aliyun'],
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
