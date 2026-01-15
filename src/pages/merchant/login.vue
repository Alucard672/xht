<template>
  <view class="login-container">
    <view class="header">
      <text class="title">乡货通 - 商家登录</text>
      <text class="subtitle">专注乡镇批发的 SaaS 平台</text>
    </view>

    <view class="form">
      <u-form ref="uForm" :model="form">
        <u-form-item label="手机号" prop="mobile" border-bottom>
          <u-input v-model="form.mobile" type="number" placeholder="请输入手机号" border="none" />
        </u-form-item>
        <u-form-item label="密码" prop="password" border-bottom>
          <u-input v-model="form.password" type="password" placeholder="请输入密码" border="none" />
        </u-form-item>
      </u-form>

      <u-button
        type="primary"
        text="登录"
        :loading="loading"
        custom-style="margin-top: 50rpx"
        @click="handleLogin"
      ></u-button>

      <view class="actions">
        <text class="link" @click="goRegister">没有账号？去注册</text>
      </view>
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

uniOnShow(() => {
  // 如果是注册后跳转过来，显示提示
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (currentPage.options.registered === 'true') {
    uni.showToast({
      title: '注册成功，请等待审核',
      icon: 'none',
      duration: 3000
    })
  }
})

const handleLogin = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }
  if (!form.password) {
    return uni.showToast({ title: '请输入密码', icon: 'none' })
  }

  loading.value = true
  try {
    const userCo = uniCloud.importObject('wh-user-co')
    const res = await userCo.loginMerchant({
      username: form.mobile,
      password: form.password
    })

    if (res.code === 0) {
      userStore.login(res)
      uni.showToast({ title: '登录成功' })

      setTimeout(() => {
        // 登录成功后跳转到首页
        uni.reLaunch({ url: '/pages/index/index' })
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
.login-container {
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
    margin-bottom: 40rpx;
    .actions {
      margin-top: 30rpx;
      display: flex;
      justify-content: center;
      .link {
        font-size: 28rpx;
        color: #2979ff;
      }
    }
  }
  .footer {
    text-align: center;
    font-size: 24rpx;
    color: #ccc;
    margin-top: 60rpx;
  }
}
</style>
