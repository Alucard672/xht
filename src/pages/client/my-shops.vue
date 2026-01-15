<template>
  <view class="my-shops-container">
    <view class="page-header">
      <text class="title">我的商家</text>
    </view>

    <view v-if="loading" class="loading">
      <u-loading-icon></u-loading-icon>
    </view>

    <view v-else-if="shopList.length === 0" class="empty">
      <u-empty mode="list" text="还没有关联的商家"></u-empty>
      <view class="tip">扫码进入商家店铺后会自动关联</view>
    </view>

    <view v-else class="shop-list">
      <view v-for="shop in shopList" :key="shop._id" class="shop-card" @click="enterShop(shop)">
        <view class="shop-info">
          <image
            v-if="shop.tenant_logo"
            :src="shop.tenant_logo"
            class="shop-logo"
            mode="aspectFill"
          ></image>
          <view v-else class="shop-logo-placeholder">
            <text>{{ shop.tenant_name?.charAt(0) || '商' }}</text>
          </view>
          <view class="shop-detail">
            <view class="shop-name">{{ shop.tenant_name }}</view>
            <view class="shop-stats">
              <text>消费 {{ shop.total_spent ? formatAmount(shop.total_spent) : '0.00' }} 元</text>
              <text class="divider">|</text>
              <text>{{ shop.total_orders }} 笔订单</text>
            </view>
            <view class="shop-time"> 最近访问: {{ formatTime(shop.last_visit_at) }} </view>
          </view>
        </view>
        <view class="shop-actions">
          <u-button
            type="primary"
            size="mini"
            text="进入"
            custom-style="width: 120rpx; height: 60rpx; border-radius: 30rpx;"
          ></u-button>
          <u-icon
            name="close"
            size="18"
            color="#999"
            class="unbind-btn"
            @click.stop="showUnbindConfirm(shop)"
          ></u-icon>
        </view>
      </view>
    </view>

    <!-- 解绑确认弹窗 -->
    <u-popup :show="showUnbindPopup" mode="dialog" @close="showUnbindPopup = false">
      <view class="unbind-popup">
        <view class="popup-header">确认解绑</view>
        <view class="popup-body">
          <text>确定要解除与 "{{ currentShop?.tenant_name }}" 的关联吗？</text>
          <text class="warning">解绑后需要重新扫码才能进入该商家</text>
        </view>
        <view class="popup-footer">
          <u-button
            text="取消"
            custom-style="flex: 1; margin-right: 20rpx;"
            @click="showUnbindPopup = false"
          ></u-button>
          <u-button
            type="error"
            text="解绑"
            :loading="unbinding"
            custom-style="flex: 1;"
            @click="handleUnbind"
          ></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const userCo = importObject('wh-user-co')

const loading = ref(true)
const shopList = ref<any[]>([])
const showUnbindPopup = ref(false)
const currentShop = ref<any>(null)
const unbinding = ref(false)

onShow(async () => {
  await fetchMyShops()
})

onMounted(() => {
  fetchMyShops()
})

const fetchMyShops = async () => {
  loading.value = true
  try {
    const res: any = await userCo.getMyTenants()
    if (res.code === 0) {
      shopList.value = res.data.list || []
    } else {
      uni.showToast({ title: res.message || '获取失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const formatAmount = (fen: number) => {
  return priceHelper.format(fen)
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '暂无'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

const enterShop = (shop: any) => {
  uni.navigateTo({
    url: `/pages/client/shop?tenant_id=${shop.tenant_id}`
  })
}

const showUnbindConfirm = (shop: any) => {
  currentShop.value = shop
  showUnbindPopup.value = true
}

const handleUnbind = async () => {
  if (!currentShop.value || unbinding.value) return

  unbinding.value = true
  try {
    const res: any = await userCo.unbindTenant({
      tenant_id: currentShop.value.tenant_id
    })

    if (res.code === 0) {
      uni.showToast({ title: '解绑成功', icon: 'success' })
      showUnbindPopup.value = false
      await fetchMyShops()
    } else {
      uni.showToast({ title: res.message || '解绑失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '解绑出错', icon: 'none' })
  } finally {
    unbinding.value = false
  }
}
</script>

<style lang="scss" scoped>
.my-shops-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 24rpx;
}

.page-header {
  padding: 20rpx 0 30rpx;
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;

  .tip {
    font-size: 26rpx;
    color: #999;
    margin-top: 20rpx;
  }
}

.shop-list {
  .shop-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .shop-info {
      display: flex;
      align-items: center;
      flex: 1;
      margin-right: 20rpx;

      .shop-logo {
        width: 100rpx;
        height: 100rpx;
        border-radius: 12rpx;
        margin-right: 20rpx;
      }

      .shop-logo-placeholder {
        width: 100rpx;
        height: 100rpx;
        border-radius: 12rpx;
        background-color: #07c160;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
        text {
          font-size: 40rpx;
          color: #fff;
          font-weight: bold;
        }
      }

      .shop-detail {
        flex: 1;

        .shop-name {
          font-size: 32rpx;
          font-weight: 500;
          color: #333;
          margin-bottom: 8rpx;
        }

        .shop-stats {
          font-size: 24rpx;
          color: #666;
          margin-bottom: 4rpx;

          .divider {
            margin: 0 12rpx;
            color: #ddd;
          }
        }

        .shop-time {
          font-size: 22rpx;
          color: #999;
        }
      }
    }

    .shop-actions {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .unbind-btn {
        padding: 10rpx;
      }
    }
  }
}

.unbind-popup {
  .popup-header {
    font-size: 32rpx;
    font-weight: bold;
    text-align: center;
    padding: 30rpx 0 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .popup-body {
    padding: 40rpx 30rpx;
    text-align: center;
    font-size: 28rpx;
    color: #333;

    .warning {
      display: block;
      font-size: 24rpx;
      color: #ff4d4f;
      margin-top: 16rpx;
    }
  }

  .popup-footer {
    display: flex;
    padding: 20rpx 30rpx 30rpx;
  }
}
</style>
