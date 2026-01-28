<template>
  <view class="login-container">
    <view class="header">
      <view class="logo-section">
        <text class="logo-icon">🏪</text>
      </view>
      <text class="title">乡货通</text>
      <text class="subtitle">专注乡镇批发的 SaaS 平台</text>
    </view>

    <view class="form">
      <view class="input-group">
        <text class="label">手机号</text>
        <input
          v-model="form.mobile"
          class="input"
          type="number"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <text class="label">密码</text>
        <input
          v-model="form.password"
          class="input"
          type="password"
          placeholder="请输入密码"
          placeholder-class="placeholder"
        />
      </view>

      <button class="submit-btn" :loading="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <view class="actions">
        <text class="link" @click="goRegister">没有账号？去注册</text>
      </view>
    </view>

    <view class="footer">
      <text class="footer-text">乡货通 · 让批发更简单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onShow as uniOnShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()

const form = reactive({
  mobile: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }
  if (!form.password) {
    return uni.showToast({ title: '请输入密码', icon: 'none' })
  }

  loading.value = true
  try {
    const { importObject } = await import('@/utils/cloud')
    const userCo = importObject('wh-user-co')
    const res = await userCo.loginMerchant({
      username: form.mobile,
      password: form.password
    })

    if (res.code === 0) {
      userStore.login(res)
      uni.showToast({ title: '登录成功' })

      setTimeout(() => {
        // 登录成功后跳转到工作台
        uni.reLaunch({ url: '/pages/merchant/dashboard' })
      }, 1000)
    } else {
      uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '系统错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  uni.navigateTo({ url: '/pages/merchant/register' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f4ff 0%, #f7f8fa 50%, #ffffff 100%);
  padding: $wh-spacing-xxl $wh-spacing-xl;
  @include safe-area-top;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .header {
    margin-bottom: $wh-spacing-3xl;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .logo-section {
      margin-bottom: $wh-spacing-lg;

      .logo-icon {
        font-size: 120rpx;
        display: block;
        filter: drop-shadow(0 8rpx 16rpx rgba(45, 127, 249, 0.2));
      }
    }

    .title {
      font-size: $wh-font-size-3xl;
      font-weight: $wh-font-weight-extrabold;
      background: $wh-gradient-blue;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 2rpx;
      margin-bottom: $wh-spacing-sm;
    }

    .subtitle {
      font-size: $wh-font-size-md;
      color: $wh-text-color-gray;
      font-weight: $wh-font-weight-medium;
      letter-spacing: 0.5rpx;
    }
  }

  .form {
    margin-bottom: $wh-spacing-xl;

    .input-group {
      background: $wh-bg-color-card;
      border-radius: $wh-border-radius-lg;
      padding: $wh-spacing-xl;
      margin-bottom: $wh-spacing-md;
      box-shadow: $wh-shadow-sm;
      border: 2rpx solid transparent;
      transition: all $wh-transition-normal;

      &:focus-within {
        border-color: $wh-color-blue;
        box-shadow: 0 0 0 6rpx rgba(45, 127, 249, 0.1);
        transform: translateY(-2rpx);
      }

      .label {
        font-size: $wh-font-size-md;
        color: $wh-text-color-dark;
        font-weight: $wh-font-weight-semibold;
        display: block;
        margin-bottom: $wh-spacing-sm;
        letter-spacing: 0.5rpx;
      }

      .input {
        font-size: $wh-font-size-lg;
        color: $wh-text-color-dark;
        height: 88rpx;
        line-height: 88rpx;
        font-weight: $wh-font-weight-medium;
      }

      .placeholder {
        color: $wh-text-color-placeholder;
      }
    }

    .actions {
      margin-top: $wh-spacing-lg;
      display: flex;
      justify-content: center;

      .link {
        font-size: $wh-font-size-md;
        color: $wh-color-blue;
        font-weight: $wh-font-weight-semibold;
        padding: $wh-spacing-sm;
        border-radius: $wh-border-radius-full;
        transition: all $wh-transition-normal;

        &:active {
          opacity: 0.7;
          transform: scale(0.95);
        }
      }
    }

    .submit-btn {
      margin-top: $wh-spacing-xl;
      background: $wh-color-blue;
      color: $wh-text-color-inverse;
      border-radius: $wh-border-radius-full;
      font-size: $wh-font-size-xl;
      font-weight: $wh-font-weight-semibold;
      height: 100rpx;
      line-height: 100rpx;
      border: none;
      box-shadow: $wh-shadow-colored;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.95);
        box-shadow: $wh-shadow-md;
      }

      &[disabled] {
        opacity: 0.5;
        transform: none;
      }
    }
  }

  .footer {
    text-align: center;
    padding-top: $wh-spacing-3xl;

    .footer-text {
      font-size: $wh-font-size-sm;
      color: $wh-text-color-light-gray;
      font-weight: $wh-font-weight-medium;
      letter-spacing: 1rpx;
    }
  }
}
</style>
