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
          <view class="goods-main">
            <view class="goods-info">
              <view class="goods-name">{{ item.name }}</view>
              <view v-if="item.is_multi_unit" class="goods-spec">
                <text v-if="item.countBig">{{ item.countBig }}{{ item.unitBigName }}</text>
                <text v-if="item.countSmall">{{ item.countSmall }}{{ item.unitSmallName }}</text>
              </view>
              <view v-else class="goods-spec">
                <text>{{ item.countSmall }}{{ item.unitSmallName }}</text>
              </view>
            </view>
            <view class="goods-actions">
              <view class="edit-btn" @click="editGoods(index)">
                <u-icon name="edit-pen" size="18" color="#2979ff"></u-icon>
                <text class="txt">修改</text>
              </view>
              <view class="goods-total"> ¥{{ priceHelper.format(getItemTotal(item)) }} </view>
              <u-icon name="close" size="16" color="#999" @click="removeGoods(index)"></u-icon>
            </view>
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

    <!-- 多单位选择弹窗 -->
    <u-popup :show="showUnitPopup" mode="bottom" :round="10" @close="showUnitPopup = false">
      <view class="unit-popup">
        <view class="popup-header">
          <text class="popup-title">选择数量</text>
          <u-icon name="close" size="20" @click="showUnitPopup = false"></u-icon>
        </view>

        <view v-if="activeItem" class="popup-content">
          <view class="goods-preview">
            <image v-if="activeItem.img_url" :src="activeItem.img_url" class="goods-img" />
            <view class="goods-detail">
              <text class="name">{{ activeItem.name }}</text>
              <text v-if="activeItem.is_multi_unit" class="price">
                大单位: ¥{{ priceHelper.format(activeItem.unit_big?.price || 0) }}/{{
                  activeItem.unit_big?.name
                }}
                \n小单位: ¥{{ priceHelper.format(activeItem.unit_small?.price || 0) }}/{{
                  activeItem.unit_small?.name
                }}
              </text>
              <text v-else class="price">
                ¥{{ priceHelper.format(activeItem.unit_small?.price || 0) }}/{{
                  activeItem.unit_small?.name
                }}
              </text>
            </view>
          </view>

          <!-- 多单位选择 -->
          <view v-if="activeItem.is_multi_unit" class="unit-selector">
            <view class="unit-row">
              <text class="unit-label">{{ activeItem.unit_big?.name }}:</text>
              <u-number-box
                v-model="tempCartItem.countBig"
                :min="0"
                :max="999"
                size="22"
              ></u-number-box>
            </view>
            <view class="unit-row">
              <text class="unit-label">{{ activeItem.unit_small?.name }}:</text>
              <u-number-box
                v-model="tempCartItem.countSmall"
                :min="0"
                :max="999"
                size="22"
              ></u-number-box>
            </view>
          </view>

          <!-- 单单位选择 -->
          <view v-else class="unit-selector">
            <view class="unit-row">
              <text class="unit-label">{{ activeItem.unit_small?.name }}:</text>
              <u-number-box
                v-model="tempCartItem.countSmall"
                :min="1"
                :max="999"
                size="22"
              ></u-number-box>
            </view>
          </view>

          <view class="total-preview">
            <text class="label">小计：</text>
            <text class="amount">¥{{ priceHelper.format(getTempTotal()) }}</text>
          </view>
        </view>

        <view class="popup-footer">
          <u-button
            type="primary"
            text="确定"
            :disabled="getTempTotal() === 0"
            custom-style="width: 100%; height: 88rpx; border-radius: 44rpx;"
            @click="confirmEditGoods"
          ></u-button>
        </view>
      </view>
    </u-popup>
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

// 多单位选择弹窗
const showUnitPopup = ref(false)
const activeItem = ref<any>(null)
const editIndex = ref<number>(-1)
const tempCartItem = ref({
  countBig: 0,
  countSmall: 0
})

// 计算单个商品总价
const getItemTotal = (item: any) => {
  let total = (item.priceSmall || 0) * (item.countSmall || 0)
  if (item.is_multi_unit && item.countBig && item.priceBig) {
    total += item.priceBig * item.countBig
  }
  return total
}

// 计算临时总价
const getTempTotal = () => {
  if (!activeItem.value) return 0
  let total = (activeItem.value.unit_small?.price || 0) * (tempCartItem.value.countSmall || 0)
  if (activeItem.value.is_multi_unit) {
    total += (activeItem.value.unit_big?.price || 0) * (tempCartItem.value.countBig || 0)
  }
  return total
}

// 计算订单总价
const totalAmount = computed(() => {
  return selectedGoods.value.reduce((total, item) => total + getItemTotal(item), 0)
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

// 编辑商品
const editGoods = (index: number) => {
  const item = selectedGoods.value[index]
  activeItem.value = item
  editIndex.value = index
  tempCartItem.value = {
    countBig: item.countBig || 0,
    countSmall: item.countSmall || 0
  }
  showUnitPopup.value = true
}

// 确认编辑商品
const confirmEditGoods = () => {
  if (editIndex.value >= 0) {
    // 更新现有商品
    const item = selectedGoods.value[editIndex.value]
    item.countBig = tempCartItem.value.countBig
    item.countSmall = tempCartItem.value.countSmall

    // 如果数量都为0，则删除
    if (item.countBig === 0 && item.countSmall === 0) {
      selectedGoods.value.splice(editIndex.value, 1)
    }
  } else {
    // 添加新商品
    const item = activeItem.value
    selectedGoods.value.push({
      ...item,
      countBig: tempCartItem.value.countBig,
      countSmall: tempCartItem.value.countSmall
    })
  }

  showUnitPopup.value = false
  activeItem.value = null
  editIndex.value = -1
}

// 商品选择回调
onShow(() => {
  const selectedGoodsData = uni.getStorageSync('selected_goods_for_order')
  if (selectedGoodsData) {
    const goods = JSON.parse(selectedGoodsData)
    // 添加到已选列表
    goods.forEach((g: any) => {
      activeItem.value = g
      editIndex.value = -1

      if (g.is_multi_unit) {
        // 多单位商品，弹出选择窗口
        tempCartItem.value = {
          countBig: 0,
          countSmall: 1 // 默认选择1个小单位
        }
        showUnitPopup.value = true
      } else {
        // 单单位商品，直接添加
        selectedGoods.value.push({
          ...g,
          countBig: 0,
          countSmall: 1
        })
      }
    })
    uni.removeStorageSync('selected_goods_for_order')
  }
})

// 移除商品
const removeGoods = (index: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要移除该商品吗？',
    success: res => {
      if (res.confirm) {
        selectedGoods.value.splice(index, 1)
      }
    }
  })
}

// 提交订单
const submitOrder = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  try {
    // 构建商品列表
    const items = selectedGoods.value
      .filter(item => (item.countBig || 0) > 0 || (item.countSmall || 0) > 0)
      .map(item => {
        // 计算总价
        const priceSmall = item.priceSmall || 0
        let count = item.countSmall || 0
        let totalAmount = priceSmall * count

        // 如果有多单位
        if (item.is_multi_unit && item.countBig && item.priceBig) {
          const bigUnitTotal = item.priceBig * item.countBig
          totalAmount += bigUnitTotal

          // 换算成小单位总数
          count = item.countBig * (item.rate || 1) + item.countSmall
        }

        return {
          goods_id: item._id,
          name: item.name,
          count: count,
          unit_name: item.unitSmallName,
          price: Math.floor(totalAmount / count) // 平均单价
        }
      })

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
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .goods-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .goods-info {
        flex: 1;
        .goods-name {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }
        .goods-spec {
          font-size: 24rpx;
          color: #999;
          text {
            margin-right: 12rpx;
          }
        }
      }

      .goods-actions {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .edit-btn {
          display: flex;
          align-items: center;
          padding: 8rpx 16rpx;
          background-color: #f0f9eb;
          border-radius: 8rpx;
          .txt {
            font-size: 24rpx;
            color: #2979ff;
            margin-left: 4rpx;
          }
        }

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

// 多单位选择弹窗
.unit-popup {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .popup-content {
    .goods-preview {
      display: flex;
      padding: 20rpx;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      margin-bottom: 30rpx;
      .goods-img {
        width: 120rpx;
        height: 120rpx;
        border-radius: 12rpx;
        margin-right: 20rpx;
      }
      .goods-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        .name {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          margin-bottom: 8rpx;
        }
        .price {
          font-size: 24rpx;
          color: #999;
          line-height: 1.5;
        }
      }
    }

    .unit-selector {
      .unit-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx 0;
        border-bottom: 1rpx solid #f5f5f5;
        .unit-label {
          font-size: 28rpx;
          color: #333;
        }
      }
    }

    .total-preview {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      padding: 30rpx 0;
      border-top: 1rpx solid #f5f5f5;
      margin-top: 20rpx;
      .label {
        font-size: 26rpx;
        color: #666;
        margin-right: 12rpx;
      }
      .amount {
        font-size: 40rpx;
        color: #ff4d4f;
        font-weight: bold;
      }
    }
  }

  .popup-footer {
    margin-top: 30rpx;
  }
}
</style>
