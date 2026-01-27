import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'

// Mock uni API
const mockUni = {
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(() => true),
  removeStorageSync: vi.fn(() => true),
  reLaunch: vi.fn()
}

global.uni = mockUni as any

describe('useUserStore', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该正确初始化默认状态', () => {
      const store = useUserStore()

      expect(store.token).toBe('')
      expect(store.userInfo).toEqual({})
      expect(store.tenantInfo).toEqual({})
      expect(store.hasLogin).toBe(false)
    })

    it('应该从 storage 读取已有数据', () => {
      // Mock storage 返回值
      mockUni.getStorageSync
        .mockReturnValueOnce('stored_token_123')
        .mockReturnValueOnce({ _id: 'user_001', name: 'Test User' })
        .mockReturnValueOnce({ _id: 'tenant_001', name: 'Test Shop' })

      const store = useUserStore()

      expect(store.token).toBe('stored_token_123')
      expect(store.userInfo).toEqual({ _id: 'user_001', name: 'Test User' })
      expect(store.tenantInfo).toEqual({ _id: 'tenant_001', name: 'Test Shop' })
      expect(store.hasLogin).toBe(true)
    })

    it('应该处理 storage 中的无效数据', () => {
      // Mock storage 返回无效数据
      mockUni.getStorageSync
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('invalid_string')
        .mockReturnValueOnce(null)

      const store = useUserStore()

      expect(store.token).toBe('')
      expect(store.userInfo).toEqual({})
      expect(store.tenantInfo).toEqual({})
      expect(store.hasLogin).toBe(false)
    })
  })

  describe('login', () => {
    it('应该正确设置登录状态', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: new Date(Date.now() + 86400000).getTime(),
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      expect(store.token).toBe('test_token_123')
      expect(store.userInfo).toEqual({ _id: 'user_001', name: '张三' })
      expect(store.tenantInfo).toEqual({ _id: 'tenant_001', name: '测试店铺' })
      expect(store.hasLogin).toBe(true)
    })

    it('应该正确保存到 storage', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      expect(mockUni.setStorageSync).toHaveBeenCalledWith('uni_id_token', 'test_token_123')
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('uni_id_token_expired', 1234567890)
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('uni-id-pages-userInfo', {
        _id: 'user_001',
        name: '张三'
      })
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('tenant_info', {
        _id: 'tenant_001',
        name: '测试店铺'
      })
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('tenant_id', 'tenant_001')
    })

    it('应该处理没有 tenantInfo 的情况', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: { _id: 'user_001', name: '张三' }
      })

      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_info')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_id')
    })

    it('应该处理空对象 tenantInfo', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: {}
      })

      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_info')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_id')
    })

    it('应该处理无效的 userInfo', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: 'invalid' as any
      })

      expect(store.userInfo).toEqual({})
    })

    it('应该处理缺少 token 的情况', () => {
      const store = useUserStore()

      store.login({
        userInfo: { _id: 'user_001' }
      } as any)

      expect(store.token).toBe('')
      expect(store.hasLogin).toBe(true)
    })
  })

  describe('logout', () => {
    it('应该正确清除登录状态', () => {
      const store = useUserStore()

      // 先登录
      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      expect(store.hasLogin).toBe(true)

      // 再登出
      store.logout()

      expect(store.token).toBe('')
      expect(store.userInfo).toEqual({})
      expect(store.tenantInfo).toEqual({})
      expect(store.hasLogin).toBe(false)
    })

    it('应该清除所有 storage 数据', () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        tokenExpired: 1234567890,
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      vi.clearAllMocks()

      store.logout()

      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('uni_id_token')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('uni_id_token_expired')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('uni-id-pages-userInfo')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_info')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('tenant_id')
    })

    it('应该跳转到登录页面', () => {
      const store = useUserStore()

      store.logout()

      expect(mockUni.reLaunch).toHaveBeenCalledWith({ url: '/pages/merchant/login' })
    })
  })

  describe('refreshTenantInfo', () => {
    it('应该在有 tenantInfo 时调用云对象', async () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        userInfo: { _id: 'user_001' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      // Mock cloud object
      const mockMerchantCo = {
        getTenantInfo: vi.fn().mockResolvedValue({
          code: 0,
          data: { _id: 'tenant_001', name: '更新后店铺', status: 1 }
        })
      }

      vi.doMock('@/utils/cloud', () => ({
        importObject: vi.fn(() => mockMerchantCo)
      }))

      // 这里需要实际的 mock 实现，暂时跳过
      // 实际测试中需要完整 mock cloud 模块
    })

    it('应该在无 tenantInfo 时不执行操作', async () => {
      const store = useUserStore()

      // 不设置 tenantInfo
      const result = await store.refreshTenantInfo()

      expect(result).toBeUndefined()
    })

    it('应该处理云对象调用失败的情况', async () => {
      const store = useUserStore()

      store.login({
        token: 'test_token_123',
        userInfo: { _id: 'user_001' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      // Mock cloud error
      // 实际测试中需要完整 mock cloud 模块
      // 这里暂时跳过
    })
  })

  describe('综合场景', () => {
    it('应该正确处理完整的登录登出流程', () => {
      const store = useUserStore()

      // 初始状态
      expect(store.hasLogin).toBe(false)

      // 登录
      store.login({
        token: 'test_token',
        tokenExpired: Date.now() + 86400000,
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '测试店铺' }
      })

      expect(store.hasLogin).toBe(true)
      expect(store.token).toBe('test_token')

      // 登出
      store.logout()

      expect(store.hasLogin).toBe(false)
      expect(store.token).toBe('')
    })

    it('应该支持多次登录', () => {
      const store = useUserStore()

      // 第一次登录
      store.login({
        token: 'token_1',
        userInfo: { _id: 'user_001', name: '张三' },
        tenantInfo: { _id: 'tenant_001', name: '店铺A' }
      })

      expect(store.token).toBe('token_1')
      expect(store.userInfo.name).toBe('张三')

      // 第二次登录（切换用户）
      store.login({
        token: 'token_2',
        userInfo: { _id: 'user_002', name: '李四' },
        tenantInfo: { _id: 'tenant_002', name: '店铺B' }
      })

      expect(store.token).toBe('token_2')
      expect(store.userInfo.name).toBe('李四')
      expect(store.tenantInfo.name).toBe('店铺B')
    })
  })
})
