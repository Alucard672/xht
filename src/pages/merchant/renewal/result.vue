<template>
  <view class="result-container">
    <view class="result-card">
      <view class="icon-area">
        <u-icon
          v-if="status === 'success'"
          name="checkmark-circle-fill"
          color="#07c160"
          size="160"
        ></u-icon>
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
          custom-style="height: 96rpx; border-radius: 48rpx; background-color: #2d7ff9; border: none;"
          @click="goBack"
        ></u-button>
        <u-button
          v-else
          type="primary"
          text="重新支付"
          custom-style="height: 96rpx; border-radius: 48rpx; background-color: #2d7ff9; border: none;"
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
  const pages = uni.getCurrentPages()
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
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.result-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f4ff 0%, #f7f8fa 50%, #f7f7f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $wh-spacing-xxl;
  position: relative;
  overflow: hidden;

  // 装饰性背景元素
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -15%;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(45, 127, 249, 0.08) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -10%;
    left: -15%;
    width: 350rpx;
    height: 350rpx;
    background: radial-gradient(circle, rgba(45, 127, 249, 0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
}

.result-card {
  @include card-modern;
  padding: $wh-spacing-3xl $wh-spacing-xxl;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
  @include slide-in-up;

  .icon-area {
    margin-bottom: $wh-spacing-xxl;
    animation: icon-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

    @keyframes icon-pop {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .u-icon {
      filter: drop-shadow(0 8rpx 24rpx rgba(7, 193, 96, 0.25));
    }
  }

  .title {
    @include text-heading;
    font-size: $wh-font-size-3xl !important;
    margin-bottom: $wh-spacing-3xl;
    letter-spacing: 0.5rpx;
    background: $wh-gradient-blue;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .success-info,
  .fail-info {
    margin-bottom: $wh-spacing-3xl;
    padding: $wh-spacing-xl;
    background: $wh-bg-color-tertiary;
    border-radius: $wh-border-radius-lg;

    .info-row {
      @include flex-center;
      margin-bottom: $wh-spacing-md;
      padding: $wh-spacing-sm 0;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: $wh-font-size-md;
        color: $wh-text-color-secondary;
        font-weight: $wh-font-weight-medium;
        margin-right: $wh-spacing-xs;
      }

      .value {
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-semibold;
      }
    }

    .info-text {
      font-size: $wh-font-size-md;
      color: $wh-text-color-secondary;
      margin-bottom: $wh-spacing-sm;
      font-weight: $wh-font-weight-medium;
    }

    .order-tip {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-light-gray;
      font-weight: $wh-font-weight-normal;
    }
  }

  .actions {
    ::v-deep .u-button {
      width: 100%;
      height: 100rpx;
      border-radius: $wh-border-radius-full !important;
      font-weight: $wh-font-weight-semibold !important;
      font-size: $wh-font-size-xl !important;
      box-shadow: $wh-shadow-colored !important;
      transition: all $wh-transition-normal !important;

      &:active {
        transform: scale(0.98) !important;
        box-shadow: $wh-shadow-md !important;
      }
    }
  }
}
</style>
