<template>
  <view class="result-container">
    <view class="result-card">
      <view class="icon-area">
        <u-icon v-if="status === 'success'" name="checkmark-circle-fill" color="#07c160" size="160"></u-icon>
        <u-icon v-else name="close-circle-fill" color="#ff4d4f" size="160"></u-icon>
      </view>
      
      <view class="title">{{ status === 'success' ? '续费成功' : '支付失败' }}</view>
      
      <view v-if="status === 'success'" class="success-info">
        <view class="info-row">
          <text class="label">订单号：</text>
          <text class="value">{{ orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="label">续费时长：</text>
          <text class="value">{{ duration }} 个月</text>
        </view>
      </view>
      
      <view v-else class="fail-info">
        <view class="info-text">支付未能完成，请重新尝试</view>
        <view class="order-tip">订单号：{{ orderNo }}</view>
      </view>
      
      <view class="actions">
        <u-button
          v-if="status === 'success'"
          type="primary"
          text="完成"
          custom-style="height: 96rpx; border-radius: 48rpx; background-color: #07c160; border: none;"
          @click="goBack"
        ></u-button>
        <u-button
          v-else
          type="primary"
          text="重新支付"
          custom-style="height: 96rpx; border-radius: 48rpx; background-color: #07c160; border: none;"
          @click="retryPayment"
        ></u-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()

const status = ref('success')
const orderNo = ref('')
const duration = ref(0)

onLoad((options: any) => {
  if (options.status) {
    status.value = options.status
  }
  if (options.order_no) {
    orderNo.value = options.order_no
  }
})

onMounted(async () => {
  // 如果是成功状态，刷新商家信息
  if (status.value === 'success') {
    await userStore.refreshTenantInfo()
    
    // 获取订单详情
    try {
      const oaAPI = require('@/utils/oa').default
      const res: any = await oaAPI.getRenewalOrders(userStore.tenantInfo?._id)
      if (res.code === 0) {
        const order = (res.data || []).find((o: any) => o.order_no === orderNo.value)
        if (order) {
          duration.value = order.duration_months
        }
      }
    } catch (e) {
      console.error('获取订单详情失败:', e)
    }
  }
})

const goBack = () => {
  // 返回上一页或工作台
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/merchant/dashboard' })
  }
}

const retryPayment = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.result-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.result-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  width: 100%;
  text-align: center;

  .icon-area {
    margin-bottom: 32rpx;
  }

  .title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 48rpx;
  }

  .success-info, .fail-info {
    margin-bottom: 48rpx;

    .info-row {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16rpx;

      .label {
        font-size: 28rpx;
        color: #666;
      }

      .value {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
    }

    .info-text {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }

    .order-tip {
      font-size: 24rpx;
      color: #999;
    }
  }

  .actions {
    u-button {
      width: 100%;
    }
  }
}
</style>
