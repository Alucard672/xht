<template>
  <view class="admin-container">
    <!-- 顶部紫色背景统计区 -->
    <view class="header-stats">
      <view class="stats-grid">
        <view class="stats-item">
          <view class="label">总商户数</view>
          <view class="value-row">
            <text class="value">{{ stats.totalMerchants }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">活跃商户</view>
          <view class="value-row">
            <text class="value">{{ stats.activeMerchants }}</text>
            <text class="unit">家</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">总客户数</view>
          <view class="value-row">
            <text class="value">{{ stats.totalCustomers }}</text>
            <text class="unit">个</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">总订单量</view>
          <view class="value-row">
            <text class="value">{{ formatCount(stats.totalOrders) }}</text>
            <text class="unit">笔</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作区 -->
    <view class="action-bar">
      <view class="search-box">
        <u-search
          placeholder="搜索商户名称或电话"
          v-model="keyword"
          :show-action="false"
          @search="handleSearch"
          @clear="handleSearch"
        ></u-search>
      </view>
      <u-button
        type="primary"
        icon="plus"
        text="添加商户"
        customStyle="width: 220rpx; height: 72rpx; border-radius: 16rpx; background-color: #722ed1; border: none;"
        @click="addMerchant"
      ></u-button>
    </view>

    <!-- 列表区 -->
    <view class="list-content">
      <view class="table-header">
        <text class="th col-id">ID</text>
        <text class="th col-name">店铺名称</text>
        <text class="th col-mobile">老板手机</text>
        <text class="th col-status">状态</text>
      </view>
      <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
        <view class="table-row" v-for="(item, index) in list" :key="item._id">
          <text class="td col-id">M{{ String(index + 1).padStart(3, '0') }}</text>
          <text class="td col-name u-line-1">{{ item.name }}</text>
          <text class="td col-mobile">{{ item.owner_mobile || '-' }}</text>
          <view class="td col-status">
            <u-tag
              :text="item.status === 1 ? '正常' : '已停用'"
              :type="item.status === 1 ? 'success' : 'error'"
              size="mini"
            ></u-tag>
          </view>
        </view>
        <u-loadmore :status="loadStatus" />
      </scroll-view>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="tabIndex"
      @change="handleTabChange"
      :fixed="true"
      :placeholder="true"
      :safeAreaInsetBottom="true"
      activeColor="#722ed1"
    >
      <u-tabbar-item text="商户管理" icon="home"></u-tabbar-item>
      <u-tabbar-item text="员工管理" icon="account"></u-tabbar-item>
      <u-tabbar-item text="数据统计" icon="integral"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const adminCo = uniCloud.importObject('wh-admin-co');

const tabIndex = ref(0);
const keyword = ref('');
const list = ref<any[]>([
  { _id: 'm1', name: '王记粮油批发', owner_mobile: '138-0000-1234', status: 1 },
  { _id: 'm2', name: '李氏日用百货', owner_mobile: '139-0000-5678', status: 0 },
  { _id: 'm3', name: '张家食品批发', owner_mobile: '136-0000-9012', status: 0 },
  { _id: 'm4', name: '刘记副食', owner_mobile: '137-0000-3456', status: 1 },
  { _id: 'm5', name: '陈氏批发部', owner_mobile: '135-0000-7890', status: 1 }
]);
const stats = ref({
  totalMerchants: 5,
  activeMerchants: 4,
  totalCustomers: 202,
  totalOrders: 6200
});

const loadData = async (reset = false) => {
  if (reset) {
    page.value = 1;
  }
  loadStatus.value = 'loading';
  try {
    const res = await adminCo.getMerchantList({
      page: page.value,
      limit: 20,
      keyword: keyword.value
    });
    if (res.code === 0 && res.data.list.length > 0) {
      if (reset) list.value = res.data.list;
      else list.value = [...list.value, ...res.data.list];
      stats.value = res.data.stats;
      loadStatus.value = res.data.list.length < 20 ? 'nomore' : 'loadmore';
    } else {
      loadStatus.value = 'nomore';
    }
  } catch (e: any) {
    loadStatus.value = 'nomore';
  }
};

const handleSearch = () => {
  loadData(true);
};

const loadMore = () => {
  if (loadStatus.value === 'loadmore') {
    page.value++;
    loadData();
  }
};

const formatCount = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

const addMerchant = () => {
  uni.showToast({ title: '演示功能', icon: 'none' });
};

const handleTabChange = (index: number) => {
  if (index === 0) return;
  const paths = [
    '/pages/admin/merchant/list',
    '/pages/admin/employee/list',
    '/pages/admin/statistics/index'
  ];
  uni.redirectTo({ url: paths[index] });
};

onShow(() => {
  loadData(true);
});
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header-stats {
  background: linear-gradient(180deg, #722ed1 0%, #531dab 100%);
  padding: 40rpx 32rpx;
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
  }
  
  .stats-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    padding: 24rpx;
    
    .label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 24rpx;
      margin-bottom: 16rpx;
    }
    
    .value-row {
      display: flex;
      align-items: baseline;
      
      .value {
        color: #ffffff;
        font-size: 48rpx;
        font-weight: bold;
      }
      
      .unit {
        color: rgba(255, 255, 255, 0.6);
        font-size: 24rpx;
        margin-left: 8rpx;
      }
    }
  }
}

.action-bar {
  display: flex;
  align-items: center;
  padding: 32rpx;
  gap: 20rpx;
  
  .search-box {
    flex: 1;
  }
}

.list-content {
  background-color: #ffffff;
  margin: 0 32rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);

  .table-header {
    display: flex;
    background-color: #fafafa;
    padding: 20rpx;
    border-bottom: 1rpx solid #eeeeee;
    
    .th {
      font-size: 26rpx;
      font-weight: 500;
      color: #333;
    }
  }
  
  .table-row {
    display: flex;
    align-items: center;
    padding: 24rpx 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    .td {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .col-id { width: 100rpx; }
  .col-name { flex: 1; padding-right: 10rpx; }
  .col-mobile { width: 220rpx; }
  .col-status { width: 120rpx; text-align: center; }
}

.list-scroll {
  height: calc(100vh - 580rpx);
}
</style>
