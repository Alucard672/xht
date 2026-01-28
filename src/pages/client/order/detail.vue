<template>
  <view class="order-detail-container">
    <view v-if="loading" class="loading-state">
      <u-loading-icon></u-loading-icon>
    </view>

    <template v-else-if="order">
      <!-- 订单状态 -->
      <view class="status-section">
        <view class="status-badge" :class="getStatusClass(order.status)">
          {{ getStatusText(order.status) }}
        </view>
        <view class="order-no">订单号: {{ order.order_no || order._id }}</view>
      </view>

      <!-- 收货信息 -->
      <view class="section-card">
        <view class="section-title">收货信息</view>
        <view class="info-row">
          <text class="label">收货人</text>
          <text class="value">{{ order.contact_name || '未填写' }}</text>
        </view>
        <view class="info-row">
          <text class="label">联系电话</text>
          <text class="value">{{ order.contact_phone || '未填写' }}</text>
        </view>
        <view class="info-row">
          <text class="label">收货地址</text>
          <text class="value">{{ order.address || '未填写' }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section-card">
        <view class="section-title">商品清单</view>
        <view class="goods-list">
          <view v-for="(item, index) in order.items" :key="index" class="goods-item">
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <text class="goods-spec">
                {{ item.count }}{{ item.unit_name }} × ¥{{ priceHelper.format(item.price) }}
              </text>
            </view>
            <text class="goods-price">¥{{ priceHelper.format(item.price * item.count) }}</text>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="section-card">
        <view class="section-title">订单信息</view>
        <view class="info-row">
          <text class="label">下单时间</text>
          <text class="value">{{ formatDate(order.created_at) }}</text>
        </view>
        <view class="info-row">
          <text class="label">支付方式</text>
          <text class="value">{{ order.payment_method === 'credit' ? '赊账' : '在线支付' }}</text>
        </view>
        <view class="info-row total-row">
          <text class="label">订单金额</text>
          <text class="total-price"
            >¥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
          >
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="order.status === 2" class="action-bar">
        <u-button text="再次购买" @click="reorder"></u-button>
      </view>
    </template>

    <view v-else class="empty-state">
      <u-empty text="订单不存在"></u-empty>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'

const orderId = ref('')
const order = ref<any>(null)
const loading = ref(true)

onLoad(options => {
  if (options?.id || options?.order_id) {
    orderId.value = options.id || options.order_id
    fetchOrderDetail()
  }
})

const fetchOrderDetail = async () => {
  loading.value = true
  try {
    const db = uniCloud.database()
    const res: any = await db.collection('wh_orders').doc(orderId.value).get()
    if (res.result.data && res.result.data.length > 0) {
      order.value = res.result.data[0]
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待接单',
    1: '待发货',
    2: '已完成',
    [-1]: '已取消'
  }
  return statusMap[status] || '未知'
}

const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'status-pending',
    1: 'status-processing',
    2: 'status-completed',
    [-1]: 'status-cancelled'
  }
  return classMap[status] || ''
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const reorder = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.order-detail-container {
  @include page-container-with-top;
  padding-bottom: 180rpx;
}

.loading-state,
.empty-state {
  @include flex-center;
  padding-top: $wh-spacing-3xl;
}

.status-section {
  @include card-modern;
  padding: $wh-spacing-3xl $wh-spacing-xxl;
  text-align: center;
  margin-bottom: $wh-spacing-lg;
  position: relative;
  overflow: hidden;

  // 根据状态添加渐变背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.05;
    background-image: radial-gradient(
      circle at 30% 50%,
      rgba(45, 127, 249, 0.3) 0%,
      transparent 50%
    );
    pointer-events: none;
  }

  .status-badge {
    display: inline-block;
    padding: $wh-spacing-sm $wh-spacing-2xl;
    border-radius: $wh-border-radius-full;
    @include text-subheading;
    font-weight: $wh-font-weight-semibold;
    margin-bottom: $wh-spacing-md;
    position: relative;
    z-index: 1;

    &.status-pending {
      background: linear-gradient(135deg, rgba(255, 149, 0, 0.12) 0%, rgba(255, 149, 0, 0.08) 100%);
      color: $wh-color-warning;
      border: 2rpx solid rgba(255, 149, 0, 0.2);
    }

    &.status-processing {
      background: linear-gradient(
        135deg,
        rgba(45, 127, 249, 0.12) 0%,
        rgba(45, 127, 249, 0.08) 100%
      );
      color: $wh-color-blue;
      border: 2rpx solid rgba(45, 127, 249, 0.2);
    }

    &.status-completed {
      background: linear-gradient(135deg, rgba(7, 193, 96, 0.12) 0%, rgba(7, 193, 96, 0.08) 100%);
      color: $wh-color-success-modern;
      border: 2rpx solid rgba(7, 193, 96, 0.2);
    }

    &.status-cancelled {
      background: $wh-bg-color-tertiary;
      color: $wh-text-color-light-gray;
      border: 2rpx solid $wh-border-color-light;
    }
  }

  .order-no {
    font-size: $wh-font-size-sm;
    color: $wh-text-color-light-gray;
    font-weight: $wh-font-weight-medium;
    position: relative;
    z-index: 1;
  }
}

.section-card {
  @include card-modern;
  margin: 0 $wh-spacing-lg $wh-spacing-lg;
  padding: $wh-spacing-xl;
  @include slide-in-up;

  .section-title {
    @include text-heading;
    margin-bottom: $wh-spacing-lg;
    padding-bottom: $wh-spacing-md;
    border-bottom: 2rpx solid $wh-border-color-lighter;
    letter-spacing: 0.3rpx;
  }

  .info-row {
    @include flex-between;
    align-items: flex-start;
    padding: $wh-spacing-sm 0;

    .label {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-secondary;
      flex-shrink: 0;
      font-weight: $wh-font-weight-medium;
    }

    .value {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-dark;
      text-align: right;
      margin-left: $wh-spacing-md;
      font-weight: $wh-font-weight-medium;
    }

    &.total-row {
      border-top: 2rpx solid $wh-border-color-lighter;
      margin-top: $wh-spacing-md;
      padding-top: $wh-spacing-lg;

      .label {
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-semibold;
      }

      .total-price {
        @include price-text-medium;
      }
    }
  }
}

.goods-list {
  .goods-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $wh-spacing-md 0;
    border-bottom: 2rpx solid $wh-border-color-lighter;
    transition: all $wh-transition-normal;

    &:last-child {
      border-bottom: none;
    }

    .goods-info {
      flex: 1;

      .goods-name {
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        display: block;
        font-weight: $wh-font-weight-medium;
        margin-bottom: $wh-spacing-xs;
      }

      .goods-spec {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        display: block;
        font-weight: $wh-font-weight-normal;
      }
    }

    .goods-price {
      font-size: $wh-font-size-md;
      color: $wh-text-color-dark;
      font-weight: $wh-font-weight-semibold;
    }
  }
}

.action-bar {
  @include bottom-bar;
  padding: $wh-spacing-xl $wh-spacing-xl calc($wh-spacing-xl + env(safe-area-inset-bottom));

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
</style>
