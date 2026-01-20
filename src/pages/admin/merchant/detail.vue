<template>
  <view class="detail-container" v-if="merchant">
    <!-- 商家信息卡片 -->
    <view class="info-card">
      <view class="card-header">
        <text class="shop-name">{{ merchant.name }}</text>
        <u-tag :text="getStatusText(merchant.status)" :type="getStatusType(merchant.status)" size="mini"></u-tag>
      </view>
      
      <view class="info-grid">
        <view class="info-item">
          <text class="label">联系电话</text>
          <text class="value">{{ merchant.phone || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="label">注册时间</text>
          <text class="value">{{ formatDate(merchant.created_at) }}</text>
        </view>
        <view class="info-item">
          <text class="label">有效期至</text>
          <text class="value" :class="{ expired: isExpired(merchant.expired_at) }">
            {{ formatDate(merchant.expired_at) || '未设置' }}
          </text>
        </view>
        <view class="info-item">
          <text class="label">登录状态</text>
          <text class="value">{{ merchant.has_oa_password ? '已设置密码' : '未设置密码' }}</text>
        </view>
      </view>
    </view>

    <!-- 赠送有效期 -->
    <view class="action-card">
      <view class="card-title">
        <u-icon name="gift" color="#1890ff" size="36"></u-icon>
        <text class="title-text">赠送有效期</text>
      </view>
      
      <view class="gift-form">
        <view class="form-item">
          <text class="label">赠送时长</text>
          <u-input
            v-model="giftForm.months"
            type="number"
            placeholder="请输入月数"
            border="true"
            custom-style="padding: 20rpx; border-radius: 12rpx;"
          ></u-input>
        </view>
        
        <view class="form-item">
          <text class="label">备注说明</text>
          <u-input
            v-model="giftForm.remark"
            placeholder="选填，如：活动赠送"
            border="true"
            custom-style="padding: 20rpx; border-radius: 12rpx;"
          ></u-input>
        </view>
        
        <view class="preview-info">
          <text class="preview-label">赠送后有效期：</text>
          <text class="preview-value">{{ formatDate(newExpiredAt) || '-' }}</text>
        </view>
        
        <u-button
          type="primary"
          text="确认赠送"
          :loading="submitting"
          custom-style="height: 88rpx; border-radius: 44rpx; background-color: #1890ff; border: none;"
          @click="handleGift"
        ></u-button>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="action-card">
      <view class="card-title">
        <u-icon name="setting" color="#1890ff" size="36"></u-icon>
        <text class="title-text">快捷操作</text>
      </view>
      
      <view class="action-list">
        <view class="action-item" @click="resetPassword">
          <u-icon name="lock" color="#52c41a" size="36"></u-icon>
          <text class="action-text">重置登录密码</text>
          <text class="action-tip">重置为默认密码123456</text>
        </view>
      </view>
    </view>

    <u-toast ref="toastRef" />
  </view>
  
  <u-loading-icon v-else size="60" mode="circular"></u-loading-icon>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import oaAPI from '@/utils/oa'

const toastRef = ref<any>(null)
const merchantId = ref('')
const merchant = ref<any>(null)
const submitting = ref(false)

const giftForm = reactive({
  months: '',
  remark: ''
})

onLoad((options: any) => {
  if (options.id) {
    merchantId.value = options.id
    loadMerchant(options.id)
  }
})

const loadMerchant = async (id: string) => {
  try {
    const res: any = await oaAPI.getMerchantDetail(id)
    if (res.code === 0) {
      merchant.value = res.data
    } else {
      toastRef.value?.show({ type: 'error', message: res.msg })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '加载失败' })
  }
}

const newExpiredAt = computed(() => {
  if (!merchant.value?.expired_at || !giftForm.months) return null
  const months = parseInt(giftForm.months)
  if (isNaN(months) || months <= 0) return null
  
  const currentExpiredAt = merchant.value.expired_at
  const date = new Date(currentExpiredAt)
  const targetMonth = date.getMonth() + months
  const targetDate = new Date(date.getFullYear(), targetMonth, date.getDate())
  
  if (targetDate.getMonth() !== targetMonth % 12) {
    return new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getTime()
  }
  
  return targetDate.getTime()
})

const getStatusText = (status: number) => {
  const texts: Record<number, string> = { 0: '待审核', 1: '正常', 2: '已冻结', 3: '已过期' }
  return texts[status] || '未知'
}

const getStatusType = (status: number) => {
  const types: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error', 3: 'info' }
  return types[status] || 'info'
}

const isExpired = (expiredAt: number | undefined) => {
  if (!expiredAt) return false
  return expiredAt < Date.now()
}

const formatDate = (ts: number | string | undefined) => {
  if (!ts) return ''
  const date = new Date(ts)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const handleGift = async () => {
  const months = parseInt(giftForm.months)
  if (isNaN(months) || months <= 0) {
    toastRef.value?.show({ type: 'warning', message: '请输入有效的月数' })
    return
  }
  
  submitting.value = true
  try {
    const res: any = await oaAPI.giftRenewal({
      tenantId: merchantId.value,
      months: months,
      remark: giftForm.remark
    })
    
    submitting.value = false
    
    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: `赠送成功，有效期延长${months}个月` })
      // 重新加载商家信息
      loadMerchant(merchantId.value)
      // 清空表单
      giftForm.months = ''
      giftForm.remark = ''
    } else {
      toastRef.value?.show({ type: 'error', message: res.msg })
    }
  } catch (e: any) {
    submitting.value = false
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  }
}

const resetPassword = () => {
  uni.showModal({
    title: '重置密码',
    content: '确定要将该商家的登录密码重置为默认密码123456吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result: any = await oaAPI.setMerchantPassword(merchantId.value, {
            password: '123456'
          })
          if (result.code === 0) {
            toastRef.value?.show({ type: 'success', message: '密码已重置为123456' })
          } else {
            toastRef.value?.show({ type: 'error', message: result.msg })
          }
        } catch (e: any) {
          toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.info-card, .action-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;

  .shop-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;

  .info-item {
    .label {
      display: block;
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .value {
      font-size: 28rpx;
      color: #333;

      &.expired {
        color: #ff4d4f;
      }
    }
  }
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;

  .title-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
}

.gift-form {
  .form-item {
    margin-bottom: 20rpx;

    .label {
      display: block;
      font-size: 26rpx;
      color: #666;
      margin-bottom: 12rpx;
    }
  }

  .preview-info {
    display: flex;
    align-items: center;
    padding: 20rpx 0;

    .preview-label {
      font-size: 26rpx;
      color: #666;
    }

    .preview-value {
      font-size: 28rpx;
      font-weight: bold;
      color: #1890ff;
    }
  }
}

.action-list {
  .action-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .action-text {
      flex: 1;
      margin-left: 16rpx;
      font-size: 30rpx;
      color: #333;
    }

    .action-tip {
      font-size: 24rpx;
      color: #999;
      margin-right: 16rpx;
    }
  }
}
</style>
