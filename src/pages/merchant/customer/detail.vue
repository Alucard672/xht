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
          <text class="label">当前欠款</text>
          <text class="amount" :class="{ danger: customer.total_debt > 0 }">
            ¥{{ (customer.total_debt / 100).toFixed(2) }}
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
      <view class="section-title">欠款明细</view>
      <view class="log-list">
        <view v-for="log in logs" :key="log._id" class="log-item card-box">
          <view class="log-left">
            <view class="type-name">{{ getTypeText(log) }}</view>
            <view class="log-time">{{ formatDate(log.create_time) }}</view>
            <view v-if="log.remark" class="log-remark">{{ log.remark }}</view>
          </view>
          <view class="log-right" :class="log.amount > 0 ? 'plus' : 'minus'">
            {{ log.amount > 0 ? '+' : '' }}{{ (log.amount / 100).toFixed(2) }}
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
.customer-detail-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.header-card {
  background-color: #fff;
  padding: 40rpx;
  border-radius: 20rpx;
  margin-bottom: 30rpx;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;

    .alias {
      font-size: 40rpx;
      font-weight: bold;
      color: #333;
    }
    .phone-link {
      display: flex;
      align-items: center;
      gap: 10rpx;
      color: #2979ff;
      font-size: 30rpx;
    }
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .stats-item {
      display: flex;
      flex-direction: column;
      .label {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 10rpx;
      }
      .amount {
        font-size: 48rpx;
        font-weight: bold;
        color: #333;
        &.danger {
          color: #ff4d4f;
        }
      }
    }

    .stats-action {
      display: flex;
    }
  }
}

.detail-section {
  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    padding-left: 10rpx;
  }
}

.log-item {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .log-left {
    .type-name {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 8rpx;
    }
    .log-time {
      font-size: 22rpx;
      color: #999;
      margin-bottom: 4rpx;
    }
    .log-remark {
      font-size: 24rpx;
      color: #666;
      font-style: italic;
    }
  }

  .log-right {
    font-size: 36rpx;
    font-weight: bold;
    &.plus {
      color: #ff4d4f;
    }
    &.minus {
      color: #52c41a;
    }
  }
}

.card-box {
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.repay-form {
  padding: 20rpx 0;
  width: 100%;
}
</style>
