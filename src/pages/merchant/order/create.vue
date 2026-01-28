<template>
  <view class="create-order-container">
    <!-- 客户选择卡片 -->
    <view class="customer-card" @click="selectCustomer">
      <view class="customer-info">
        <text v-if="selectedCustomer" class="customer-name">{{ selectedCustomer.alias }}</text>
        <text v-else class="customer-placeholder">点击选择客户</text>
        <text v-if="selectedCustomer?.phone" class="customer-phone">{{
          selectedCustomer.phone
        }}</text>
      </view>
      <u-icon name="arrow-right" size="20" color="#999"></u-icon>
    </view>

    <!-- 商品列表 -->
    <view class="goods-section">
      <view v-if="selectedGoods.length === 0" class="empty-goods" @click="addGoods">
        <u-icon name="plus-circle" size="48" color="#2d7ff9"></u-icon>
        <text class="txt">添加商品</text>
      </view>

      <view v-else class="goods-list">
        <view
          v-for="(item, index) in selectedGoods"
          :key="index"
          class="goods-card"
          @click="editGoods(index)"
        >
          <!-- 商品图片 -->
          <image v-if="item.img_url" :src="item.img_url" class="goods-img" mode="aspectFill" />
          <view v-else class="goods-img placeholder">
            <u-icon name="shopping-bag" size="40" color="#ccc"></u-icon>
          </view>

          <!-- 商品信息 -->
          <view class="goods-info">
            <text class="goods-name">{{ item.name }}</text>

            <!-- 规格列表 -->
            <view class="goods-specs">
              <template v-if="item.is_multi_unit">
                <text v-if="item.countBig > 0" class="spec-text">
                  {{ item.countBig }}{{ item.unitBigName }} × ¥{{
                    priceHelper.format(item.priceBig)
                  }}
                </text>
                <text v-if="item.countSmall > 0" class="spec-text">
                  {{ item.countSmall }}{{ item.unitSmallName }} × ¥{{
                    priceHelper.format(item.priceSmall)
                  }}
                </text>
              </template>
              <template v-else>
                <text class="spec-text">
                  {{ item.countSmall }}{{ item.unitSmallName }} × ¥{{
                    priceHelper.format(item.priceSmall)
                  }}
                </text>
              </template>
            </view>

            <!-- 小计 -->
            <text class="goods-subtotal">¥{{ priceHelper.format(getItemTotal(item)) }}</text>
          </view>

          <!-- 删除按钮 -->
          <view class="delete-btn" @click.stop="removeGoods(index)">
            <u-icon name="close-circle-fill" size="22" color="#ff4d4f"></u-icon>
          </view>
        </view>

        <!-- 继续添加按钮 -->
        <view class="add-more-btn" @click="addGoods">
          <u-icon name="plus" size="18" color="#2d7ff9"></u-icon>
          <text class="txt">继续添加商品</text>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-section">
      <u-radio-group v-model="paymentMethod" placement="row">
        <u-radio
          label="赊账结算"
          name="credit"
          :custom-style="{ marginRight: '40rpx' }"
          active-color="#2d7ff9"
        ></u-radio>
        <u-radio label="现金支付" name="cash" active-color="#2d7ff9"></u-radio>
      </u-radio-group>
    </view>

    <!-- 订单备注 -->
    <view class="remark-section">
      <u-textarea
        v-model="remark"
        placeholder="填写订单备注（可选）"
        :maxlength="200"
        count
        :custom-style="{ backgroundColor: '#f0f0f5' }"
      ></u-textarea>
    </view>

    <!-- 底部栏 -->
    <view class="footer-bar">
      <view class="total-info">
        <text class="label">合计</text>
        <text class="amount">¥{{ priceHelper.format(totalAmount) }}</text>
      </view>
      <u-button
        type="primary"
        text="确认开单"
        :loading="submitting"
        :disabled="!canSubmit"
        custom-style="width: 220rpx; height: 88rpx; border-radius: 44rpx; font-weight: 600;"
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
import { ref, computed, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'

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
  // 跳转到商品选择器
  uni.navigateTo({
    url: '/pages/merchant/goods/picker'
  })
}

// 监听商品选择事件
uni.$on('goodsSelected', (goods: any) => {
  activeItem.value = goods
  editIndex.value = -1 // -1 表示添加新商品
  tempCartItem.value = {
    countBig: 0,
    countSmall: 1 // 默认数量为1
  }
  showUnitPopup.value = true
})

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
    // 添加新商品 - 映射价格和单位名称字段
    const item = activeItem.value
    selectedGoods.value.push({
      ...item,
      countBig: tempCartItem.value.countBig,
      countSmall: tempCartItem.value.countSmall,
      // 映射价格字段
      priceBig: item.unit_big?.price || 0,
      priceSmall: item.unit_small?.price || 0,
      // 映射单位名称字段
      unitBigName: item.unit_big?.name || '',
      unitSmallName: item.unit_small?.name || ''
    })
  }

  showUnitPopup.value = false
  activeItem.value = null
  editIndex.value = -1
}

// 商品选择回调
onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/order/create')) return

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
        // 单单位商品，直接添加 - 映射价格和单位名称字段
        selectedGoods.value.push({
          ...g,
          countBig: 0,
          countSmall: 1,
          // 映射价格字段
          priceBig: g.unit_big?.price || 0,
          priceSmall: g.unit_small?.price || 0,
          // 映射单位名称字段
          unitBigName: g.unit_big?.name || '',
          unitSmallName: g.unit_small?.name || ''
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

// 清理事件监听
onUnmounted(() => {
  uni.$off('goodsSelected')
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

// ========== 页面容器 ==========
.create-order-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
  padding: 12rpx 16rpx 160rpx;
}

// ========== 客户选择卡片 ==========
.customer-card {
  background: linear-gradient(135deg, #f7f8fa 0%, #ffffff 100%);
  border-radius: $wh-border-radius-md;
  padding: 24rpx 20rpx;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: $wh-shadow-xs;
  transition: all $wh-transition-normal;

  &:active {
    transform: scale(0.98);
    background: #f0f0f5;
  }

  .customer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .customer-name {
      font-size: $wh-font-size-md;
      font-weight: $wh-font-weight-semibold;
      color: $wh-text-color-dark;
    }

    .customer-placeholder {
      font-size: $wh-font-size-md;
      color: $wh-text-color-secondary;
    }

    .customer-phone {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-secondary;
    }
  }
}

// ========== 商品区块 ==========
.goods-section {
  .empty-goods {
    background: $wh-bg-color-card;
    border-radius: $wh-border-radius-md;
    padding: 60rpx 20rpx;
    margin-bottom: 12rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    box-shadow: $wh-shadow-xs;

    .txt {
      font-size: $wh-font-size-md;
      color: $wh-color-blue;
      font-weight: $wh-font-weight-medium;
    }
  }

  .goods-list {
    .goods-card {
      background: $wh-bg-color-card;
      border-radius: $wh-border-radius-md;
      padding: 10rpx 20rpx;
      margin-bottom: 12rpx;
      display: flex;
      align-items: center;
      gap: 16rpx;
      box-shadow: $wh-shadow-xs;
      transition: all $wh-transition-normal;
      @include slide-in-up;

      &:active {
        transform: scale(0.98);
        background: #fafafa;
      }

      .goods-img {
        width: 120rpx;
        height: 120rpx;
        border-radius: $wh-border-radius-sm;
        flex-shrink: 0;
        background: $wh-bg-color-tertiary;

        &.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2rpx solid $wh-border-color-light;
        }
      }

      .goods-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 120rpx;
        overflow: hidden;

        .goods-name {
          font-size: $wh-font-size-md;
          font-weight: $wh-font-weight-semibold;
          color: $wh-text-color-dark;
          line-height: $wh-line-height-snug;
          margin-bottom: 6rpx;
        }

        .goods-specs {
          display: flex;
          flex-direction: column;
          gap: 2rpx;
          margin-bottom: 4rpx;

          .spec-text {
            font-size: $wh-font-size-xs;
            color: $wh-text-color-secondary;
            font-weight: $wh-font-weight-normal;
          }
        }

        .goods-subtotal {
          font-size: $wh-font-size-lg;
          font-weight: $wh-font-weight-extrabold;
          background: $wh-gradient-price;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .delete-btn {
        flex-shrink: 0;
        padding: 4rpx;

        &:active {
          transform: scale(0.9);
        }
      }
    }

    .add-more-btn {
      background: $wh-color-blue-light-bg;
      border: 2rpx dashed $wh-color-blue;
      border-radius: $wh-border-radius-md;
      padding: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      margin-top: 8rpx;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.98);
        background: rgba(45, 127, 249, 0.08);
      }

      .txt {
        font-size: $wh-font-size-md;
        color: $wh-color-blue;
        font-weight: $wh-font-weight-medium;
      }
    }
  }
}

// ========== 支付方式区块 ==========
.payment-section {
  background: $wh-bg-color-card;
  border-radius: $wh-border-radius-md;
  padding: 20rpx;
  margin-bottom: 12rpx;
  box-shadow: $wh-shadow-xs;
}

// ========== 备注区块 ==========
.remark-section {
  background: $wh-bg-color-card;
  border-radius: $wh-border-radius-md;
  padding: 20rpx;
  margin-bottom: 12rpx;
  box-shadow: $wh-shadow-xs;

  ::v-deep .u-textarea {
    .u-textarea__textarea {
      font-size: $wh-font-size-md !important;
      color: $wh-text-color-dark !important;
    }
  }
}

// ========== 底部栏 ==========
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  z-index: $wh-z-index-footer;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding: 20rpx 16rpx calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;

  .total-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;

    .label {
      font-size: $wh-font-size-md;
      color: $wh-text-color-dark;
      font-weight: $wh-font-weight-medium;
    }

    .amount {
      font-size: 40rpx;
      font-weight: $wh-font-weight-extrabold;
      background: $wh-gradient-price;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

// ========== 多单位选择弹窗 ==========
.unit-popup {
  background: $wh-bg-color-card;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .popup-title {
      font-size: $wh-font-size-xl;
      font-weight: $wh-font-weight-semibold;
      color: $wh-text-color-dark;
    }
  }

  .popup-content {
    .goods-preview {
      display: flex;
      gap: 16rpx;
      padding: 20rpx;
      background: $wh-bg-color-tertiary;
      border-radius: $wh-border-radius-md;
      margin-bottom: 24rpx;

      .goods-img {
        width: 80rpx;
        height: 80rpx;
        border-radius: $wh-border-radius-sm;
        flex-shrink: 0;
      }

      .goods-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8rpx;

        .name {
          font-size: $wh-font-size-md;
          font-weight: $wh-font-weight-semibold;
          color: $wh-text-color-dark;
        }

        .price {
          font-size: $wh-font-size-sm;
          color: $wh-text-color-secondary;
          white-space: pre-line;
        }
      }
    }

    .unit-selector {
      .unit-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20rpx 0;
        border-bottom: 2rpx solid $wh-border-color-light;

        &:last-child {
          border-bottom: none;
        }

        .unit-label {
          font-size: $wh-font-size-md;
          font-weight: $wh-font-weight-medium;
          color: $wh-text-color-dark;
        }
      }
    }

    .total-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 0;
      margin-top: 24rpx;
      border-top: 2rpx solid $wh-border-color-light;

      .label {
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-medium;
      }

      .amount {
        font-size: $wh-font-size-2xl;
        font-weight: $wh-font-weight-extrabold;
        background: $wh-gradient-price;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }

  .popup-footer {
    margin-top: 32rpx;
  }
}
</style>
