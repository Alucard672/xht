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
  totalMerchants: 125,
  activeMerchants: 98,
  totalCustomers: 3400,
  totalOrders: 45700,
  totalRevenue: 895000000,
  growthRate: '+12.5%'
})
const trends = ref<any[]>([
  { month: '12月', merchants: 125, orders: 45680, revenue: 895000000, growth: '+9.1%' },
  { month: '11月', merchants: 118, orders: 42500, revenue: 820000000, growth: '+6.8%' },
  { month: '10月', merchants: 112, orders: 39200, revenue: 768000000, growth: '+8.9%' },
  { month: '9月', merchants: 105, orders: 36800, revenue: 705000000, growth: '+15.6%' },
  { month: '8月', merchants: 92, orders: 32100, revenue: 610000000, growth: '+17.3%' },
  { month: '7月', merchants: 85, orders: 28500, revenue: 520000000, growth: '0.0%' }
])
const topMerchants = ref<any[]>([
  { _id: '1', name: '王记粮油批发', order_count: 2580, total_revenue: 51200000 },
  { _id: '2', name: '李氏日用百货', order_count: 2340, total_revenue: 46800000 },
  { _id: '3', name: '张家食品批发', order_count: 2120, total_revenue: 42500000 },
  { _id: '4', name: '刘记副食', order_count: 1980, total_revenue: 39600000 },
  { _id: '5', name: '陈氏批发部', order_count: 1850, total_revenue: 37000000 }
])

const loadData = async () => {
  try {
    const res = await adminCo.getPlatformStats()
    if (res.code === 0 && res.data.trends.length > 0) {
      summary.value = res.data.summary
      trends.value = res.data.trends
      topMerchants.value = res.data.topMerchants
    }
  } catch (e: any) {
    // ignore
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
