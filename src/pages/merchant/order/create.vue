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
        <view
          v-for="(item, index) in selectedGoods"
          :key="index"
          class="goods-item"
          hover-class="goods-item-hover"
          @click="editGoods(index)"
        >
          <!-- 左侧：图片 + 信息 -->
          <view class="goods-left">
            <!-- 商品图片 -->
            <image v-if="item.img_url" :src="item.img_url" class="goods-img" mode="aspectFill" />
            <view v-else class="goods-img placeholder">
              <u-icon name="shopping-bag" size="48" color="#ccc"></u-icon>
            </view>

            <!-- 商品信息 -->
            <view class="goods-info">
              <view class="goods-name u-line-1">{{ item.name }}</view>

              <!-- 多单位数量显示 -->
              <view class="goods-specs">
                <template v-if="item.is_multi_unit">
                  <view v-if="item.countBig > 0" class="spec-item">
                    <text class="spec-qty">{{ item.countBig }}</text>
                    <text class="spec-unit">{{ item.unitBigName }}</text>
                    <text class="spec-x">×</text>
                    <text class="spec-price">¥{{ priceHelper.format(item.priceBig) }}</text>
                  </view>
                  <view v-if="item.countSmall > 0" class="spec-item">
                    <text class="spec-qty">{{ item.countSmall }}</text>
                    <text class="spec-unit">{{ item.unitSmallName }}</text>
                    <text class="spec-x">×</text>
                    <text class="spec-price">¥{{ priceHelper.format(item.priceSmall) }}</text>
                  </view>
                </template>
                <template v-else>
                  <view class="spec-item">
                    <text class="spec-qty">{{ item.countSmall }}</text>
                    <text class="spec-unit">{{ item.unitSmallName }}</text>
                    <text class="spec-x">×</text>
                    <text class="spec-price">¥{{ priceHelper.format(item.priceSmall) }}</text>
                  </view>
                </template>
              </view>

              <!-- 小计 -->
              <view class="goods-subtotal">
                <text class="subtotal-label">小计:</text>
                <text class="subtotal-amount">¥{{ priceHelper.format(getItemTotal(item)) }}</text>
              </view>
            </view>
          </view>

          <!-- 右侧：删除按钮 -->
          <view class="goods-right" @click.stop="removeGoods(index)">
            <u-icon name="close-circle-fill" size="20" color="#ff4d4f"></u-icon>
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

// 清理事件监听
onUnmounted(() => {
  uni.$off('goodsSelected')
})
</script>

<style lang="scss" scoped>
// 导入设计系统
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

// ========== 页面容器 ==========
.create-order-container {
  @include page-container-with-top;
}

// ========== 通用区块 ==========
.section {
  @include section-with-label($wh-color-blue);
}

// ========== 客户选择区块 ==========
.customer-section {
  @include customer-selector;
}

// ========== 商品区块 ==========
.goods-section {
  .empty-goods {
    @include empty-state-with-border;
  }

  .goods-list {
    .goods-item {
      @include goods-card-with-decoration;
      @include slide-in-up;

      // 左侧区域
      .goods-left {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: $wh-spacing-lg;
        overflow: hidden;
        padding-right: $wh-spacing-sm;

        .goods-img {
          @include goods-image-style;
        }

        .goods-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 120rpx;
          overflow: hidden;

          .goods-name {
            font-size: $wh-font-size-lg;
            font-weight: $wh-font-weight-semibold;
            color: $wh-text-color-dark;
            line-height: $wh-line-height-snug;
            margin-bottom: $wh-spacing-sm;
            letter-spacing: 0.3rpx;
          }

          .goods-specs {
            display: flex;
            flex-direction: column;
            gap: 6rpx;
            margin-bottom: $wh-spacing-sm;

            .spec-item {
              @include spec-tag;
              @include spec-item-content;
            }
          }

          .goods-subtotal {
            @include subtotal-display;
          }
        }
      }

      // 右侧删除按钮
      .goods-right {
        @include delete-button;
      }
    }

    .add-more {
      @include add-more-button;
    }
  }
}

// ========== 支付方式区块 ==========
.payment-section {
  .radio-desc {
    font-size: $wh-font-size-sm;
    color: $wh-text-color-light-gray;
    margin: 6rpx 0 $wh-spacing-lg 60rpx;
    line-height: 1.5;
  }
}

// ========== 备注区块 ==========
.remark-section {
  textarea {
    @include modern-textarea;
  }
}

// ========== 底部栏 ==========
.footer-bar {
  @include bottom-bar;
  height: calc(140rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $wh-spacing-xl $wh-spacing-xl calc($wh-spacing-xl + env(safe-area-inset-bottom));

  .total-info {
    @include total-bar-section;
  }
}

// ========== 多单位选择弹窗 ==========
.unit-popup {
  @include popup-content;

  .popup-header {
    @include popup-header;
  }

  .popup-content {
    .goods-preview {
      @include goods-preview-card;
    }

    .unit-selector {
      .unit-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $wh-spacing-lg 0;
        border-bottom: 1rpx solid $wh-border-color-light;

        &:last-child {
          border-bottom: none;
        }

        .unit-label {
          @include text-subheading;
          letter-spacing: 0.3rpx;
        }
      }
    }

    .total-preview {
      @include total-preview-section;
    }
  }

  .popup-footer {
    margin-top: $wh-spacing-xl;
  }
}
</style>
