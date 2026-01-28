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
        text="立即还款"
        type="primary"
        icon="rmb"
        custom-style="width: 100%;"
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
    title: '联系商家',
    content: '如需增加赊账额度，请联系商家',
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
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.assets-container {
  @include page-container-with-top($wh-spacing-lg);
}

.debt-card {
  @include card-modern;
  background: $wh-gradient-danger;
  padding: $wh-spacing-3xl;
  margin-bottom: $wh-spacing-xl;
  position: relative;
  overflow: hidden;

  // 装饰性背景元素
  &::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -10%;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  .debt-header {
    @include flex-between;
    margin-bottom: $wh-spacing-lg;
    position: relative;
    z-index: 1;
  }

  .label {
    color: rgba(255, 255, 255, 0.9);
    font-size: $wh-font-size-md;
    font-weight: $wh-font-weight-medium;
  }

  .tip {
    color: rgba(255, 255, 255, 0.7);
    font-size: $wh-font-size-sm;
    font-weight: $wh-font-weight-normal;
  }

  .amount-row {
    @include flex-start;
    align-items: baseline;
    margin-bottom: $wh-spacing-md;
    position: relative;
    z-index: 1;

    .currency {
      color: #fff;
      font-size: $wh-font-size-2xl;
      margin-right: $wh-spacing-xs;
      font-weight: $wh-font-weight-semibold;
    }

    .amount {
      color: #fff;
      @include price-text-large;
      color: #fff !important;
    }
  }

  .info-row .info {
    color: rgba(255, 255, 255, 0.8);
    font-size: $wh-font-size-sm;
    font-weight: $wh-font-weight-medium;
    position: relative;
    z-index: 1;
  }
}

.action-bar {
  margin-bottom: $wh-spacing-xl;

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

.record-section {
  @include section-base;
  padding: 0 $wh-spacing-xl;
  @include slide-in-up;

  .section-header {
    @include flex-between;
    align-items: center;
    margin-bottom: $wh-spacing-lg;
    padding: $wh-spacing-md $wh-spacing-sm;
    @include label-dot($wh-color-blue);

    .title {
      @include text-heading;
    }
  }

  .record-list {
    max-height: 600rpx;
  }

  .record-item {
    @include flex-between;
    align-items: center;
    padding: $wh-spacing-lg 0;
    border-bottom: 2rpx solid $wh-border-color-lighter;
    transition: all $wh-transition-normal;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      transform: scale(0.98);
      opacity: 0.8;
    }
  }

  .record-left {
    @include flex-column;
  }

  .type-tag {
    font-size: $wh-font-size-md;
    font-weight: $wh-font-weight-semibold;
    margin-bottom: $wh-spacing-xs;

    &.borrow {
      color: $wh-color-warning;
    }

    &.repay {
      color: $wh-color-success-modern;
    }
  }

  .date {
    font-size: $wh-font-size-xs;
    color: $wh-text-color-light-gray;
    font-weight: $wh-font-weight-normal;
  }

  .record-amount {
    font-size: $wh-font-size-lg;
    font-weight: $wh-font-weight-extrabold;

    &.borrow {
      color: $wh-color-danger-modern;
    }

    &.repay {
      color: $wh-color-success-modern;
    }
  }
}

.repay-popup {
  @include popup-content;
  padding: $wh-spacing-xxl;

  .popup-header {
    @include popup-header;
  }

  .popup-body {
    .input-group {
      margin-bottom: $wh-spacing-2xl;

      .input-label {
        @include text-subheading;
        font-size: $wh-font-size-md !important;
        color: $wh-text-color-secondary;
        margin-bottom: $wh-spacing-md;
        display: block;
        font-weight: $wh-font-weight-medium;
      }

      ::v-deep .u-input {
        background: $wh-bg-color-tertiary !important;
        border-radius: $wh-border-radius-lg !important;
        padding: $wh-spacing-sm $wh-spacing-md !important;
        font-size: $wh-font-size-md !important;
        color: $wh-text-color-dark !important;
        transition: all $wh-transition-normal !important;

        &:focus {
          background: $wh-bg-color-card !important;
          border-color: $wh-color-blue !important;
          box-shadow: 0 0 0 6rpx rgba(45, 127, 249, 0.1) !important;
        }
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
}
</style>
