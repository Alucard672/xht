<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'
import { extractTenantId, isClientEntry } from '@/utils/routeGuard'

onLaunch((options: any) => {
  console.log('App Launch', options)

  // 1. 检查是否是客户端扫码进入
  if (isClientEntry(options)) {
    const tenant_id = extractTenantId(options)
    if (tenant_id) {
      console.log('客户端扫码进入, tenant_id:', tenant_id)
      uni.setStorageSync('tenant_id', tenant_id)
      return uni.redirectTo({ url: `/pages/client/shop?tenant_id=${tenant_id}` })
    }
  }

  // 2. 商户访问 - 检查登录状态
  const userStore = useUserStore()
  if (!userStore.hasLogin) {
    console.log('未登录，跳转到登录页')
    return uni.reLaunch({ url: '/pages/merchant/login' })
  }

  // 3. 已登录 - 检查租户信息
  if (!userStore.tenantInfo || !userStore.tenantInfo._id) {
    console.log('已登录但无租户信息，跳转到注册页')
    return uni.reLaunch({ url: '/pages/merchant/register' })
  }

  // 4. 所有检查通过 - 进入工作台
  console.log('已登录且有租户信息，进入工作台')
  uni.reLaunch({ url: '/pages/merchant/dashboard' })
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>
<style lang="scss">
@import 'uview-plus/index.scss';
</style>
