<template>
  <view class="merchant-page">
    <view class="stats-bar">
      <view class="item">
        <text class="label">客户总数</text>
        <text class="val">{{ totalCount }}</text>
      </view>
      <view class="item">
        <text class="label">合计欠款</text>
        <text class="val warn">¥{{ (totalDebt / 100).toFixed(2) }}</text>
      </view>
    </view>

    <view class="list-container">
      <unicloud-db
        ref="udb"
        v-slot="{ data, loading, error, hasMore }"
        collection="wh_customers"
        :where="whereClause"
        @load="onDataLoaded"
      >
        <view v-if="loading" class="loading-box"><u-loading-icon></u-loading-icon></view>
        <view v-else-if="error" class="error-box">{{ error.message }}</view>
        <view v-else class="card-list">
          <view
            v-for="item in data.length > 0 ? data : mockCustomers"
            :key="item._id"
            class="card customer-card"
          >
            <view class="info">
              <view class="name-row">
                <text class="name">{{ item.alias }}</text>
                <text class="mobile">{{ item.mobile || '' }}</text>
              </view>
              <view class="debt-row">
                欠款:
                <text :class="{ warn: item.total_debt > 0 }"
                  >¥{{ (item.total_debt / 100).toFixed(2) }}</text
                >
              </view>
            </view>
            <view class="actions">
              <u-button
                v-if="item.total_debt > 0"
                type="warning"
                size="mini"
                text="还一笔"
                plain
                @click="openRepay(item)"
              ></u-button>
            </view>
          </view>
          <u-loadmore :status="data.length > 0 && hasMore ? 'loadmore' : 'nomore'" />
        </view>
      </unicloud-db>
    </view>

    <!-- 还款弹窗 -->
    <u-modal
      :show="repayShow"
      title="录入还款"
      show-cancel-button
      @confirm="submitRepay"
      @cancel="repayShow = false"
    >
      <view class="repay-form">
        <u-form label-width="140rpx">
          <u-form-item label="还款金额">
            <u-input v-model="repayAmount" type="digit" placeholder="元" border="bottom"></u-input>
          </u-form-item>
          <u-form-item label="备注">
            <u-input v-model="repayRemark" placeholder="可选" border="bottom"></u-input>
          </u-form-item>
        </u-form>
      </view>
    </u-modal>

    <!-- 底部导航 -->
    <u-tabbar
      :value="3"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#1890ff"
      @change="handleTabChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tenant_id = uni.getStorageSync('tenant_id')
const udb = ref(null)
const totalCount = ref(0)
const totalDebt = ref(0)

const mockCustomers = [
  { _id: 'c1', alias: '李老板 (李四)', mobile: '13800001111', total_debt: 50000 },
  { _id: 'c2', alias: '张小店', mobile: '13911112222', total_debt: 12500 },
  { _id: 'c3', alias: '王便利店', mobile: '13733334444', total_debt: 0 },
  { _id: 'c4', alias: '赵记副食', mobile: '13655556666', total_debt: 89000 },
  { _id: 'c5', alias: '陈氏批发', mobile: '13577778888', total_debt: 0 }
]

const whereClause = `tenant_id == "${tenant_id}"`

const onDataLoaded = (data: any[]) => {
  const displayData = data.length > 0 ? data : mockCustomers
  totalCount.value = displayData.length
  totalDebt.value = displayData.reduce((sum, item) => sum + (item.total_debt || 0), 0)
}

// 还款逻辑
const repayShow = ref(false)
const currentCustomer = ref<any>(null)
const repayAmount = ref('')
const repayRemark = ref('')

const openRepay = (customer: any) => {
  currentCustomer.value = customer
  repayAmount.value = (customer.total_debt / 100).toFixed(2)
  repayRemark.value = ''
  repayShow.value = true
}

const submitRepay = async () => {
  const amountFen = Math.round(parseFloat(repayAmount.value) * 100)
  if (isNaN(amountFen) || amountFen <= 0) {
    return uni.showToast({ title: '金额不正确', icon: 'none' })
  }

  try {
    const merchantCo = uniCloud.importObject('wh-merchant-co')
    await merchantCo.repay({
      customer_id: currentCustomer.value._id,
      amount: amountFen,
      remark: repayRemark.value
    })
    uni.showToast({ title: '还款成功' })
    repayShow.value = false
    // @ts-ignore
    udb.value.refresh()
  } catch (e: any) {
    uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
  }
}

const handleTabChange = (index: number) => {
  if (index === 3) return
  const paths = [
    '/pages/merchant/dashboard',
    '/pages/merchant/order/list',
    '/pages/merchant/goods/list',
    '/pages/merchant/customer/list'
  ]
  uni.redirectTo({ url: paths[index] })
}
</script>

<style lang="scss" scoped>
.merchant-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 180rpx; // 预留 tabbar 与安全区
}

.stats-bar {
  display: flex;
  background-color: #fff;
  padding: 32rpx;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 10;
  .item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    .label {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }
    .val {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    .warn {
      color: #ff4d4f;
    }
  }
}

.list-container {
  padding: 24rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .info {
    .name-row {
      display: flex;
      align-items: baseline;
      gap: 12rpx;
      margin-bottom: 8rpx;
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      .mobile {
        font-size: 24rpx;
        color: #999;
      }
    }
    .debt-row {
      font-size: 26rpx;
      color: #666;
      .warn {
        color: #ff4d4f;
        font-weight: bold;
      }
    }
  }
}

.repay-form {
  padding: 20rpx;
  width: 100%;
}
</style>
