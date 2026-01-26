import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('uni_id_token') || '')
  const userInfo = ref(uni.getStorageSync('uni-id-pages-userInfo') || {})
  const tenantInfo = ref(uni.getStorageSync('tenant_info') || {})

  const hasLogin = ref(!!token.value)

  const login = (data: any) => {
    token.value = data.token
    userInfo.value = data.userInfo
    tenantInfo.value = data.tenantInfo || {}

    uni.setStorageSync('uni_id_token', data.token)
    uni.setStorageSync('uni_id_token_expired', data.tokenExpired)
    uni.setStorageSync('uni-id-pages-userInfo', data.userInfo)
    if (data.tenantInfo) {
      uni.setStorageSync('tenant_info', data.tenantInfo)
      // 兼容旧逻辑
      uni.setStorageSync('tenant_id', data.tenantInfo._id)
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
