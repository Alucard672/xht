<template>
  <view class="debt-add-container">
    <!-- 选择客户 -->
    <view class="section-card">
      <view class="section-title">选择客户</view>
      <view v-if="!selectedCustomer" class="select-customer" @click="showCustomerPicker = true">
        <u-icon name="plus" size="24" color="#07c160"></u-icon>
        <text class="select-text">点击选择客户</text>
      </view>
      <view v-else class="selected-customer" @click="showCustomerPicker = true">
        <view class="customer-avatar">
          <u-icon name="account" size="28" color="#07c160"></u-icon>
        </view>
        <view class="customer-info">
          <text class="customer-name">{{ selectedCustomer.alias || selectedCustomer.phone }}</text>
          <text class="customer-debt"
            >当前欠款: ¥{{ priceHelper.format(selectedCustomer.total_debt) }}</text
          >
        </view>
        <u-icon name="arrow-right" size="16" color="#999"></u-icon>
      </view>
    </view>

    <!-- 记账类型 -->
    <view class="section-card">
      <view class="section-title">记账类型</view>
      <view class="type-selector">
        <view
          :class="['type-btn', debtType === 'borrow' ? 'active borrow' : '']"
          @click="debtType = 'borrow'"
        >
          <u-icon name="plus-circle" size="20" color="#ff4d4f"></u-icon>
          <text>记一笔赊账</text>
        </view>
        <view
          :class="['type-btn', debtType === 'repay' ? 'active repay' : '']"
          @click="debtType = 'repay'"
        >
          <u-icon name="minus-circle" size="20" color="#07c160"></u-icon>
          <text>记一笔还款</text>
        </view>
      </view>
    </view>

    <!-- 金额 -->
    <view class="section-card">
      <view class="section-title">{{ debtType === 'borrow' ? '赊账金额' : '还款金额' }}</view>
      <view class="amount-input-wrapper">
        <text class="prefix">¥</text>
        <input
          v-model="amount"
          class="amount-input"
          type="digit"
          placeholder="0.00"
          @input="handleAmountInput"
        />
      </view>
      <view class="preset-amounts">
        <view
          v-for="preset in presetAmounts"
          :key="preset"
          :class="['preset-btn', amount == preset ? 'active' : '']"
          @click="amount = preset"
        >
          {{ priceHelper.format(preset) }}
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="section-card">
      <view class="section-title">备注说明</view>
      <textarea
        v-model="remark"
        class="remark-input"
        placeholder="请输入备注（如：货款、运费等）"
        maxlength="100"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <u-button
        type="primary"
        :text="debtType === 'borrow' ? '确认赊账' : '确认还款'"
        :loading="submitting"
        :disabled="!isValid"
        custom-style="border-radius: 60rpx;"
        @click="submitDebt"
      ></u-button>
    </view>

    <!-- 客户选择弹窗 -->
    <u-popup
      :show="showCustomerPicker"
      mode="bottom"
      border-radius="20"
      @close="showCustomerPicker = false"
    >
      <view class="customer-picker">
        <view class="picker-header">
          <text class="picker-title">选择客户</text>
          <u-icon name="close" @click="showCustomerPicker = false"></u-icon>
        </view>
        <view class="search-box">
          <u-search
            v-model="searchKeyword"
            placeholder="搜索客户名称或电话"
            :show-action="false"
            @search="searchCustomers"
            @clear="searchCustomers"
          />
        </view>
        <scroll-view scroll-y class="customer-list">
          <view v-if="loadingCustomers" class="loading-state">
            <u-loading-icon></u-loading-icon>
          </view>
          <view v-else-if="customerList.length === 0" class="empty-state">
            <u-empty text="暂无客户"></u-empty>
          </view>
          <view
            v-for="customer in customerList"
            :key="customer._id"
            :class="['customer-item', selectedCustomer?._id === customer._id ? 'selected' : '']"
            @click="selectCustomer(customer)"
          >
            <view class="customer-avatar">
              <u-icon name="account" size="24" color="#07c160"></u-icon>
            </view>
            <view class="customer-info">
              <text class="customer-name">{{ customer.alias || customer.phone }}</text>
              <text class="customer-phone">{{ customer.phone }}</text>
            </view>
            <view class="customer-debt">
              <text class="debt-label">欠款</text>
              <text class="debt-value">¥{{ priceHelper.format(customer.total_debt) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const customerCo = importObject('wh-customer-co')
const toastRef = ref<any>(null)

const selectedCustomer = ref<any>(null)
const debtType = ref<'borrow' | 'repay'>('borrow')
const amount = ref('')
const remark = ref('')
const submitting = ref(false)
const showCustomerPicker = ref(false)
const searchKeyword = ref('')
const customerList = ref<any[]>([])
const loadingCustomers = ref(false)

// 读取URL参数，设置默认类型
onLoad(options => {
  if (options?.type === 'repay' || options?.type === 'borrow') {
    debtType.value = options.type
  }
})

// 监听debtType变化，动态更新导航栏标题
watch(
  debtType,
  newType => {
    uni.setNavigationBarTitle({
      title: newType === 'repay' ? '快速收款' : '记账'
    })
  },
  { immediate: true }
)

const presetAmounts = [100, 200, 500, 1000, 2000, 5000]

const isValid = computed(() => {
  const amountVal = parseFloat(amount.value)
  return selectedCustomer.value && amountVal && amountVal > 0
})

const handleAmountInput = (e: any) => {
  const value = e.detail.value
  if (value && isNaN(parseFloat(value))) {
    amount.value = ''
  }
}

const searchCustomers = async () => {
  loadingCustomers.value = true
  try {
    const res: any = await customerCo.getCustomerList({
      keyword: searchKeyword.value,
      page: 1,
      limit: 50
    })
    if (res.code === 0) {
      customerList.value = res.data.list || []
    }
  } catch (e: any) {
    console.error('Search customers failed:', e)
  } finally {
    loadingCustomers.value = false
  }
}

const selectCustomer = (customer: any) => {
  selectedCustomer.value = customer
  showCustomerPicker.value = false
}

const submitDebt = async () => {
  if (!isValid.value) return

  const amountFen = Math.round(parseFloat(amount.value) * 100)
  submitting.value = true

  try {
    let res: any
    if (debtType.value === 'borrow') {
      res = await customerCo.repayDebt({
        customer_id: selectedCustomer.value._id,
        amount: -amountFen,
        remark: remark.value || (debtType.value === 'borrow' ? '手动赊账' : '手动还款')
      })
    } else {
      res = await customerCo.repayDebt({
        customer_id: selectedCustomer.value._id,
        amount: amountFen,
        remark: remark.value || (debtType.value === 'borrow' ? '手动赊账' : '手动还款')
      })
    }

    if (res.code === 0) {
      toastRef.value?.show({
        type: 'success',
        message: debtType.value === 'borrow' ? '赊账成功' : '还款成功'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      toastRef.value?.show({
        type: 'error',
        message: res.msg || '操作失败'
      })
    }
  } catch (e: any) {
    toastRef.value?.show({
      type: 'error',
      message: e.message || '操作失败'
    })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  searchCustomers()
})
</script>

<style lang="scss" scoped>
.debt-add-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 200rpx;
}

.section-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
}

.select-customer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  background-color: #fafafa;

  .select-text {
    margin-left: 12rpx;
    color: #07c160;
    font-size: 28rpx;
  }
}

.selected-customer {
  display: flex;
  align-items: center;
  padding: 16rpx;
  border: 2rpx solid #07c160;
  border-radius: 16rpx;
  background-color: #f6ffed;

  .customer-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;
  }

  .customer-info {
    flex: 1;

    .customer-name {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
      display: block;
    }

    .customer-debt {
      font-size: 24rpx;
      color: #ff4d4f;
      margin-top: 4rpx;
      display: block;
    }
  }
}

.type-selector {
  display: flex;
  gap: 20rpx;

  .type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background-color: #f5f5f5;
    font-size: 28rpx;
    color: #666;
    border: 2rpx solid transparent;

    &.active {
      &.borrow {
        background-color: #fff2f0;
        border-color: #ff4d4f;
        color: #ff4d4f;
      }

      &.repay {
        background-color: #f6ffed;
        border-color: #07c160;
        color: #07c160;
      }
    }
  }
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .prefix {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    margin-right: 8rpx;
  }

  .amount-input {
    flex: 1;
    font-size: 48rpx;
    font-weight: bold;
  }
}

.preset-amounts {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;

  .preset-btn {
    padding: 16rpx 24rpx;
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

.remark-input {
  width: 100%;
  height: 160rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.customer-picker {
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1rpx solid #f5f5f5;

    .picker-title {
      font-size: 32rpx;
      font-weight: bold;
    }
  }

  .search-box {
    padding: 20rpx 24rpx;
  }

  .customer-list {
    flex: 1;
    max-height: 50vh;
    padding: 0 24rpx;
  }

  .loading-state,
  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60rpx 0;
  }

  .customer-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &.selected {
      background-color: #f6ffed;
      margin: 0 -24rpx;
      padding: 24rpx;
    }

    &:last-child {
      border-bottom: none;
    }

    .customer-avatar {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
    }

    .customer-info {
      flex: 1;

      .customer-name {
        font-size: 28rpx;
        color: #333;
        display: block;
      }

      .customer-phone {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
        display: block;
      }
    }

    .customer-debt {
      text-align: right;

      .debt-label {
        font-size: 22rpx;
        color: #999;
        display: block;
      }

      .debt-value {
        font-size: 28rpx;
        color: #ff4d4f;
        font-weight: 500;
      }
    }
  }
}
</style>
