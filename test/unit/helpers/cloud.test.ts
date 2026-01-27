import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importObject } from '@/utils/cloud'

describe('cloud.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('importObject', () => {
    it('应该调用 uniCloud.importObject', () => {
      const mockCloudObject = {
        testMethod: vi.fn(async () => ({ code: 0, data: 'success' }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      expect(global.uniCloud.importObject).toHaveBeenCalledWith('test-co')
    })

    it('应该返回云对象的方法', () => {
      const mockCloudObject = {
        testMethod: vi.fn(async () => ({ code: 0, data: 'success' }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      expect(typeof co.testMethod).toBe('function')
    })

    it('应该成功调用云对象方法', async () => {
      const mockResponse = { code: 0, data: 'test data' }
      const mockCloudObject = {
        testMethod: vi.fn(async () => mockResponse)
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      const result = await co.testMethod('arg1', 'arg2')

      expect(result).toEqual(mockResponse)
      expect(mockCloudObject.testMethod).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该传递参数给云对象方法', async () => {
      const mockCloudObject = {
        getUserInfo: vi.fn(async () => ({ code: 0, data: { name: 'Test' } }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('wh-user-co')
      await co.getUserInfo({ userId: 'user_001' })

      expect(mockCloudObject.getUserInfo).toHaveBeenCalledWith({ userId: 'user_001' })
    })

    it('应该处理云对象方法调用失败', async () => {
      const mockError = new Error('Cloud function error')
      const mockCloudObject = {
        testMethod: vi.fn(async () => {
          throw mockError
        })
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')

      await expect(co.testMethod()).rejects.toThrow('Cloud function error')
    })

    it('应该支持多个云对象', async () => {
      const mockUserCo = {
        getUserInfo: vi.fn(async () => ({ code: 0, data: { name: 'User' } }))
      }
      const mockOrderCo = {
        createOrder: vi.fn(async () => ({ code: 0, data: { orderId: 'order_001' } }))
      }

      global.uniCloud = {
        importObject: vi.fn((name: string) => {
          if (name === 'wh-user-co') return mockUserCo
          if (name === 'wh-order-co') return mockOrderCo
          return {}
        })
      } as any

      const userCo = importObject('wh-user-co')
      const orderCo = importObject('wh-order-co')

      const userResult = await userCo.getUserInfo()
      const orderResult = await orderCo.createOrder()

      expect(userResult.data.name).toBe('User')
      expect(orderResult.data.orderId).toBe('order_001')
    })

    it('应该支持链式调用', async () => {
      const mockCloudObject = {
        method1: vi.fn(async () => ({ code: 0 })),
        method2: vi.fn(async () => ({ code: 0 }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')

      await co.method1()
      await co.method2()

      expect(mockCloudObject.method1).toHaveBeenCalled()
      expect(mockCloudObject.method2).toHaveBeenCalled()
    })

    it('应该处理无返回值的方法', async () => {
      const mockCloudObject = {
        voidMethod: vi.fn(async () => undefined)
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      const result = await co.voidMethod()

      expect(result).toBeUndefined()
    })

    it('应该处理复杂返回值', async () => {
      const complexData = {
        code: 0,
        data: {
          list: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ],
          total: 2,
          pagination: { page: 1, limit: 20 }
        }
      }

      const mockCloudObject = {
        getList: vi.fn(async () => complexData)
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      const result = await co.getList()

      expect(result.data.list).toHaveLength(2)
      expect(result.data.total).toBe(2)
    })

    it('应该处理空参数调用', async () => {
      const mockCloudObject = {
        noArgMethod: vi.fn(async () => ({ code: 0 }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      await co.noArgMethod()

      expect(mockCloudObject.noArgMethod).toHaveBeenCalledWith()
    })
  })

  describe('日志拦截', () => {
    it('应该记录请求日志', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log')
      const mockCloudObject = {
        testMethod: vi.fn(async () => ({ code: 0, data: 'success' }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      await co.testMethod('testArg')

      // 验证 console.log 被调用
      expect(consoleLogSpy).toHaveBeenCalled()
      consoleLogSpy.mockRestore()
    })

    it('应该记录响应日志', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log')
      const mockCloudObject = {
        testMethod: vi.fn(async () => ({ code: 0, data: 'success' }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      await co.testMethod('testArg')

      // 验证响应日志
      const logCalls = consoleLogSpy.mock.calls
      const hasResponseLog = logCalls.some(call => String(call[0]).includes('[CloudRes]'))

      expect(hasResponseLog).toBe(true)
      consoleLogSpy.mockRestore()
    })

    it('应该记录错误日志', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const mockCloudObject = {
        testMethod: vi.fn(async () => {
          throw new Error('Test error')
        })
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')

      try {
        await co.testMethod('testArg')
      } catch (e) {
        // Expected error
      }

      // 验证错误日志
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('应该生成唯一的请求ID', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log')
      const mockCloudObject = {
        testMethod: vi.fn(async () => ({ code: 0 }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      await co.testMethod()

      const logCalls = consoleLogSpy.mock.calls
      const requestIds = logCalls
        .filter(call => String(call[0]).includes('[CloudReq]'))
        .map(call => String(call[0]).match(/\[([a-z0-9]+)\]/)?.[1])

      // 验证请求ID格式（应该是7位字母数字）
      requestIds.forEach(id => {
        expect(id).toMatch(/^[a-z0-9]{7}$/)
      })

      consoleLogSpy.mockRestore()
    })

    it('应该记录方法执行时间', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log')
      const mockCloudObject = {
        testMethod: vi.fn(async () => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 10))
          return { code: 0 }
        })
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')
      await co.testMethod()

      const logCalls = consoleLogSpy.mock.calls
      const hasDuration = logCalls.some(call => String(call[0]).match(/\(\d+ms\)/))

      expect(hasDuration).toBe(true)
      consoleLogSpy.mockRestore()
    })
  })

  describe('类型安全', () => {
    it('应该支持泛型类型定义', async () => {
      interface TestResponse {
        code: number
        data: { name: string }
      }

      const mockCloudObject = {
        getData: vi.fn(async () => ({ code: 0, data: { name: 'Test' } }))
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject<TestResponse>('test-co')
      const result = await co.getData()

      expect(result.data.name).toBe('Test')
    })

    it('应该支持云对象类型推断', () => {
      const mockCloudObject = {
        method1: vi.fn(),
        method2: vi.fn()
      }

      global.uniCloud = {
        importObject: vi.fn(() => mockCloudObject)
      } as any

      const co = importObject('test-co')

      // TypeScript 应该能够推断出 co 有 method1 和 method2
      expect(typeof co.method1).toBe('function')
      expect(typeof co.method2).toBe('function')
    })
  })
})
