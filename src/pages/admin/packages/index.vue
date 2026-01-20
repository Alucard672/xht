<template>
  <view class="oa-container">
    <!-- 顶部统计区 -->
    <view class="header-stats">
      <view class="stats-grid">
        <view class="stats-item">
          <view class="label">套餐总数</view>
          <view class="value-row">
            <text class="value">{{ stats.total }}</text>
            <text class="unit">个</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">已上架</view>
          <view class="value-row">
            <text class="value">{{ stats.active }}</text>
            <text class="unit">个</text>
          </view>
        </view>
        <view class="stats-item">
          <view class="label">已下架</view>
          <view class="value-row">
            <text class="value">{{ stats.inactive }}</text>
            <text class="unit">个</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作区 -->
    <view class="action-bar">
      <u-button
        type="primary"
        icon="plus"
        text="添加套餐"
        custom-style="height: 72rpx; border-radius: 16rpx; background-color: #1890ff; border: none;"
        @click="openEditPopup()"
      ></u-button>
    </view>

    <!-- 套餐列表 -->
    <view class="list-content">
      <scroll-view scroll-y class="list-scroll">
        <view v-for="item in list" :key="item._id" class="package-card">
          <view class="card-header">
            <view class="name-area">
              <text class="name">{{ item.name }}</text>
              <u-tag :text="item.is_active ? '上架' : '下架'" :type="item.is_active ? 'success' : 'info'" size="mini"></u-tag>
            </view>
            <view class="sort">排序: {{ item.sort_order }}</view>
          </view>
          
          <view class="card-body">
            <view class="info-row">
              <text class="label">续费时长：</text>
              <text class="value highlight">{{ item.duration_months }} 个月</text>
            </view>
            <view class="info-row">
              <text class="label">套餐价格：</text>
              <text class="value price">{{ formatPrice(item.price) }}</text>
            </view>
            <view class="info-row" v-if="item.description">
              <text class="label">套餐描述：</text>
              <text class="value">{{ item.description }}</text>
            </view>
          </view>
          
          <view class="card-actions">
            <view class="action-btn" :class="item.is_active ? 'warning' : 'success'" @click="toggleStatus(item)">
              {{ item.is_active ? '下架' : '上架' }}
            </view>
            <view class="action-btn primary" @click="openEditPopup(item)">编辑</view>
            <view class="action-btn danger" @click="deletePackage(item)">删除</view>
          </view>
        </view>
        
        <u-empty v-if="list.length === 0" mode="data" margin-top="100"></u-empty>
      </scroll-view>
    </view>

    <!-- 编辑弹窗 -->
    <u-popup :show="showPopup" mode="bottom" :round="20" @close="closePopup">
      <view class="edit-popup">
        <view class="popup-header">
          <text class="title">{{ editingPackage ? '编辑套餐' : '添加套餐' }}</text>
          <view class="close-btn" @click="closePopup">
            <u-icon name="close" size="40"></u-icon>
          </view>
        </view>
        
        <view class="popup-body">
          <view class="form-item">
            <view class="label">套餐名称 <text class="required">*</text></view>
            <u-input
              v-model="form.name"
              placeholder="如：1个月套餐"
              border="true"
              :maxlength="30"
              custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
            ></u-input>
          </view>

          <view class="form-item">
            <view class="label">续费时长（月） <text class="required">*</text></view>
            <u-input
              v-model="form.duration_months"
              type="number"
              placeholder="如：1"
              border="true"
              custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
            ></u-input>
          </view>

          <view class="form-item">
            <view class="label">价格（分） <text class="required">*</text></view>
            <u-input
              v-model="form.price"
              type="number"
              placeholder="如：2900"
              border="true"
              custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
            ></u-input>
            <view class="tip">价格单位：分（100分 = 1元）</view>
          </view>

          <view class="form-item">
            <view class="label">排序序号</view>
            <u-input
              v-model="form.sort_order"
              type="number"
              placeholder="数字越大越靠前"
              border="true"
              custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
            ></u-input>
          </view>

          <view class="form-item">
            <view class="label">套餐描述</view>
            <u-textarea
              v-model="form.description"
              placeholder="描述套餐特点（选填）"
              border="true"
              count
              maxlength="200"
              custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
            ></u-textarea>
          </view>

          <u-button
            type="primary"
            :text="editingPackage ? '保存修改' : '添加套餐'"
            :loading="saving"
            custom-style="height: 96rpx; border-radius: 48rpx; background-color: #1890ff; border: none; margin-top: 40rpx;"
            @click="savePackage"
          ></u-button>
        </view>
      </view>
    </u-popup>

    <!-- 确认弹窗 -->
    <u-modal :show="showConfirm" :title="confirmTitle" :content="confirmContent" showCancelButton @confirm="confirmModalAction" @cancel="showConfirm = false"></u-modal>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import oaAPI from '@/utils/oa'

const toastRef = ref<any>(null)
const list = ref<any[]>([])
const saving = ref(false)

const stats = reactive({
  total: 0,
  active: 0,
  inactive: 0
})

// 编辑弹窗
const showPopup = ref(false)
const editingPackage = ref<any>(null)
const form = reactive({
  name: '',
  duration_months: '',
  price: '',
  sort_order: '',
  description: ''
})

// 确认弹窗
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmContent = ref('')
const currentItem = ref<any>(null)
const confirmAction = ref<any>(null)

onShow(() => {
  loadList()
})

onMounted(() => {
  const token = uni.getStorageSync('oa_token')
  if (!token) {
    uni.reLaunch({ url: '/pages/admin/login/index' })
  }
})

const loadList = async () => {
  try {
    const res: any = await oaAPI.getPackageList()
    
    if (res.code === 0) {
      list.value = res.data || []
      
      // 计算统计
      stats.total = list.value.length
      stats.active = list.value.filter(p => p.is_active).length
      stats.inactive = list.value.filter(p => !p.is_active).length
    }
  } catch (e: any) {
    console.error('加载套餐列表失败:', e)
    
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

const formatPrice = (cents: number) => {
  if (cents === 0) return '免费'
  return `¥${(cents / 100).toFixed(2)}`
}

const openEditPopup = (item?: any) => {
  editingPackage.value = item
  
  if (item) {
    form.name = item.name
    form.duration_months = String(item.duration_months)
    form.price = String(item.price)
    form.sort_order = String(item.sort_order)
    form.description = item.description || ''
  } else {
    form.name = ''
    form.duration_months = ''
    form.price = ''
    form.sort_order = '0'
    form.description = ''
  }
  
  showPopup.value = true
}

const closePopup = () => {
  showPopup.value = false
  editingPackage.value = null
}

const savePackage = async () => {
  if (!form.name) {
    toastRef.value?.show({ type: 'warning', message: '请输入套餐名称' })
    return
  }
  
  if (!form.duration_months || parseInt(form.duration_months) <= 0) {
    toastRef.value?.show({ type: 'warning', message: '请输入有效的续费时长' })
    return
  }
  
  if (form.price === '' || parseInt(form.price) < 0) {
    toastRef.value?.show({ type: 'warning', message: '请输入有效的价格' })
    return
  }
  
  saving.value = true
  
  try {
    let res: any
    
    if (editingPackage.value) {
      res = await oaAPI.updatePackage(editingPackage.value._id, {
        name: form.name,
        duration_months: parseInt(form.duration_months),
        price: parseInt(form.price),
        sort_order: parseInt(form.sort_order) || 0,
        description: form.description
      })
    } else {
      res = await oaAPI.addPackage({
        name: form.name,
        duration_months: parseInt(form.duration_months),
        price: parseInt(form.price),
        sort_order: parseInt(form.sort_order) || 0,
        description: form.description
      })
    }
    
    saving.value = false
    
    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: editingPackage.value ? '修改成功' : '添加成功' })
      closePopup()
      loadList()
    } else {
      toastRef.value?.show({ type: 'error', message: res.msg })
    }
  } catch (e: any) {
    saving.value = false
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  }
}

const toggleStatus = (item: any) => {
  currentItem.value = item
  confirmTitle.value = item.is_active ? '下架套餐' : '上架套餐'
  confirmContent.value = `确定要${item.is_active ? '下架' : '上架'} "${item.name}" 吗？`
  confirmAction.value = 'toggle'
  showConfirm.value = true
}

const deletePackage = (item: any) => {
  currentItem.value = item
  confirmTitle.value = '删除套餐'
  confirmContent.value = `确定要删除 "${item.name}" 吗？删除后无法恢复。`
  confirmAction.value = 'delete'
  showConfirm.value = true
}

const confirmModalAction = () => {
  showConfirm.value = false
  
  if (confirmAction.value === 'toggle' && currentItem.value) {
    oaAPI.togglePackageStatus(currentItem.value._id).then((res: any) => {
      if (res.code === 0) {
        toastRef.value?.show({ type: 'success', message: res.msg })
        loadList()
      } else {
        toastRef.value?.show({ type: 'error', message: res.msg })
      }
    })
  } else if (confirmAction.value === 'delete' && currentItem.value) {
    oaAPI.deletePackage(currentItem.value._id).then((res: any) => {
      if (res.code === 0) {
        toastRef.value?.show({ type: 'success', message: '删除成功' })
        loadList()
      } else {
        toastRef.value?.show({ type: 'error', message: res.msg })
      }
    })
  }
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
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20rpx;
  }

  .stats-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    padding: 24rpx;
    text-align: center;

    .label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 24rpx;
      margin-bottom: 16rpx;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      justify-content: center;

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
  padding: 20rpx 32rpx;
  background-color: #fff;
}

.list-content {
  padding: 0 32rpx 32rpx;
}

.list-scroll {
  height: calc(100vh - 400rpx);
}

.package-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .name-area {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .sort {
      font-size: 24rpx;
      color: #999;
    }
  }

  .card-body {
    margin-bottom: 20rpx;

    .info-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: 26rpx;
        color: #666;
        min-width: 160rpx;
      }

      .value {
        font-size: 26rpx;
        color: #333;
        flex: 1;

        &.highlight {
          color: #1890ff;
          font-weight: bold;
          font-size: 28rpx;
        }

        &.price {
          color: #ff4d4f;
          font-weight: bold;
          font-size: 28rpx;
        }
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 16rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-btn {
      flex: 1;
      text-align: center;
      padding: 16rpx 0;
      border-radius: 8rpx;
      font-size: 26rpx;

      &.primary {
        color: #1890ff;
        background: rgba(24, 144, 255, 0.1);
      }

      &.success {
        color: #52c41a;
        background: rgba(82, 196, 26, 0.1);
      }

      &.warning {
        color: #faad14;
        background: rgba(250, 173, 20, 0.1);
      }

      &.danger {
        color: #ff4d4f;
        background: rgba(255, 77, 79, 0.1);
      }
    }
  }
}

.edit-popup {
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .close-btn {
      padding: 10rpx;
    }
  }

  .popup-body {
    flex: 1;
    padding: 30rpx;
    overflow-y: auto;

    .form-item {
      margin-bottom: 30rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 16rpx;
        display: flex;
        align-items: center;

        .required {
          color: #ff4d4f;
          margin-left: 8rpx;
        }
      }

      .tip {
        font-size: 22rpx;
        color: #999;
        margin-top: 12rpx;
      }
    }
  }
}
</style>
