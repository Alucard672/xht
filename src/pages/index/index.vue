<template>
  <view class="container">
    <view class="header">
      <image src="/static/logo.png" class="logo"></image>
      <text class="title">乡货通 Xianghuotong</text>
      <text class="desc">专注乡镇批发的 SaaS 平台</text>
    </view>

    <view class="loading-container">
      <u-loading-icon mode="circle" size="60"></u-loading-icon>
      <text class="loading-text">正在进入...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { checkLogin } from '@/utils/auth'

onLoad((options: any) => {
  // 处理扫码入店或带参数访问（保持向后兼容）
  let tenant_id = options.tenant_id

  // 处理微信小程序扫码 (scene 参数)
  if (options.scene) {
    const scene = decodeURIComponent(options.scene)
    const sceneParams = scene.split('=')
    if (sceneParams[0] === 't') {
      tenant_id = sceneParams[1]
    }
  }

  if (tenant_id) {
    // 扫码进入客户端
    uni.setStorageSync('tenant_id', tenant_id)
    return uni.reLaunch({ url: `/pages/client/shop?tenant_id=${tenant_id}` })
  }

  // 默认重定向到商户登录页
  if (!checkLogin()) {
    return uni.reLaunch({ url: '/pages/merchant/login' })
  }

  // 已登录，检查租户信息
  const tenant_id_stored = uni.getStorageSync('tenant_id')
  if (!tenant_id_stored) {
    return uni.reLaunch({ url: '/pages/merchant/register' })
  }

  // 已登录且有租户，进入工作台
  uni.reLaunch({ url: '/pages/merchant/dashboard' })
})
</script>

<style lang="scss" scoped>
.container {
  padding: 40rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .header {
    margin-top: 60rpx;
    margin-bottom: 80rpx;
    text-align: center;
    .logo {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 20rpx;
    }
    .title {
      display: block;
      font-size: 40rpx;
      font-weight: bold;
      color: #333;
    }
    .desc {
      font-size: 24rpx;
      color: #999;
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30rpx;

    .loading-text {
      font-size: 28rpx;
      color: #666;
    }
  }
}
</style>
