<template>
  <view class="merchant-edit-container">
    <view class="page-header">
      <text class="title">{{ isEdit ? '编辑商家' : '新增商家' }}</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <view class="label">手机号</view>
        <input
          v-if="!isEdit"
          v-model="formData.mobile"
          type="number"
          placeholder="请输入手机号"
          class="input"
        />
        <text v-else class="value">{{ formData.mobile }}</text>
      </view>

      <view class="form-item">
        <view class="label">店铺名称</view>
        <input
          v-model="formData.name"
          placeholder="请输入店铺名称"
          class="input"
        />
      </view>

      <view class="form-item">
        <view class="label">有效期至</view>
        <picker
          mode="date"
          :value="expiredDate"
          @change="onDateChange"
        >
          <view class="picker-value">
            <text v-if="expiredDate">{{ expiredDate }}</text>
            <text v-else class="placeholder">请选择有效期</text>
          </view>
        </picker>
      </view>

      <view v-if="isEdit" class="form-item">
        <view class="label">状态</view>
        <view class="status-row">
          <u-tag
            :text="getStatusText(formData.status)"
            :type="getStatusType(formData.status)"
            size="mini"
          ></u-tag>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <u-button
        v-if="isEdit && formData.status === 0"
        type="primary"
        text="审核通过"
        :loading="submitting"
        @click="handleAudit(1)"
      ></u-button>
      
      <u-button
        v-if="isEdit && formData.status === 0"
        type="error"
        plain
        text="审核拒绝"
        :loading="submitting"
        @click="handleAudit(2)"
      ></u-button>

      <u-button
        v-if="isEdit && formData.status === 2"
        type="warning"
        text="解冻"
        :loading="submitting"
        @click="handleUnfreeze"
      ></u-button>

      <u-button
        v-if="isEdit && formData.status === 3"
        type="warning"
        text="续费并解冻"
        :loading="submitting"
        @click="handleRenew"
      ></u-button>

      <u-button
        v-if="isEdit && formData.status === 1"
        type="error"
        plain
        text="冻结"
        :loading="submitting"
        @click="handleFreeze"
      ></u-button>

      <u-button
        v-if="isEdit"
        type="primary"
        text="延长有效期"
        :loading="submitting"
        custom-style="margin-top: 20rpx;"
        @click="showExtendDialog"
      ></u-button>

      <u-button
        v-if="!isEdit"
        type="primary"
        text="创建商家"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleCreate"
      ></u-button>
    </view>

    <!-- 延长有效期弹窗 -->
    <u-popup :show="showExtendPopup" mode="dialog" @close="showExtendPopup = false">
      <view class="extend-popup">
        <view class="popup-header">延长有效期</view>
        <view class="popup-body">
          <view class="form-item">
            <view class="label">延长天数</view>
            <input
              v-model="extendDays"
              type="number"
              placeholder="请输入天数"
              class="input"
            />
          </view>
        </view>
        <view class="popup-footer">
          <u-button
            text="取消"
            custom-style="flex: 1; margin-right: 20rpx;"
            @click="showExtendPopup = false"
          ></u-button>
          <u-button
            type="primary"
            text="确定"
            :loading="submitting"
            custom-style="flex: 1;"
            @click="handleExtend"
          ></u-button>
        </view>
      </view>
    </u-popup>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'

const adminCo = importObject('wh-admin-co')

const isEdit = ref(false)
const tenantId = ref('')
const submitting = ref(false)
const showExtendPopup = ref(false)
const extendDays = ref('')
const toastRef = ref<any>(null)

const formData = ref<any>({
  mobile: '',
  name: '',
  status: 0
})
const expiredDate = ref('')

onLoad((options: any) => {
  if (options.id) {
    isEdit.value = true
    tenantId.value = options.id
    loadMerchantDetail()
  }
})

onMounted(() => {
  // 获取URL参数中的手机号（从创建页面跳转过来）
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (currentPage.options.mobile) {
    formData.value.mobile = currentPage.options.mobile
  }
})

const loadMerchantDetail = async () => {
  try {
    const res: any = await adminCo.getMerchantDetail(tenantId.value)
    if (res.code === 0) {
      const { tenant, user } = res.data
      formData.value = {
        mobile: user.mobile || '',
        name: tenant.name || '',
        status: tenant.status || 0
      }
      if (tenant.expired_at) {
        const date = new Date(tenant.expired_at)
        expiredDate.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
    } else {
      uni.showToast({ title: res.message || '获取失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

const canSubmit = computed(() => {
  return formData.value.mobile && formData.value.name && expiredDate.value
})

const onDateChange = (e: any) => {
  expiredDate.value = e.detail.value
}

const getStatusText = (status: number) => {
  const texts = {
    0: '待审核',
    1: '正常',
    2: '已冻结',
    3: '已过期',
    4: '已拒绝'
  }
  return texts[status] || '未知'
}

const getStatusType = (status: number) => {
  const types = {
    0: 'warning',
    1: 'success',
    2: 'error',
    3: 'info',
    4: 'error'
  }
  return types[status] || 'info'
}

// 创建商家
const handleCreate = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true
  try {
    const expiredAt = new Date(expiredDate.value).getTime()
    const res: any = await adminCo.createMerchant({
      mobile: formData.value.mobile,
      shopName: formData.value.name,
      expired_at: expiredAt
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: '创建成功' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '创建失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '创建失败' })
  } finally {
    submitting.value = false
  }
}

// 审核
const handleAudit = async (action: number) => {
  if (submitting.value) return

  submitting.value = true
  try {
    const expiredAt = action === 1 ? new Date(expiredDate.value).getTime() : null
    const res: any = await adminCo.auditMerchant({
      tenant_id: tenantId.value,
      action,
      expired_at: expiredAt
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: res.msg })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  } finally {
    submitting.value = false
  }
}

// 冻结
const handleFreeze = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    const res: any = await adminCo.toggleMerchantFreeze({
      tenant_id: tenantId.value,
      action: 2
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: '已冻结' })
      loadMerchantDetail()
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  } finally {
    submitting.value = false
  }
}

// 解冻
const handleUnfreeze = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    const res: any = await adminCo.toggleMerchantFreeze({
      tenant_id: tenantId.value,
      action: 1
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: res.msg })
      loadMerchantDetail()
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  } finally {
    submitting.value = false
  }
}

// 续费
const handleRenew = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    const res: any = await adminCo.extendMerchantExpire({
      tenant_id: tenantId.value,
      days: 365
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: '续费成功' })
      loadMerchantDetail()
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  } finally {
    submitting.value = false
  }
}

const showExtendDialog = () => {
  extendDays.value = ''
  showExtendPopup.value = true
}

// 延长有效期
const handleExtend = async () => {
  if (!extendDays.value || parseInt(extendDays.value) <= 0) {
    toastRef.value?.show({ type: 'error', message: '请输入有效天数' })
    return
  }

  if (submitting.value) return

  submitting.value = true
  try {
    const res: any = await adminCo.extendMerchantExpire({
      tenant_id: tenantId.value,
      days: parseInt(extendDays.value)
    })

    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: res.msg })
      showExtendPopup.value = false
      loadMerchantDetail()
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.merchant-edit-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx 32rpx;
}

.page-header {
  padding: 20rpx 0 40rpx;
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;

  .form-item {
    margin-bottom: 30rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 16rpx;
    }

    .input {
      height: 88rpx;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
    }

    .value {
      font-size: 28rpx;
      color: #666;
    }

    .picker-value {
      height: 88rpx;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      display: flex;
      align-items: center;
      font-size: 28rpx;

      .placeholder {
        color: #999;
      }
    }

    .status-row {
      display: flex;
      align-items: center;
    }
  }
}

.action-buttons {
  margin-top: 40rpx;
}

.extend-popup {
  .popup-header {
    font-size: 32rpx;
    font-weight: bold;
    text-align: center;
    padding: 30rpx 0 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .popup-body {
    padding: 30rpx;

    .form-item {
      .label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }

      .input {
        height: 88rpx;
        background-color: #f5f5f5;
        border-radius: 12rpx;
        padding: 0 24rpx;
        font-size: 28rpx;
      }
    }
  }

  .popup-footer {
    display: flex;
    padding: 20rpx 30rpx 30rpx;
  }
}
</style>
