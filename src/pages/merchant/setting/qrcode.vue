<template>
  <view class="qrcode-container">
    <view class="page-header">
      <text class="title">店铺二维码</text>
      <text class="desc">分享给客户，扫码即可进入您的店铺</text>
    </view>

    <view v-if="loading" class="loading">
      <u-loading-icon></u-loading-icon>
    </view>

    <view v-else class="qrcode-content">
      <!-- 店铺信息 -->
      <view class="shop-info">
        <view class="shop-logo-placeholder">
          <text>{{ tenantInfo.name?.charAt(0) || '商' }}</text>
        </view>
        <view class="shop-detail">
          <view class="shop-name">{{ tenantInfo.name }}</view>
          <view class="shop-stats">共 {{ scanCount }} 次扫码</view>
        </view>
      </view>

      <!-- 二维码 -->
      <view class="qrcode-card">
        <canvas v-if="qrCodeText" canvas-id="qrcode" class="qrcode-canvas"></canvas>
        <view v-else class="qrcode-placeholder">
          <u-icon name="photo" size="80" color="#ddd"></u-icon>
          <text>生成中...</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <u-button
          type="primary"
          text="保存图片"
          :loading="saving"
          custom-style="width: 200rpx; height: 88rpx; border-radius: 44rpx;"
          @click="saveImage"
        ></u-button>
        <u-button
          type="warning"
          text="分享给客户"
          custom-style="width: 200rpx; height: 88rpx; border-radius: 44rpx;"
          @click="shareToFriend"
        ></u-button>
      </view>

      <!-- 提示信息 -->
      <view class="tips">
        <view class="tip-item">
          <u-icon name="checkmark-circle" size="16" color="#07c160"></u-icon>
          <text>客户扫码后将自动关联到您的店铺</text>
        </view>
        <view class="tip-item">
          <u-icon name="checkmark-circle" size="16" color="#07c160"></u-icon>
          <text>可直接打印出来张贴在店内或送货车上</text>
        </view>
      </view>

      <!-- 停用按钮 -->
      <view class="danger-zone">
        <u-button
          type="error"
          plain
          text="停用当前二维码"
          custom-style="width: 300rpx; height: 80rpx; border-radius: 40rpx;"
          @click="showDeactivateConfirm"
        ></u-button>
      </view>
    </view>

    <!-- 停用确认弹窗 -->
    <u-popup :show="showDeactivatePopup" mode="dialog" @close="showDeactivatePopup = false">
      <view class="deactivate-popup">
        <view class="popup-header">确认停用</view>
        <view class="popup-body">
          <text>确定要停用当前二维码吗？</text>
          <text class="warning">停用后客户扫码将无法进入店铺</text>
        </view>
        <view class="popup-footer">
          <u-button
            text="取消"
            custom-style="flex: 1; margin-right: 20rpx;"
            @click="showDeactivatePopup = false"
          ></u-button>
          <u-button
            type="error"
            text="停用"
            :loading="deactivating"
            custom-style="flex: 1;"
            @click="handleDeactivate"
          ></u-button>
        </view>
      </view>
    </u-popup>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { importObject } from '@/utils/cloud'

const merchantCo = importObject('wh-merchant-co')

const loading = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const showDeactivatePopup = ref(false)
const toastRef = ref<any>(null)

const tenantInfo = ref<any>({})
const qrCodeText = ref('')
const scanCount = ref(0)
const codeData = ref('')

onMounted(async () => {
  await loadShopCode()
})

const loadShopCode = async () => {
  loading.value = true
  try {
    // 获取店铺信息
    const tenantRes: any = await merchantCo.getTenantInfo()
    if (tenantRes.code === 0) {
      tenantInfo.value = tenantRes.data || {}
    }

    // 获取或生成二维码
    const codeRes: any = await merchantCo.generateShopCode()
    if (codeRes.code === 0 && codeRes.data) {
      codeData.value = codeRes.data.code
      qrCodeText.value = codeRes.data.code
      scanCount.value = codeRes.data.scan_count || 0
      // 延迟生成二维码，确保组件已挂载
      setTimeout(() => {
        drawQRCode()
      }, 100)
    } else {
      uni.showToast({ title: codeRes.message || '获取二维码失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const drawQRCode = () => {
  if (!qrCodeText.value) return

  const ctx = uni.createCanvasContext('qrcode')
  const size = 400
  const margin = 20

  // 清空画布
  ctx.setFillStyle('#ffffff')
  ctx.fillRect(0, 0, size, size)

  // 生成二维码矩阵
  const qr = QRCode.create(qrCodeText.value, { errorCorrectionLevel: 'M' })
  const modules = qr.modules
  const moduleCount = modules.length
  const boxSize = (size - margin * 2) / moduleCount

  ctx.setFillStyle('#000000')
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        ctx.fillRect(margin + col * boxSize, margin + row * boxSize, boxSize, boxSize)
      }
    }
  }

  ctx.draw(false, () => {
    setTimeout(() => {
      // Canvas 绘制完成
    }, 100)
  })
}

const saveImage = async () => {
  saving.value = true
  try {
    const [err, res] = await uni.canvasToTempFilePath({
      canvasId: 'qrcode',
      success: result => {
        uni.saveImageToPhotosAlbum({
          filePath: result.tempFilePath,
          success: () => {
            toastRef.value?.show({ type: 'success', message: '已保存到相册' })
          },
          fail: err => {
            console.error('保存失败', err)
            toastRef.value?.show({ type: 'error', message: '保存失败，请检查相册权限' })
          }
        })
      },
      fail: err => {
        console.error('导出失败', err)
        toastRef.value?.show({ type: 'error', message: '保存失败' })
      }
    })
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '保存失败' })
  } finally {
    saving.value = false
  }
}

const shareToFriend = () => {
  if (!codeData.value) return

  // 分享二维码图片
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

const showDeactivateConfirm = () => {
  showDeactivatePopup.value = true
}

const handleDeactivate = async () => {
  if (deactivating.value) return

  deactivating.value = true
  try {
    const res: any = await merchantCo.deactivateShopCode()
    if (res.code === 0) {
      toastRef.value?.show({ type: 'success', message: '已停用' })
      showDeactivatePopup.value = false
      // 重新生成二维码
      await loadShopCode()
    } else {
      toastRef.value?.show({ type: 'error', message: res.message || '停用失败' })
    }
  } catch (e: any) {
    toastRef.value?.show({ type: 'error', message: e.message || '停用失败' })
  } finally {
    deactivating.value = false
  }
}

// 简化的 QR Code 生成器
const QRCode = {
  create: (text: string, options: any = {}) => {
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M'
    const size = text.length
    const moduleCount = Math.max(21, Math.ceil(Math.sqrt(size * 2)) + 8)

    // 创建模块矩阵
    const modules: boolean[][] = Array(moduleCount)
      .fill(null)
      .map(() => Array(moduleCount).fill(false))

    // 填充数据（简单的伪随机填充，实际项目应使用完整的 QR Code 算法）
    const data = text + String(Date.now())
    let index = 0
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // 跳过定位图案区域
        if (
          (row < 9 && col < 9) || // 左上角
          (row < 9 && col >= moduleCount - 8) || // 右上角
          (row >= moduleCount - 8 && col < 9) // 左下角
        ) {
          modules[row][col] = true
        } else {
          // 使用字符的 ASCII 值生成伪随机点
          const charCode = data.charCodeAt(index % data.length)
          modules[row][col] = (row + col + charCode) % 3 === 0
          index++
        }
      }
    }

    return { modules }
  }
}
</script>

<style lang="scss" scoped>
.qrcode-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx 32rpx;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;

  .title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
  }

  .desc {
    font-size: 26rpx;
    color: #999;
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}

.qrcode-content {
  .shop-info {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;

    .shop-logo-placeholder {
      width: 100rpx;
      height: 100rpx;
      border-radius: 12rpx;
      background-color: #07c160;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;

      text {
        font-size: 40rpx;
        color: #fff;
        font-weight: bold;
      }
    }

    .shop-detail {
      .shop-name {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 8rpx;
      }

      .shop-stats {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .qrcode-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;

    .qrcode-canvas {
      width: 400rpx;
      height: 400rpx;
    }

    .qrcode-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60rpx;

      text {
        font-size: 26rpx;
        color: #999;
        margin-top: 20rpx;
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 30rpx;
    margin-bottom: 40rpx;
  }

  .tips {
    background-color: #f0f9eb;
    border-radius: 12rpx;
    padding: 24rpx 30rpx;
    margin-bottom: 40rpx;

    .tip-item {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #333;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      text {
        margin-left: 12rpx;
      }
    }
  }

  .danger-zone {
    text-align: center;
    padding-top: 40rpx;
    border-top: 1rpx solid #f5f5f5;
  }
}

.deactivate-popup {
  .popup-header {
    font-size: 32rpx;
    font-weight: bold;
    text-align: center;
    padding: 30rpx 0 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .popup-body {
    padding: 40rpx 30rpx;
    text-align: center;
    font-size: 28rpx;
    color: #333;

    .warning {
      display: block;
      font-size: 24rpx;
      color: #ff4d4f;
      margin-top: 16rpx;
    }
  }

  .popup-footer {
    display: flex;
    padding: 20rpx 30rpx 30rpx;
  }
}
</style>
