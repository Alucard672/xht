/**
 * 检查是否登录
 */
export function checkLogin(): boolean {
  const token = uni.getStorageSync('uni_id_token')
  const tokenExpired = uni.getStorageSync('uni_id_token_expired')

  if (!token) return false
  if (!tokenExpired) return true

  return Date.now() < tokenExpired
}

/**
 * 要求登录（未登录跳转到登录页）
 */
export function requireLogin(): boolean {
  if (!checkLogin()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/merchant/login' })
    }, 1500)
    return false
  }
  return true
}

/**
 * 获取用户角色
 */
export function getUserRole(): string[] {
  const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
  return userInfo?.role || []
}

/**
 * 是否有租户
 */
export function hasTenant(): boolean {
  const tenant_id = uni.getStorageSync('tenant_id')
  return !!tenant_id
}
