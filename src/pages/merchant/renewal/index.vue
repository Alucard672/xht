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
      <text class="tip-text">{{ daysRemaining <= 0 ? '您的账号已过期，请立即续费以恢复使用' : `距到期还有${daysRemaining}天，建议及时续费` }}</text>
    </view>

    <!-- 套餐列表 -->
    <view class="section-title">选择续费套餐</view>
    
    <view class="package-list">
      <view 
        v-for="(item, index) in packageList" 
        :key="item._id" 
        class="package-item"
        :class="{ selected: selectedPackageIndex === index, disabled: item.price === 0 }"
        @click="selectPackage(index)"
      >
        <view class="package-header">
          <text class="package-name">{{ item.name }}</text>
          <text class="package-price" v-if="item.price > 0">¥{{ (item.price / 100).toFixed(2) }}</text>
          <text class="package-price free" v-else>免费</text>
        </view>
        
        <view class="package-body">
          <text class="duration">续费 {{ item.duration_months }} 个月</text>
          <text v-if="item.description" class="description">{{ item.description }}</text>
        </view>
        
        <view class="package-footer">
          <view class="select-icon">
            <u-icon v-if="selectedPackageIndex === index" name="checkmark-circle-fill" color="#07c160" size="40"></u-icon>
            <view v-else class="circle"></view>
          </view>
        </view>
      </view>
      
      <u-empty v-if="packageList.length === 0" mode="data" text="暂无可用套餐"></u-empty>
    </view>

    <!-- 续费按钮 -->
    <view class="bottom-action">
      <view class="total-info" v-if="selectedPackage">
        <text class="label">应付金额：</text>
        <text class="amount">{{ selectedPackage.price > 0 ? `¥${(selectedPackage.price / 100).toFixed(2)}` : '¥0.00' }}</text>
      </view>
      
      <u-button
        type="primary"
        :text="selectedPackage?.price > 0 ? '微信支付续费' : '免费续费'"
        :loading="submitting"
        :disabled="selectedPackageIndex === null"
        custom-style="height: 96rpx; border-radius: 48rpx; background-color: #07c160; border: none;"
        @click="handleRenewal"
      ></u-button>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'
import oaAPI from '@/utils/oa'

const userStore = useUserStore()
const toastRef = ref<any>(null)

const packageList = ref<any[]>([])
const selectedPackageIndex = ref<number | null>(null)
const submitting = ref(false)

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

onMounted(() => {
  // 刷新商家信息
  userStore.refreshTenantInfo()
})

const loadPackages = async () => {
  try {
    const res: any = await oaAPI.getPackageList()
    if (res.code === 0) {
      // 只显示上架的套餐
      packageList.value = (res.data || []).filter((p: any) => p.is_active)
      
      // 默认选择第一个套餐
      if (packageList.value.length > 0) {
        selectedPackageIndex.value = 0
      }
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '加载套餐失败' })
  }
}

const selectPackage = (index: number) => {
  selectedPackageIndex.value = index
}

const formatDate = (ts: number | string | undefined) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
    // 创建续费订单
    const res: any = await oaAPI.createRenewalOrder({
      tenantId: tenantId,
      packageId: selectedPackage.value._id
    })
    
    if (res.code !== 0) {
      toastRef.value?.show({ type: 'error', message: res.msg })
      submitting.value = false
      return
    }
    
    const { order_id, order_no, amount } = res.data
    
    // 如果是免费套餐，直接处理
    if (amount === 0) {
      // 免费套餐，直接调用支付回调
      await oaAPI.handlePaymentCallback({
        orderId: order_id,
        paymentInfo: { method: 'free', time: Date.now() }
      })
      
      // 刷新商家信息
      await userStore.refreshTenantInfo()
      
      uni.showModal({
        title: '续费成功',
        content: `${selectedPackage.value.name}续费成功！`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          uni.navigateBack()
        }
      })
      submitting.value = false
      return
    }
    
    // 微信支付（示例代码，需要根据实际支付配置调整）
    // #ifdef MP-WEIXIN
    try {
      const paymentRes = await uniCloud.callFunction({
        name: 'wh-payment-co',
        data: {
          action: 'createPayment',
          params: {
            orderId: order_id,
            orderNo: order_no,
            amount: amount,
            subject: selectedPackage.value.name,
            tenantId: tenantId
          }
        }
      })
      
      if (paymentRes.result.code === 0) {
        // 发起微信支付
        uni.requestPayment({
          provider: 'wxpay',
          ...paymentRes.result.data,
          success: async () => {
            // 支付成功，刷新商家信息
            await userStore.refreshTenantInfo()
            
            uni.redirectTo({
              url: `/pages/merchant/renewal/result?status=success&order_no=${order_no}`
            })
          },
          fail: async (err) => {
            console.error('支付失败:', err)
            uni.redirectTo({
              url: `/pages/merchant/renewal/result?status=fail&order_no=${order_no}`
            })
          }
        })
      } else {
        throw new Error(paymentRes.result.msg)
      }
    } catch (payError: any) {
      console.error('支付调用失败:', payError)
      // 模拟支付成功（测试环境）
      uni.showModal({
        title: '支付提示',
        content: `测试环境：订单${order_no}已创建，实际支付需对接微信支付`,
        confirmText: '模拟支付成功',
        success: async (res) => {
          if (res.confirm) {
            await userStore.refreshTenantInfo()
            uni.redirectTo({
              url: `/pages/merchant/renewal/result?status=success&order_no=${order_no}`
            })
          }
        }
      })
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.showModal({
      title: '提示',
      content: '请在微信小程序中完成支付',
      showCancel: false
    })
    // #endif
    
  } catch (e: any) {
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
