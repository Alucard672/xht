<template>
  <view class="login-container">
    <view class="header">
      <text class="title">乡货通 - 开发环境登录</text>
      <text class="subtitle">输入手机号即可直接进入系统</text>
    </view>

    <view class="form">
      <u-form :model="form" ref="uForm">
        <u-form-item label="手机号" prop="mobile" borderBottom>
          <u-input v-model="form.mobile" type="number" placeholder="请输入手机号" border="none" />
        </u-form-item>
      </u-form>

      <view class="quick-tips">
        <text class="tip-text" @click="form.mobile = '13003629527'">[超级管理员: 13003629527]</text>
        <text class="tip-text" @click="form.mobile = '13800001111'">[普通商家: 13800001111]</text>
      </view>

      <u-button type="primary" text="直接登录" :loading="loading" customStyle="margin-top: 50rpx" @click="handleLogin"></u-button>
    </view>

    <view class="footer">
      <text>提示：开发环境已关闭短信验证码</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const form = reactive({
  mobile: ''
})

const loading = ref(false)

const handleLogin = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }

  loading.value = true
  try {
    const merchantCo = uniCloud.importObject('wh-merchant-co')
    const res = await merchantCo.devLogin(form.mobile)
    
    if (res.code === 0) {
      // 保存认证信息
      uni.setStorageSync('uni_id_token', res.token)
      uni.setStorageSync('uni_id_token_expired', res.tokenExpired)
      uni.setStorageSync('uni-id-pages-userInfo', res.userInfo)
      
      if (res.userInfo.tenant_id) {
        uni.setStorageSync('tenant_id', res.userInfo.tenant_id)
      }

      uni.showToast({ title: '登录成功' })

      setTimeout(() => {
        if (form.mobile === '13003629527') {
          // 超管进入后台
          uni.reLaunch({ url: '/pages/admin/merchant/list' })
        } else {
          // 普通用户进入商家端首页或注册页
          if (res.userInfo.tenant_id) {
            uni.reLaunch({ url: '/pages/index/index' })
          } else {
            uni.reLaunch({ url: '/pages/merchant/register' })
          }
        }
      }, 1000)
    } else {
      uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: '系统错误: ' + (e.msg || ''), icon: 'none' })
  } finally {
    loading.value = false
  }
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
    .quick-tips {
      margin-top: 20rpx;
      display: flex;
      flex-direction: column;
      gap: 10rpx;
      .tip-text {
        font-size: 24rpx;
        color: #2979ff;
        text-decoration: underline;
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
