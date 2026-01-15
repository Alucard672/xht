<template>
  <view class="admin-container">
    <!-- 顶部统计区 -->
    <view class="header-stats">
      <view class="stats-grid">
        <view class="stats-item" @click="filterByStatus(-1)">
          <view class="label">全部</view>
          <view class="value-row">
            <text class="value">{{ stats.totalMerchants }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(0)">
          <view class="label">待审核</view>
          <view class="value-row">
            <text class="value">{{ stats.pendingAudit }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(1)">
          <view class="label">正常</view>
          <view class="value-row">
            <text class="value">{{ stats.activeMerchants }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(2)">
          <view class="label">已冻结</view>
          <view class="value-row">
            <text class="value">{{ stats.frozenMerchants }}</text>
            <text class="unit">家</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作区 -->
    <view class="action-bar">
      <view class="search-box">
        <u-search
          v-model="keyword"
          placeholder="搜索商户名称"
          :show-action="false"
          @search="handleSearch"
          @clear="handleSearch"
        ></u-search>
      </view>
      <u-button
        type="primary"
        icon="plus"
        text="添加商户"
        custom-style="width: 200rpx; height: 72rpx; border-radius: 16rpx; background-color: #722ed1; border: none;"
        @click="addMerchant"
      ></u-button>
    </view>

    <!-- 列表区 -->
    <view class="list-content">
      <view class="table-header">
        <text class="th col-name">店铺名称</text>
        <text class="th col-status">状态</text>
        <text class="th col-expired">有效期</text>
        <text class="th col-action">操作</text>
      </view>
      <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
        <view v-for="item in list" :key="item._id" class="table-row">
          <text class="td col-name u-line-1">{{ item.name }}</text>
          <view class="td col-status">
            <u-tag
              :text="getStatusText(item.status)"
              :type="getStatusType(item.status)"
              size="mini"
            ></u-tag>
          </view>
          <text class="td col-expired">{{ formatDate(item.expired_at) }}</text>
          <view class="td col-action">
            <view class="action-btns">
              <text class="btn edit" @click="editMerchant(item._id)">编辑</text>
              <text v-if="item.status === 0" class="btn audit" @click="auditMerchant(item._id)">审核</text>
              <text v-if="item.status === 1" class="btn danger" @click="freezeMerchant(item._id)">冻结</text>
              <text v-if="item.status === 2" class="btn warn" @click="unfreezeMerchant(item._id)">解冻</text>
            </view>
          </view>
        </view>
        <u-loadmore :status="loadStatus" />
      </scroll-view>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="tabIndex"
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

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'

const adminCo = importObject('wh-admin-co')

const keyword = ref('')
const tabIndex = ref(0)
const list = ref<any[]>([])
const loadStatus = ref('loadmore')
const page = ref(1)
const limit = 20
const total = ref(0)
const statusFilter = ref(-1)

const stats = ref<any>({
  totalMerchants: 0,
  activeMerchants: 0,
  pendingAudit: 0,
  frozenMerchants: 0,
  expiredMerchants: 0
})

const toastRef = ref<any>(null)

onShow(() => {
  loadList()
})

onMounted(() => {
  loadStats()
})

const loadStats = async () => {
  try {
    const res: any = await adminCo.getMerchantList({ page: 1, limit: 1 })
    if (res.code === 0) {
      stats.value = res.data.stats
    }
  } catch (e) {
    console.error('loadStats failed:', e)
  }
}

const loadList = async (reset = false) => {
  if (reset) {
    page.value = 1
    list.value = []
  }

  loadStatus.value = 'loading'

  try {
    const res: any = await adminCo.getMerchantList({
      page: page.value,
      limit,
      keyword: keyword.value,
      status: statusFilter.value
    })

    if (res.code === 0) {
      if (reset) {
        list.value = res.data.list
      } else {
        list.value = [...list.value, ...res.data.list]
      }
      total.value = res.data.total
      loadStatus.value = list.value.length >= total.value ? 'nomore' : 'loadmore'
      page.value++
    }
  } catch (e: any) {
    loadStatus.value = 'loadmore'
    toastRef.value?.show({ type: 'error', message: e.message || '加载失败' })
  }
}

const loadMore = () => {
  if (loadStatus.value === 'loadmore') {
    loadList()
  }
}

const handleSearch = () => {
  loadList(true)
}

const filterByStatus = (status: number) => {
  statusFilter.value = status
  loadList(true)
}

const addMerchant = () => {
  uni.navigateTo({ url: '/pages/admin/merchant/edit' })
}

const editMerchant = (id: string) => {
  uni.navigateTo({ url: `/pages/admin/merchant/edit?id=${id}` })
}

const auditMerchant = (id: string) => {
  uni.navigateTo({ url: `/pages/admin/merchant/edit?id=${id}` })
}

const freezeMerchant = async (id: string) => {
  uni.showModal({
    title: '确认冻结',
    content: '确定要冻结该商家吗？冻结后商家将无法登录。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result: any = await adminCo.toggleMerchantFreeze({ tenant_id: id, action: 2 })
          if (result.code === 0) {
            toastRef.value?.show({ type: 'success', message: '已冻结' })
            loadList(true)
            loadStats()
          } else {
            toastRef.value?.show({ type: 'error', message: result.message || '操作失败' })
          }
        } catch (e: any) {
          toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
        }
      }
    }
  })
}

const unfreezeMerchant = async (id: string) => {
  try {
    const result: any = await adminCo.toggleMerchantFreeze({ tenant_id: id, action: 1 })
    if (result.code === 0) {
      toastRef.value?.show({ type: 'success', message: result.msg })
      loadList(true)
      loadStats()
    } else {
      toastRef.value?.show({ type: 'error', message: result.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  }
}

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '待审核',
    1: '正常',
    2: '已冻结',
    3: '已过期',
    4: '已拒绝'
  }
  return texts[status] || '未知'
}

const getStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'error',
    3: 'info',
    4: 'error'
  }
  return types[status] || 'info'
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatCount = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count
}

const handleTabChange = (index: number) => {
  tabIndex.value = index
  if (index === 1) {
    uni.navigateTo({ url: '/pages/admin/employee/list' })
  } else if (index === 2) {
    uni.navigateTo({ url: '/pages/admin/statistics/index' })
  }
}
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.header-stats {
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
  padding: 30rpx 24rpx;

  .stats-grid {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;

    .stats-item {
      width: 48%;
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 12rpx;
      padding: 20rpx;
      margin-bottom: 20rpx;
      box-sizing: border-box;

      &:nth-last-child(-n+2) {
        margin-bottom: 0;
      }

      .label {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8rpx;
      }

      .value-row {
        display: flex;
        align-items: baseline;

        .value {
          font-size: 40rpx;
          font-weight: bold;
          color: #fff;
        }

        .unit {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
          margin-left: 8rpx;
        }
      }
    }
  }
}

.action-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #fff;

  .search-box {
    flex: 1;
    margin-right: 20rpx;
  }
}

.list-content {
  margin: 20rpx 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;

  .table-header {
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    padding: 20rpx 24rpx;
    font-size: 26rpx;
    font-weight: 500;
    color: #666;

    .th {
      &.col-name { flex: 2; }
      &.col-status { width: 120rpx; text-align: center; }
      &.col-expired { width: 180rpx; text-align: center; }
      &.col-action { flex: 1; text-align: right; }
    }
  }

  .list-scroll {
    max-height: calc(100vh - 400rpx);

    .table-row {
      display: flex;
      align-items: center;
      padding: 24rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .td {
        font-size: 26rpx;
        color: #333;

        &.col-name { flex: 2; padding-right: 20rpx; }
        &.col-status { width: 120rpx; text-align: center; }
        &.col-expired { width: 180rpx; text-align: center; font-size: 24rpx; color: #666; }
        &.col-action { flex: 1; text-align: right; }

        .action-btns {
          display: flex;
          justify-content: flex-end;
          gap: 16rpx;

          .btn {
            font-size: 24rpx;
            color: #2979ff;

            &.audit { color: #07c160; }
            &.danger { color: #ff4d4f; }
            &.warn { color: #fa8c16; }
          }
        }
      }
    }
  }
}
</style>
