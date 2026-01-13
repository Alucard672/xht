<template>
  <view class="checkout-container">
    <view v-if="mode !== 'agent'" class="section address-section" @click="selectAddress">
      <view v-if="address" class="address-info">
        <view class="top">
          <text class="name">{{ address.name }}</text>
          <text class="mobile">{{ address.mobile }}</text>
        </view>
        <view class="detail">{{ address.fullAddress }}</view>
      </view>
      <view v-else class="no-address">
        <u-icon name="map" size="24" color="#999"></u-icon>
        <text class="txt">选择收货地址</text>
      </view>
      <u-icon name="arrow-right" size="18" color="#ccc"></u-icon>
    </view>

    <!-- 商家代客下单：选择客户 -->
    <view v-if="mode === 'agent'" class="section customer-section" @click="selectCustomer">
      <view class="section-title">下单客户</view>
      <view v-if="selectedCustomer" class="customer-info">
        <view class="top">
          <text class="name">{{ selectedCustomer.alias }}</text>
          <text v-if="selectedCustomer.phone" class="mobile">{{ selectedCustomer.phone }}</text>
        </view>
      </view>
      <view v-else class="no-customer">
        <u-icon name="account" size="24" color="#2979ff"></u-icon>
        <text class="txt blue">点击选择下单客户</text>
      </view>
      <u-icon name="arrow-right" size="18" color="#ccc"></u-icon>
    </view>

    <view class="section items-section">
      <view class="section-title">订单明细</view>
      <view class="items-list">
        <view v-for="item in cartItems" :key="item._id" class="item">
          <image :src="item.img_url || '/static/logo.png'" class="item-img"></image>
          <view class="item-info">
            <view class="item-name">{{ item.name }}</view>
            <view class="item-spec">
              <text v-if="item.countBig">{{ item.countBig }}{{ item.unitBigName }} </text>
              <text v-if="item.countSmall">{{ item.countSmall }}{{ item.unitSmallName }}</text>
            </view>
            <view class="item-price">¥{{ priceHelper.format(getItemTotal(item)) }}</view>
          </view>
        </view>
      </view>
    </view>

    <view class="section payment-section">
      <view class="section-title">支付方式</view>
      <u-radio-group v-model="paymentMethod" placement="column">
        <u-radio label="现金/在线支付" name="cash" active-color="#07c160"></u-radio>
        <view class="radio-desc">货到付款或在线支付</view>
        <u-radio label="赊账结算" name="credit" active-color="#07c160"></u-radio>
        <view class="radio-desc">稍后通过账本结算 (适合老客户)</view>
      </u-radio-group>
    </view>

    <view class="section remark-section">
      <view class="section-title">订单备注</view>
      <u-textarea v-model="remark" placeholder="请填写收货要求、商品备注等" count></u-textarea>
    </view>

    <view class="footer-bar">
      <view class="left">
        <text class="label">合计:</text>
        <text class="symbol">¥</text>
        <text class="amount">{{ priceHelper.format(totalAmount) }}</text>
      </view>
      <u-button
        type="primary"
        text="提交订单"
        :loading="submitting"
        custom-style="width: 280rpx; height: 80rpx; border-radius: 40rpx;"
        @click="submitOrder"
      ></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const orderCo = importObject('wh-order-co')

const mode = ref('')
const selectedCustomer = ref<any>(null)

const tenant_id = ref('')
const cartItems = ref<any[]>([])
const address = ref<any>({
  name: '',
  mobile: '',
  fullAddress: ''
})
const paymentMethod = ref('cash')
const remark = ref('')
const submitting = ref(false)

onLoad((options: any) => {
  mode.value = options.mode || ''
  tenant_id.value = options.tenant_id || ''
  const cartData = uni.getStorageSync('current_cart')
  if (cartData) {
    cartItems.value = JSON.parse(cartData)
  } else {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

const totalAmount = computed(() => {
  return cartItems.value.reduce((total, item) => total + getItemTotal(item), 0)
})

const getItemTotal = (item: any) => {
  let sum = (item.priceSmall || 0) * (item.countSmall || 0)
  if (item.countBig && item.priceBig) {
    sum += item.priceBig * item.countBig
  }
  return sum
}

const selectAddress = () => {
  uni.showToast({ title: '演示环境，暂不支持修改地址', icon: 'none' })
}

const selectCustomer = () => {
  uni.navigateTo({ url: '/pages/merchant/customer/list?mode=picker' })
  uni.$once('select-customer', customer => {
    selectedCustomer.value = customer
  })
}

const submitOrder = async () => {
  if (submitting.value) return

  if (mode.value === 'agent' && !selectedCustomer.value) {
    uni.showToast({ title: '请先选择下单客户', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const items = cartItems.value
      .map(item => {
        const detailItems = []
        if (item.countBig > 0) {
          detailItems.push({
            goods_id: item._id,
            name: item.name,
            count: item.countBig,
            unit_name: item.unitBigName,
            price: item.priceBig
          })
        }
        if (item.countSmall > 0) {
          detailItems.push({
            goods_id: item._id,
            name: item.name,
            count: item.countSmall,
            unit_name: item.unitSmallName,
            price: item.priceSmall
          })
        }
        return detailItems
      })
      .flat()

    let finalAddress = address.value
    if (mode.value === 'agent' && selectedCustomer.value) {
      finalAddress = {
        name: selectedCustomer.value.alias,
        mobile: selectedCustomer.value.phone || '',
        fullAddress: selectedCustomer.value.address || selectedCustomer.value.remark || ''
      }
    }

    const res: any = await orderCo.createOrder({
      tenant_id: tenant_id.value,
      items,
      total_amount: totalAmount.value,
      payment_method: paymentMethod.value,
      remark: remark.value,
      address: finalAddress,
      customer_id: selectedCustomer.value?._id // 如果是代客下单，传入选中的客户ID
    })

    if (res.status === 0) {
      uni.showToast({ title: '下单成功', icon: 'success' })
      uni.removeStorageSync('current_cart')
      // 跳转到订单列表或成功页
      setTimeout(() => {
        const url =
          mode.value === 'agent'
            ? '/pages/merchant/order/list'
            : `/pages/client/shop?tenant_id=${tenant_id.value}`
        uni.reLaunch({ url })
      }, 1500)
    } else {
      uni.showToast({ title: res.message || '下单失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单出错', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.checkout-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 24rpx 140rpx;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.address-section {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .address-info {
    flex: 1;
    margin-right: 20rpx;
    .top {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 8rpx;
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      .mobile {
        font-size: 28rpx;
        color: #666;
      }
    }
    .detail {
      font-size: 26rpx;
      color: #999;
      line-height: 1.4;
    }
  }

  .no-address {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    .txt {
      font-size: 30rpx;
      color: #999;
    }
  }
}

.customer-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .customer-info {
    flex: 1;
    .top {
      display: flex;
      align-items: baseline;
      gap: 16rpx;
      .name {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
      }
      .mobile {
        font-size: 28rpx;
        color: #666;
      }
    }
  }
  .no-customer {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    .txt {
      font-size: 30rpx;
      color: #999;
      &.blue {
        color: #2979ff;
      }
    }
  }
}

.items-section {
  .items-list {
    .item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f5f5f5;
      &:last-child {
        border-bottom: none;
      }
      .item-img {
        width: 100rpx;
        height: 100rpx;
        border-radius: 8rpx;
        margin-right: 20rpx;
      }
      .item-info {
        flex: 1;
        .item-name {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 4rpx;
        }
        .item-spec {
          font-size: 24rpx;
          color: #999;
          margin-bottom: 4rpx;
        }
        .item-price {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
      }
    }
  }
}

.payment-section {
  .radio-desc {
    font-size: 24rpx;
    color: #999;
    margin: 8rpx 0 20rpx 60rpx;
  }
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
  z-index: 100;

  .left {
    display: flex;
    align-items: baseline;
    .label {
      font-size: 28rpx;
      color: #333;
      margin-right: 8rpx;
    }
    .symbol {
      font-size: 24rpx;
      color: #ff4d4f;
      font-weight: bold;
    }
    .amount {
      font-size: 40rpx;
      color: #ff4d4f;
      font-weight: bold;
    }
  }
}
</style>
