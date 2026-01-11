<template>
  <view class="container">
    <view class="header">
      <image src="/static/logo.png" class="logo"></image>
      <text class="title">乡货通 Xianghuotong</text>
      <text class="desc">专注乡镇批发的 SaaS 平台</text>
    </view>

    <view class="menu-grid">
      <view class="menu-item merchant" @click="goMerchant">
        <u-icon name="home-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">商家端</text>
        <text class="menu-sub">管账、管货、管客户</text>
      </view>

      <view class="menu-item client" @click="goClient">
        <u-icon name="shopping-cart-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">客户端</text>
        <text class="menu-sub">扫码下单、对账</text>
      </view>

      <view v-if="isSuperAdmin" class="menu-item admin" @click="goAdmin">
        <u-icon name="setting-fill" color="#fff" size="30"></u-icon>
        <text class="menu-text">系统管理端</text>
        <text class="menu-sub">平台商户与概览</text>
      </view>
    </view>

    <view v-if="tenantId" class="debug-info">
      <text>当前租户ID: {{ tenantId }}</text>
      <u-button
        size="mini"
        type="info"
        text="清除缓存"
        custom-style="margin-top: 10rpx"
        @click="clearCache"
      ></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tenantId = ref('demo-tenant-id') // 默认演示租户ID
const isSuperAdmin = ref(true) // 默认开启超管入口

onShow(() => {
  // 暂时注释掉真实逻辑，直接开启所有入口
  /*
  tenantId.value = uni.getStorageSync('tenant_id')
  const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
  isSuperAdmin.value = userInfo && userInfo.mobile === '13003629527'
  */
})

const goMerchant = () => {
  // 直接进入工作台
  uni.navigateTo({ url: '/pages/merchant/dashboard' })
}

const goAdmin = () => {
  uni.navigateTo({ url: '/pages/admin/merchant/list' })
}

const goClient = () => {
  // 直接进入商城，带入演示ID
  uni.navigateTo({ url: `/pages/client/shop?tenant_id=${tenantId.value}` })
}

const clearCache = () => {
  uni.clearStorageSync()
  tenantId.value = ''
  uni.showToast({ title: '缓存已清除' })
}
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

  .debug-info {
    margin-top: auto;
    padding-bottom: 40rpx;
    text-align: center;
    color: #999;
    font-size: 20rpx;
  }
}
</style>
