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
        <view v-for="order in orders" :key="order._id" class="order-card">
          <view class="card-header">
            <text class="order-no">单号: {{ order.order_no || order._id.slice(-8) }}</text>
            <text :class="['status-txt', 'status-' + order.status]">{{
              getStatusTxt(order.status)
            }}</text>
          </view>

          <view class="card-body">
            <view class="items-list">
              <view v-for="(item, idx) in order.items" :key="idx" class="item-row">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-qty">x{{ item.count }}{{ item.unit_name }}</text>
                <text class="item-price">￥{{ priceHelper.format(item.price * item.count) }}</text>
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
                  >￥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
                >
              </view>
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
</script>

<style lang="scss" scoped>
.order-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #f5f5f5;
    padding-bottom: 16rpx;
    margin-bottom: 16rpx;

    .order-no {
      font-size: 24rpx;
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
    .items-list {
      .item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12rpx;
        font-size: 28rpx;
        color: #333;
        .item-name {
          flex: 1;
          margin-right: 20rpx;
        }
        .item-qty {
          color: #999;
          margin-right: 40rpx;
        }
        .item-price {
          font-weight: 500;
        }
      }
    }
  }

  .card-footer {
    border-top: 1rpx solid #f5f5f5;
    margin-top: 20rpx;
    padding-top: 16rpx;
    .pay-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .method {
        font-size: 24rpx;
        color: #999;
      }
      .total {
        display: flex;
        align-items: baseline;
        .label {
          font-size: 24rpx;
          color: #666;
          margin-right: 8rpx;
        }
        .amount {
          font-size: 32rpx;
          font-weight: bold;
          color: #ff4d4f;
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
