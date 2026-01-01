<template>
  <view class="checkout-container">
    <view class="section">
      <text class="section-title">商品明细</text>
      <view v-for="item in cartItems" :key="item._id" class="item">
        <text class="name">{{ item.name }}</text>
        <text class="qty">x{{ item.countSmall }} {{ item.unitSmallName }}</text>
        <text class="price">￥{{ priceHelper.format(item.priceSmall * item.countSmall) }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">支付方式</text>
      <u-radio-group v-model="paymentMethod" placement="column">
        <u-radio label="赊账 (记账)" name="credit"></u-radio>
        <u-radio label="微信支付" name="wechat" disabled></u-radio>
      </u-radio-group>
    </view>

    <view class="footer">
      <view class="total">合计: ￥{{ priceHelper.format(totalFee) }}</view>
      <u-button type="error" text="提交订单" :loading="loading" @click="submitOrder"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'

const tenant_id = ref('')
const cartItems = ref([])
const totalFee = ref(0)
const paymentMethod = ref('credit')
const loading = ref(false)

onLoad((options) => {
  tenant_id.value = options.tenant_id
  const cartData = uni.getStorageSync('current_cart')
  if (cartData) {
    cartItems.value = JSON.parse(cartData)
    totalFee.value = cartItems.value.reduce((total, item) => total + (item.priceSmall * item.countSmall), 0)
  }
})

const submitOrder = async () => {
  if (cartItems.value.length === 0) return
  
  loading.value = true
  const db = uniCloud.database()
  
  try {
    const orderData = {
      tenant_id: tenant_id.value,
      customer_id: 'temp_customer_id', // 实际应关联当前登录客户ID
      order_no: 'ORD' + Date.now() + Math.floor(Math.random() * 1000),
      status: 0,
      payment_method: paymentMethod.value,
      items: cartItems.value.map(item => ({
        goods_id: item._id,
        name: item.name,
        price: item.priceSmall,
        count: item.countSmall,
        unit: item.unitSmallName
      })),
      total_fee: totalFee.value
    }

    const res = await db.collection('wh_orders').add(orderData)
    
    if (res.result.id) {
      uni.showToast({ title: '下单成功' })
      uni.removeStorageSync('current_cart')
      setTimeout(() => {
        uni.reLaunch({ url: `/pages/client/shop?tenant_id=${tenant_id.value}` })
      }, 1500)
    }
  } catch (e) {
    uni.showToast({ title: '下单失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.checkout-container {
  padding: 30rpx;
  .section {
    background-color: #fff;
    padding: 30rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    .section-title {
      font-size: 30rpx;
      font-weight: bold;
      margin-bottom: 20rpx;
      display: block;
    }
    .item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15rpx;
      font-size: 28rpx;
      .qty { color: #999; }
      .price { color: #333; }
    }
  }
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #fff;
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
    .total {
      font-size: 36rpx;
      color: #ff4d4f;
      font-weight: bold;
    }
  }
}
</style>

