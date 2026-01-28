<template>
  <view class="order-list-container">
    <u-sticky bg-color="#f7f8fa">
      <u-tabs
        :list="tabList"
        :current="currentTab"
        active-color="#2d7ff9"
        line-color="#2d7ff9"
        @change="handleTabChange"
      ></u-tabs>
    </u-sticky>

    <view class="list-content">
      <view v-if="loading && orders.length === 0" class="loading-state">
        <u-loading-icon text="加载中..."></u-loading-icon>
      </view>

      <view v-else-if="orders.length === 0" class="empty-state">
        <u-empty mode="order" icon="/static/empty/order.png" text="暂无订单"></u-empty>
      </view>

      <view v-else class="order-items">
        <view
          v-for="order in orders"
          :key="order._id"
          class="order-card"
          :class="{ 'order-card-hover': isHovering }"
          @touchstart="isHovering = true"
          @touchend="isHovering = false"
          @touchcancel="isHovering = false"
        >
          <view class="card-header">
            <text class="order-no">单号: {{ order.order_no || order._id.slice(-8) }}</text>
            <view :class="['status-badge', 'status-' + order.status]">
              <text class="status-txt">{{ getStatusTxt(order.status) }}</text>
            </view>
          </view>

          <view class="card-body">
            <view class="customer-info">
              <view class="icon-wrap">
                <u-icon name="account" size="18" color="#2d7ff9"></u-icon>
              </view>
              <text class="name">{{ order.address?.name || '未知客户' }}</text>
              <text class="mobile">{{ order.address?.mobile || '' }}</text>
            </view>
            <view v-if="order.address?.fullAddress" class="address-info">
              <view class="icon-wrap">
                <u-icon name="map" size="18" color="#ff9500"></u-icon>
              </view>
              <text class="addr">{{ order.address.fullAddress }}</text>
            </view>

            <view class="items-summary">
              <view v-for="(item, idx) in order.items.slice(0, 3)" :key="idx" class="item-row">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-qty">x{{ item.count }}{{ item.unit_name }}</text>
              </view>
              <view v-if="order.items.length > 3" class="more"
                >等 {{ order.items.length }} 件商品...</view
              >
            </view>
          </view>

          <view class="card-footer">
            <view class="pay-info">
              <text class="method">{{ order.payment_method === 'credit' ? '赊账' : '现结' }}</text>
              <text class="amount"
                >¥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
              >
            </view>

            <view class="actions">
              <u-button
                v-if="order.status === 0"
                type="primary"
                size="small"
                text="确认接单"
                @click="updateStatus(order, 1)"
              ></u-button>
              <u-button
                v-if="order.status === 1"
                type="success"
                size="small"
                text="确认送达"
                @click="updateStatus(order, 2)"
              ></u-button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="1"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#2d7ff9"
      @change="handleModuleChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'

const orderCo = importObject('wh-order-co')

const tabList = [
  { name: '全部', value: undefined },
  { name: '待接单', value: 0 },
  { name: '加工/配送', value: 1 },
  { name: '已完成', value: 2 },
  { name: '已取消', value: -1 }
]

const currentTab = ref(0)
const orders = ref<any[]>([])
const loading = ref(false)
const isHovering = ref(false)

let lastLoadTime = 0
onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/order/list')) {
    return
  }
  fetchOrders()
})

const handleTabChange = (item: any) => {
  currentTab.value = tabList.findIndex(i => i.value === item.value)
  fetchOrders(true)
}

const fetchOrders = async (force = false) => {
  const now = Date.now()
  if (!force && lastLoadTime && now - lastLoadTime < 300000) {
    return
  }
  loading.value = true
  try {
    const status = tabList[currentTab.value].value
    const res: any = await orderCo.getOrderList({ status })
    if (res.status === 0) {
      orders.value = res.data
      lastLoadTime = now
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const updateStatus = async (order: any, newStatus: number) => {
  const actionText = newStatus === 1 ? '确认接单？' : '确认送达并完成订单？'
  uni.showModal({
    title: '提示',
    content: actionText,
    success: async res => {
      if (res.confirm) {
        try {
          let callRes: any
          if (newStatus === 1) {
            callRes = await orderCo.confirmOrder(order._id)
          } else if (newStatus === 2) {
            callRes = await orderCo.completeOrder(order._id)
          }

          if (callRes.status === 0) {
            uni.showToast({ title: '操作成功', icon: 'success' })
            fetchOrders(true)
          } else {
            uni.showToast({ title: callRes.message || '操作失败', icon: 'none' })
          }
        } catch (e: any) {
          uni.showToast({ title: e.message || '操作异常', icon: 'none' })
        }
      }
    }
  })
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

const handleModuleChange = (index: number) => {
  const paths = [
    '/pages/merchant/dashboard',
    '/pages/merchant/order/list',
    '/pages/merchant/goods/list',
    '/pages/merchant/customer/list'
  ]
  uni.switchTab({ url: paths[index] })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.order-list-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
}

.list-content {
  padding: $wh-spacing-md;
}

.order-card {
  @include card-modern;
  @include card-side-decoration(4rpx, $wh-gradient-blue-vertical);
  margin-bottom: $wh-spacing-md;
  padding: $wh-spacing-xl;
  transition: all $wh-transition-normal cubic-bezier(0.4, 0, 0.2, 1);

  &.order-card-hover {
    transform: scale(0.98);
    box-shadow: $wh-shadow-md;
    border-color: rgba(45, 127, 249, 0.3);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid $wh-border-color-light;
    padding-bottom: $wh-spacing-md;
    margin-bottom: $wh-spacing-md;

    .order-no {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-light-gray;
      font-weight: $wh-font-weight-medium;
      letter-spacing: 0.3rpx;
    }

    .status-badge {
      padding: 6rpx $wh-spacing-sm;
      border-radius: $wh-border-radius-full;
      transition: all $wh-transition-normal;

      .status-txt {
        font-size: $wh-font-size-sm;
        font-weight: $wh-font-weight-semibold;
        letter-spacing: 0.5rpx;
      }

      &.status-0 {
        background: linear-gradient(
          135deg,
          rgba(255, 149, 0, 0.12) 0%,
          rgba(255, 149, 0, 0.08) 100%
        );

        .status-txt {
          color: $wh-color-warning-modern;
        }
      }

      &.status-1 {
        background: linear-gradient(
          135deg,
          rgba(52, 199, 89, 0.12) 0%,
          rgba(52, 199, 89, 0.08) 100%
        );

        .status-txt {
          color: $wh-color-success-modern;
        }
      }

      &.status-2 {
        background: linear-gradient(
          135deg,
          rgba(110, 110, 115, 0.08) 0%,
          rgba(110, 110, 115, 0.05) 100%
        );

        .status-txt {
          color: $wh-text-color-gray;
        }
      }

      &.status--1 {
        background: linear-gradient(
          135deg,
          rgba(255, 59, 48, 0.12) 0%,
          rgba(255, 59, 48, 0.08) 100%
        );

        .status-txt {
          color: $wh-color-danger-modern;
        }
      }
    }
  }

  .card-body {
    .customer-info,
    .address-info {
      display: flex;
      align-items: center;
      gap: $wh-spacing-sm;
      margin-bottom: $wh-spacing-sm;

      .icon-wrap {
        width: 36rpx;
        height: 36rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $wh-color-blue-light-bg;
        border-radius: $wh-border-radius-full;
      }

      .name {
        font-size: $wh-font-size-lg;
        font-weight: $wh-font-weight-semibold;
        color: $wh-text-color-dark;
        letter-spacing: 0.3rpx;
      }

      .mobile {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-gray;
        margin-left: $wh-spacing-xs;
      }

      .addr {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-gray;
        line-height: $wh-line-height-relaxed;
        flex: 1;
      }
    }

    .items-summary {
      background: linear-gradient(135deg, $wh-bg-color-secondary 0%, $wh-color-blue-light 100%);
      padding: $wh-spacing-md;
      border-radius: $wh-border-radius-md;
      margin-top: $wh-spacing-md;
      border: 1rpx solid rgba(45, 127, 249, 0.08);

      .item-row {
        display: flex;
        justify-content: space-between;
        font-size: $wh-font-size-sm;
        color: $wh-text-color-secondary;
        margin-bottom: $wh-spacing-xs;
        font-weight: $wh-font-weight-medium;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .more {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        text-align: center;
        margin-top: $wh-spacing-sm;
        font-weight: $wh-font-weight-medium;
        letter-spacing: 0.5rpx;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $wh-spacing-md;
    padding-top: $wh-spacing-md;
    border-top: 1rpx solid $wh-border-color-light;

    .pay-info {
      display: flex;
      align-items: baseline;
      gap: $wh-spacing-sm;

      .method {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-gray;
        background: $wh-bg-color-tertiary;
        padding: 4rpx $wh-spacing-sm;
        border-radius: $wh-border-radius-xs;
        font-weight: $wh-font-weight-semibold;
        letter-spacing: 0.5rpx;
      }

      .amount {
        @include price-text-small;
      }
    }

    .actions {
      display: flex;
      gap: $wh-spacing-sm;

      ::v-deep .u-button {
        border-radius: $wh-border-radius-full !important;
        font-weight: $wh-font-weight-semibold !important;
        transition: all $wh-transition-normal !important;

        &:active {
          transform: scale(0.95) !important;
        }
      }
    }
  }
}

.loading-state,
.empty-state {
  padding-top: 200rpx;
}
</style>
