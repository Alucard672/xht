<template>
  <view class="assets-container">
    <view class="debt-card">
      <view class="debt-header">
        <text class="label">当前欠款</text>
        <text class="tip">点击下方按钮还款</text>
      </view>
      <view class="amount-row">
        <text class="currency">¥</text>
        <text class="amount">{{ formatAmount(totalDebt) }}</text>
      </view>
      <view class="info-row">
        <text class="info">已还金额: ¥{{ formatAmount(totalPaid) }}</text>
      </view>
    </view>

    <view class="action-bar">
      <u-button
        text="申请赊账"
        icon="plus"
        custom-style="flex: 1; margin-right: 20rpx;"
        @click="requestCredit"
      ></u-button>
      <u-button
        text="立即还款"
        type="warning"
        icon="rmb"
        custom-style="flex: 1;"
        @click="showRepayPopup = true"
      ></u-button>
    </view>

    <view class="record-section">
      <view class="section-header">
        <text class="title">账单记录</text>
      </view>
      <scroll-view scroll-y class="record-list" :style="{ height: recordListHeight + 'px' }">
        <view v-if="loading && records.length === 0" class="loading">
          <u-loading-icon></u-loading-icon>
        </view>
        <view v-else-if="records.length === 0" class="empty">
          <u-empty text="暂无账单记录"></u-empty>
        </view>
        <view v-else>
          <view v-for="record in records" :key="record._id" class="record-item">
            <view class="record-left">
              <text :class="['type-tag', record.type]">
                {{ record.type === 'borrow' ? '赊账' : '还款' }}
              </text>
              <text class="date">{{ formatDate(record.created_at) }}</text>
            </view>
            <text :class="['record-amount', record.type]">
              {{ record.type === 'borrow' ? '+' : '-' }}¥{{ formatAmount(record.amount) }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <u-popup
      :show="showRepayPopup"
      mode="bottom"
      border-radius="20"
      @close="showRepayPopup = false"
    >
      <view class="repay-popup">
        <view class="popup-header">
          <text class="popup-title">还款</text>
          <u-icon name="close" @click="showRepayPopup = false"></u-icon>
        </view>
        <view class="popup-body">
          <view class="input-group">
            <text class="input-label">还款金额</text>
            <u-input v-model="repayAmount" type="digit" placeholder="请输入还款金额" prefix="¥" />
          </view>
          <u-button text="确认还款" type="primary" @click="handleRepay"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'

const customerId = uni.getStorageSync('customer_id')

const totalDebt = ref(0)
const totalPaid = ref(0)
const records = ref<any[]>([])
const loading = ref(false)
const showRepayPopup = ref(false)
const repayAmount = ref('')
const recordListHeight = ref(400)

const formatAmount = (fen: number) => priceHelper.format(fen)
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchData = async () => {
  if (!customerId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const db = uniCloud.database()
    const customer = await db.collection('wh_customers').doc(customerId).get()
    if (customer.data) {
      totalDebt.value = customer.data.total_debt || 0
    }

    const logs = await db
      .collection('wh_debt_logs')
      .where({ customer_id: customerId })
      .orderBy('created_at', 'desc')
      .limit(50)
      .get()
    records.value = logs.data || []

    totalPaid.value = records.value
      .filter(r => r.type === 'repay')
      .reduce((sum, r) => sum + r.amount, 0)
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const requestCredit = () => {
  uni.showModal({
    title: '申请赊账',
    content: '请联系商家为您增加赊账额度',
    showCancel: false
  })
}

const handleRepay = async () => {
  const amount = parseFloat(repayAmount.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }

  const customerCo = uniCloud.importObject('wh-customer-co')

  try {
    const res: any = await customerCo.repay({
      customer_id: customerId,
      amount: Math.round(amount * 100)
    })
    if (res.code === 0) {
      showRepayPopup.value = false
      repayAmount.value = ''
      uni.showToast({ title: '还款成功', icon: 'success' })
      fetchData()
    } else {
      uni.showToast({ title: res.msg || '还款失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '还款失败', icon: 'none' })
  }
}

onShow(() => {
  fetchData()
})

const getSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  recordListHeight.value = systemInfo.windowHeight - 520
}
getSystemInfo()
</script>

<style lang="scss" scoped>
.assets-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.debt-card {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;

  .debt-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  .label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 28rpx;
  }

  .tip {
    color: rgba(255, 255, 255, 0.7);
    font-size: 24rpx;
  }

  .amount-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 16rpx;

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

  .info-row .info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 26rpx;
  }
}

.action-bar {
  display: flex;
  margin-bottom: 24rpx;
}

.record-section {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;

  .section-header {
    margin-bottom: 20rpx;

    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .record-list {
    max-height: 600rpx;
  }

  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }
  }

  .record-left {
    display: flex;
    flex-direction: column;
  }

  .type-tag {
    font-size: 28rpx;
    font-weight: 500;
    margin-bottom: 8rpx;

    &.borrow {
      color: #ff9900;
    }

    &.repay {
      color: #07c160;
    }
  }

  .date {
    font-size: 24rpx;
    color: #999;
  }

  .record-amount {
    font-size: 32rpx;
    font-weight: bold;

    &.borrow {
      color: #ff4d4f;
    }

    &.repay {
      color: #07c160;
    }
  }
}

.repay-popup {
  padding: 32rpx;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .popup-title {
      font-size: 34rpx;
      font-weight: bold;
    }
  }

  .popup-body {
    .input-group {
      margin-bottom: 32rpx;

      .input-label {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 16rpx;
        display: block;
      }
    }
  }
}
</style>
