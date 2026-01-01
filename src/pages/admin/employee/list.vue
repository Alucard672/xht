<template>
  <view class="admin-container">
    <!-- 顶部统计区 -->
    <view class="header-stats">
      <view class="stats-grid">
        <view class="stats-item">
          <view class="label">员工总数</view>
          <view class="value-row">
            <text class="value">{{ stats.total }}</text>
            <text class="unit">人</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">在职员工</view>
          <view class="value-row">
            <text class="value">{{ stats.active }}</text>
            <text class="unit">人</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">管理员</view>
          <view class="value-row">
            <text class="value">{{ stats.admins }}</text>
            <text class="unit">人</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">本月新增</view>
          <view class="value-row">
            <text class="value">{{ stats.newThisMonth }}</text>
            <text class="unit">人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索和过滤 -->
    <view class="filter-bar">
      <u-search
        placeholder="搜索员工姓名、手机号"
        v-model="keyword"
        :show-action="false"
        @search="handleSearch"
        @clear="handleSearch"
      ></u-search>
      <view class="tabs">
        <u-tabs
          :list="statusTabs"
          @click="handleTabClick"
          lineColor="#722ed1"
          activeStyle="color: #722ed1; font-weight: bold;"
        ></u-tabs>
      </view>
    </view>

    <!-- 列表区 -->
    <view class="list-content">
      <scroll-view scroll-y class="list-scroll">
        <view class="employee-card" v-for="item in list" :key="item._id">
          <view class="info">
            <view class="top">
              <text class="name">{{ item.nickname || '未命名' }}</text>
              <u-tag :text="getRoleName(item.role)" type="info" plain size="mini"></u-tag>
            </view>
            <view class="mobile">{{ item.mobile }}</view>
          </view>
          <view class="status">
            <u-tag
              :text="item.status === 0 ? '在职' : '离职'"
              :type="item.status === 0 ? 'success' : 'error'"
              size="mini"
            ></u-tag>
            <view class="date">入职: {{ formatDate(item.register_date) }}</view>
          </view>
        </view>
        <u-empty v-if="list.length === 0" mode="data" marginTop="100"></u-empty>
      </scroll-view>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="1"
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
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const adminCo = uniCloud.importObject('wh-admin-co');

const list = ref<any[]>([
  { _id: 'e1', nickname: '张三', mobile: '138-0000-0001', role: ['admin'], status: 0, register_date: Date.now() - 86400000 * 300 },
  { _id: 'e2', nickname: '李四', mobile: '138-0000-0002', role: ['operator'], status: 0, register_date: Date.now() - 86400000 * 200 },
  { _id: 'e3', nickname: '王五', mobile: '138-0000-0003', role: ['operator'], status: 0, register_date: Date.now() - 86400000 * 100 },
  { _id: 'e4', nickname: '赵六', mobile: '138-0000-0004', role: ['operator'], status: 0, register_date: Date.now() - 86400000 * 50 },
  { _id: 'e5', nickname: '钱七', mobile: '138-0000-0005', role: ['operator'], status: 1, register_date: Date.now() - 86400000 * 10 }
]);
const stats = ref({
  total: 5,
  active: 4,
  admins: 1,
  newThisMonth: 0
});

const loadData = async () => {
  try {
    const res = await adminCo.getEmployeeList({
      status: activeStatus.value,
      keyword: keyword.value
    });
    if (res.code === 0 && res.data.list.length > 0) {
      list.value = res.data.list;
      stats.value = res.data.stats;
    }
  } catch (e: any) {}
};

const handleSearch = () => {
  loadData();
};

const handleTabClick = (item: any) => {
  activeStatus.value = item.status;
  loadData();
};

const getRoleName = (roles: string[]) => {
  if (roles?.includes('admin')) return '管理员';
  if (roles?.includes('operator')) return '运营';
  return '普通员工';
};

const formatDate = (ts: number) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
};

const handleTabChange = (index: number) => {
  if (index === 1) return;
  const paths = [
    '/pages/admin/merchant/list',
    '/pages/admin/employee/list',
    '/pages/admin/statistics/index'
  ];
  uni.redirectTo({ url: paths[index] });
};

onShow(() => {
  loadData();
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

.filter-bar {
  padding: 32rpx;
  background-color: #ffffff;
  margin-bottom: 20rpx;
  
  .tabs {
    margin-top: 20rpx;
  }
}

.list-content {
  padding: 0 32rpx;
}

.employee-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
  
  .info {
    .top {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
      
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
    .mobile {
      font-size: 26rpx;
      color: #999;
    }
  }
  
  .status {
    text-align: right;
    .date {
      font-size: 22rpx;
      color: #ccc;
      margin-top: 12rpx;
    }
  }
}

.list-scroll {
  height: calc(100vh - 550rpx);
}
</style>

