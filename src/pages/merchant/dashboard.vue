<template>
  <view class="dashboard-container">
    <!-- 过期提示横幅 -->
    <view v-if="isExpired" class="expired-banner">
      <view class="banner-content">
        <u-icon name="info-circle" color="#fff" size="20"></u-icon>
        <text class="banner-text">您的店铺已过期，请尽快续费以避免影响正常经营</text>
      </view>
      <view class="banner-btn" @click="goToRenew">
        <text>立即续费</text>
        <u-icon name="arrow-right" color="#fff" size="14"></u-icon>
      </view>
    </view>

    <!-- 即将过期提示 (7天内) -->
    <view v-else-if="willExpireSoon && expireDays <= 7" class="expire-soon-banner">
      <view class="banner-content">
        <u-icon name="clock" color="#fff" size="20"></u-icon>
        <text class="banner-text">您的店铺将于 {{ expireDays }} 天后过期</text>
      </view>
      <view class="banner-btn" @click="goToRenew">
        <text>续费</text>
        <u-icon name="arrow-right" color="#fff" size="14"></u-icon>
      </view>
    </view>

    <!-- 即将过期提示 (8-30天) -->
    <view v-else-if="willExpireSoon" class="expire-soon-banner-light">
      <view class="banner-content">
        <u-icon name="info-circle" color="#1890ff" size="20"></u-icon>
        <text class="banner-text">您的店铺将于 {{ expireDays }} 天后过期</text>
      </view>
      <view class="banner-btn" @click="goToRenew">
        <text>续费</text>
        <u-icon name="arrow-right" color="#1890ff" size="14"></u-icon>
      </view>
    </view>

    <!-- 顶部蓝色统计区 -->
    <view class="header-stats" :class="{ 'header-expanded': isExpired || willExpireSoon }">
      <view class="header-top">
        <view class="shop-name">{{ shopName }} - 工作台</view>
        <view class="setting-btn" @click="navTo('/pages/merchant/store')">
          <u-icon name="setting" color="#fff" size="24"></u-icon>
        </view>
      </view>
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
      <view class="action-item" @click="navTo('/pages/merchant/order/create')">
        <view class="icon-box blue"><u-icon name="plus" color="#07c160" size="24"></u-icon></view>
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
            }}{{ i !== order.items.length - 1 ? '，' : '' }}</text
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

    <!-- 底部导航 -->
    <u-tabbar
      :value="0"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#07c160"
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
import { ref, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'
import { merchantRouteGuard } from '@/utils/routeGuard'

const merchantCo = uniCloud.importObject('wh-merchant-co')
const userStore = useUserStore()

const shopName = ref('加载中...')
const todayStr = ref(new Date().toISOString().split('T')[0])
const isExpired = ref(false)
const willExpireSoon = ref(false)
const expireDays = ref(0)
const expiredAt = ref<number | null>(null)
const stats = ref({
  todayOrderCount: 0,
  todayRevenue: 0,
  pendingOrderCount: 0,
  unsettledOrderCount: 0
})
const pendingOrders = ref<any[]>([])
let lastLoadTime = 0

const loadData = async (force = false) => {
  const now = Date.now()
  if (!force && now - lastLoadTime < 300000) {
    // 5分钟内不重复加载
    return
  }

  try {
    const res = await merchantCo.getDashboardStats()
    if (res.code === 0) {
      lastLoadTime = now
      stats.value = res.data.stats
      pendingOrders.value = res.data.pendingOrders
      shopName.value = res.data.tenantName || '我的店铺'

      // 检查过期状态
      if (res.data.expired) {
        isExpired.value = true
        expiredAt.value = res.data.expired_at
      } else if (res.data.expired_at) {
        const expiredDate = new Date(res.data.expired_at).getTime()
        const daysLeft = Math.floor((expiredDate - now) / (24 * 60 * 60 * 1000))
        if (daysLeft <= 7 && daysLeft > 0) {
          willExpireSoon.value = true
          expireDays.value = daysLeft
        }
        expiredAt.value = res.data.expired_at
      }
    }
  } catch (e: any) {
    console.error('加载工作台数据失败:', e)
    // 静默失败，避免频繁打扰用户
    // 严重错误会在操作时提示
  }
}

const goToRenew = () => {
  uni.navigateTo({ url: '/pages/merchant/renewal/index' })
}

// 监听设置页面的更新通知
uni.$on('refresh-dashboard', () => {
  loadData(true)
})

onUnmounted(() => {
  uni.$off('refresh-dashboard')
})

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
  uni.navigateTo({ url: '/pages/merchant/store?tab=1' })
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
  if (!merchantRouteGuard('/pages/merchant/dashboard')) {
    return
  }
  loadData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.dashboard-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
  padding-bottom: 180rpx;
}

// 过期提示横幅
.expired-banner,
.expire-soon-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $wh-spacing-lg $wh-spacing-xl;
  background: linear-gradient(135deg, $wh-color-danger-modern 0%, #d9363e 100%);
  color: $wh-text-color-inverse;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-image: radial-gradient(
      circle at 80% 20%,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 50%
    );
  }

  .banner-content {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: $wh-spacing-md;
    position: relative;
    z-index: 1;

    .banner-text {
      margin-left: $wh-spacing-sm;
      font-size: $wh-font-size-md;
      line-height: $wh-line-height-relaxed;
      font-weight: $wh-font-weight-medium;
    }
  }

  .banner-btn {
    display: flex;
    align-items: center;
    padding: $wh-spacing-sm $wh-spacing-md;
    background: rgba(255, 255, 255, 0.2);
    border-radius: $wh-border-radius-full;
    font-size: $wh-font-size-sm;
    font-weight: $wh-font-weight-semibold;
    flex-shrink: 0;
    transition: all $wh-transition-normal;
    position: relative;
    z-index: 1;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    text {
      margin-right: $wh-spacing-xs;
    }
  }
}

.expire-soon-banner {
  background: linear-gradient(135deg, $wh-color-warning-modern 0%, #d48806 100%);
}

.expire-soon-banner-light {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $wh-spacing-lg $wh-spacing-xl;
  background: $wh-color-blue-light;
  border: 1rpx solid rgba(45, 127, 249, 0.2);

  .banner-content {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: $wh-spacing-md;

    .banner-text {
      margin-left: $wh-spacing-sm;
      font-size: $wh-font-size-md;
      color: $wh-color-blue;
      line-height: $wh-line-height-relaxed;
      font-weight: $wh-font-weight-medium;
    }
  }

  .banner-btn {
    display: flex;
    align-items: center;
    padding: $wh-spacing-sm $wh-spacing-md;
    background: rgba(45, 127, 249, 0.1);
    border-radius: $wh-border-radius-full;
    font-size: $wh-font-size-sm;
    font-weight: $wh-font-weight-semibold;
    flex-shrink: 0;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.95);
      background: rgba(45, 127, 249, 0.2);
    }

    text {
      margin-right: $wh-spacing-xs;
      color: $wh-color-blue;
    }
  }
}

.header-stats {
  background: $wh-gradient-blue-vertical;
  color: $wh-text-color-inverse;
  padding: $wh-spacing-xxl $wh-spacing-xl 80rpx;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  &.header-expanded {
    padding-top: $wh-spacing-lg;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $wh-spacing-xs;

    .shop-name {
      font-size: $wh-font-size-2xl;
      font-weight: $wh-font-weight-extrabold;
      letter-spacing: 0.5rpx;
    }

    .setting-btn {
      padding: $wh-spacing-xs;
      transition: all $wh-transition-normal;
      &:active {
        transform: scale(0.9);
        opacity: 0.7;
      }
    }
  }

  .date-text {
    font-size: $wh-font-size-sm;
    opacity: 0.9;
    margin-bottom: $wh-spacing-xl;
    font-weight: $wh-font-weight-medium;
  }

  .stats-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $wh-spacing-md;
  }

  .stats-item {
    flex: 1;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10rpx);
    border-radius: $wh-border-radius-lg;
    padding: $wh-spacing-lg;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1rpx solid rgba(255, 255, 255, 0.2);
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.98);
      background: rgba(255, 255, 255, 0.2);
    }

    .label {
      font-size: $wh-font-size-xs;
      opacity: 0.9;
      margin-bottom: $wh-spacing-sm;
      white-space: nowrap;
      font-weight: $wh-font-weight-medium;
      letter-spacing: 0.5rpx;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      .value {
        font-size: $wh-font-size-2xl;
        font-weight: $wh-font-weight-extrabold;
        letter-spacing: -0.5rpx;
      }
      .unit {
        font-size: $wh-font-size-xs;
        margin-left: $wh-spacing-xs;
        opacity: 0.8;
        font-weight: $wh-font-weight-medium;
      }
    }

    .badge {
      position: absolute;
      right: $wh-spacing-sm;
      top: $wh-spacing-sm;
      background: $wh-color-danger-modern;
      color: #fff;
      font-size: $wh-font-size-xs;
      padding: 4rpx $wh-spacing-sm;
      border-radius: $wh-border-radius-full;
      line-height: 1;
      font-weight: $wh-font-weight-semibold;
      box-shadow: $wh-shadow-sm;
    }
  }
}

.card-box {
  @include card-modern;
  margin: 0 $wh-spacing-lg;
  margin-bottom: $wh-spacing-md;
}

.quick-actions {
  @include card-modern;
  display: flex;
  justify-content: space-around;
  padding: $wh-spacing-xl 0;
  margin: (-$wh-spacing-3xl) $wh-spacing-lg $wh-spacing-lg;
  position: relative;
  z-index: $wh-z-index-sticky;
  box-shadow: $wh-shadow-md;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $wh-spacing-sm;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.95);
    }

    text {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-dark;
      font-weight: $wh-font-weight-semibold;
      letter-spacing: 0.3rpx;
    }

    .icon-box {
      width: 104rpx;
      height: 104rpx;
      border-radius: $wh-border-radius-lg;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all $wh-transition-normal;
      box-shadow: $wh-shadow-xs;

      &:active {
        transform: scale(0.95);
      }

      &.blue {
        background: linear-gradient(
          135deg,
          rgba(45, 127, 249, 0.1) 0%,
          rgba(45, 127, 249, 0.05) 100%
        );
        border: 1rpx solid rgba(45, 127, 249, 0.2);
      }
      &.orange {
        background: linear-gradient(
          135deg,
          rgba(255, 149, 0, 0.1) 0%,
          rgba(255, 149, 0, 0.05) 100%
        );
        border: 1rpx solid rgba(255, 149, 0, 0.2);
      }
      &.green {
        background: linear-gradient(
          135deg,
          rgba(52, 199, 89, 0.1) 0%,
          rgba(52, 199, 89, 0.05) 100%
        );
        border: 1rpx solid rgba(52, 199, 89, 0.2);
      }
      &.purple {
        background: linear-gradient(
          135deg,
          rgba(114, 46, 209, 0.1) 0%,
          rgba(114, 46, 209, 0.05) 100%
        );
        border: 1rpx solid rgba(114, 46, 209, 0.2);
      }
    }
  }
}

.section-header {
  @include flex-between;
  padding: $wh-spacing-3xl $wh-spacing-lg $wh-spacing-lg;

  .left {
    @include flex-start;
  }

  .title {
    @include text-heading;
    letter-spacing: 0.3rpx;
  }
  .more {
    font-size: $wh-font-size-sm;
    color: $wh-color-blue;
    font-weight: $wh-font-weight-semibold;
    padding: $wh-spacing-xs;
    border-radius: $wh-border-radius-full;
    transition: all $wh-transition-normal;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
}

.order-list {
  .order-card {
    @include card-modern;
    margin: 0 $wh-spacing-lg $wh-spacing-md;
    padding: $wh-spacing-xl;
    @include card-side-decoration(4rpx, $wh-gradient-blue-vertical);

    &:active {
      transform: scale(0.98);
      box-shadow: $wh-shadow-md;
    }

    .order-header {
      display: flex;
      align-items: center;
      gap: $wh-spacing-sm;
      margin-bottom: $wh-spacing-md;

      .order-no {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        font-weight: $wh-font-weight-medium;
      }
      .customer-name {
        font-size: $wh-font-size-lg;
        font-weight: $wh-font-weight-semibold;
        color: $wh-text-color-dark;
        flex: 1;
        text-align: right;
        letter-spacing: 0.3rpx;
      }
    }

    .order-goods {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-secondary;
      margin-bottom: $wh-spacing-md;
      line-height: $wh-line-height-relaxed;
      font-weight: $wh-font-weight-medium;
    }

    .order-footer {
      @include flex-between;
      .time {
        font-size: $wh-font-size-xs;
        color: $wh-text-color-light-gray;
        font-weight: $wh-font-weight-medium;
      }
      .amount {
        @include price-text-small;
      }
    }
  }
}
</style>
