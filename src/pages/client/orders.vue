<template>
  <view class="order-list-container">
    <view class="list-content">
      <view v-if="loading && orders.length === 0" class="loading-state">
        <u-loading-icon text="加载中..."></u-loading-icon>
      </view>

      <view v-else-if="orders.length === 0" class="empty-state">
        <u-empty mode="order" text="暂无订单"></u-empty>
      </view>

      <view v-else class="order-items">
        <view
          v-for="order in orders"
          :key="order._id"
          class="order-card"
          @click="toggleOrderExpand(order._id)"
        >
          <view class="card-header">
            <view class="header-left">
              <text class="order-no">单号: {{ order.order_no || order._id.slice(-8) }}</text>
              <text class="order-date">{{ formatDate(order.create_time) }}</text>
            </view>
            <view class="header-right">
              <text :class="['status-txt', 'status-' + order.status]">{{
                getStatusTxt(order.status)
              }}</text>
              <u-icon
                :name="expandedOrders.includes(order._id) ? 'arrow-up' : 'arrow-down'"
                size="16"
                color="#999"
              ></u-icon>
            </view>
          </view>

          <!-- Expanded content -->
          <view v-if="expandedOrders.includes(order._id)" class="card-body">
            <view class="items-list">
              <view v-for="(item, idx) in order.items" :key="idx" class="item-row">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-qty">x{{ item.count }}{{ item.unit_name }}</text>
                <text class="item-price">¥{{ priceHelper.format(item.price * item.count) }}</text>
              </view>
            </view>
          </view>

          <view class="card-footer">
            <view class="pay-info">
              <text class="method">{{
                order.payment_method === 'credit' ? '赊账结算' : '现结'
              }}</text>
              <view class="total">
                <text class="label">合计:</text>
                <text class="amount"
                  >¥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
                >
              </view>
            </view>
            <view
              v-if="expandedOrders.includes(order._id)"
              class="reorder-btn"
              @click.stop="reorder(order)"
            >
              <u-icon name="reload" size="14" color="#2d7ff9"></u-icon>
              <text>再次下单</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const orderCo = importObject('wh-order-co')

const orders = ref<any[]>([])
const loading = ref(false)
const expandedOrders = ref<string[]>([])

onShow(() => {
  fetchOrders()
})

const fetchOrders = async () => {
  loading.value = true
  try {
    // 这里的 getOrderList 在云端会根据 openid 过滤出当前用户的订单 (如果是 C 端逻辑)
    // 或者目前为了演示，获取全部
    const res: any = await orderCo.getOrderList({})
    if (res.status === 0) {
      orders.value = res.data
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getStatusTxt = (status: number) => {
  switch (status) {
    case 0:
      return '待接单'
    case 1:
      return '加工/配送中'
    case 2:
      return '已完成'
    case -1:
      return '已取消'
    default:
      return '未知'
  }
}

const toggleOrderExpand = (orderId: string) => {
  const index = expandedOrders.value.indexOf(orderId)
  if (index > -1) {
    expandedOrders.value.splice(index, 1)
  } else {
    expandedOrders.value.push(orderId)
  }
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const reorder = (order: any) => {
  // For MVP, just show a toast
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.order-list-container {
  @include page-container-with-top($wh-spacing-md);
}

.order-card {
  @include card-modern;
  padding: $wh-spacing-xl;
  margin-bottom: $wh-spacing-md;
  position: relative;
  overflow: hidden;
  @include slide-in-up;
  transition: all $wh-transition-normal;

  // 左侧装饰条
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $wh-gradient-blue-vertical;
    opacity: 0;
    transition: opacity $wh-transition-normal;
  }

  &:active {
    transform: scale(0.98);

    &::before {
      opacity: 1;
    }
  }

  .card-header {
    @include flex-between;
    align-items: center;
    border-bottom: 2rpx solid $wh-border-color-light;
    padding-bottom: $wh-spacing-md;
    margin-bottom: $wh-spacing-md;

    .header-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: $wh-spacing-xs;

      .order-no {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-semibold;
      }

      .order-date {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        font-weight: $wh-font-weight-medium;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: $wh-spacing-sm;
    }

    .status-txt {
      font-size: $wh-font-size-sm;
      font-weight: $wh-font-weight-semibold;
      padding: 6rpx $wh-spacing-md;
      border-radius: $wh-border-radius-full;

      &.status-0 {
        background: linear-gradient(
          135deg,
          rgba(255, 149, 0, 0.12) 0%,
          rgba(255, 149, 0, 0.08) 100%
        );
        color: $wh-color-warning;
      }
      &.status-1 {
        background: linear-gradient(
          135deg,
          rgba(45, 127, 249, 0.12) 0%,
          rgba(45, 127, 249, 0.08) 100%
        );
        color: $wh-color-blue;
      }
      &.status-2 {
        background: linear-gradient(135deg, rgba(7, 193, 96, 0.12) 0%, rgba(7, 193, 96, 0.08) 100%);
        color: $wh-color-success-modern;
      }
      &.status--1 {
        background: linear-gradient(
          135deg,
          rgba(255, 77, 79, 0.12) 0%,
          rgba(255, 77, 79, 0.08) 100%
        );
        color: $wh-color-danger-modern;
      }
    }
  }

  .card-body {
    .items-list {
      .item-row {
        @include flex-between;
        align-items: center;
        margin-bottom: $wh-spacing-sm;
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        .item-name {
          flex: 1;
          margin-right: $wh-spacing-md;
          font-weight: $wh-font-weight-medium;
        }
        .item-qty {
          color: $wh-text-color-secondary;
          margin-right: $wh-spacing-xxl;
          font-weight: $wh-font-weight-normal;
        }
        .item-price {
          font-weight: $wh-font-weight-semibold;
        }
      }
    }
  }

  .card-footer {
    border-top: 2rpx solid $wh-border-color-light;
    margin-top: $wh-spacing-md;
    padding-top: $wh-spacing-md;

    .pay-info {
      @include flex-between;
      align-items: center;
      .method {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-secondary;
        font-weight: $wh-font-weight-medium;
        padding: 6rpx $wh-spacing-sm;
        background: $wh-bg-color-tertiary;
        border-radius: $wh-border-radius-md;
      }
      .total {
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        .label {
          font-size: $wh-font-size-sm;
          color: $wh-text-color-secondary;
          margin-right: $wh-spacing-xs;
          font-weight: $wh-font-weight-medium;
        }
        .amount {
          @include price-text-small;
        }
      }
    }

    .reorder-btn {
      display: flex;
      align-items: center;
      gap: $wh-spacing-xs;
      margin-top: $wh-spacing-md;
      padding: $wh-spacing-sm $wh-spacing-lg;
      background: $wh-color-blue-light-bg;
      border-radius: $wh-border-radius-full;
      color: $wh-color-blue;
      font-size: $wh-font-size-sm;
      font-weight: $wh-font-weight-semibold;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.95);
        background: rgba(45, 127, 249, 0.15);
      }

      text {
        font-weight: $wh-font-weight-semibold;
      }
    }
  }
}

.loading-state,
.empty-state {
  @include flex-center;
  padding-top: $wh-spacing-3xl;
}
</style>
