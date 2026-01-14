<template>
  <view class="register-container">
    <view class="header">
      <text class="title">申请入驻</text>
      <text class="subtitle">开启您的数字化批发之旅</text>
    </view>

    <view class="form">
      <u-form ref="uForm" :model="form">
        <u-form-item label="店铺名称" prop="shopName" border-bottom label-width="160rpx">
          <u-input v-model="form.shopName" placeholder="如：老王粮油批发" border="none" />
        </u-form-item>
        <u-form-item label="手机号码" prop="username" border-bottom label-width="160rpx">
          <u-input v-model="form.username" placeholder="请输入手机号" border="none" />
        </u-form-item>
        <u-form-item label="登录密码" prop="password" border-bottom label-width="160rpx">
          <u-input
            v-model="form.password"
            type="password"
            placeholder="设置登录密码"
            border="none"
          />
        </u-form-item>
        <u-form-item label="确认密码" prop="confirmPassword" border-bottom label-width="160rpx">
          <u-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            border="none"
          />
        </u-form-item>
      </u-form>

      <u-button
        type="primary"
        text="立即开通"
        custom-style="margin-top: 50rpx; background: linear-gradient(90deg, #07c160, #06ad56); border: none;"
        :loading="loading"
        @click="handleRegister"
      ></u-button>

      <view style="margin-top: 30rpx; text-align: center">
        <text style="color: #666; font-size: 28rpx" @click="goToLogin">已有账号？去登录</text>
      </view>
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
      uni.showToast({ title: '注册成功' })

      // 保存登录状态
      userStore.login({
        token: res.token,
        userInfo: res.userInfo,
        tenantInfo: res.tenantInfo,
        tokenExpired: res.tokenExpired
      })

      setTimeout(() => {
        uni.reLaunch({ url: '/pages/merchant/dashboard' })
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
}
</style>
