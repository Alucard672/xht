<template>
  <view class="merchant-page">
    <view class="tabs-box">
      <u-tabs
        :list="tabList"
        :current="currentTab"
        line-color="#1890ff"
        active-style="color: #1890ff; font-weight: bold;"
        @click="tabClick"
      ></u-tabs>
    </view>

    <view class="list-container">
      <unicloud-db
        ref="udb"
        v-slot="{ data, loading, error, hasMore }"
        collection="wh_orders"
        :where="whereClause"
        orderby="create_time desc"
      >
        <view v-if="loading" class="loading-box"><u-loading-icon></u-loading-icon></view>
        <view v-else-if="error" class="error-box">{{ error.message }}</view>
        <view v-else class="card-list">
          <view
            v-for="order in data.length > 0 ? data : mockOrders"
            :key="order._id"
            class="card order-card"
          >
            <view class="card-header">
              <text class="no">#{{ order.order_no.slice(-8) }}</text>
              <u-tag
                :text="getStatusText(order.status)"
                :type="getStatusType(order.status)"
                size="mini"
              ></u-tag>
            </view>

            <view class="card-body">
              <view class="customer">客户: {{ order.customer_name || '散客' }}</view>
              <view class="items">
                <view v-for="(item, idx) in order.items" :key="idx" class="item-line">
                  {{ item.name }} x{{ item.countSmall || item.count
                  }}{{ item.unitSmallName || item.unit }}
                </view>
              </view>
            </view>

            <view class="card-footer">
              <view class="time">{{ formatTime(order.create_time) }}</view>
              <view class="right">
                <text class="total">合计: ¥{{ (order.total_amount / 100).toFixed(2) }}</text>
                <view class="btns">
                  <u-button
                    v-if="order.status === 'pending'"
                    type="primary"
                    size="mini"
                    text="确认接单"
                    @click="updateStatus(order._id, 'confirmed')"
                  ></u-button>
                  <u-button
                    v-if="order.status === 'confirmed'"
                    type="success"
                    size="mini"
                    text="确认送达"
                    @click="updateStatus(order._id, 'completed')"
                  ></u-button>
                </view>
              </view>
            </view>
          </view>
          <u-loadmore :status="data.length > 0 && hasMore ? 'loadmore' : 'nomore'" />
        </view>
      </unicloud-db>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="1"
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
const currentTab = ref(0)

const mockOrders = [
  {
    _id: 'o1',
    order_no: 'ORD20250101001',
    status: 'pending',
    customer_name: '李老板',
    create_time: Date.now() - 3600000,
    total_amount: 5400,
    items: [{ name: '农夫山泉', count: 2, unit: '箱' }]
  },
  {
    _id: 'o2',
    order_no: 'ORD20250101002',
    status: 'confirmed',
    customer_name: '张小店',
    create_time: Date.now() - 7200000,
    total_amount: 12000,
    items: [{ name: '康师傅方便面', count: 2, unit: '箱' }]
  },
  {
    _id: 'o3',
    order_no: 'ORD20250101003',
    status: 'completed',
    customer_name: '王大妈',
    create_time: Date.now() - 86400000,
    total_amount: 3500,
    items: [{ name: '雪碧', count: 1, unit: '箱' }]
  },
  {
    _id: 'o4',
    order_no: 'ORD20250101004',
    status: 'pending',
    customer_name: '赵记批发',
    create_time: Date.now() - 1800000,
    total_amount: 8500,
    items: [{ name: '金龙鱼油', count: 1, unit: '桶' }]
  }
]

const tabList = [
  { name: '全部', value: 'all' },
  { name: '待接单', value: 'pending' },
  { name: '待发货', value: 'confirmed' },
  { name: '已完成', value: 'completed' }
]

const whereClause = computed(() => {
  let clause = `tenant_id == "${tenant_id}"`
  const status = tabList[currentTab.value].value
  if (status !== 'all') {
    clause += ` && status == "${status}"`
  }
  return clause
})

const tabClick = (index: number) => {
  currentTab.value = index
}

const getStatusText = (status: string) => {
  const map: any = {
    pending: '待确认',
    confirmed: '待发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: any = { pending: 'error', confirmed: 'primary', completed: 'success' }
  return map[status] || 'info'
}

const formatTime = (ts: number) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const updateStatus = async (id: string, status: string) => {
  try {
    const orderCo = uniCloud.importObject('wh-order-co')
    if (status === 'confirmed') {
      await orderCo.confirmOrder(id)
    } else if (status === 'completed') {
      await orderCo.completeOrder(id)
    }
    uni.showToast({ title: '操作成功' })
    // @ts-ignore
    udb.value.refresh()
  } catch (e: any) {
    uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
  }
}

const handleTabChange = (index: number) => {
  if (index === 1) return
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

.tabs-box {
  background-color: #fff;
  position: relative;
  z-index: 10;
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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #f5f5f5;
    padding-bottom: 16rpx;
    margin-bottom: 16rpx;
    .no {
      font-size: 24rpx;
      color: #999;
    }
  }

  .card-body {
    .customer {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 12rpx;
    }
    .items {
      .item-line {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 4rpx;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #f5f5f5;

    .time {
      font-size: 24rpx;
      color: #ccc;
    }
    .right {
      display: flex;
      align-items: center;
      gap: 20rpx;
      .total {
        font-size: 32rpx;
        color: #ff6b00;
        font-weight: bold;
      }
      .btns {
        display: flex;
        gap: 12rpx;
      }
    }
  }
}
</style>
