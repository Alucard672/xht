<template>
  <view class="oa-container">
    <!-- 顶部统计区 -->
    <view class="header-stats">
      <view class="stats-grid">
        <view class="stats-item" @click="filterByStatus(-1)">
          <view class="label">全部</view>
          <view class="value-row">
            <text class="value">{{ stats.total }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(0)">
          <view class="label">待审核</view>
          <view class="value-row">
            <text class="value">{{ stats.pending }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(1)">
          <view class="label">正常</view>
          <view class="value-row">
            <text class="value">{{ stats.active }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item" @click="filterByStatus(3)">
          <view class="label">已过期</view>
          <view class="value-row">
            <text class="value">{{ stats.expired }}</text>
            <text class="unit">家</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索区 -->
    <view class="filter-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索商家名称"
        :show-action="false"
        @search="handleSearch"
        @clear="handleSearch"
      ></u-search>
    </view>

    <!-- 商家列表 -->
    <view class="list-content">
      <!-- 加载中状态 -->
      <view v-if="isLoading" class="loading-wrap">
        <u-loading-icon size="40" mode="circle" color="#1890ff"></u-loading-icon>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 数据列表 -->
      <scroll-view v-else scroll-y class="list-scroll" @scrolltolower="loadMore">
        <view v-for="item in list" :key="item._id" class="merchant-card" @click="goToDetail(item)">
          <view class="card-header">
            <view class="name-area">
              <text class="name">{{ item.name }}</text>
              <u-tag :text="getStatusText(item.status)" :type="getStatusType(item.status)" size="mini"></u-tag>
            </view>
            <view class="phone">{{ item.phone || '未设置' }}</view>
          </view>
          
          <view class="card-body">
            <view class="info-row">
              <text class="label">有效期至：</text>
              <text class="value" :class="{ expired: isExpired(item.expired_at) }">
                {{ formatDate(item.expired_at) || '未设置' }}
              </text>
            </view>
            <view class="info-row">
              <text class="label">登录密码：</text>
              <text class="value">
                {{ item.has_oa_password ? '已设置' : '未设置' }}
              </text>
            </view>
          </view>
        </view>
        
        <u-loadmore :status="loadStatus" />
        <u-empty v-if="list.length === 0" mode="data" margin-top="100"></u-empty>
      </scroll-view>
    </view>



    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import oaAPI from '@/utils/oa'

const keyword = ref('')
const list = ref<any[]>([])
const loadStatus = ref('loadmore')
const page = ref(1)
const statusFilter = ref(-1)
const isLoading = ref(true)  // 添加加载状态

const stats = reactive({
  total: 0,
  pending: 0,
  active: 0,
  expired: 0
})

const toastRef = ref<any>(null)

onShow(() => {
  loadList(true)
})

onMounted(() => {
  const token = uni.getStorageSync('oa_token')
  if (!token) {
    uni.reLaunch({ url: '/pages/admin/login/index' })
  }
})

const loadList = async (reset = false) => {
  if (reset) {
    page.value = 1
    list.value = []
  }
  
  try {
    isLoading.value = true  // 开始加载
    const res: any = await oaAPI.getMerchantList({
      page: page.value,
      limit: 20,
      keyword: keyword.value,
      status: statusFilter.value
    })
    
    if (res.code === 0) {
      if (reset) {
        list.value = res.data.list
      } else {
        list.value = [...list.value, ...res.data.list]
      }
      loadStatus.value = list.value.length >= res.data.total ? 'nomore' : 'loadmore'
      page.value++
      
      stats.total = res.data.stats.total
      stats.pending = res.data.stats.pending
      stats.active = res.data.stats.active
      stats.expired = res.data.stats.expired
    }
    isLoading.value = false  // 加载完成
  } catch (e: any) {
    console.error('加载商家列表失败:', e)
    
    isLoading.value = false  // 加载失败也结束加载状态
    
    // 如果是未授权错误，跳转到登录页
    if (e.code === 401 || e.message?.includes('未登录') || e.message?.includes('Unauthorized')) {
      uni.removeStorageSync('oa_token')
      uni.removeStorageSync('oa_user')
      uni.reLaunch({ url: '/pages/admin/login/index' })
      return
    }
    
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

const goToDetail = (item: any) => {
  uni.navigateTo({ url: `/pages/admin/merchant/detail?id=${item._id}` })
}

const getStatusText = (status: number) => {
  const texts: Record<number, string> = { 0: '待审核', 1: '正常', 2: '已冻结', 3: '已过期' }
  return texts[status] || '未知'
}

const getStatusType = (status: number) => {
  const types: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error', 3: 'info' }
  return types[status] || 'info'
}

const isExpired = (expiredAt: number) => {
  if (!expiredAt) return false
  return expiredAt < Date.now()
}

const formatDate = (ts: number | string) => {
  if (!ts) return ''
  const date = new Date(ts)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.oa-container { min-height: 100vh; background-color: #f5f5f5; }

.header-stats {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
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

      &:nth-last-child(-n+2) { margin-bottom: 0; }

      .label { font-size: 24rpx; color: rgba(255, 255, 255, 0.8); margin-bottom: 8rpx; }

      .value-row {
        display: flex;
        align-items: baseline;

        .value { font-size: 40rpx; font-weight: bold; color: #fff; }
        .unit { font-size: 24rpx; color: rgba(255, 255, 255, 0.8); margin-left: 8rpx; }
      }
    }
  }
}

.filter-bar { padding: 20rpx 24rpx; background-color: #fff; }
.list-content { padding: 20rpx 24rpx; }
.list-scroll { height: calc(100vh - 400rpx); }

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .loading-text {
    margin-top: 20rpx;
    color: #999;
    font-size: 28rpx;
  }
}

.merchant-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .card-header {
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .name-area {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;

      .name { font-size: 32rpx; font-weight: bold; color: #333; }
    }
    .phone { font-size: 26rpx; color: #999; }
  }

  .card-body {
    margin-bottom: 20rpx;

    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      &:last-child { margin-bottom: 0; }

      .label { font-size: 26rpx; color: #666; }
      .value { font-size: 26rpx; color: #333; flex: 1; &.expired { color: #ff4d4f; } }
    }
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 12rpx 24rpx;
      border-radius: 8rpx;
      font-size: 26rpx;

      &.primary { color: #1890ff; background: rgba(24, 144, 255, 0.1); }
    }
  }
}

</style>
