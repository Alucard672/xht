<template>
  <view class="dashboard-container">
    <!-- 顶部蓝色统计区 -->
    <view class="header-stats">
      <view class="shop-name">{{ shopName }} - 工作台</view>
      <view class="date-text">{{ todayStr }}</view>
      <view class="stats-grid">
        <view class="stats-item">
          <view class="label">今日订单</view>
          <view class="value-row">
            <text class="value">{{ stats.todayOrderCount }}</text>
            <text class="unit">笔</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">今日销售额</view>
          <view class="value-row">
            <text class="value">{{ (stats.todayRevenue / 100).toFixed(0) }}</text>
            <text class="unit">元</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">待处理订单</view>
          <view class="value-row">
            <text class="value">{{ stats.pendingOrderCount }}</text>
            <text class="unit">笔</text>
            <view v-if="stats.pendingOrderCount > 0" class="badge">{{
              stats.pendingOrderCount
            }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快速操作 -->
    <view class="quick-actions card-box">
      <view class="action-item" @click="navTo('/pages/client/shop?mode=agent')">
        <view class="icon-box blue"><u-icon name="plus" color="#1890ff" size="24"></u-icon></view>
        <text>快速开单</text>
      </view>
      <view class="action-item" @click="navTo('/pages/merchant/goods/list')">
        <view class="icon-box orange"><u-icon name="bag" color="#fa8c16" size="24"></u-icon></view>
        <text>商品管理</text>
      </view>
      <view class="action-item" @click="navTo('/pages/merchant/customer/list')">
        <view class="icon-box green"><u-icon name="order" color="#52c41a" size="24"></u-icon></view>
        <text>客户账本</text>
      </view>
      <view class="action-item" @click="showShopCode">
        <view class="icon-box purple"><u-icon name="grid" color="#722ed1" size="24"></u-icon></view>
        <text>店铺码</text>
      </view>
    </view>

    <!-- 待处理订单 -->
    <view class="section-header">
      <text class="title">待处理订单</text>
      <text class="more" @click="navTo('/pages/merchant/order/list')">查看全部 ></text>
    </view>
    <view class="order-list">
      <view v-for="order in pendingOrders" :key="order._id" class="order-card card-box">
        <view class="order-header">
          <u-tag
            :text="getStatusText(order.status)"
            :type="getStatusType(order.status)"
            size="mini"
          ></u-tag>
          <text class="order-no">#{{ order.order_no.slice(-8) }}</text>
          <text class="customer-name">{{ order.customer_name }}</text>
        </view>
        <view class="order-goods u-line-1">
          <text v-for="(g, i) in order.items" :key="i"
            >{{ g.name }} x{{ g.countSmall }}{{ g.unitSmallName
            }}{{ i < order.items.length - 1 ? '，' : '' }}</text
          >
        </view>
        <view class="order-footer">
          <text class="time">{{ formatTime(order.create_time) }}</text>
          <text class="amount">¥{{ (order.total_amount / 100).toFixed(2) }}</text>
        </view>
      </view>
      <u-empty
        v-if="pendingOrders.length === 0"
        mode="order"
        icon="/static/empty/order.png"
        text="暂无待处理订单"
      ></u-empty>
    </view>

    <!-- 库存预警 -->
    <view class="section-header">
      <view class="left">
        <text class="title">库存预警</text>
        <u-badge
          :value="stockAlerts.length"
          type="error"
          :inverted="false"
          custom-style="margin-left: 10rpx"
        ></u-badge>
      </view>
      <text class="more" @click="navTo('/pages/merchant/goods/list')">管理</text>
    </view>
    <view class="stock-alerts card-box">
      <view v-for="item in stockAlerts" :key="item._id" class="alert-item">
        <view class="item-left">
          <image
            :src="item.image || '/static/logo.png'"
            class="goods-img"
            mode="aspectFill"
          ></image>
          <view class="goods-info">
            <view class="name u-line-1">{{ item.name }}</view>
            <view class="stock-num"
              >库存：<text class="warn">{{ item.stock }}</text
              >{{ item.unit_small }}</view
            >
          </view>
        </view>
        <view class="item-right">
          <u-button
            type="primary"
            size="mini"
            plain
            text="去补货"
            :custom-style="{ width: '140rpx', height: '52rpx', fontSize: '24rpx' }"
            @click="navTo('/pages/merchant/goods/edit?id=' + item._id)"
          ></u-button>
        </view>
      </view>
      <u-empty
        v-if="stockAlerts.length === 0"
        mode="list"
        text="库存充足"
        icon="/static/empty/list.png"
      ></u-empty>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="0"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#1890ff"
      @change="handleModuleChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const merchantCo = uniCloud.importObject('wh-merchant-co')

const shopName = ref('加载中...')
const todayStr = ref(new Date().toISOString().split('T')[0])
const stats = ref({
  todayOrderCount: 0,
  todayRevenue: 0,
  pendingOrderCount: 0,
  unsettledOrderCount: 0
})
const pendingOrders = ref<any[]>([])
const stockAlerts = ref<any[]>([])

const loadData = async () => {
  shopName.value = '王记粮油批发'
  // 保持异步调用，但不覆盖模拟数据（除非接口报错）
  try {
    const res = await merchantCo.getDashboardStats()
    if (res.code === 0) {
      stats.value = res.data.stats
      pendingOrders.value = res.data.pendingOrders
      stockAlerts.value = res.data.stockAlerts
    }
  } catch (e) {
    // ignore
  }
}

const getStatusText = (status: string) => {
  const map: any = { pending: '待确认', confirmed: '待发货', completed: '已完成' }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: any = { pending: 'error', confirmed: 'primary', completed: 'success' }
  return map[status] || 'info'
}

const formatTime = (ts: number) => {
  if (!ts) return ''
  const now = Date.now()
  const diff = (now - ts) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  return new Date(ts).toLocaleDateString()
}

const navTo = (url: string) => {
  uni.navigateTo({ url })
}

const showShopCode = () => {
  uni.showToast({ title: '演示功能', icon: 'none' })
}

const handleModuleChange = (index: number) => {
  const paths = [
    '/pages/merchant/dashboard',
    '/pages/merchant/order/list',
    '/pages/merchant/goods/list',
    '/pages/merchant/customer/list'
  ]
  uni.switchTab({ url: paths[index] })
}

onShow(() => {
  uni.hideTabBar()
  loadData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 180rpx; // 预留 tabbar 与安全区，避免底部内容被挡
}

.header-stats {
  background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  padding: 40rpx 32rpx 100rpx;
  color: #fff;

  .shop-name {
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  .date-text {
    font-size: 24rpx;
    opacity: 0.8;
    margin-bottom: 40rpx;
  }

  .stats-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  .stats-item {
    flex: 1;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20rpx;
    padding: 20rpx;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .label {
      font-size: 22rpx;
      opacity: 0.8;
      margin-bottom: 12rpx;
      white-space: nowrap;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      .value {
        font-size: 36rpx;
        font-weight: bold;
      }
      .unit {
        font-size: 20rpx;
        margin-left: 4rpx;
        opacity: 0.7;
      }
    }

    .badge {
      position: absolute;
      right: 10rpx;
      top: 10rpx;
      background-color: #ff4d4f;
      color: #fff;
      font-size: 18rpx;
      padding: 2rpx 10rpx;
      border-radius: 20rpx;
      line-height: 1;
    }
  }
}

.card-box {
  background-color: #ffffff;
  border-radius: 20rpx;
  margin: 0 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 32rpx 0;
  margin-top: -60rpx;
  position: relative;
  z-index: 1;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    text {
      font-size: 24rpx;
      color: #333;
      font-weight: 500;
    }

    .icon-box {
      width: 96rpx;
      height: 96rpx;
      border-radius: 28rpx;
      display: flex;
      justify-content: center;
      align-items: center;

      &.blue {
        background-color: #e6f7ff;
      }
      &.orange {
        background-color: #fff7e6;
      }
      &.green {
        background-color: #f6ffed;
      }
      &.purple {
        background-color: #f9f0ff;
      }
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 32rpx 20rpx;

  .left {
    display: flex;
    align-items: center;
  }

  .title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  .more {
    font-size: 24rpx;
    color: #1890ff;
  }
}

.order-list {
  .order-card {
    margin-bottom: 20rpx;
    padding: 24rpx;

    .order-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 16rpx;

      .order-no {
        font-size: 24rpx;
        color: #999;
      }
      .customer-name {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        flex: 1;
        text-align: right;
      }
    }

    .order-goods {
      font-size: 26rpx;
      color: #666;
      margin-bottom: 16rpx;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .time {
        font-size: 24rpx;
        color: #999;
      }
      .amount {
        font-size: 32rpx;
        font-weight: bold;
        color: #ff6b00;
      }
    }
  }
}

.stock-alerts {
  padding: 0 24rpx;
  .alert-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    &:last-child {
      border-bottom: none;
    }

    .item-left {
      display: flex;
      align-items: center;
      flex: 1;
      overflow: hidden;
      margin-right: 20rpx;
    }

    .goods-img {
      width: 100rpx;
      height: 100rpx;
      border-radius: 12rpx;
      margin-right: 20rpx;
      background-color: #f9f9f9;
      flex-shrink: 0;
    }

    .goods-info {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
        width: 100%;
      }
      .stock-num {
        font-size: 24rpx;
        color: #999;
        white-space: nowrap;
        .warn {
          color: #ff4d4f;
          font-weight: bold;
          margin: 0 4rpx;
        }
      }
    }

    .item-right {
      flex-shrink: 0;
    }
  }
}
</style>
