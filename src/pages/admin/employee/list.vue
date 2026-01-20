<template>
  <view class="oa-container">
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
          <view class="label">已禁用</view>
          <view class="value-row">
            <text class="value">{{ stats.disabled }}</text>
            <text class="unit">人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索和操作区 -->
    <view class="filter-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索员工姓名、账号"
        :show-action="false"
        @search="handleSearch"
        @clear="handleSearch"
      ></u-search>
      <u-button
        type="primary"
        icon="plus"
        text="添加员工"
        custom-style="width: 180rpx; height: 72rpx; border-radius: 16rpx; background-color: #1890ff; border: none;"
        @click="addEmployee"
      ></u-button>
    </view>

    <!-- 员工列表 -->
    <view class="list-content">
      <scroll-view scroll-y class="list-scroll">
        <view v-for="item in list" :key="item._id" class="employee-card">
          <view class="info">
            <view class="top">
              <text class="name">{{ item.nickname }}</text>
              <u-tag :text="getRoleName(item.role)" type="info" plain size="mini"></u-tag>
            </view>
            <view class="username">账号: {{ item.username }}</view>
          </view>
          <view class="status">
            <u-tag
              :text="item.status === 0 ? '在职' : '禁用'"
              :type="item.status === 0 ? 'success' : 'error'"
              size="mini"
            ></u-tag>
            <view class="date">添加: {{ formatDate(item.created_at) }}</view>
          </view>
          <view class="actions">
            <view class="action-btn edit" @click="editEmployee(item)">编辑</view>
            <!-- 超级管理员不允许禁用/启用 -->
            <view v-if="item.role !== 'super_admin'">
              <view v-if="item.status === 0" class="action-btn danger" @click="toggleStatus(item)">禁用</view>
              <view v-else class="action-btn success" @click="toggleStatus(item)">启用</view>
            </view>
            <view class="action-btn warn" @click="resetPassword(item)">重置密码</view>
            <!-- 超级管理员不允许删除 -->
            <view v-if="item.role !== 'super_admin'" class="action-btn delete" @click="deleteEmployee(item)">删除</view>
          </view>
        </view>
        
        <u-loadmore :status="loadStatus" />
        <u-empty v-if="list.length === 0" mode="data" margin-top="100"></u-empty>
      </scroll-view>
    </view>

    <u-toast ref="toastRef" />
    <u-modal :show="showModal" :title="modalTitle" :content="modalContent" showCancelButton @confirm="confirmModal" @cancel="showModal = false"></u-modal>
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
const isLoading = ref(true)  // 添加加载状态

const stats = reactive({
  total: 0,
  active: 0,
  admins: 0,
  disabled: 0
})

const toastRef = ref<any>(null)

const showModal = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const currentItem = ref<any>(null)
const modalAction = ref('')

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
    isLoading.value = true
    const res: any = await oaAPI.getEmployeeList({
      page: page.value,
      limit: 20,
      keyword: keyword.value
    })
    
    if (res.code === 0) {
      if (reset) {
        list.value = res.data.list || []
      } else {
        list.value = [...list.value, ...(res.data.list || [])]
      }
      loadStatus.value = list.value.length >= (res.data.total || 0) ? 'nomore' : 'loadmore'
      page.value++
      
      // 安全获取统计数据
      const dataStats = res.data.stats || {}
      stats.total = dataStats.total || list.value.length || 0
      stats.active = dataStats.active || 0
      stats.admins = dataStats.admins || 0
      stats.disabled = dataStats.disabled || 0
      
      // 如果统计数据为0，根据列表计算
      if (stats.total === 0 && list.value.length > 0) {
        stats.total = list.value.length
        stats.active = list.value.filter((e: any) => e.status === 0).length
        stats.admins = list.value.filter((e: any) => e.role === 'admin' || e.role === 'super_admin').length
        stats.disabled = list.value.filter((e: any) => e.status === 1).length
      }
    }
  } catch (e: any) {
    console.error('加载失败:', e)
    toastRef.value?.show({ type: 'error', message: e.message || '加载失败' })
    isLoading.value = false
  }
}

const handleSearch = () => {
  loadList(true)
}

const addEmployee = () => {
  uni.navigateTo({ url: '/pages/admin/employee/edit' })
}

const editEmployee = (item: any) => {
  uni.navigateTo({ url: `/pages/admin/employee/edit?id=${item._id}` })
}

const resetPassword = (item: any) => {
  uni.showModal({
    title: '重置密码',
    content: `确定要重置 "${item.nickname}" 的密码吗？`,
    editable: true,
    placeholderText: '请输入新密码',
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          const result: any = await oaAPI.resetEmployeePassword(item._id, {
            newPassword: res.content
          })
          if (result.code === 0) {
            toastRef.value?.show({ type: 'success', message: '密码重置成功' })
          } else {
            toastRef.value?.show({ type: 'error', message: result.msg })
          }
        } catch (e: any) {
          toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
        }
      }
    }
  })
}

const toggleStatus = (item: any) => {
  const newStatus = item.status === 0 ? 1 : 0
  const statusText = newStatus === 0 ? '禁用' : '启用'
  
  modalTitle.value = `${statusText}员工`
  modalContent.value = `确定要${statusText} "${item.nickname}" 吗？`
  currentItem.value = item
  modalAction.value = 'toggle'
  showModal.value = true
}

const deleteEmployee = (item: any) => {
  modalTitle.value = '删除员工'
  modalContent.value = `确定要删除 "${item.nickname}" 吗？删除后无法恢复。`
  currentItem.value = item
  modalAction.value = 'delete'
  showModal.value = true
}

const confirmModal = async () => {
  showModal.value = false
  
  if (modalAction.value === 'toggle' && currentItem.value) {
    try {
      const result: any = await oaAPI.updateEmployee(currentItem.value._id, {
        status: currentItem.value.status === 0 ? 1 : 0
      })
      if (result.code === 0) {
        toastRef.value?.show({ type: 'success', message: '操作成功' })
        loadList(true)
      } else {
        toastRef.value?.show({ type: 'error', message: result.msg })
      }
    } catch (e: any) {
      toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
    }
  } else if (modalAction.value === 'delete' && currentItem.value) {
    try {
      const result: any = await oaAPI.deleteEmployee(currentItem.value._id)
      if (result.code === 0) {
        toastRef.value?.show({ type: 'success', message: '删除成功' })
        loadList(true)
      } else {
        toastRef.value?.show({ type: 'error', message: result.msg })
      }
    } catch (e: any) {
      toastRef.value?.show({ type: 'error', message: e.message || '删除失败' })
    }
  }
}

const getRoleName = (role: string) => {
  const names: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    employee: '员工'
  }
  return names[role] || role
}

const formatDate = (ts: number) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.oa-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header-stats {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
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
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  background-color: #fff;
  gap: 20rpx;
}

.list-content {
  padding: 0 32rpx 32rpx;
}

.list-scroll {
  height: calc(100vh - 500rpx);
}

.employee-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .info {
    margin-bottom: 20rpx;

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

    .username {
      font-size: 26rpx;
      color: #999;
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .date {
      font-size: 22rpx;
      color: #ccc;
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-btn {
      font-size: 24rpx;
      padding: 8rpx 20rpx;
      border-radius: 8rpx;

      &.edit { color: #1890ff; background: rgba(24, 144, 255, 0.1); }
      &.success { color: #52c41a; background: rgba(82, 196, 26, 0.1); }
      &.danger { color: #ff4d4f; background: rgba(255, 77, 79, 0.1); }
      &.warn { color: #faad14; background: rgba(250, 173, 20, 0.1); }
      &.delete { color: #ff4d4f; background: rgba(255, 77, 79, 0.1); }
    }
  }
}
</style>
