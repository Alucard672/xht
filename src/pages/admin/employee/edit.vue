<template>
  <view class="edit-container">
    <view class="form-card">
      <view class="form-item">
        <view class="label">
          <text class="required">*</text>
          登录账号
        </view>
        <u-input
          v-model="form.username"
          placeholder="请输入登录账号"
          :disabled="!!id"
          border="true"
          custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
          :maxlength="20"
        ></u-input>
        <view class="tip">账号一旦创建无法修改</view>
      </view>

      <view class="form-item" v-if="!id">
        <view class="label">
          <text class="required">*</text>
          登录密码
        </view>
        <u-input
          v-model="form.password"
          type="password"
          placeholder="请输入登录密码"
          border="true"
          custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
          :maxlength="20"
        ></u-input>
      </view>

      <view class="form-item">
        <view class="label">
          <text class="required">*</text>
          姓名
        </view>
        <u-input
          v-model="form.nickname"
          placeholder="请输入姓名"
          border="true"
          custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
          :maxlength="20"
        ></u-input>
      </view>

      <view class="form-item">
        <view class="label">
          <text class="required">*</text>
          角色
        </view>
        <u-radio-group v-model="form.role" class="role-group" :disabled="isSuperAdmin">
          <u-radio
            label="员工"
            name="employee"
            labelSize="28rpx"
          ></u-radio>
          <u-radio
            label="管理员"
            name="admin"
            labelSize="28rpx"
          ></u-radio>
        </u-radio-group>
        <view v-if="isSuperAdmin" class="tip" style="color: #ff4d4f;">超级管理员角色无法修改</view>
      </view>

      <view class="form-item" v-if="id">
        <view class="label">状态</view>
        <u-radio-group v-model="form.status" class="role-group" :disabled="isSuperAdmin">
          <u-radio
            label="在职"
            :name="0"
            labelSize="28rpx"
          ></u-radio>
          <u-radio
            label="禁用"
            :name="1"
            labelSize="28rpx"
          ></u-radio>
        </u-radio-group>
        <view v-if="isSuperAdmin" class="tip" style="color: #ff4d4f;">超级管理员状态无法修改</view>
      </view>
    </view>

    <view class="action-area">
      <u-button
        type="primary"
        :text="id ? '保存修改' : '添加员工'"
        :loading="saving"
        custom-style="height: 96rpx; border-radius: 48rpx; background-color: #722ed1; border: none;"
        @click="handleSave"
      ></u-button>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import oaAPI from '@/utils/oa'

const toastRef = ref<any>(null)
const id = ref('')
const saving = ref(false)
const isEdit = ref(false)
const isSuperAdmin = ref(false)  // 是否是超级管理员

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'employee',
  status: 0
})

onLoad((options: any) => {
  if (options?.id) {
    id.value = options.id
    isEdit.value = true
    loadEmployee(options.id)
  }
})

const loadEmployee = async (employeeId: string) => {
  uni.showLoading({ title: '加载中...' })
  
  try {
    const db = uniCloud.database()
    const res: any = await db.collection('oa_users').doc(employeeId).get()
    
    uni.hideLoading()
    
    if (res.data && res.data.length > 0) {
      const employee = res.data[0]
      form.username = employee.username
      form.nickname = employee.nickname
      form.role = employee.role
      form.status = employee.status
      isSuperAdmin.value = employee.role === 'super_admin'
    }
  } catch (e: any) {
    uni.hideLoading()
    toastRef.value?.show({ type: 'error', message: e.message || '加载失败' })
  }
}

const handleSave = async () => {
  if (!form.username) {
    toastRef.value?.show({ type: 'warning', message: '请输入登录账号' })
    return
  }
  
  if (!isEdit.value && !form.password) {
    toastRef.value?.show({ type: 'warning', message: '请输入登录密码' })
    return
  }
  
  if (!form.nickname) {
    toastRef.value?.show({ type: 'warning', message: '请输入姓名' })
    return
  }
  
  saving.value = true
  
  try {
    let res: any
    
    if (isEdit.value) {
      res = await oaAPI.updateEmployee(id.value, {
        username: form.username,
        nickname: form.nickname,
        role: form.role,
        status: form.status
      })
    } else {
      res = await oaAPI.addEmployee({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        role: form.role
      })
    }
    
    saving.value = false
    
    if (res.code === 0) {
      toastRef.value?.show({ 
        type: 'success', 
        message: isEdit.value ? '修改成功' : '添加成功' 
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      toastRef.value?.show({ type: 'error', message: res.msg })
    }
  } catch (e: any) {
    saving.value = false
    toastRef.value?.show({ type: 'error', message: e.message || '操作失败' })
  }
}
</script>

<style lang="scss" scoped>
.edit-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 32rpx;
}

.form-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
}

.form-item {
  margin-bottom: 40rpx;

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
      margin-right: 8rpx;
    }
  }

  .tip {
    font-size: 22rpx;
    color: #999;
    margin-top: 12rpx;
  }
}

.role-group {
  display: flex;
  gap: 40rpx;
}

.action-area {
  margin-top: 40rpx;
}
</style>
