<template>
  <view class="register-container">
    <view class="header">
      <text class="title">申请入驻</text>
      <text class="subtitle">开启您的数字化批发之旅</text>
    </view>

    <view class="form">
      <u-form :model="form" ref="uForm">
        <u-form-item label="店铺名称" prop="shopName" borderBottom labelWidth="160rpx">
          <u-input v-model="form.shopName" placeholder="如：老王粮油批发" border="none" />
        </u-form-item>
        <u-form-item label="联系电话" prop="mobile" borderBottom labelWidth="160rpx">
          <u-input v-model="form.mobile" placeholder="负责人手机号" border="none" />
        </u-form-item>
      </u-form>

      <u-button type="success" text="确认入驻" customStyle="margin-top: 50rpx" :loading="loading" @click="handleOnboard"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const form = reactive({
  shopName: '',
  mobile: ''
})

const loading = ref(false)

const handleOnboard = async () => {
  if (!form.shopName) return uni.showToast({ title: '请输入店铺名称', icon: 'none' })
  
  loading.value = true
  try {
    // 调用云对象 wh-merchant-co
    const merchantCo = uniCloud.importObject('wh-merchant-co')
    const res = await merchantCo.onboard(form.shopName)
    
    if (res.code === 0) {
      uni.showToast({ title: '入驻成功' })
      // 持久化租户ID
      uni.setStorageSync('tenant_id', res.tenant_id)
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/merchant/goods/list' })
      }, 1500)
    } else {
      uni.showToast({ title: res.msg || '入驻失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '系统错误', icon: 'none' })
  } finally {
    loading.value = false
  }
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

