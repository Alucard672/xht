/**
 * 路由守卫工具
 * 用于保护需要登录或租户信息的页面
 */

import { useUserStore } from '@/stores/useUserStore'

/**
 * 公开页面列表（不需要登录）
 */
const PUBLIC_PAGES = ['/pages/merchant/login', '/pages/merchant/register']

/**
 * 提取 tenant_id
 * 支持直接参数和微信小程序 scene 参数
 */
export function extractTenantId(options: any): string | null {
  // 直接参数
  if (options?.tenant_id) {
    return options.tenant_id
  }

  // Scene 参数（微信小程序扫码）
  if (options?.scene) {
    try {
      const scene = decodeURIComponent(options.scene)
      if (scene.includes('=')) {
        const [key, value] = scene.split('=')
        return key === 't' ? value : null
      }
      // 如果 scene 只是 tenant_id
      return scene
    } catch (e) {
      console.error('解析 scene 参数失败:', e)
      return null
    }
  }

  return null
}

/**
 * 判断是否是客户端扫码进入
 */
export function isClientEntry(options: any): boolean {
  return !!extractTenantId(options)
}

/**
 * 商户路由守卫
 * 检查用户是否已登录且有租户信息
 *
 * @param currentPage 当前页面路径
 * @returns 是否允许访问
 */
export function merchantRouteGuard(currentPage: string): boolean {
  // 公开页面无需检查
  if (PUBLIC_PAGES.includes(currentPage)) {
    return true
  }

  const userStore = useUserStore()

  // 检查是否登录
  if (!userStore.hasLogin) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/merchant/login' })
    }, 1500)
    return false
  }

  // 检查是否有租户信息
  if (!userStore.tenantInfo || !userStore.tenantInfo._id) {
    uni.showToast({
      title: '请先完成商户注册',
      icon: 'none',
      duration: 1500
    })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/merchant/register' })
    }, 1500)
    return false
  }

  return true
}

/**
 * 客户端路由守卫
 * 检查是否有有效的 tenant_id
 *
 * @param tenant_id 租户ID
 * @returns 是否允许访问
 */
export function clientRouteGuard(tenant_id?: string): boolean {
  const targetTenantId = tenant_id || uni.getStorageSync('tenant_id')

  if (!targetTenantId) {
    uni.showToast({
      title: '缺少商户信息',
      icon: 'none',
      duration: 1500
    })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/merchant/login' })
    }, 1500)
    return false
  }

  return true
}

/**
 * 带守卫的导航封装
 */

export function navigateTo(url: string, guardType: 'merchant' | 'client' = 'merchant') {
  if (guardType === 'merchant' && !merchantRouteGuard(url)) {
    return
  }

  if (guardType === 'client') {
    const urlObj = new URL(url, 'http://dummy.com')
    const tenant_id = urlObj.searchParams.get('tenant_id') || undefined
    if (!clientRouteGuard(tenant_id)) {
      return
    }
  }

  uni.navigateTo({ url })
}

export function redirectTo(url: string, guardType: 'merchant' | 'client' = 'merchant') {
  if (guardType === 'merchant' && !merchantRouteGuard(url)) {
    return
  }

  if (guardType === 'client') {
    const urlObj = new URL(url, 'http://dummy.com')
    const tenant_id = urlObj.searchParams.get('tenant_id') || undefined
    if (!clientRouteGuard(tenant_id)) {
      return
    }
  }

  uni.redirectTo({ url })
}

export function reLaunch(url: string, guardType: 'merchant' | 'client' = 'merchant') {
  if (guardType === 'merchant' && !merchantRouteGuard(url)) {
    return
  }

  if (guardType === 'client') {
    const urlObj = new URL(url, 'http://dummy.com')
    const tenant_id = urlObj.searchParams.get('tenant_id') || undefined
    if (!clientRouteGuard(tenant_id)) {
      return
    }
  }

  uni.reLaunch({ url })
}
