<template>
  <view class="credit-apply-container">
    <!-- 当前额度信息 -->
    <view class="credit-info-card">
      <view class="info-header">
        <text class="label">当前可用额度</text>
        <text class="hint">如有疑问请联系商家</text>
      </view>
      <view class="amount-row">
        <text class="currency">¥</text>
        <text class="amount">{{ formatAmount(availableCredit) }}</text>
      </view>
      <view class="credit-stats">
        <view class="stat-item">
          <text class="stat-value">{{ formatAmount(totalCredit) }}</text>
          <text class="stat-label">总额度</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ formatAmount(usedCredit) }}</text>
          <text class="stat-label">已使用</text>
        </view>
      </view>
    </view>

    <!-- 申请表单 -->
    <view class="apply-form">
      <view class="form-title">申请提高额度</view>

      <view class="form-item">
        <text class="item-label">申请额度</text>
        <view class="amount-input-wrapper">
          <text class="prefix">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="applyAmount"
            placeholder="请输入申请额度"
            @input="handleAmountInput"
          />
        </view>
      </view>

      <view class="form-item">
        <text class="item-label">申请原因</text>
        <textarea
          class="reason-input"
          v-model="reason"
          placeholder="请输入申请原因（如：旺季备货需要）"
          maxlength="200"
        />
      </view>

      <view class="preset-amounts">
        <view
          v-for="preset in presetAmounts"
          :key="preset"
          :class="['preset-btn', applyAmount == preset ? 'active' : '']"
          @click="applyAmount = preset"
        >
          ¥{{ formatAmount(preset) }}
        </view>
      </view>

      <u-button
        type="primary"
        text="提交申请"
        :loading="submitting"
        :disabled="!isValid"
        custom-style="margin-top: 40rpx; border-radius: 60rpx;"
        @click="submitApplication"
      ></u-button>
    </view>

    <!-- 申请记录 -->
    <view class="history-section">
      <view class="section-title">申请记录</view>
      <view v-if="loadingHistory" class="loading-state">
        <u-loading-icon></u-loading-icon>
      </view>
      <view v-else-if="applications.length === 0" class="empty-state">
        <u-empty text="暂无申请记录"></u-empty>
      </view>
      <view v-else class="history-list">
        <view v-for="item in applications" :key="item._id" class="history-item">
          <view class="item-header">
            <text class="item-date">{{ formatDate(item.created_at) }}</text>
            <text :class="['status-tag', 'status-' + item.status]">
              {{ getStatusText(item.status) }}
            </text>
          </view>
          <view class="item-body">
            <text class="amount">¥{{ formatAmount(item.amount) }}</text>
            <text class="reason">{{ item.reason || '未填写原因' }}</text>
          </view>
          <view v-if="item.remark" class="item-remark"> 商家回复: {{ item.remark }} </view>
        </view>
      </view>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { priceHelper } from '@/common/price-helper'

const customerId = uni.getStorageSync('customer_id')
const toastRef = ref<any>(null)

const availableCredit = ref(0)
const totalCredit = ref(5000)
const usedCredit = ref(0)
const applyAmount = ref('')
const reason = ref('')
const submitting = ref(false)
const loadingHistory = ref(false)
const applications = ref<any[]>([])

const presetAmounts = [1000, 2000, 5000, 10000]

const isValid = computed(() => {
  const amount = parseFloat(applyAmount.value)
  return amount && amount > 0 && reason.value.trim().length > 0
})

const formatAmount = (fen: number) => priceHelper.format(fen)
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝'
  }
  return statusMap[status] || '未知'
}

const handleAmountInput = (e: any) => {
  const value = e.detail.value
  if (value && isNaN(parseFloat(value))) {
    applyAmount.value = ''
  }
}

const fetchCreditInfo = async () => {
  if (!customerId) return
  try {
    const db = uniCloud.database()
    const res: any = await db.collection('wh_customers').doc(customerId).get()
    if (res.result.data) {
      const data = res.result.data
      availableCredit.value = data.total_debt || 0
      usedCredit.value = data.credit_used || 0
      totalCredit.value = data.credit_limit || 5000
    }
  } catch (e: any) {
    console.error('Failed to fetch credit info:', e)
  }
}

const fetchApplications = async () => {
  if (!customerId) return
  loadingHistory.value = true
  try {
    const db = uniCloud.database()
    const res: any = await db
      .collection('wh_credit_applications')
      .where({ customer_id: customerId })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get()
    applications.value = res.result.data || []
  } catch (e: any) {
    console.error('Failed to fetch applications:', e)
  } finally {
    loadingHistory.value = false
  }
}

const submitApplication = async () => {
  if (!isValid.value) return

  const amount = Math.round(parseFloat(applyAmount.value) * 100)

  submitting.value = true
  try {
    const db = uniCloud.database()
    await db.collection('wh_credit_applications').add({
      customer_id: customerId,
      amount,
      reason: reason.value.trim(),
      status: 0,
      created_at: Date.now()
    })

    toastRef.value?.show({
      type: 'success',
      message: '申请已提交，请等待商家审核'
    })

    applyAmount.value = ''
    reason.value = ''
    fetchApplications()
  } catch (e: any) {
    toastRef.value?.show({
      type: 'error',
      message: e.message || '提交失败'
    })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  fetchCreditInfo()
  fetchApplications()
})
</script>

<style lang="scss" scoped>
.credit-apply-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.credit-info-card {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;

  .info-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .label {
      color: rgba(255, 255, 255, 0.9);
      font-size: 28rpx;
    }

    .hint {
      color: rgba(255, 255, 255, 0.7);
      font-size: 24rpx;
    }
  }

  .amount-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 32rpx;

    .currency {
      color: #fff;
      font-size: 36rpx;
      margin-right: 8rpx;
    }

    .amount {
      color: #fff;
      font-size: 72rpx;
      font-weight: bold;
    }
  }

  .credit-stats {
    display: flex;
    gap: 60rpx;

    .stat-item {
      display: flex;
      flex-direction: column;

      .stat-value {
        color: #fff;
        font-size: 36rpx;
        font-weight: bold;
      }

      .stat-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 24rpx;
        margin-top: 4rpx;
      }
    }
  }
}

.apply-form {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 32rpx;

  .form-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 32rpx;
  }

  .form-item {
    margin-bottom: 24rpx;

    .item-label {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 12rpx;
      display: block;
    }

    .amount-input-wrapper {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 24rpx;

      .prefix {
        font-size: 32rpx;
        color: #333;
        margin-right: 8rpx;
      }

      .amount-input {
        flex: 1;
        font-size: 32rpx;
      }
    }

    .reason-input {
      width: 100%;
      height: 160rpx;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 24rpx;
      font-size: 28rpx;
      box-sizing: border-box;
    }
  }

  .preset-amounts {
    display: flex;
    gap: 20rpx;
    flex-wrap: wrap;
    margin-top: 16rpx;

    .preset-btn {
      padding: 16rpx 32rpx;
      background-color: #f5f5f5;
      border-radius: 8rpx;
      font-size: 26rpx;
      color: #666;

      &.active {
        background-color: #07c160;
        color: #fff;
      }
    }
  }
}

.history-section {
  margin-top: 32rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    padding-left: 8rpx;
  }

  .loading-state,
  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60rpx 0;
  }

  .history-list {
    background-color: #fff;
    border-radius: 20rpx;
    overflow: hidden;

    .history-item {
      padding: 24rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12rpx;

        .item-date {
          font-size: 24rpx;
          color: #999;
        }

        .status-tag {
          font-size: 24rpx;
          padding: 4rpx 16rpx;
          border-radius: 4rpx;

          &.status-0 {
            background-color: #fff7e6;
            color: #d48806;
          }

          &.status-1 {
            background-color: #f6ffed;
            color: #52c41a;
          }

          &.status-2 {
            background-color: #f5f5f5;
            color: #999;
          }
        }
      }

      .item-body {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .amount {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }

        .reason {
          font-size: 26rpx;
          color: #999;
          flex: 1;
          text-align: right;
          margin-left: 20rpx;
        }
      }

      .item-remark {
        font-size: 24rpx;
        color: #ff4d4f;
        margin-top: 12rpx;
        padding: 12rpx;
        background-color: #fff2f0;
        border-radius: 8rpx;
      }
    }
  }
}
</style>
