<template>
  <view class="order-detail-container">
    <view v-if="loading" class="loading-state">
      <u-loading-icon></u-loading-icon>
    </view>

    <template v-else-if="order">
      <!-- 订单状态 -->
      <view class="status-section" :class="getStatusClass(order.status)">
        <view class="status-icon">
          <u-icon :name="getStatusIcon(order.status)" size="48" color="#fff"></u-icon>
        </view>
        <view class="status-text">{{ getStatusText(order.status) }}</view>
        <view class="status-desc">{{ getStatusDesc(order.status) }}</view>
      </view>

      <!-- 客户信息 -->
      <view class="section-card">
        <view class="section-title">客户信息</view>
        <view class="customer-info">
          <view class="customer-avatar">
            <u-icon name="account" size="32" color="#07c160"></u-icon>
          </view>
          <view class="customer-details">
            <text class="customer-name">{{ order.customer_name || '未知客户' }}</text>
            <text class="customer-phone">{{ order.customer_phone || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section-card">
        <view class="section-title">商品清单 ({{ order.items?.length || 0 }}种)</view>
        <view class="goods-list">
          <view v-for="(item, index) in order.items" :key="index" class="goods-item">
            <image :src="item.img_url || '/static/logo.png'" mode="aspectFill" class="goods-img" />
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <text class="goods-spec">
                {{ item.count }}{{ item.unit_name }} × ¥{{ priceHelper.format(item.price) }}
              </text>
            </view>
            <view class="goods-right">
              <text class="goods-price">¥{{ priceHelper.format(item.price * item.count) }}</text>
            </view>
          </view>
        </view>
        <view class="total-row">
          <text class="label">订单金额</text>
          <text class="total-price"
            >¥{{ priceHelper.format(order.total_amount || order.total_fee) }}</text
          >
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="section-card">
        <view class="section-title">订单信息</view>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">订单号</text>
            <text class="info-value">{{ order.order_no || order._id }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">下单时间</text>
            <text class="info-value">{{ formatDate(order.created_at) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">支付方式</text>
            <text class="info-value">{{
              order.payment_method === 'credit' ? '赊账' : '在线支付'
            }}</text>
          </view>
          <view v-if="order.remark" class="info-item">
            <text class="info-label">备注</text>
            <text class="info-value">{{ order.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <template v-if="order.status === 0">
          <u-button type="error" text="取消订单" @click="cancelOrder"></u-button>
          <u-button type="primary" text="完成订单" @click="acceptOrder"></u-button>
        </template>
        <template v-else-if="order.status === 1">
          <u-button text="分享单据" @click="shareReceipt"></u-button>
        </template>
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
import { importObject } from '@/utils/cloud'

const orderCo = importObject('wh-order-co')

const orderId = ref('')
const order = ref<any>(null)
const loading = ref(true)

onLoad(options => {
  if (options?.id) {
    orderId.value = options.id
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
    1: '已完成',
    [-1]: '已取消'
  }
  return statusMap[status] || '未知'
}

const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'status-pending',
    1: 'status-completed',
    [-1]: 'status-cancelled'
  }
  return classMap[status] || ''
}

const getStatusIcon = (status: number) => {
  const iconMap: Record<number, string> = {
    0: 'clock',
    1: 'checkmark-circle',
    [-1]: 'close-circle'
  }
  return iconMap[status] || 'info-circle'
}

const getStatusDesc = (status: number) => {
  const descMap: Record<number, string> = {
    0: '请尽快处理订单',
    1: '订单已完成',
    [-1]: '订单已取消'
  }
  return descMap[status] || ''
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const acceptOrder = async () => {
  uni.showLoading({ title: '处理中...' })
  try {
    const res: any = await orderCo.updateOrderStatus({
      order_id: orderId.value,
      status: 1
    })
    if (res.code === 0) {
      order.value.status = 1
      uni.showToast({ title: '订单已完成', icon: 'success' })
    } else {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const cancelOrder = async () => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    success: async res => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        try {
          const result: any = await orderCo.updateOrderStatus({
            order_id: orderId.value,
            status: -1
          })
          if (result.code === 0) {
            order.value.status = -1
            uni.showToast({ title: '已取消', icon: 'success' })
          } else {
            uni.showToast({ title: result.msg || '操作失败', icon: 'none' })
          }
        } catch (e: any) {
          uni.showToast({ title: e.message || '操作失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

const shareReceipt = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.order-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 160rpx;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}

.status-section {
  padding: 60rpx 32rpx;
  text-align: center;

  &.status-pending {
    background: linear-gradient(180deg, #ff9900 0%, #fa8c16 100%);
  }

  &.status-processing {
    background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  }

  &.status-completed {
    background: linear-gradient(180deg, #07c160 0%, #06ad56 100%);
  }

  &.status-cancelled {
    background: linear-gradient(180deg, #999 0%, #777 100%);
  }

  .status-icon {
    margin-bottom: 16rpx;
  }

  .status-text {
    color: #fff;
    font-size: 40rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  .status-desc {
    color: rgba(255, 255, 255, 0.8);
    font-size: 26rpx;
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
}

.customer-info {
  display: flex;
  align-items: center;

  .customer-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
  }

  .customer-details {
    display: flex;
    flex-direction: column;

    .customer-name {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
    }

    .customer-phone {
      font-size: 26rpx;
      color: #999;
      margin-top: 4rpx;
    }
  }
}

.goods-list {
  .goods-item {
    display: flex;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .goods-img {
      width: 100rpx;
      height: 100rpx;
      border-radius: 12rpx;
      margin-right: 16rpx;
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

    .goods-right {
      .goods-price {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
      }
    }
  }
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;

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

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;

  .info-item {
    display: flex;
    flex-direction: column;

    .info-label {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .info-value {
      font-size: 26rpx;
      color: #333;
      word-break: break-all;
    }
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);

  button {
    flex: 1;
    border-radius: 60rpx;
  }
}
</style>
