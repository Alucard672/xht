<template>
  <view class="notification-container">
    <view v-if="loading" class="loading-state">
      <u-loading-icon></u-loading-icon>
    </view>

    <view v-else-if="notifications.length === 0" class="empty-state">
      <u-icon name="bell" size="80" color="#ddd"></u-icon>
      <text class="empty-text">暂无消息通知</text>
    </view>

    <view v-else class="notification-list">
      <view
        v-for="item in notifications"
        :key="item._id"
        :class="['notification-item', !item.read ? 'unread' : '']"
        @click="handleNotificationClick(item)"
      >
        <view class="item-icon">
          <u-icon :name="getIcon(item.type)" size="24" :color="getIconColor(item.type)"></u-icon>
        </view>
        <view class="item-content">
          <view class="item-header">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-time">{{ formatTime(item.created_at) }}</text>
          </view>
          <text class="item-desc">{{ item.content }}</text>
        </view>
        <view v-if="!item.read" class="unread-dot"></view>
      </view>
    </view>

    <view v-if="notifications.length > 0" class="bottom-bar">
      <u-button text="全部标为已读" @click="markAllRead"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const loading = ref(false)
const notifications = ref<any[]>([])

const mockNotifications = [
  {
    _id: '1',
    type: 'order',
    title: '新订单提醒',
    content: '客户张三下了一个新订单，订单金额 ¥256.00，请及时处理。',
    read: false,
    created_at: Date.now() - 1800000
  },
  {
    _id: '2',
    type: 'payment',
    title: '还款通知',
    content: '客户李四已还款 ¥500.00，当前欠款 ¥1250.00。',
    read: false,
    created_at: Date.now() - 3600000
  },
  {
    _id: '3',
    type: 'order',
    title: '订单已送达',
    content: '订单 #20240115001 已送达客户，确认收款 ¥1280.00。',
    read: true,
    created_at: Date.now() - 86400000
  },
  {
    _id: '4',
    type: 'system',
    title: '系统通知',
    content: '欢迎使用乡货通批发管理系统，祝您生意兴隆！',
    read: true,
    created_at: Date.now() - 172800000
  }
]

onShow(() => {
  fetchNotifications()
})

const fetchNotifications = async () => {
  loading.value = true
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500))
    notifications.value = mockNotifications
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    order: 'order',
    payment: 'rmb-circle',
    system: 'info-circle',
    warning: 'warning'
  }
  return iconMap[type] || 'bell'
}

const getIconColor = (type: string) => {
  const colorMap: Record<string, string> = {
    order: '#07c160',
    payment: '#1890ff',
    system: '#999',
    warning: '#ff4d4f'
  }
  return colorMap[type] || '#999'
}

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

const handleNotificationClick = (item: any) => {
  if (!item.read) {
    item.read = true
  }
  // 根据类型跳转到对应页面
  if (item.type === 'order') {
    uni.showToast({ title: '跳转到订单详情', icon: 'none' })
  }
}

const markAllRead = () => {
  notifications.value.forEach(item => {
    item.read = true
  })
  uni.showToast({ title: '已全部标为已读', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.notification-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;

  .empty-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.notification-list {
  padding: 20rpx;

  .notification-item {
    display: flex;
    align-items: flex-start;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    position: relative;

    &.unread {
      background-color: #f6ffed;

      .item-title {
        font-weight: bold;
      }
    }

    .item-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;

        .item-title {
          font-size: 28rpx;
          color: #333;
        }

        .item-time {
          font-size: 22rpx;
          color: #999;
        }
      }

      .item-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.5;
        display: block;
      }
    }

    .unread-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background-color: #07c160;
      position: absolute;
      top: 24rpx;
      right: 24rpx;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);

  button {
    border-radius: 60rpx;
  }
}
</style>
