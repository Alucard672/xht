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
      <view class="action-bar" v-if="order.status === 2">
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
.order-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}

.status-section {
  background-color: #fff;
  padding: 40rpx 32rpx;
  text-align: center;
  border-bottom: 1rpx solid #f5f5f5;

  .status-badge {
    display: inline-block;
    padding: 12rpx 40rpx;
    border-radius: 40rpx;
    font-size: 30rpx;
    font-weight: bold;
    margin-bottom: 16rpx;

    &.status-pending {
      background-color: #fff7e6;
      color: #d48806;
    }

    &.status-processing {
      background-color: #e6f7ff;
      color: #1890ff;
    }

    &.status-completed {
      background-color: #f6ffed;
      color: #52c41a;
    }

    &.status-cancelled {
      background-color: #f5f5f5;
      color: #999;
    }
  }

  .order-no {
    font-size: 24rpx;
    color: #999;
  }
}

.section-card {
  background-color: #fff;
  margin: 24rpx 32rpx 0;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12rpx 0;

    .label {
      font-size: 26rpx;
      color: #999;
      flex-shrink: 0;
    }

    .value {
      font-size: 26rpx;
      color: #333;
      text-align: right;
      margin-left: 20rpx;
    }

    &.total-row {
      border-top: 1rpx solid #f5f5f5;
      margin-top: 16rpx;
      padding-top: 20rpx;

      .label {
        font-size: 28rpx;
        color: #333;
      }

      .total-price {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff4d4f;
      }
    }
  }
}

.goods-list {
  .goods-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .goods-info {
      flex: 1;

      .goods-name {
        font-size: 28rpx;
        color: #333;
        display: block;
      }

      .goods-spec {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
        display: block;
      }
    }

    .goods-price {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);

  button {
    border-radius: 60rpx;
  }
}
</style>
