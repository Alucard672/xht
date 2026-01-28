<template>
  <view class="checkout-container">
    <!-- 商家代客下单：选择客户 -->
    <view v-if="mode === 'agent'" class="section customer-section" @click="selectCustomer">
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
      <view class="payment-info">
        <text class="payment-label">支付方式</text>
        <text class="payment-value">货到付款（商家联系您）</text>
      </view>
    </view>

    <view class="section remark-section">
      <view class="section-title">订单备注</view>
      <u-textarea v-model="remark" placeholder="请填写收货要求、商品备注等" count></u-textarea>
    </view>

    <view class="footer-bar">
      <view class="total-price">
        <text class="label">合计:</text>
        <text class="symbol">¥</text>
        <text class="amount">{{ priceHelper.format(totalAmount) }}</text>
      </view>
      <view class="submit-action">
        <u-button
          type="primary"
          text="提交订单"
          :loading="submitting"
          custom-style="width: 240rpx; height: 80rpx; border-radius: 40rpx;"
          @click="submitOrder"
        ></u-button>
      </view>
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
const paymentMethod = ref('credit') // Hardcoded to credit for MVP
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

const selectCustomer = () => {
  uni.navigateTo({ url: '/pages/merchant/customer/picker' })
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

    const res: any = await orderCo.createOrder({
      tenant_id: tenant_id.value,
      items,
      total_amount: totalAmount.value,
      payment_method: 'credit', // Hardcoded to credit for MVP
      remark: remark.value,
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
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.checkout-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
  padding: $wh-spacing-md $wh-spacing-lg 180rpx;
}

.section {
  @include section-base;
  margin-bottom: $wh-spacing-md;
  padding: $wh-spacing-xl;

  .section-title {
    @include text-subheading;
    margin-bottom: $wh-spacing-lg;
    letter-spacing: 0.3rpx;
  }
}

.customer-section {
  @include customer-selector;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .customer-info {
    flex: 1;
    .top {
      display: flex;
      align-items: baseline;
      gap: $wh-spacing-sm;
      .name {
        font-size: $wh-font-size-xl;
        font-weight: $wh-font-weight-semibold;
        color: $wh-text-color-dark;
      }
      .mobile {
        font-size: $wh-font-size-md;
        color: $wh-text-color-gray;
      }
    }
  }
  .no-customer {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $wh-spacing-sm;
    .txt {
      font-size: $wh-font-size-lg;
      color: $wh-text-color-light-gray;
      font-weight: $wh-font-weight-semibold;
      &.blue {
        color: $wh-color-blue;
      }
    }
  }
}

.items-section {
  .items-list {
    .item {
      display: flex;
      align-items: center;
      padding: $wh-spacing-md 0;
      border-bottom: 1rpx solid $wh-border-color-light;
      &:last-child {
        border-bottom: none;
      }
      .item-img {
        @include goods-image-style;
        margin-right: $wh-spacing-md;
      }
      .item-info {
        flex: 1;
        .item-name {
          font-size: $wh-font-size-lg;
          color: $wh-text-color-dark;
          font-weight: $wh-font-weight-semibold;
          margin-bottom: $wh-spacing-xs;
        }
        .item-spec {
          font-size: $wh-font-size-xs;
          color: $wh-text-color-gray;
          margin-bottom: $wh-spacing-xs;
          font-weight: $wh-font-weight-medium;
        }
        .item-price {
          @include price-text-small;
        }
      }
    }
  }
}

.payment-section {
  .payment-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $wh-spacing-md 0;

    .payment-label {
      font-size: $wh-font-size-base;
      color: $wh-text-color-dark;
      font-weight: $wh-font-weight-semibold;
    }

    .payment-value {
      font-size: $wh-font-size-base;
      color: $wh-color-blue;
      font-weight: $wh-font-weight-semibold;
    }
  }
}

.footer-bar {
  @include bottom-bar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $wh-spacing-lg $wh-spacing-xl;
  padding-bottom: calc($wh-spacing-lg + env(safe-area-inset-bottom));
  height: auto;
  min-height: 140rpx;

  .total-price {
    @include total-bar-section;
  }

  .submit-action {
    display: flex;
    justify-content: flex-end;

    ::v-deep .u-button {
      background: $wh-color-blue !important;
      border-radius: $wh-border-radius-full !important;
      font-weight: $wh-font-weight-semibold !important;
      box-shadow: $wh-shadow-colored !important;
      transition: all $wh-transition-normal !important;

      &:active {
        transform: scale(0.98) !important;
        box-shadow: $wh-shadow-md !important;
      }
    }
  }
}
</style>
