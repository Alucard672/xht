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
.renewal-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 200rpx;
}

.expired-card {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  color: #fff;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .title {
      font-size: 28rpx;
      opacity: 0.9;
    }
  }

  .expired-date {
    display: flex;
    align-items: baseline;
    margin-bottom: 16rpx;

    .date {
      font-size: 56rpx;
      font-weight: bold;
      margin-right: 12rpx;
    }

    .unit {
      font-size: 28rpx;
      opacity: 0.9;
    }
  }

  .days-info {
    display: flex;
    align-items: center;

    .days {
      font-size: 36rpx;
      font-weight: bold;
      margin-right: 8rpx;
    }

    .text {
      font-size: 26rpx;
      opacity: 0.9;
    }

    &.expired .text {
      color: #ffcdd2;
    }
  }
}

.renewal-tip {
  display: flex;
  align-items: center;
  background-color: #fff2f0;
  border: 1rpx solid #ffccc7;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 32rpx;

  .tip-text {
    margin-left: 16rpx;
    font-size: 26rpx;
    color: #ff4d4f;
    flex: 1;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
}

.package-list {
  .package-item {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    border: 2rpx solid transparent;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    position: relative;

    &.selected {
      border-color: #07c160;
      background-color: #f6ffed;
    }

    &.disabled {
      opacity: 0.7;
    }

    .package-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .package-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .package-price {
        font-size: 36rpx;
        font-weight: bold;
        color: #07c160;

        &.free {
          color: #1890ff;
        }
      }
    }

    .package-body {
      .duration {
        font-size: 26rpx;
        color: #666;
      }

      .description {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }

    .package-footer {
      position: absolute;
      right: 24rpx;
      bottom: 24rpx;

      .circle {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 2rpx solid #ddd;
      }
    }
  }
}

.loading-packages {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  padding: 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);

  .total-info {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20rpx;

    .label {
      font-size: 28rpx;
      color: #666;
    }

    .amount {
      font-size: 40rpx;
      font-weight: bold;
      color: #07c160;
    }
  }
}
</style>
