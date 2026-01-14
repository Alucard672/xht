<template>
  <view class="setting-container">
    <view class="form-box">
      <u-form ref="settingForm" :model="form" label-width="150rpx">
        <u-form-item label="店铺名称" border-bottom required>
          <u-input v-model="form.name" placeholder="请输入店铺名称" border="none" />
        </u-form-item>

        <u-form-item label="联系电话" border-bottom>
          <u-input v-model="form.phone" placeholder="请输入联系电话" border="none" />
        </u-form-item>

        <u-form-item label="店铺 Logo" border-bottom>
          <view class="upload-area">
            <u-upload
              :file-list="fileList"
              name="logo"
              :max-count="1"
              width="160rpx"
              height="160rpx"
              @after-read="afterRead"
              @delete="deletePic"
            ></u-upload>
          </view>
        </u-form-item>

        <u-form-item label="起送价" border-bottom>
          <u-input
            v-model="form.min_delivery_price_display"
            type="digit"
            placeholder="0"
            border="none"
          />
          <template #right>
            <view class="unit">元</view>
          </template>
        </u-form-item>

        <u-form-item label="允许赊账" border-bottom>
          <template #right>
            <view>
              <u-switch v-model="form.settings.allow_debt" active-color="#07c160"></u-switch>
            </view>
          </template>
        </u-form-item>
      </u-form>
    </view>

    <view class="footer-btn">
      <u-button type="primary" text="保存设置" :loading="loading" @click="saveSettings"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const merchantCo = importObject('wh-merchant-co')
const loading = ref(false)
const fileList = ref<any[]>([])

const form = reactive({
  name: '',
  phone: '',
  logo_url: '',
  min_delivery_price_display: '0',
  settings: {
    allow_debt: true,
    min_delivery_price: 0
  }
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  uni.showLoading({ title: '加载中' })
  try {
    const res = await merchantCo.getTenantInfo()
    if (res.code === 0) {
      const data = res.data
      form.name = data.name || ''
      form.phone = data.phone || ''
      form.logo_url = data.logo_url || ''
      form.settings = data.settings || { allow_debt: true, min_delivery_price: 0 }
      form.min_delivery_price_display = priceHelper.format(form.settings.min_delivery_price || 0)

      if (form.logo_url) {
        fileList.value = [{ url: form.logo_url, status: 'success', message: '' }]
      }
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const afterRead = async (event: any) => {
  const file = event.file[0]
  const tenant_id = uni.getStorageSync('tenant_id')

  fileList.value.push({ ...file, status: 'uploading', message: '上传中' })

  try {
    const result = await uniCloud.uploadFile({
      filePath: file.url,
      cloudPath: `logo/${tenant_id}/${Date.now()}.png`
    })
    form.logo_url = result.fileID
    fileList.value[0].status = 'success'
    fileList.value[0].message = ''
    fileList.value[0].url = result.fileID
  } catch (e) {
    fileList.value[0].status = 'failed'
    fileList.value[0].message = '上传失败'
  }
}

const deletePic = () => {
  fileList.value = []
  form.logo_url = ''
}

const saveSettings = async () => {
  if (!form.name) return uni.showToast({ title: '请输入店铺名称', icon: 'none' })

  loading.value = true
  try {
    const min_price_fen = priceHelper.toFen(form.min_delivery_price_display)
    const updateData = {
      name: form.name,
      phone: form.phone,
      logo_url: form.logo_url,
      settings: {
        allow_debt: form.settings.allow_debt,
        min_delivery_price: min_price_fen
      }
    }

    const res = await merchantCo.updateTenantInfo(updateData)
    if (res.code === 0) {
      uni.showToast({ title: '保存成功' })
      uni.$emit('refresh-dashboard')
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.setting-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;

  .form-box {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 0 30rpx;
  }

  .upload-area {
    padding: 20rpx 0;
  }

  .unit {
    font-size: 28rpx;
    color: #333;
    margin-left: 10rpx;
  }

  .footer-btn {
    margin-top: 60rpx;
    padding: 0 40rpx;
  }
}
</style>
