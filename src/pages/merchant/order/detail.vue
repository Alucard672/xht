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

    <!-- 隐藏的Canvas用于绘制小票 -->
    <canvas
      id="orderReceiptCanvas"
      canvas-id="orderReceiptCanvas"
      class="hidden-canvas"
      style="width: 750px; height: 1200px; position: fixed; left: -9999px; top: -9999px"
    ></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'
import { generateOrderReceipt } from '@/utils/order-receipt'
import { merchantRouteGuard } from '@/utils/routeGuard'

const orderCo = importObject('wh-order-co')

const orderId = ref('')
const order = ref<any>(null)
const tenantInfo = ref<any>(null)
const loading = ref(true)

onLoad(options => {
  if (options?.id) {
    orderId.value = options.id
    fetchOrderDetail()
  }
})

onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/order/detail')) return
})

const fetchOrderDetail = async () => {
  loading.value = true
  try {
    const db = uniCloud.database()
    const res: any = await db.collection('wh_orders').doc(orderId.value).get()
    if (res.result.data && res.result.data.length > 0) {
      order.value = res.result.data[0]

      // 获取店铺信息用于小票
      const merchantCo = importObject('wh-merchant-co')
      const tenantRes: any = await merchantCo.getTenantInfo()
      if (tenantRes.code === 0) {
        tenantInfo.value = tenantRes.data
      }
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

const shareReceipt = async () => {
  if (!order.value || !tenantInfo.value) {
    uni.showToast({ title: '数据加载中，请稍后', icon: 'none' })
    return
  }

  uni.showLoading({ title: '生成小票中...', mask: true })

  try {
    // 使用Canvas生成订单小票
    const receiptData = {
      order: {
        order_no: order.value.order_no,
        created_at: order.value.created_at,
        total_fee: order.value.total_fee || order.value.total_amount,
        total_amount: order.value.total_amount,
        payment_method: order.value.payment_method,
        remark: order.value.remark,
        items: order.value.items || [],
        customer_name: order.value.customer_name
      },
      tenant: {
        name: tenantInfo.value.name,
        phone: tenantInfo.value.phone,
        address: tenantInfo.value.address
      }
    }

    const imagePath = await generateOrderReceipt(receiptData, {
      canvasId: 'orderReceiptCanvas',
      canvasWidth: 750,
      canvasHeight: 1200
    })

    uni.hideLoading()

    // 预览并保存图片
    uni.previewImage({
      urls: [imagePath],
      current: 0,
      longPressActions: {
        itemList: ['保存图片', '发送给朋友'],
        success: data => {
          if (data.tapIndex === 0) {
            saveReceiptImage(imagePath)
          }
        }
      },
      fail: () => {
        // 如果预览失败，尝试直接保存
        saveReceiptImage(imagePath)
      }
    })
  } catch (e: any) {
    uni.hideLoading()
    console.error('生成小票失败:', e)
    uni.showModal({
      title: '生成失败',
      content: `生成小票失败: ${e.message || '未知错误'}\n请检查网络或联系技术支持`,
      showCancel: false
    })
  }
}

const saveReceiptImage = async (url: string) => {
  try {
    uni.showLoading({ title: '保存中...' })
    const [err, res] = await uni.downloadFile({ url })
    if (err || res.statusCode !== 200) {
      throw new Error('下载失败')
    }

    await uni.saveImageToPhotosAlbum({
      filePath: res.tempFilePath
    })

    uni.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.order-detail-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
  padding-bottom: 180rpx;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}

.status-section {
  padding: $wh-spacing-3xl $wh-spacing-xl;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
  }

  &.status-pending {
    background: linear-gradient(135deg, $wh-color-warning-modern 0%, #fa8c16 100%);
  }

  &.status-processing {
    background: $wh-gradient-blue;
  }

  &.status-completed {
    background: linear-gradient(135deg, $wh-color-success-modern 0%, #06ad56 100%);
  }

  &.status-cancelled {
    background: linear-gradient(135deg, $wh-text-color-gray 0%, #777 100%);
  }

  .status-icon {
    margin-bottom: $wh-spacing-md;
    position: relative;
    z-index: 1;
  }

  .status-text {
    color: $wh-text-color-inverse;
    font-size: $wh-font-size-2xl;
    font-weight: $wh-font-weight-extrabold;
    margin-bottom: $wh-spacing-sm;
    letter-spacing: 1rpx;
    position: relative;
    z-index: 1;
  }

  .status-desc {
    color: rgba(255, 255, 255, 0.9);
    font-size: $wh-font-size-md;
    font-weight: $wh-font-weight-medium;
    letter-spacing: 0.5rpx;
    position: relative;
    z-index: 1;
  }
}

.section-card {
  @include section-base;
  margin: $wh-spacing-md $wh-spacing-lg 0;
  padding: $wh-spacing-xl;

  .section-title {
    @include text-subheading;
    margin-bottom: $wh-spacing-lg;
    padding-bottom: $wh-spacing-md;
    border-bottom: 1rpx solid $wh-border-color-light;
    letter-spacing: 0.3rpx;
  }
}

.customer-info {
  display: flex;
  align-items: center;

  .customer-avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: $wh-border-radius-circle;
    background: $wh-gradient-customer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: $wh-spacing-md;
    border: 2rpx solid rgba(45, 127, 249, 0.1);
  }

  .customer-details {
    display: flex;
    flex-direction: column;

    .customer-name {
      font-size: $wh-font-size-lg;
      color: $wh-text-color-dark;
      font-weight: $wh-font-weight-semibold;
      letter-spacing: 0.3rpx;
    }

    .customer-phone {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-gray;
      margin-top: $wh-spacing-xs;
      font-weight: $wh-font-weight-medium;
    }
  }
}

.goods-list {
  .goods-item {
    display: flex;
    align-items: center;
    padding: $wh-spacing-md 0;
    border-bottom: 1rpx solid $wh-border-color-light;

    &:last-child {
      border-bottom: none;
    }

    .goods-img {
      width: 120rpx;
      height: 120rpx;
      border-radius: $wh-border-radius-md;
      margin-right: $wh-spacing-md;
      border: 1rpx solid $wh-border-color-light;
    }

    .goods-info {
      flex: 1;

      .goods-name {
        font-size: $wh-font-size-lg;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-semibold;
        display: block;
        margin-bottom: $wh-spacing-xs;
      }

      .goods-spec {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-gray;
        display: block;
        font-weight: $wh-font-weight-medium;
      }
    }

    .goods-right {
      .goods-price {
        @include price-text-small;
      }
    }
  }
}

.total-row {
  @include flex-between;
  margin-top: $wh-spacing-md;
  padding-top: $wh-spacing-md;
  border-top: 2rpx solid $wh-border-color-light;
  gap: $wh-spacing-sm;

  .label {
    font-size: $wh-font-size-lg;
    color: $wh-text-color-dark;
    font-weight: $wh-font-weight-semibold;
  }

  .total-price {
    @include price-text-medium;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $wh-spacing-md;

  .info-item {
    display: flex;
    flex-direction: column;

    .info-label {
      font-size: $wh-font-size-xs;
      color: $wh-text-color-light-gray;
      margin-bottom: $wh-spacing-xs;
      font-weight: $wh-font-weight-medium;
      text-transform: uppercase;
      letter-spacing: 0.5rpx;
    }

    .info-value {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-dark;
      word-break: break-all;
      font-weight: $wh-font-weight-medium;
      line-height: $wh-line-height-relaxed;
    }
  }
}

.action-bar {
  @include bottom-bar;
  display: flex;
  gap: $wh-spacing-md;
  padding: $wh-spacing-lg $wh-spacing-xl;
  padding-bottom: calc($wh-spacing-lg + env(safe-area-inset-bottom));

  button {
    flex: 1;
    border-radius: $wh-border-radius-full;
    font-weight: $wh-font-weight-semibold;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
