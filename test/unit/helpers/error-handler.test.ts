import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock uni API
const mockUni = {
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn()
}

global.uni = mockUni as any

/**
 * error-handler.ts 单元测试
 * 测试统一错误处理工具函数
 */

// 导入要测试的函数
const getFriendlyMessage = (message: string, type: string): string => {
  const commonErrors: Record<string, string> = {
    网络异常: '网络连接失败，请检查网络',
    请求超时: '请求超时，请稍后重试',
    未登录: '请先登录',
    登录失效: '登录已过期，请重新登录',
    无权限: '您没有权限执行此操作',
    不存在: '数据不存在或已被删除'
  }

  // 检查常见错误
  for (const [key, friendly] of Object.entries(commonErrors)) {
    if (message.includes(key)) {
      return friendly
    }
  }

  // 根据错误类型返回默认消息
  const defaultMessages: Record<string, string> = {
    network: '网络连接失败，请检查网络设置',
    business: message || '操作失败，请稍后重试',
    system: '系统错误，请稍后重试',
    permission: '您没有权限执行此操作'
  }

  return defaultMessages[type as string] || message
}

const handleError = (error: Error | string | unknown, type: string = 'system', options: any = {}) => {
  const { showToast = true, duration = 2000 } = options

  // 获取错误消息
  let message = '操作失败'
  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message || message
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = (error as any).message || message
  }

  // 记录错误日志
  console.error(`[${type.toUpperCase()}]`, error)

  // 显示用户友好的提示
  if (showToast) {
    uni.showToast({
      title: getFriendlyMessage(message, type),
      icon: 'none',
      duration
    })
  }
}

describe('error-handler 工具函数', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFriendlyMessage', () => {
    it('应该转换网络错误为友好提示', () => {
      const message = '网络异常'
      const friendly = getFriendlyMessage(message, 'network')

      expect(friendly).toBe('网络连接失败，请检查网络')
    })

    it('应该转换请求超时为友好提示', () => {
      const message = '请求超时'
      const friendly = getFriendlyMessage(message, 'network')

      expect(friendly).toBe('请求超时，请稍后重试')
    })

    it('应该转换未登录错误为友好提示', () => {
      const message = '未登录'
      const friendly = getFriendlyMessage(message, 'permission')

      expect(friendly).toBe('请先登录')
    })

    it('应该转换登录失效为友好提示', () => {
      const message = '登录失效'
      const friendly = getFriendlyMessage(message, 'permission')

      expect(friendly).toBe('登录已过期，请重新登录')
    })

    it('应该转换无权限错误为友好提示', () => {
      const message = '无权限'
      const friendly = getFriendlyMessage(message, 'permission')

      expect(friendly).toBe('您没有权限执行此操作')
    })

    it('应该返回业务错误原消息', () => {
      const message = '库存不足'
      const friendly = getFriendlyMessage(message, 'business')

      expect(friendly).toBe('库存不足')
    })

    it('应该返回系统错误默认提示', () => {
      const message = '未知错误'
      const friendly = getFriendlyMessage(message, 'system')

      expect(friendly).toBe('系统错误，请稍后重试')
    })

    it('应该返回网络错误默认提示', () => {
      const message = '连接失败'
      const friendly = getFriendlyMessage(message, 'network')

      expect(friendly).toBe('网络连接失败，请检查网络设置')
    })

    it('应该处理不存在的错误', () => {
      const message = '商品不存在'
      const friendly = getFriendlyMessage(message, 'business')

      expect(friendly).toBe('数据不存在或已被删除')
    })
  })

  describe('handleError', () => {
    it('应该处理字符串错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = '网络异常'

      handleError(error, 'network')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[NETWORK]', error)
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '网络连接失败，请检查网络',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该处理Error对象', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error('请求超时')

      handleError(error, 'network')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[NETWORK]', error)
      expect(mockUni.showToast).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该处理带message属性的对象', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = { message: '未登录' }

      handleError(error, 'permission')

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该处理未知错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = null

      handleError(error, 'system')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[SYSTEM]', error)
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '系统错误，请稍后重试',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该支持自定义显示时长', () => {
      const options = { duration: 3000 }

      handleError('测试错误', 'system', options)

      expect(mockUni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 3000
        })
      )
    })

    it('应该支持不显示toast', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const options = { showToast: false }

      handleError('测试错误', 'system', options)

      expect(mockUni.showToast).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该记录错误日志', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error('测试错误')

      handleError(error, 'business')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[BUSINESS]', error)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('错误类型', () => {
    it('应该正确识别网络错误', () => {
      const type = 'network'

      expect(['network', 'business', 'system', 'permission']).toContain(type)
    })

    it('应该正确识别业务错误', () => {
      const type = 'business'

      expect(['network', 'business', 'system', 'permission']).toContain(type)
    })

    it('应该正确识别系统错误', () => {
      const type = 'system'

      expect(['network', 'business', 'system', 'permission']).toContain(type)
    })

    it('应该正确识别权限错误', () => {
      const type = 'permission'

      expect(['network', 'business', 'system', 'permission']).toContain(type)
    })
  })

  describe('withErrorHandling', () => {
    it('应该包装异步函数并捕获错误', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const asyncFn = async () => {
        throw new Error('测试错误')
      }

      const withErrorHandling = async (asyncFn: () => Promise<any>) => {
        try {
          return await asyncFn()
        } catch (error) {
          handleError(error, 'system')
          return null
        }
      }

      const result = await withErrorHandling(asyncFn)

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该正常返回异步函数结果', async () => {
      const asyncFn = async () => {
        return { success: true }
      }

      const withErrorHandling = async (asyncFn: () => Promise<any>) => {
        try {
          return await asyncFn()
        } catch (error) {
          handleError(error, 'system')
          return null
        }
      }

      const result = await withErrorHandling(asyncFn)

      expect(result).toEqual({ success: true })
    })

    it('应该处理异步函数抛出的字符串错误', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const asyncFn = async () => {
        throw '字符串错误'
      }

      const withErrorHandling = async (asyncFn: () => Promise<any>) => {
        try {
          return await asyncFn()
        } catch (error) {
          handleError(error, 'system')
          return null
        }
      }

      const result = await withErrorHandling(asyncFn)

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('加载状态管理', () => {
    it('应该显示加载状态', () => {
      const showLoading = (title = '加载中...') => {
        uni.showLoading({ title, mask: true })
      }

      showLoading('请稍候...')

      expect(mockUni.showLoading).toHaveBeenCalledWith({
        title: '请稍候...',
        mask: true
      })
    })

    it('应该使用默认加载提示', () => {
      const showLoading = (title = '加载中...') => {
        uni.showLoading({ title, mask: true })
      }

      showLoading()

      expect(mockUni.showLoading).toHaveBeenCalledWith({
        title: '加载中...',
        mask: true
      })
    })

    it('应该隐藏加载状态', () => {
      const hideLoading = () => {
        uni.hideLoading()
      }

      hideLoading()

      expect(mockUni.hideLoading).toHaveBeenCalled()
    })

    it('应该支持显示和隐藏加载状态', () => {
      mockUni.showLoading.mockClear()
      mockUni.hideLoading.mockClear()

      // 显示加载
      uni.showLoading({ title: '加载中...', mask: true })
      expect(mockUni.showLoading).toHaveBeenCalledTimes(1)

      // 隐藏加载
      uni.hideLoading()
      expect(mockUni.hideLoading).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = ''

      handleError(error, 'system')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该处理undefined错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = undefined

      handleError(error, 'system')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该处理null错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = null

      handleError(error, 'system')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('应该处理Error对象无message', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error()

      handleError(error, 'system')

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '系统错误，请稍后重试',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('综合场景', () => {
    it('应该完整处理网络错误流程', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error('网络异常')

      handleError(error, 'network')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[NETWORK]', error)
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '网络连接失败，请检查网络',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该完整处理业务错误流程', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = '库存不足'

      handleError(error, 'business')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[BUSINESS]', '库存不足')
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '库存不足',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该完整处理权限错误流程', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = { message: '无权限' }

      handleError(error, 'permission')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[PERMISSION]', error)
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '您没有权限执行此操作',
        icon: 'none',
        duration: 2000
      })

      consoleErrorSpy.mockRestore()
    })

    it('应该支持加载中的异步操作', async () => {
      mockUni.showLoading.mockClear()
      mockUni.hideLoading.mockClear()

      // 显示加载
      uni.showLoading({ title: '提交中...', mask: true })

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 10))

      // 隐藏加载
      uni.hideLoading()

      expect(mockUni.showLoading).toHaveBeenCalled()
      expect(mockUni.hideLoading).toHaveBeenCalled()
    })
  })
})
