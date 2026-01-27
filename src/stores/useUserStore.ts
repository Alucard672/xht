import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 安全地从存储中读取数据，确保类型正确
  const storedToken = uni.getStorageSync('uni_id_token')
  const storedUserInfo = uni.getStorageSync('uni-id-pages-userInfo')
  const storedTenantInfo = uni.getStorageSync('tenant_info')

  const token = ref(storedToken || '')
  const userInfo = ref(storedUserInfo && typeof storedUserInfo === 'object' ? storedUserInfo : {})
  const tenantInfo = ref(
    storedTenantInfo && typeof storedTenantInfo === 'object' ? storedTenantInfo : {}
  )

  const hasLogin = ref(!!token.value)

  const login = (data: any) => {
    token.value = data.token || ''
    userInfo.value = data.userInfo && typeof data.userInfo === 'object' ? data.userInfo : {}
    tenantInfo.value = data.tenantInfo && typeof data.tenantInfo === 'object' ? data.tenantInfo : {}

    uni.setStorageSync('uni_id_token', data.token || '')
    uni.setStorageSync('uni_id_token_expired', data.tokenExpired)
    uni.setStorageSync('uni-id-pages-userInfo', userInfo.value)
    if (
      tenantInfo.value &&
      typeof tenantInfo.value === 'object' &&
      Object.keys(tenantInfo.value).length > 0
    ) {
      uni.setStorageSync('tenant_info', tenantInfo.value)
      // 兼容旧逻辑
      uni.setStorageSync('tenant_id', tenantInfo.value._id)
    } else {
      uni.removeStorageSync('tenant_info')
      uni.removeStorageSync('tenant_id')
    }

    hasLogin.value = true
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    tenantInfo.value = {}
    hasLogin.value = false

    uni.removeStorageSync('uni_id_token')
    uni.removeStorageSync('uni_id_token_expired')
    uni.removeStorageSync('uni-id-pages-userInfo')
    uni.removeStorageSync('tenant_info')
    uni.removeStorageSync('tenant_id')

    uni.reLaunch({ url: '/pages/merchant/login' })
  }

  // 刷新商家信息（获取最新有效期等）
  const refreshTenantInfo = async () => {
    if (!tenantInfo.value?._id) return

    try {
      const { importObject } = await import('@/utils/cloud')
      const merchantCo = importObject('wh-merchant-co')
      const res: any = await merchantCo.getTenantInfo()

      if (res.code === 0 && res.data) {
        tenantInfo.value = res.data
        uni.setStorageSync('tenant_info', res.data)
      }
    } catch (e) {
      console.error('刷新商家信息失败:', e)
    }
  }

  return {
    token,
    userInfo,
    tenantInfo,
    hasLogin,
    login,
    logout,
    refreshTenantInfo
  }
})
