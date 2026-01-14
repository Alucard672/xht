<template>
  <view class="admin-container">
    <!-- 顶部综合统计区 -->
    <view class="header-stats">
      <view class="stats-row">
        <view class="stats-card purple">
          <view class="label">总商户数</view>
          <view class="value">{{ summary.totalMerchants }}</view>
          <view class="sub">活跃: {{ summary.activeMerchants }} 家</view>
        </view>
        <view class="stats-card blue">
          <view class="label">总客户数</view>
          <view class="value">{{ formatCount(summary.totalCustomers) }}</view>
          <view class="sub">全平台客户</view>
        </view>
      </view>
      <view class="stats-row" style="margin-top: 20rpx">
        <view class="stats-card green">
          <view class="label">平台总营业额</view>
          <view class="value">¥{{ formatAmount(summary.totalRevenue) }}</view>
          <view class="sub">累计收入</view>
        </view>
        <view class="stats-card orange">
          <view class="label">月度增长率</view>
          <view class="value">{{ summary.growthRate }}</view>
          <view class="sub">环比上月</view>
        </view>
      </view>
    </view>

    <!-- 月度趋势 -->
    <view class="section-title">月度数据趋势 (最近3个月)</view>
    <view class="card-box">
      <view class="trend-table">
        <view class="tr th">
          <text class="td">月份</text>
          <text class="td">商户数</text>
          <text class="td">订单量</text>
          <text class="td">营业额</text>
        </view>
        <view v-for="item in trends" :key="item.month" class="tr">
          <text class="td">{{ item.month }}</text>
          <text class="td">{{ item.merchants }}</text>
          <text class="td">{{ formatCount(item.orders) }}</text>
          <text class="td">¥{{ formatAmount(item.revenue) }}</text>
        </view>
      </view>
    </view>

    <!-- TOP 商户 -->
    <view class="section-title">TOP 商户排行 (按订单量)</view>
    <view class="card-box">
      <view class="rank-list">
        <view v-for="(item, index) in topMerchants" :key="item._id" class="rank-item">
          <view class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
          <view class="rank-info">
            <view class="name">{{ item.name }}</view>
            <view class="sub">订单量: {{ item.order_count }} 笔</view>
          </view>
          <view class="rank-value">
            <view class="amount">¥{{ formatAmount(item.total_revenue) }}</view>
            <view class="label">营业额</view>
          </view>
        </view>
      </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="2"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#722ed1"
      @change="handleTabChange"
    >
      <u-tabbar-item text="商户管理" icon="home"></u-tabbar-item>
      <u-tabbar-item text="员工管理" icon="account"></u-tabbar-item>
      <u-tabbar-item text="数据统计" icon="integral"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const adminCo = uniCloud.importObject('wh-admin-co')

const summary = ref({
    totalMerchants: 0,
    activeMerchants: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    growthRate: '0%'
})
const trends = ref<any[]>([])
const topMerchants = ref<any[]>([])
const loading = ref(false)

const loadData = async () => {
    loading.value = true
    try {
        const res: any = await adminCo.getPlatformStats()
        if (res.code === 0 && res.data) {
            summary.value = res.data.summary || summary.value
            trends.value = res.data.trends || []
            topMerchants.value = res.data.topMerchants || []
        }
    } catch (e: any) {
        console.error('Load statistics failed:', e)
    } finally {
        loading.value = false
    }
}

const formatCount = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

const formatAmount = (fen: number) => {
  if (!fen) return '0.00'
  if (fen >= 1000000) return (fen / 1000000).toFixed(2) + 'M'
  return (fen / 100).toFixed(2)
}

const handleTabChange = (index: number) => {
  if (index === 2) return
  const paths = [
    '/pages/admin/merchant/list',
    '/pages/admin/employee/list',
    '/pages/admin/statistics/index'
  ]
  uni.redirectTo({ url: paths[index] })
}

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.header-stats {
  background: linear-gradient(180deg, #722ed1 0%, #531dab 100%);
  padding: 40rpx 32rpx;

  .stats-row {
    display: flex;
    gap: 20rpx;
  }

  .stats-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    padding: 24rpx;

    .label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 24rpx;
      margin-bottom: 12rpx;
    }

    .value {
      color: #ffffff;
      font-size: 40rpx;
      font-weight: bold;
      margin-bottom: 8rpx;
    }

    .sub {
      color: rgba(255, 255, 255, 0.6);
      font-size: 22rpx;
    }
  }
}

.section-title {
  padding: 32rpx 32rpx 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.card-box {
  background-color: #ffffff;
  margin: 0 32rpx;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.trend-table {
  .tr {
    display: flex;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &.th .td {
      font-weight: bold;
      color: #333;
      font-size: 26rpx;
    }

    .td {
      flex: 1;
      text-align: center;
      font-size: 26rpx;
      color: #666;

      &:first-child {
        text-align: left;
      }
      &:last-child {
        text-align: right;
      }
    }
  }
}

.rank-list {
  .rank-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .rank-num {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background-color: #f5f5f5;
      color: #999;
      font-size: 24rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 24rpx;

      &.rank-1 {
        background-color: #ff4d4f;
        color: #fff;
      }
      &.rank-2 {
        background-color: #ff7a45;
        color: #fff;
      }
      &.rank-3 {
        background-color: #ffc53d;
        color: #fff;
      }
    }

    .rank-info {
      flex: 1;
      .name {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
      .sub {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }

    .rank-value {
      text-align: right;
      .amount {
        font-size: 28rpx;
        color: #722ed1;
        font-weight: bold;
      }
      .label {
        font-size: 22rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }
  }
}
</style>
