<template>
  <view class="container">
    <view class="header">
      <image src="/static/logo.png" class="logo"></image>
      <text class="title">乡货通 Xianghuotong</text>
      <text class="desc">专注乡镇批发的 SaaS 平台</text>
    </view>

    <view class="menu-grid">
      <view
        v-if="!appMode || appMode === 'merchant'"
        class="menu-item merchant"
        @click="goMerchant"
      >
        <u-icon name="home-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">商家端</text>
        <text class="menu-sub">管账、管货、管客户</text>
      </view>

      <view v-if="!appMode || appMode === 'client'" class="menu-item client" @click="goClient">
        <u-icon name="shopping-cart-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">客户端</text>
        <text class="menu-sub">扫码下单、对账</text>
      </view>

      <view v-if="!appMode || appMode === 'admin'" class="menu-item admin" @click="goAdmin">
        <u-icon name="setting-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">系统管理端</text>
        <text class="menu-sub">平台商户与概览</text>
      </view>
    </view>

    <view class="footer-tips">
      <text v-if="appMode"
        >生产模式：{{
          appMode === 'merchant' ? '商家端' : appMode === 'client' ? '客户端' : '管理端'
        }}</text
      >
      <text v-else>开发调试模式：点击各入口时检查登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { checkLogin } from '@/utils/auth'

const appMode = computed(() => {
  // @ts-ignore
  return process.env.VITE_APP_MODE || ''
})

const goMerchant = () => {
  if (!checkLogin()) {
    return uni.navigateTo({ url: '/pages/merchant/login' })
  }

  const tenant_id = uni.getStorageSync('tenant_id')
  if (!tenant_id) {
    // 已登录但无租户，去注册
    return uni.navigateTo({ url: '/pages/merchant/register' })
  }

  // 直接进入工作台 (使用 reLaunch 确保无法返回当前页)
  uni.reLaunch({ url: '/pages/merchant/dashboard' })
}

const goAdmin = () => {
  if (!checkLogin()) {
    // 统一跳商家登录页（或专门的管理员登录页）
    return uni.navigateTo({ url: '/pages/merchant/login' })
  }
  uni.reLaunch({ url: '/pages/admin/merchant/list' })
}

const goClient = () => {
  // 客户端暂时允许未登录访问（扫码场景），或者带入演示ID
  const tenant_id = uni.getStorageSync('tenant_id')
  if (tenant_id) {
    uni.reLaunch({ url: `/pages/client/shop?tenant_id=${tenant_id}` })
  } else {
    // 模拟一个演示 tenant_id 或者提示
    // uni.showToast({ title: '体验模式：进入演示店铺', icon: 'none' })
    // setTimeout(() => {
    // 假设有一个演示店铺ID
    // uni.navigateTo({ url: `/pages/client/shop?tenant_id=demo-tenant-id` })
    // }, 500)
    uni.showToast({ title: '请先登录商户端获取体验ID', icon: 'none' })
  }
}

onLoad(() => {
  // 如果指定了模式，自动执行跳转逻辑
  if (appMode.value === 'merchant') {
    goMerchant()
  } else if (appMode.value === 'client') {
    goClient()
  } else if (appMode.value === 'admin') {
    goAdmin()
  }
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

  .menu-grid {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 30rpx;

    .menu-item {
      padding: 40rpx;
      border-radius: 20rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s;
      &:active {
        transform: scale(0.98);
        opacity: 0.9;
      }
      .menu-text {
        color: #fff;
        font-size: 34rpx;
        font-weight: bold;
        margin-top: 20rpx;
      }
      .menu-sub {
        color: rgba(255, 255, 255, 0.8);
        font-size: 24rpx;
        margin-top: 10rpx;
      }
    }

    .merchant {
      background: linear-gradient(135deg, #007aff, #005bb7);
      box-shadow: 0 10rpx 20rpx rgba(0, 122, 255, 0.2);
    }
    .client {
      background: linear-gradient(135deg, #ff9900, #e68a00);
      box-shadow: 0 10rpx 20rpx rgba(255, 153, 0, 0.2);
    }
    .admin {
      background: linear-gradient(135deg, #722ed1, #531dab);
      box-shadow: 0 10rpx 20rpx rgba(114, 46, 209, 0.2);
    }
  }

  .footer-tips {
    margin-top: auto;
    padding-bottom: 40rpx;
    color: #999;
    font-size: 24rpx;
  }
}
</style>
