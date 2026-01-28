<template>
  <view class="renewal-container">
    <!-- 有效期卡片 -->
    <view class="expired-card">
      <view class="card-header">
        <text class="title">当前有效期</text>
        <u-tag :text="statusText" :type="statusType" size="mini"></u-tag>
      </view>

      <view class="expired-date">
        <text class="date">{{ formatDate(userStore.tenantInfo?.expired_at) || '未设置' }}</text>
        <text class="unit">到期</text>
      </view>

      <view v-if="daysRemaining > 0" class="days-info">
        <text class="days">{{ daysRemaining }}</text>
        <text class="text">天后到期</text>
      </view>
      <view v-else class="days-info expired">
        <text class="text">已过期 {{ Math.abs(daysRemaining) }} 天</text>
      </view>
    </view>

    <!-- 续费提示 -->
    <view v-if="daysRemaining <= 30" class="renewal-tip">
      <u-icon name="info-circle" color="#ff4d4f" size="32"></u-icon>
      <text class="tip-text">{{
        daysRemaining <= 0
          ? '您的账号已过期，请立即续费以恢复使用'
          : `距到期还有${daysRemaining}天，建议及时续费`
      }}</text>
    </view>

    <!-- 套餐列表 -->
    <view class="section-title">选择续费套餐</view>

    <view v-if="!loadingPackages" class="package-list">
      <view
        v-for="(item, index) in packageList"
        :key="item._id"
        class="package-item"
        :class="{ selected: selectedPackageIndex === index, disabled: item.price === 0 }"
        @click="selectPackage(index)"
      >
        <view class="package-header">
          <text class="package-name">{{ item.name }}</text>
          <text v-if="item.price > 0" class="package-price"
            >¥{{ (item.price / 100).toFixed(2) }}</text
          >
          <text v-else class="package-price free">免费</text>
        </view>

        <view class="package-body">
          <text class="duration">续费 {{ item.duration_months }} 个月</text>
          <text v-if="item.description" class="description">{{ item.description }}</text>
        </view>

        <view class="package-footer">
          <view class="select-icon">
            <u-icon
              v-if="selectedPackageIndex === index"
              name="checkmark-circle-fill"
              color="#07c160"
              size="40"
            ></u-icon>
            <view v-else class="circle"></view>
          </view>
        </view>
      </view>

      <u-empty v-if="packageList.length === 0" mode="data" text="暂无可用套餐"></u-empty>
    </view>

    <u-loading v-else mode="circle" class="loading-packages"></u-loading>

    <!-- 续费按钮 -->
    <view class="bottom-action">
      <view v-if="selectedPackage" class="total-info">
        <text class="label">应付金额：</text>
        <text class="amount">{{
          selectedPackage.price > 0 ? `¥${(selectedPackage.price / 100).toFixed(2)}` : '¥0.00'
        }}</text>
      </view>

      <u-button
        type="primary"
        :text="selectedPackage?.price > 0 ? '微信支付续费' : '免费续费'"
        :loading="submitting"
        :disabled="selectedPackageIndex === null || loadingPackages"
        custom-style="height: 96rpx; border-radius: 48rpx; background-color: #07c160; border: none;"
        @click="handleRenewal"
      ></u-button>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'
import { importObject } from '@/utils/cloud'

const userStore = useUserStore()
const toastRef = ref<any>(null)

const packageList = ref<any[]>([])
const selectedPackageIndex = ref<number | null>(null)
const submitting = ref(false)
const loadingPackages = ref(false)

// 计算属性
const selectedPackage = computed(() => {
  if (selectedPackageIndex.value === null) return null
  return packageList.value[selectedPackageIndex.value]
})

const daysRemaining = computed(() => {
  if (!userStore.tenantInfo?.expired_at) return 0
  const expiredAt = userStore.tenantInfo.expired_at
  const now = Date.now()
  return Math.floor((expiredAt - now) / (24 * 60 * 60 * 1000))
})

const statusText = computed(() => {
  if (daysRemaining.value > 0) return '正常'
  if (daysRemaining.value === 0) return '今日到期'
  return '已过期'
})

const statusType = computed(() => {
  if (daysRemaining.value > 30) return 'success'
  if (daysRemaining.value > 0) return 'warning'
  return 'error'
})

onShow(() => {
  // 检查是否登录
  if (!userStore.token) {
    uni.redirectTo({ url: '/pages/merchant/login' })
    return
  }
  // 刷新商家信息（获取最新有效期）
  userStore.refreshTenantInfo()
  loadPackages()
})

const formatDate = (ts: number | string | undefined) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadPackages = async () => {
  loadingPackages.value = true
  try {
    const merchantCo = importObject('wh-merchant-co')
    const res: any = await merchantCo.getRenewalPackages()

    if (res.code === 0) {
      packageList.value = res.data || []

      // 默认选择第一个套餐
      if (packageList.value.length > 0) {
        selectedPackageIndex.value = 0
      }
    } else {
      toastRef.value?.show({ type: 'error', message: res.msg || '加载套餐失败' })
    }
  } catch (e: any) {
    console.error('加载套餐失败:', e)
    toastRef.value?.show({ type: 'error', message: '加载套餐失败，请检查网络' })
  } finally {
    loadingPackages.value = false
  }
}

const selectPackage = (index: number) => {
  selectedPackageIndex.value = index
}

const handleRenewal = async () => {
  if (!selectedPackage.value) return

  const tenantId = userStore.tenantInfo?._id
  if (!tenantId) {
    toastRef.value?.show({ type: 'error', message: '商家信息获取失败' })
    return
  }

  submitting.value = true

  try {
    const merchantCo = importObject('wh-merchant-co')

    // 如果是免费套餐，直接处理
    if (selectedPackage.value.price === 0) {
      // 创建续费订单
      const orderRes: any = await merchantCo.createRenewalOrder({
        package_id: selectedPackage.value._id
      })

      if (orderRes.code !== 0) {
        throw new Error(orderRes.msg || '创建订单失败')
      }

      // 处理免费续费
      const processRes: any = await merchantCo.processRenewalPayment({
        orderId: orderRes.data.order_id,
        paymentInfo: { method: 'free', time: Date.now() }
      })

      if (processRes.code === 0) {
        await userStore.refreshTenantInfo()

        uni.showModal({
          title: '续费成功',
          content: `续费成功！有效期已延长${processRes.data.duration_months}个月`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            uni.navigateBack()
          }
        })
      } else {
        throw new Error(processRes.msg || '续费失败')
      }
    } else {
      // 付费套餐 - 模拟支付流程
      const orderRes: any = await merchantCo.createRenewalOrder({
        package_id: selectedPackage.value._id
      })

      if (orderRes.code !== 0) {
        throw new Error(orderRes.msg || '创建订单失败')
      }

      const { order_id, order_no, amount } = orderRes.data

      // 显示支付提示（实际项目需对接微信支付）
      uni.showModal({
        title: '支付提示',
        content: `订单创建成功！\n订单号：${order_no}\n金额：¥${(amount / 100).toFixed(2)}\n\n当前为演示环境，实际使用需对接微信支付`,
        confirmText: '模拟支付成功',
        cancelText: '稍后支付',
        success: async res => {
          if (res.confirm) {
            // 模拟支付成功
            const processRes: any = await merchantCo.processRenewalPayment({
              orderId: order_id,
              paymentInfo: { method: 'wechat', time: Date.now() }
            })

            if (processRes.code === 0) {
              await userStore.refreshTenantInfo()

              uni.showToast({ title: '续费成功！', icon: 'success' })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } else {
              throw new Error(processRes.msg || '续费失败')
            }
          }
        }
      })
    }
  } catch (e: any) {
    console.error('续费失败:', e)
    toastRef.value?.show({ type: 'error', message: e.message || '续费失败' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.renewal-container {
  @include page-container-with-top($wh-spacing-xl);
  padding-bottom: 200rpx;
}

.expired-card {
  @include card-modern;
  background: $wh-gradient-blue-vertical;
  padding: $wh-spacing-xxl;
  margin-bottom: $wh-spacing-lg;
  color: $wh-text-color-inverse;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  .card-header {
    @include flex-between;
    align-items: center;
    margin-bottom: $wh-spacing-lg;
    position: relative;
    z-index: 1;

    .title {
      @include text-subheading;
      opacity: 0.95;
      letter-spacing: 0.3rpx;
    }
  }

  .expired-date {
    @include flex-start;
    align-items: baseline;
    margin-bottom: $wh-spacing-md;

    .date {
      @include price-text-large;
      margin-right: $wh-spacing-sm;
    }

    .unit {
      font-size: $wh-font-size-md;
      opacity: 0.9;
      font-weight: $wh-font-weight-medium;
    }
  }

  .days-info {
    @include flex-start;

    .days {
      font-size: $wh-font-size-2xl;
      font-weight: $wh-font-weight-extrabold;
      margin-right: $wh-spacing-xs;
    }

    .text {
      font-size: $wh-font-size-sm;
      opacity: 0.9;
      font-weight: $wh-font-weight-medium;
    }

    &.expired .text {
      color: #ffcdd2;
    }
  }
}

.renewal-tip {
  @include flex-start;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.08) 0%, rgba(255, 149, 0, 0.05) 100%);
  border: 2rpx solid rgba(255, 59, 48, 0.15);
  border-radius: $wh-border-radius-lg;
  padding: $wh-spacing-lg $wh-spacing-xl;
  margin-bottom: $wh-spacing-3xl;
  transition: all $wh-transition-normal;

  @include hover-scale(0.98);

  .tip-text {
    margin-left: $wh-spacing-sm;
    font-size: $wh-font-size-md;
    color: $wh-color-danger-modern;
    font-weight: $wh-font-weight-semibold;
    flex: 1;
    line-height: $wh-line-height-relaxed;
  }
}

.section-title {
  @include text-heading;
  margin-bottom: $wh-spacing-lg;
  padding-left: $wh-spacing-sm;
  @include label-dot($wh-color-blue);
}

.package-list {
  .package-item {
    @include card-modern;
    margin-bottom: $wh-spacing-md;
    padding: $wh-spacing-xl;
    border: 2rpx solid transparent;
    position: relative;
    overflow: hidden;
    transition: all $wh-transition-normal;

    &.selected {
      border-color: $wh-color-blue;
      background: $wh-color-blue-light-bg;
      box-shadow: $wh-shadow-colored;
    }

    &.disabled {
      opacity: 0.6;
    }

    &:active {
      transform: scale(0.98);
    }

    .package-header {
      @include flex-between;
      align-items: center;
      margin-bottom: $wh-spacing-md;

      .package-name {
        @include text-heading;
        letter-spacing: 0.3rpx;
      }

      .package-price {
        @include price-text-medium;

        &.free {
          color: $wh-color-info;
          background: linear-gradient(
            135deg,
            rgba(16, 174, 255, 0.1) 0%,
            rgba(16, 174, 255, 0.05) 100%
          );
          padding: 4rpx $wh-spacing-sm;
          border-radius: $wh-border-radius-full;
          font-size: $wh-font-size-lg !important;
        }
      }
    }

    .package-body {
      .duration {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-secondary;
        font-weight: $wh-font-weight-medium;
        margin-bottom: $wh-spacing-xs;
      }

      .description {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        margin-top: $wh-spacing-xs;
        font-weight: $wh-font-weight-normal;
        line-height: $wh-line-height-relaxed;
      }
    }

    .package-footer {
      position: absolute;
      right: $wh-spacing-lg;
      bottom: $wh-spacing-lg;

      .circle {
        width: 48rpx;
        height: 48rpx;
        border-radius: $wh-border-radius-circle;
        border: 3rpx solid $wh-border-color-light;
        transition: all $wh-transition-normal;
      }

      .u-icon {
        position: absolute;
        right: 0;
        top: 0;
      }
    }
  }
}

.loading-packages {
  @include flex-center;
  padding: $wh-spacing-3xl;
}

.bottom-action {
  @include bottom-bar;
  height: auto;
  min-height: 160rpx;
  padding: $wh-spacing-xl $wh-spacing-xl calc($wh-spacing-xl + env(safe-area-inset-bottom));

  .total-info {
    @include flex-end;
    align-items: center;
    margin-bottom: $wh-spacing-lg;
    gap: $wh-spacing-sm;

    .label {
      font-size: $wh-font-size-md;
      color: $wh-text-color-gray;
      font-weight: $wh-font-weight-medium;
    }

    .amount {
      @include price-text-medium;
    }
  }

  ::v-deep .u-button {
    width: 100%;
    height: 100rpx;
    border-radius: $wh-border-radius-full !important;
    font-weight: $wh-font-weight-semibold !important;
    font-size: $wh-font-size-xl !important;
    box-shadow: $wh-shadow-colored !important;
    transition: all $wh-transition-normal !important;

    &:active {
      transform: scale(0.98) !important;
      box-shadow: $wh-shadow-md !important;
    }
  }
}
</style>
