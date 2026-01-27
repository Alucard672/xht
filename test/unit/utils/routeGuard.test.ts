import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractTenantId,
  isClientEntry,
  clientRouteGuard,
  merchantRouteGuard
} from '@/utils/routeGuard'

/**
 * routeGuard.ts 单元测试
 * 测试重点：纯函数逻辑和边界情况
 */

describe('routeGuard.ts - 工具函数测试', () => {
  beforeEach(() => {
    // Mock uni methods
    global.uni = {
      showToast: vi.fn(),
      setStorageSync: vi.fn(),
      getStorageSync: vi.fn(),
      navigateTo: vi.fn(),
      redirectTo: vi.fn(),
      reLaunch: vi.fn()
    } as any
  })

  describe('extractTenantId', () => {
    it('应该从直接参数中提取 tenant_id', () => {
      const options = { tenant_id: 'tenant-123' }
      expect(extractTenantId(options)).toBe('tenant-123')
    })

    it('应该从 scene 参数中提取 tenant_id (格式: t=xxx)', () => {
      const options = { scene: 't=tenant-456' }
      expect(extractTenantId(options)).toBe('tenant-456')
    })

    it('应该处理 URL 编码的 scene 参数', () => {
      const options = { scene: encodeURIComponent('t=tenant-789') }
      expect(extractTenantId(options)).toBe('tenant-789')
    })

    it('应该处理纯 tenant_id 的 scene 参数', () => {
      const options = { scene: 'tenant-simple' }
      expect(extractTenantId(options)).toBe('tenant-simple')
    })

    it('应该忽略其他格式的 scene 参数', () => {
      const options = { scene: 'other=value' }
      expect(extractTenantId(options)).toBeNull()
    })

    it('应该在没有参数时返回 null', () => {
      expect(extractTenantId({})).toBeNull()
      expect(extractTenantId(null)).toBeNull()
      expect(extractTenantId(undefined)).toBeNull()
    })

    it('应该处理解码错误', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const options = { scene: '%Invalid' }
      const result = extractTenantId(options)

      // 不应该抛出错误
      expect(result).toBeNull()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })

    it('应该处理特殊字符的 tenant_id', () => {
      expect(extractTenantId({ tenant_id: 'tenant_123-abc' })).toBe('tenant_123-abc')
      expect(extractTenantId({ tenant_id: 'tenant@123' })).toBe('tenant@123')
    })

    it('应该处理空字符串的 tenant_id', () => {
      // 空字符串被视为无效值，返回 null
      expect(extractTenantId({ tenant_id: '' })).toBeNull()
    })

    it('应该处理包含等号的特殊 scene 格式', () => {
      // 多个等号的情况
      expect(extractTenantId({ scene: 'key=value=extra' })).toBeNull()
      // 空值情况
      expect(extractTenantId({ scene: 't=' })).toBe('')
    })
  })

  describe('isClientEntry', () => {
    it('应该识别带 tenant_id 的客户端入口', () => {
      expect(isClientEntry({ tenant_id: 'tenant-123' })).toBe(true)
    })

    it('应该识别带 scene 参数的客户端入口', () => {
      expect(isClientEntry({ scene: 't=tenant-456' })).toBe(true)
      expect(isClientEntry({ scene: 'tenant-direct' })).toBe(true)
    })

    it('应该返回 false 对于普通入口', () => {
      expect(isClientEntry({})).toBe(false)
      expect(isClientEntry({ other: 'param' })).toBe(false)
      expect(isClientEntry(null)).toBe(false)
      expect(isClientEntry(undefined)).toBe(false)
    })
  })

  describe('clientRouteGuard', () => {
    it('应该允许带有效 tenant_id 的访问', () => {
      global.uni.getStorageSync = vi.fn().mockReturnValue('tenant-123')

      expect(clientRouteGuard('tenant-123')).toBe(true)
      expect(global.uni.showToast).not.toHaveBeenCalled()
    })

    it('应该从存储中读取 tenant_id', () => {
      global.uni.getStorageSync = vi.fn().mockReturnValue('tenant-456')

      expect(clientRouteGuard()).toBe(true)
      expect(global.uni.getStorageSync).toHaveBeenCalledWith('tenant_id')
    })

    it('应该拒绝缺少 tenant_id 的访问', () => {
      global.uni.getStorageSync = vi.fn().mockReturnValue(null)

      const result = clientRouteGuard()
      expect(result).toBe(false)
      expect(global.uni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '缺少商户信息'
        })
      )
    })

    it('应该在1.5秒后跳转到登录页（无 tenant_id）', () => {
      global.uni.getStorageSync = vi.fn().mockReturnValue(undefined)

      vi.useFakeTimers()
      clientRouteGuard()

      expect(global.uni.reLaunch).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1500)
      expect(global.uni.reLaunch).toHaveBeenCalledWith({
        url: '/pages/merchant/login'
      })

      vi.useRealTimers()
    })
  })

  describe('merchantRouteGuard', () => {
    it('应该允许访问公开页面', () => {
      expect(merchantRouteGuard('/pages/merchant/login')).toBe(true)
      expect(merchantRouteGuard('/pages/merchant/register')).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理空的 options 对象', () => {
      expect(extractTenantId({})).toBeNull()
      expect(isClientEntry({})).toBe(false)
    })

    it('应该处理 null 和 undefined', () => {
      expect(extractTenantId(null)).toBeNull()
      expect(extractTenantId(undefined)).toBeNull()
      expect(isClientEntry(null)).toBe(false)
      expect(isClientEntry(undefined)).toBe(false)
    })
  })

  describe('实际使用场景', () => {
    it('应该正确处理微信小程序扫码场景', () => {
      // 场景1: 完整的扫码参数
      const scene1 = 't=merchant-abc-123'
      expect(extractTenantId({ scene: scene1 })).toBe('merchant-abc-123')
      expect(isClientEntry({ scene: scene1 })).toBe(true)

      // 场景2: 简化的扫码参数
      const scene2 = 'merchant-simple-xyz'
      expect(extractTenantId({ scene: scene2 })).toBe('merchant-simple-xyz')
      expect(isClientEntry({ scene: scene2 })).toBe(true)
    })

    it('应该正确处理H5 URL参数场景', () => {
      const urlParams = { tenant_id: 'tenant-h5-001' }
      expect(extractTenantId(urlParams)).toBe('tenant-h5-001')
      expect(isClientEntry(urlParams)).toBe(true)
    })

    it('应该正确处理混合参数', () => {
      // 同时有 tenant_id 和 scene，优先使用 tenant_id
      const mixedParams = {
        tenant_id: 'tenant-from-param',
        scene: 't=tenant-from-scene'
      }
      expect(extractTenantId(mixedParams)).toBe('tenant-from-param')
    })
  })
})
