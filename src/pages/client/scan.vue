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

    <view class="manual-input">
      <text class="section-title">或者手动输入</text>
      <u-input
        v-model="manualTenantId"
        placeholder="请输入店铺码"
        border="surround"
        shape="circle"
        @confirm="handleManualInput"
      />
      <u-button
        type="primary"
        text="进入店铺"
        :loading="loading"
        :disabled="!manualTenantId"
        custom-style="margin-top: 20rpx;"
        @click="handleManualInput"
      ></u-button>
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
import { importObject } from '@/utils/cloud'

const manualTenantId = ref('')
const loading = ref(false)
const toastRef = ref<any>(null)
const userCo = importObject('wh-user-co')

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
      message: '无效的店铺码'
    })
    return
  }

  navigateToShop(tenantId)
}

const handleManualInput = () => {
  if (!manualTenantId.value) {
    toastRef.value?.show({
      type: 'error',
      message: '请输入店铺码'
    })
    return
  }

  const tenantId = manualTenantId.value.trim()
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
        if (tenant.status === 0) {
          toastRef.value?.show({
            type: 'error',
            message: '店铺已暂停营业'
          })
          return
        }

        // 保存店铺信息
        uni.setStorageSync('tenant_id', tenantId)
        uni.setStorageSync('tenant_info', tenant)

        // 调用客户关联接口
        try {
          const bindRes: any = await userCo.bindTenant({ tenant_id: tenantId })
          if (bindRes.code === 0) {
            toastRef.value?.show({
              type: 'success',
              message: '已进入 ' + tenant.name
            })
          }
        } catch (e) {
          // 关联失败不阻断流程
          console.error('Bind tenant failed:', e)
        }

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/client/shop?tenant_id=${tenantId}`,
            fail: err => {
              console.error('Navigate failed:', err)
              toastRef.value?.show({
                type: 'error',
                message: '跳转失败'
              })
            }
          })
        }, 1000)
      } else {
        toastRef.value?.show({
          type: 'error',
          message: '店铺不存在'
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

.manual-input {
  width: 100%;
  max-width: 600rpx;

  .section-title {
    display: block;
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 24rpx;
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
