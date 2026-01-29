<template>
  <view class="customer-detail-container">
    <view class="header-card card-box">
      <view class="info-row">
        <view class="alias">{{ customer.alias }}</view>
        <view v-if="customer.phone" class="phone-link" @click="makePhoneCall">
          <u-icon name="phone-fill" color="#2979ff" size="20"></u-icon>
          <text>{{ customer.phone }}</text>
        </view>
      </view>
      <view class="stats-row">
        <view class="stats-item">
          <text class="label">账户余额</text>
          <text
            class="amount"
            :class="{
              danger: customer.total_debt > 0,
              success: customer.total_debt < 0
            }"
          >
            ¥{{ Math.abs(customer.total_debt / 100).toFixed(2) }}
          </text>
          <text
            v-if="customer.total_debt !== 0"
            class="balance-tag"
            :class="{ debt: customer.total_debt > 0, credit: customer.total_debt < 0 }"
          >
            {{ customer.total_debt > 0 ? '欠款' : '有余额' }}
          </text>
        </view>
        <view class="stats-action">
          <u-button
            type="primary"
            size="small"
            text="录入还款"
            @click="showRepay = true"
          ></u-button>
          <u-button
            text="修改信息"
            size="small"
            plain
            custom-style="margin-left: 20rpx"
            @click="goEdit"
          ></u-button>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-title">账户明细</view>
      <view class="log-list">
        <view v-for="log in logs" :key="log._id" class="log-item card-box">
          <view class="log-left">
            <view class="type-name">{{ getTypeText(log) }}</view>
            <view class="log-time">{{ formatDate(log.create_time) }}</view>
            <view v-if="log.remark" class="log-remark">{{ log.remark }}</view>
          </view>
          <view class="log-right" :class="getAmountClass(log)">
            {{ formatAmount(log) }}
          </view>
        </view>
        <u-empty v-if="logs.length === 0" mode="data" text="暂无记录" />
      </view>
    </view>

    <!-- 还款弹窗 -->
    <u-modal
      :show="showRepay"
      title="录入还款"
      show-cancel-button
      @cancel="showRepay = false"
      @confirm="handleRepay"
    >
      <view class="repay-form">
        <u-input
          v-model="repayForm.amount"
          type="digit"
          placeholder="请输入还款金额"
          prefix-icon="rmb"
          border="bottom"
        />
        <u-input
          v-model="repayForm.remark"
          placeholder="还款备注(可选)"
          border="bottom"
          custom-style="margin-top: 20rpx"
        />
      </view>
    </u-modal>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { priceHelper } from '@/common/price-helper'

const customerCo = importObject('wh-customer-co')
const customer_id = ref('')
const customer = ref<any>({})
const logs = ref<any[]>([])
const showRepay = ref(false)

const repayForm = reactive({
  amount: '',
  remark: ''
})

onLoad(options => {
  if (options && options.id) {
    customer_id.value = options.id
    loadData()
  }
})

const loadData = async () => {
  try {
    const res = await customerCo.getCustomerDetail(customer_id.value)
    if (res.code === 0) {
      customer.value = res.data.info
      logs.value = res.data.recentLogs
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const getTypeText = (log: any) => {
  const map: any = {
    order: '订单支付',
    repayment: '客户还款',
    adjust: '手动调整'
  }
  return map[log.type] || '变动记录'
}

const formatAmount = (log: any) => {
  const amount = -(log.amount / 100) // 取反：存储逻辑 → 显示逻辑
  const prefix = amount > 0 ? '+' : ''
  return `${prefix}${amount.toFixed(2)}`
}

const getAmountClass = (log: any) => {
  const displayAmount = -log.amount // 取反后判断
  return displayAmount > 0 ? 'plus' : 'minus'
}

const formatDate = (ts: any) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
}

const makePhoneCall = () => {
  uni.makePhoneCall({ phoneNumber: customer.value.phone })
}

const goEdit = () => {
  uni.navigateTo({ url: `/pages/merchant/customer/edit?id=${customer_id.value}` })
}

const handleRepay = async () => {
  if (!repayForm.amount || parseFloat(repayForm.amount) <= 0) {
    return uni.showToast({ title: '金额不正确', icon: 'none' })
  }

  try {
    const res = await customerCo.repayDebt({
      customer_id: customer_id.value,
      amount: priceHelper.toFen(repayForm.amount),
      remark: repayForm.remark
    })
    if (res.code === 0) {
      uni.showToast({ title: '录入成功' })
      showRepay.value = false
      repayForm.amount = ''
      repayForm.remark = ''
      loadData()
    } else {
      uni.showToast({ title: res.msg, icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.customer-detail-container {
  background: $wh-bg-color-gradient;
  min-height: 100vh;
  padding: $wh-spacing-lg $wh-spacing-lg 180rpx;
}

.header-card {
  @include card-modern;
  padding: $wh-spacing-xxl;
  margin-bottom: $wh-spacing-lg;
  background: linear-gradient(135deg, $wh-bg-color-card 0%, $wh-color-blue-light 100%);
  border: 2rpx solid rgba(45, 127, 249, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(45, 127, 249, 0.08) 0%, transparent 70%);
    border-radius: 50%;
  }

  .info-row {
    @include flex-between;
    align-items: center;
    margin-bottom: $wh-spacing-3xl;
    position: relative;
    z-index: 1;

    .alias {
      font-size: $wh-font-size-3xl;
      font-weight: $wh-font-weight-extrabold;
      color: $wh-text-color-dark;
      letter-spacing: 0.5rpx;
    }
    .phone-link {
      @include flex-start;
      gap: $wh-spacing-sm;
      color: $wh-color-blue;
      font-size: $wh-font-size-lg;
      font-weight: $wh-font-weight-semibold;
      padding: $wh-spacing-sm $wh-spacing-md;
      border-radius: $wh-border-radius-full;
      background: $wh-color-blue-light-bg;
      transition: all $wh-transition-normal;

      &:active {
        background: rgba(45, 127, 249, 0.15);
        transform: scale(0.98);
      }
    }
  }

  .stats-row {
    @include flex-between;
    align-items: flex-end;

    .stats-item {
      @include flex-column;
      .label {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-gray;
        margin-bottom: $wh-spacing-sm;
        font-weight: $wh-font-weight-medium;
        letter-spacing: 0.5rpx;
      }
      .amount {
        @include price-text-large;
        color: $wh-text-color-dark;
        &.danger {
          background: $wh-gradient-price;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        &.success {
          color: $wh-color-success-modern;
        }
      }
      .balance-tag {
        font-size: $wh-font-size-xs;
        padding: 4rpx $wh-spacing-sm;
        border-radius: $wh-border-radius-full;
        margin-left: $wh-spacing-xs;
        font-weight: $wh-font-weight-semibold;
        &.debt {
          color: $wh-color-danger-modern;
          background: rgba(255, 77, 79, 0.1);
          border: 1rpx solid rgba(255, 77, 79, 0.3);
        }
        &.credit {
          color: $wh-color-success-modern;
          background: rgba(52, 199, 89, 0.1);
          border: 1rpx solid rgba(52, 199, 89, 0.3);
        }
      }
    }

    .stats-action {
      @include flex-start;
      gap: $wh-spacing-sm;

      ::v-deep .u-button {
        border-radius: $wh-border-radius-full !important;
        font-weight: $wh-font-weight-semibold !important;
        transition: all $wh-transition-normal !important;

        &:active {
          transform: scale(0.95) !important;
        }
      }
    }
  }
}

.detail-section {
  .section-title {
    @include text-heading;
    margin-bottom: $wh-spacing-lg;
    padding-left: $wh-spacing-sm;
    letter-spacing: 0.3rpx;
    @include label-dot($wh-color-blue);
  }
}

.log-item {
  @include card-modern;
  margin-bottom: $wh-spacing-md;
  padding: $wh-spacing-xl;
  @include slide-in-up;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4rpx solid transparent;

  &.plus {
    border-left-color: $wh-color-success-modern;
  }

  &.minus {
    border-left-color: $wh-color-danger-modern;
  }

  .log-left {
    flex: 1;
    margin-right: $wh-spacing-md;

    .type-name {
      font-size: $wh-font-size-lg;
      font-weight: $wh-font-weight-semibold;
      color: $wh-text-color-dark;
      margin-bottom: $wh-spacing-xs;
      letter-spacing: 0.3rpx;
    }
    .log-time {
      font-size: $wh-font-size-xs;
      color: $wh-text-color-light-gray;
      margin-bottom: $wh-spacing-xs;
      font-weight: $wh-font-weight-medium;
    }
    .log-remark {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-secondary;
      font-style: italic;
      font-weight: $wh-font-weight-normal;
    }
  }

  .log-right {
    @include price-text-medium;
    flex-shrink: 0;
    &.plus {
      color: $wh-color-success-modern;
    }
    &.minus {
      background: $wh-gradient-price;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

.card-box {
  box-shadow: $wh-shadow-sm;
}

.repay-form {
  padding: $wh-spacing-lg 0;
  width: 100%;

  ::v-deep .u-input {
    .u-input__content {
      font-size: $wh-font-size-md !important;
      color: $wh-text-color-dark !important;
    }
  }
}
</style>
