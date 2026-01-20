<template>
  <view class="login-container">
    <view class="header">
      <view class="logo-area">
        <view class="logo">
          <u-icon name="grid" size="80" color="#722ed1"></u-icon>
        </view>
        <text class="title">系统管理端</text>
        <text class="subtitle">OA后台管理系统</text>
      </view>
    </view>

    <view class="form-area">
      <view class="form-item">
        <view class="label">账号</view>
        <u-input
          v-model="form.username"
          placeholder="请输入登录账号"
          border="true"
          custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
          :maxlength="20"
        >
          <template #prefix>
            <u-icon name="account" size="40" color="#722ed1"></u-icon>
          </template>
        </u-input>
      </view>

      <view class="form-item">
        <view class="label">密码</view>
        <u-input
          v-model="form.password"
          type="password"
          placeholder="请输入登录密码"
          border="true"
          custom-style="padding: 24rpx 30rpx; border-radius: 12rpx;"
          :maxlength="20"
        >
          <template #prefix>
            <u-icon name="lock" size="40" color="#722ed1"></u-icon>
          </template>
        </u-input>
      </view>

      <view class="login-btn" @click="handleLogin">
        <text>登 录</text>
      </view>
    </view>

    <view class="footer">
      <text class="copyright">© 2024 乡货通 SaaS</text>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import oaAPI from '@/utils/oa'

const toastRef = ref<any>(null)
const form = reactive({
  username: '',
  password: ''
})

onLoad(async () => {
  // 登录页不应该自动跳转，否则会导致登录成功后立即跳转时冲突
  // 只有在用户明确操作后才跳转
  
  try {
    await oaAPI.initDefaultAdmin()
  } catch (e) {
    // 管理员已存在，忽略错误
  }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    toastRef.value?.show({
      type: 'warning',
      message: '请输入账号和密码'
    })
    return
  }
  
  uni.showLoading({ title: '登录中...' })
  
  try {
    const res: any = await oaAPI.login({
      username: form.username,
      password: form.password
    })
    
    uni.hideLoading()
    
    if (res.code === 0) {
      uni.setStorageSync('oa_token', res.data.token)
      uni.setStorageSync('oa_user', res.data.user)
      
      uni.setStorageSync('oa_token', res.data.token)
      uni.setStorageSync('oa_user', res.data.user)
      
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      // 延迟一点时间让用户看到提示，然后跳转
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/admin/merchant/list' })
      }, 500)
    } else {
      toastRef.value?.show({
        type: 'error',
        message: res.msg || '登录失败'
      })
    }
  } catch (e: any) {
    uni.hideLoading()
    toastRef.value?.show({
      type: 'error',
      message: e.message || '登录失败'
    })
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #722ed1 0%, #531dab 100%);
  display: flex;
  flex-direction: column;
  padding: 0 60rpx;
}

.header {
  padding-top: 120rpx;
  padding-bottom: 80rpx;
  
  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .logo {
      width: 160rpx;
      height: 160rpx;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30rpx;
    }
    
    .title {
      font-size: 48rpx;
      font-weight: bold;
      color: #fff;
      margin-bottom: 16rpx;
    }
    
    .subtitle {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.form-area {
  flex: 1;
  background: #fff;
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 60rpx;
  
  .form-item {
    margin-bottom: 40rpx;
    
    .label {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 16rpx;
      padding-left: 10rpx;
    }
  }
  
  .login-btn {
    height: 96rpx;
    background: linear-gradient(90deg, #722ed1 0%, #9d41ff 100%);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 60rpx;
    
    text {
      font-size: 36rpx;
      font-weight: bold;
      color: #fff;
    }
    
    &:active {
      opacity: 0.9;
    }
  }
}

.footer {
  padding-bottom: 40rpx;
  text-align: center;
  
  .copyright {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
