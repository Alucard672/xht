<template>
  <view class="scan-container">
    <view class="scan-header">
      <text class="title">扫码进店</text>
      <text class="desc">扫描商家店铺码，立即订货</text>
    </view>

    <view class="scan-preview" @click="handleScan">
      <view class="camera-frame">
        <view class="corner top-left"></view>
        <view class="corner top-right"></view>
        <view class="corner bottom-left"></view>
        <view class="corner bottom-right"></view>
        <u-icon name="scan" size="120" color="#07c160"></u-icon>
        <text class="hint-text">点击开始扫码</text>
      </view>
    </view>

    <view class="help-section">
      <u-icon name="question-circle" size="18" color="#999"></u-icon>
      <text class="help-text">没有店铺码？</text>
      <text class="link-text" @click="showHelp">联系商家获取</text>
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'

const loading = ref(false)
const toastRef = ref<any>(null)
const userCo = importObject('wh-user-co')

onShow(() => {
  checkLoginStatus()
})

const checkLoginStatus = () => {
  const token = uni.getStorageSync('uni_id_token')
  if (!token) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再扫码进店',
      showCancel: false,
      success: () => {
        uni.redirectTo({
          url: '/pages/client/scan' // Stay on scan page after auth
        })
      }
    })
  }
}

const handleScan = () => {
  uni.scanCode({
    success: res => {
      console.log('Scan result:', res)
      processScanResult(res)
    },
    fail: err => {
      console.error('Scan failed:', err)
      toastRef.value?.show({
        type: 'error',
        message: '扫码失败，请重试'
      })
    }
  })
}

const processScanResult = (res: any) => {
  let tenantId = ''

  switch (res.scanType) {
    case 'QR_CODE':
    case 'EAN_13':
    case 'EAN_8':
    case 'UPC_A':
    case 'UPC_E':
    case 'CODE_128':
    case 'CODE_39':
    case 'CODE_93':
    case 'ITF':
    case 'NW7':
    case 'CODE_11':
    case 'PDF417':
    case 'AZTEC':
    case 'DATA_MATRIX':
    case 'MAXICODE':
    case 'RSS_14':
    case 'RSS_EXPANDED':
    case 'CODABAR':
      try {
        const result = JSON.parse(res.result)
        tenantId = result.tenant_id || result.tid || result.shopId || result.code || ''
      } catch {
        tenantId = res.result
      }
      break
    default:
      tenantId = res.result
  }

  if (!tenantId) {
    toastRef.value?.show({
      type: 'error',
      message: '无效的店铺码，请联系商家'
    })
    return
  }

  navigateToShop(tenantId)
}

const navigateToShop = (tenantId: string) => {
  loading.value = true

  uniCloud
    .database()
    .collection('wh_tenants')
    .doc(tenantId)
    .get()
    .then(async (res: any) => {
      if (res.result.data && res.result.data.length > 0) {
        const tenant = res.result.data[0]

        // Check tenant status
        if (tenant.status === 0) {
          toastRef.value?.show({
            type: 'error',
            message: '店铺审核中，暂未开业'
          })
          loading.value = false
          return
        }
        if (tenant.status === 2) {
          toastRef.value?.show({
            type: 'error',
            message: '店铺已冻结，请联系商家'
          })
          loading.value = false
          return
        }
        if (tenant.status === 3) {
          toastRef.value?.show({
            type: 'error',
            message: '店铺已过期，请联系商家续费'
          })
          loading.value = false
          return
        }

        // Save tenant info
        uni.setStorageSync('tenant_id', tenantId)
        uni.setStorageSync('tenant_info', tenant)

        // Bind tenant
        try {
          const bindRes: any = await userCo.bindTenant({ tenant_id: tenantId })
          if (bindRes.code === 0) {
            toastRef.value?.show({
              type: 'success',
              message: '已进入 ' + tenant.name
            })
          }
        } catch (e) {
          console.error('Bind tenant failed:', e)
        }

        // Navigate with delay
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/client/shop?tenant_id=${tenantId}`,
            fail: err => {
              console.error('Navigate failed:', err)
              toastRef.value?.show({
                type: 'error',
                message: '页面跳转失败'
              })
            }
          })
        }, 1000)
      } else {
        toastRef.value?.show({
          type: 'error',
          message: '无效的店铺码，请联系商家'
        })
      }
    })
    .catch(err => {
      console.error('Query failed:', err)
      toastRef.value?.show({
        type: 'error',
        message: '店铺验证失败'
      })
    })
    .finally(() => {
      loading.value = false
    })
}

const showHelp = () => {
  uni.showModal({
    title: '获取店铺码',
    content: '请联系您的批发商获取店铺二维码，您也可以直接向商家索要店铺码进行手动输入。',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
.scan-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 48rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scan-header {
  text-align: center;
  margin-bottom: 60rpx;

  .title {
    display: block;
    font-size: 44rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
  }

  .desc {
    font-size: 28rpx;
    color: #999;
  }
}

.scan-preview {
  width: 500rpx;
  height: 500rpx;
  background-color: #fff;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 60rpx;

  .camera-frame {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;

    .corner {
      position: absolute;
      width: 40rpx;
      height: 40rpx;
      border-color: #07c160;
      border-style: solid;

      &.top-left {
        top: -10rpx;
        left: -10rpx;
        border-width: 6rpx 0 0 6rpx;
      }

      &.top-right {
        top: -10rpx;
        right: -10rpx;
        border-width: 6rpx 6rpx 0 0;
      }

      &.bottom-left {
        bottom: -10rpx;
        left: -10rpx;
        border-width: 0 0 6rpx 6rpx;
      }

      &.bottom-right {
        bottom: -10rpx;
        right: -10rpx;
        border-width: 0 6rpx 6rpx 0;
      }
    }

    .hint-text {
      margin-top: 20rpx;
      font-size: 26rpx;
      color: #999;
    }
  }
}

.help-section {
  display: flex;
  align-items: center;
  margin-top: 60rpx;

  .help-text {
    font-size: 26rpx;
    color: #999;
    margin-left: 8rpx;
  }

  .link-text {
    font-size: 26rpx;
    color: #07c160;
    margin-left: 8rpx;
  }
}
</style>
