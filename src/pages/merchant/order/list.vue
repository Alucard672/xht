<template>
  <view class="order-list-container">
    <u-sticky bg-color="#fff">
      <u-tabs
        :list="tabList"
        :current="currentTab"
        active-color="#07c160"
        line-color="#07c160"
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
        <view v-for="order in orders" :key="order._id" class="order-card">
          <view class="card-header">
            <text class="order-no">单号: {{ order.order_no || order._id.slice(-8) }}</text>
            <text :class="['status-txt', 'status-' + order.status]">{{
              getStatusTxt(order.status)
            }}</text>
          </view>

          <view class="card-body">
            <view class="customer-info">
              <u-icon name="account" size="16" color="#999"></u-icon>
              <text class="name">{{ order.address?.name || '未知客户' }}</text>
              <text class="mobile">{{ order.address?.mobile || '' }}</text>
            </view>
            <view v-if="order.address?.fullAddress" class="address-info">
              <u-icon name="map" size="16" color="#999"></u-icon>
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
                >￥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
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
      active-color="#07c160"
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

let lastLoadTime = 0
onShow(() => {
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
.order-list-container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.list-content {
  padding: 20rpx;
}

.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #f5f5f5;
    padding-bottom: 16rpx;
    margin-bottom: 16rpx;

    .order-no {
      font-size: 26rpx;
      color: #999;
    }
    .status-txt {
      font-size: 26rpx;
      font-weight: bold;
      &.status-0 {
        color: #ff9900;
      }
      &.status-1 {
        color: #07c160;
      }
      &.status-2 {
        color: #999;
      }
      &.status--1 {
        color: #ff4d4f;
      }
    }
  }

  .card-body {
    .customer-info,
    .address-info {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 12rpx;
      .name {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
      }
      .mobile {
        font-size: 26rpx;
        color: #666;
      }
      .addr {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
      }
    }

    .items-summary {
      background-color: #f9f9f9;
      padding: 16rpx;
      border-radius: 8rpx;
      margin-top: 16rpx;
      .item-row {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 8rpx;
        &:last-child {
          margin-bottom: 0;
        }
      }
      .more {
        font-size: 24rpx;
        color: #999;
        text-align: center;
        margin-top: 8rpx;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f5f5f5;

    .pay-info {
      .method {
        font-size: 24rpx;
        color: #999;
        background-color: #f0f0f0;
        padding: 4rpx 12rpx;
        border-radius: 4rpx;
        margin-right: 12rpx;
      }
      .amount {
        font-size: 32rpx;
        font-weight: bold;
        color: #ff4d4f;
      }
    }

    .actions {
      display: flex;
      gap: 16rpx;
    }
  }
}

.loading-state,
.empty-state {
  padding-top: 200rpx;
}
</style>
