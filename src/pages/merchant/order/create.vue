<template>
  <view class="create-order-container">
    <!-- 选择客户 -->
    <view class="section customer-section" @click="selectCustomer">
      <view v-if="selectedCustomer" class="customer-info">
        <view class="customer-name">{{ selectedCustomer.alias }}</view>
        <view v-if="selectedCustomer.phone" class="customer-phone">{{
          selectedCustomer.phone
        }}</view>
      </view>
      <view v-else class="no-selection">
        <text>点击选择客户</text>
      </view>
      <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
    </view>

    <!-- 商品列表 -->
    <view class="section goods-section">
      <view v-if="selectedGoods.length === 0" class="empty-goods" @click="addGoods">
        <u-icon name="plus" size="24" color="#2979ff"></u-icon>
        <text class="txt">添加商品</text>
      </view>

      <view v-else class="goods-list">
        <view v-for="(item, index) in selectedGoods" :key="index" class="goods-item">
          <view class="goods-info">
            <view class="goods-name">{{ item.name }}</view>
            <view class="goods-price"
              >¥{{ priceHelper.format(item.priceSmall) }}/{{ item.unitSmallName }}</view
            >
          </view>
          <view class="goods-actions">
            <u-number-box
              v-model="item.count"
              :min="0"
              :max="999"
              size="22"
              @change="onQuantityChange(item)"
            ></u-number-box>
            <view class="goods-total">
              ¥{{ priceHelper.format(item.priceSmall * item.count) }}
            </view>
            <u-icon name="close" size="16" color="#999" @click="removeGoods(index)"></u-icon>
          </view>
        </view>

        <view class="add-more" @click="addGoods">
          <u-icon name="plus" size="16" color="#2979ff"></u-icon>
          <text class="txt">继续添加</text>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="section payment-section">
      <view class="section-label">支付方式</view>
      <u-radio-group v-model="paymentMethod" placement="column">
        <u-radio label="赊账结算" name="credit" active-color="#07c160"></u-radio>
        <view class="radio-desc">客户稍后通过账本结算</view>
        <u-radio label="现金支付" name="cash" active-color="#07c160"></u-radio>
        <view class="radio-desc">现场收款</view>
      </u-radio-group>
    </view>

    <!-- 备注 -->
    <view class="section remark-section">
      <view class="section-label">订单备注</view>
      <u-textarea v-model="remark" placeholder="请填写商品备注、收货要求等" count></u-textarea>
    </view>

    <!-- 底部栏 -->
    <view class="footer-bar">
      <view class="total-info">
        <text class="label">合计：</text>
        <text class="amount">¥{{ priceHelper.format(totalAmount) }}</text>
      </view>
      <u-button
        type="primary"
        text="确认开单"
        :loading="submitting"
        :disabled="!canSubmit"
        custom-style="width: 200rpx; height: 80rpx; border-radius: 40rpx;"
        @click="submitOrder"
      ></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const orderCo = importObject('wh-order-co')

// 状态
const selectedCustomer = ref<any>(null)
const selectedGoods = ref<any[]>([])
const paymentMethod = ref('credit')
const remark = ref('')
const submitting = ref(false)

// 计算总价
const totalAmount = computed(() => {
  return selectedGoods.value.reduce((total, item) => {
    const price = item.priceSmall || 0
    const count = item.count || 0
    return total + price * count
  }, 0)
})

// 是否可以提交
const canSubmit = computed(() => {
  return selectedCustomer.value && selectedGoods.value.length > 0 && totalAmount.value > 0
})

// 选择客户
const selectCustomer = () => {
  uni.navigateTo({
    url: '/pages/merchant/customer/picker'
  })

  uni.$once('select-customer', (customer: any) => {
    selectedCustomer.value = customer
  })
}

// 添加商品
const addGoods = () => {
  // 跳转到商品列表选择
  uni.navigateTo({
    url: '/pages/merchant/goods/list?mode=select'
  })
}

// 商品选择回调
onShow(() => {
  const selectedGoodsData = uni.getStorageSync('selected_goods_for_order')
  if (selectedGoodsData) {
    const goods = JSON.parse(selectedGoodsData)
    // 合并到已选列表
    goods.forEach((g: any) => {
      const existing = selectedGoods.value.find((item: any) => item._id === g._id)
      if (!existing) {
        selectedGoods.value.push({
          ...g,
          count: 1
        })
      }
    })
    uni.removeStorageSync('selected_goods_for_order')
  }
})

// 数量变化
const onQuantityChange = (item: any) => {
  if (item.count === 0) {
    // 从列表中移除
    const index = selectedGoods.value.findIndex((g: any) => g._id === item._id)
    if (index > -1) {
      selectedGoods.value.splice(index, 1)
    }
  }
}

// 移除商品
const removeGoods = (index: number) => {
  selectedGoods.value.splice(index, 1)
}

// 提交订单
const submitOrder = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  try {
    // 构建商品列表
    const items = selectedGoods.value
      .filter(item => item.count > 0)
      .map(item => ({
        goods_id: item._id,
        name: item.name,
        count: item.count,
        unit_name: item.unitSmallName,
        price: item.priceSmall
      }))

    const res: any = await orderCo.createByMerchant({
      customer_id: selectedCustomer.value._id,
      items,
      payment_method: paymentMethod.value,
      remark: remark.value,
      address: {
        name: selectedCustomer.value.alias,
        mobile: selectedCustomer.value.phone || '',
        fullAddress: selectedCustomer.value.address || ''
      }
    })

    if (res.status === 0) {
      uni.showToast({ title: '开单成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.message || '开单失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '开单出错', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-order-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 24rpx 140rpx;
}

.page-header {
  padding: 20rpx 0 30rpx;
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .section-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
  }
}

.customer-section {
  display: flex;
  align-items: center;

  .customer-info {
    flex: 1;
    .customer-name {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
    .customer-phone {
      font-size: 26rpx;
      color: #666;
      margin-top: 4rpx;
    }
  }

  .no-selection {
    flex: 1;
    font-size: 28rpx;
    color: #999;
  }
}

.goods-section {
  .empty-goods {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx;
    border: 2rpx dashed #2979ff;
    border-radius: 12rpx;
    .txt {
      font-size: 28rpx;
      color: #2979ff;
      margin-left: 12rpx;
    }
  }

  .goods-list {
    .goods-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .goods-info {
        flex: 1;
        .goods-name {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 4rpx;
        }
        .goods-price {
          font-size: 24rpx;
          color: #999;
        }
      }

      .goods-actions {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .goods-total {
          font-size: 28rpx;
          color: #ff4d4f;
          font-weight: 500;
          min-width: 100rpx;
          text-align: right;
        }
      }
    }

    .add-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20rpx;
      margin-top: 20rpx;
      border: 2rpx dashed #2979ff;
      border-radius: 12rpx;
      .txt {
        font-size: 26rpx;
        color: #2979ff;
        margin-left: 8rpx;
      }
    }
  }
}

.payment-section {
  .radio-desc {
    font-size: 24rpx;
    color: #999;
    margin: 8rpx 0 16rpx 60rpx;
  }
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(120rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  box-sizing: border-box;

  .total-info {
    display: flex;
    align-items: baseline;
    .label {
      font-size: 28rpx;
      color: #333;
    }
    .amount {
      font-size: 44rpx;
      color: #ff4d4f;
      font-weight: bold;
    }
  }
}
</style>
