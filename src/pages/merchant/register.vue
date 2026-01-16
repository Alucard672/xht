<template>
  <view class="register-container">
    <view class="header">
      <text class="title">申请入驻</text>
      <text class="subtitle">开启您的数字化批发之旅</text>
    </view>

    <view class="form">
      <view class="input-group">
        <text class="label">店铺名称</text>
        <input
          v-model="form.shopName"
          class="input"
          placeholder="如：老王粮油批发"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <text class="label">手机号码</text>
        <input
          v-model="form.username"
          class="input"
          type="number"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <text class="label">登录密码</text>
        <input
          v-model="form.password"
          class="input"
          type="password"
          placeholder="设置登录密码"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <text class="label">确认密码</text>
        <input
          v-model="form.confirmPassword"
          class="input"
          type="password"
          placeholder="再次输入密码"
          placeholder-class="placeholder"
        />
      </view>

      <button class="submit-btn" :loading="loading" @click="handleRegister">
        {{ loading ? '提交中...' : '立即开通' }}
      </button>

      <view class="login-link" @click="goToLogin">已有账号？去登录</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/useUserStore'

const form = reactive({
  shopName: '',
  username: '', // 暂时作为手机号使用
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const userStore = useUserStore()

const handleRegister = async () => {
  if (!form.shopName) return uni.showToast({ title: '请输入店铺名称', icon: 'none' })
  if (!form.username) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  if (!form.password) return uni.showToast({ title: '请输入密码', icon: 'none' })
  if (form.password !== form.confirmPassword)
    return uni.showToast({ title: '两次密码不一致', icon: 'none' })

  loading.value = true
  try {
    const userCo = uniCloud.importObject('wh-user-co')
    const res = await userCo.registerMerchant({
      username: form.username,
      password: form.password,
      shopName: form.shopName
    })

    if (res.code === 0) {
      uni.showToast({ title: res.msg })

      // 注册成功后跳转到登录页
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/merchant/login?registered=true' })
      }, 1500)
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '注册失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/merchant/login' })
}
</script>

<style lang="scss" scoped>
.register-container {
  padding: 60rpx;
  .header {
    margin-bottom: 80rpx;
    display: flex;
    flex-direction: column;
    .title {
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
    }
    .subtitle {
      font-size: 28rpx;
      color: #999;
      margin-top: 10rpx;
    }
  }
  .form {
    .input-group {
      background: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 24rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
      .label {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        display: block;
        margin-bottom: 16rpx;
      }
      .input {
        font-size: 32rpx;
        color: #333;
        height: 80rpx;
        line-height: 80rpx;
      }
      .placeholder {
        color: #c0c4cc;
      }
    }
    .submit-btn {
      margin-top: 50rpx;
      background: linear-gradient(90deg, #07c160, #06ad56);
      color: #fff;
      border-radius: 12rpx;
      font-size: 32rpx;
      height: 96rpx;
      line-height: 96rpx;
      border: none;
      &:active {
        opacity: 0.9;
      }
      &[disabled] {
        opacity: 0.6;
      }
    }
    .login-link {
      margin-top: 30rpx;
      text-align: center;
      color: #666;
      font-size: 28rpx;
    }
  }
}
</style>
