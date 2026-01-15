<template>
  <view class="qrcode-image-container">
    <image :src="qrcodeUrl" mode="aspectFit" class="qrcode-image"></image>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const qrcodeUrl = ref('')

onLoad((options: any) => {
  if (options.code) {
    const code = decodeURIComponent(options.code)
    // 生成二维码图片
    // 使用 uni-app 的二维码插件或 Canvas 生成
    // 这里演示使用组件生成二维码图片
    generateQRCode(code)
  }
})

const generateQRCode = (content: string) => {
  // 在实际项目中，这里应该使用 u-qrcode 或其他二维码生成组件
  // 或者调用后端接口生成二维码图片
  // 这里使用一个占位图
  qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(content)}`
}
</script>

<style lang="scss" scoped>
.qrcode-image-container {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;

  .qrcode-image {
    width: 100%;
    max-width: 600rpx;
  }
}
</style>
