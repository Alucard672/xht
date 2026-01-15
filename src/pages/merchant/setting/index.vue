<template>
  <view class="setting-container">
    <!-- 会员信息卡片 -->
    <view class="membership-card" :class="{ 'is-expired': membership.isExpired }">
      <view class="card-header">
        <view class="card-title">会员信息</view>
        <view class="status-tag" :class="getStatusClass(membership.status)">
          {{ membership.statusText }}
        </view>
      </view>
      <view class="card-body">
        <view class="info-row">
          <text class="label">到期时间</text>
          <text class="value">{{ formatDate(membership.expired_at) }}</text>
        </view>
        <view class="info-row" v-if="membership.daysLeft !== undefined">
          <text class="label">剩余天数</text>
          <text class="value" :class="{ 'text-danger': membership.daysLeft <= 7 }">
            {{ membership.daysLeft }} 天
          </text>
        </view>
      </view>
      <view class="card-footer" v-if="membership.isExpired || membership.daysLeft <= 7">
        <view class="renew-hint">
          <u-icon name="info-circle" color="#ff4d4f" size="16"></u-icon>
          <text>{{
            membership.isExpired ? '您的会员已过期，请尽快续费' : '会员即将到期，请及时续费'
          }}</text>
        </view>
        <view class="renew-btn" @click="showRenewModal">
          <text>联系管理员续费</text>
        </view>
      </view>
    </view>

    <!-- 续费弹窗 -->
    <u-popup
      :show="showRenewPopup"
      mode="bottom"
      border-radius="24"
      @close="showRenewPopup = false"
    >
      <view class="renew-popup">
        <view class="popup-header">
          <text class="popup-title">联系管理员续费</text>
          <view class="popup-close" @click="showRenewPopup = false">
            <u-icon name="close" size="20" color="#999"></u-icon>
          </view>
        </view>
        <view class="popup-body">
          <view class="contact-item">
            <text class="contact-label">客服电话</text>
            <view class="contact-value">
              <text>130-0362-9527</text>
              <view class="copy-btn" @click="copyPhone">
                <u-icon name="file-text" size="16" color="#07c160"></u-icon>
                <text>复制</text>
              </view>
            </view>
          </view>
          <view class="contact-item">
            <text class="contact-label">续费说明</text>
            <view class="contact-desc">
              <text>1. 拨打客服电话确认续费时长和费用</text>
              <text>2. 管理员为您续费后，系统将自动更新有效期</text>
              <text>3. 续费完成后请刷新页面查看最新状态</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <u-button text="我知道了" @click="showRenewPopup = false"></u-button>
        </view>
      </view>
    </u-popup>

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
const showRenewPopup = ref(false)

const membership = reactive({
  status: 1,
  statusText: '正常',
  expired_at: null as string | null,
  isExpired: false,
  daysLeft: 0,
  canRenew: true
})

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
  loadMembership()
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

const loadMembership = async () => {
  try {
    const res = await merchantCo.getMembershipInfo()
    if (res.code === 0) {
      const data = res.data
      membership.status = data.status
      membership.statusText = data.statusText
      membership.expired_at = data.expired_at
      membership.isExpired = data.isExpired
      membership.daysLeft = data.daysLeft
      membership.canRenew = data.canRenew
    }
  } catch (e) {
    console.error('加载会员信息失败', e)
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '未设置'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusClass = (status: number) => {
  const map: Record<number, string> = {
    0: 'status-pending',
    1: 'status-normal',
    2: 'status-frozen',
    3: 'status-expired',
    4: 'status-rejected'
  }
  return map[status] || 'status-normal'
}

const showRenewModal = () => {
  showRenewPopup.value = true
}

const copyPhone = () => {
  uni.setClipboardData({
    data: '13003629527',
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
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

  // 会员信息卡片
  .membership-card {
    background: linear-gradient(135deg, #07c160 0%, #06ae56 100%);
    border-radius: 20rpx;
    padding: 32rpx;
    margin-bottom: 30rpx;
    color: #fff;

    &.is-expired {
      background: linear-gradient(135deg, #ff4d4f 0%, #d9363e 100%);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;

      .card-title {
        font-size: 32rpx;
        font-weight: bold;
      }

      .status-tag {
        padding: 6rpx 20rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .card-body {
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 28rpx;
          opacity: 0.8;
        }

        .value {
          font-size: 30rpx;
          font-weight: 500;

          &.text-danger {
            color: #ffec3d;
          }
        }
      }
    }

    .card-footer {
      margin-top: 24rpx;
      padding-top: 24rpx;
      border-top: 1rpx solid rgba(255, 255, 255, 0.1);

      .renew-hint {
        display: flex;
        align-items: center;
        font-size: 26rpx;
        margin-bottom: 20rpx;
        opacity: 0.9;

        text {
          margin-left: 8rpx;
        }
      }

      .renew-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12rpx;
        font-size: 28rpx;
        font-weight: 500;

        &:active {
          opacity: 0.8;
        }
      }
    }
  }

  // 状态标签样式
  .status-pending {
    background: rgba(255, 193, 7, 0.8) !important;
    color: #333 !important;
  }
  .status-normal {
    background: rgba(255, 255, 255, 0.2) !important;
  }
  .status-frozen {
    background: rgba(255, 82, 82, 0.8) !important;
  }
  .status-expired {
    background: rgba(156, 39, 176, 0.8) !important;
  }
  .status-rejected {
    background: rgba(158, 158, 158, 0.8) !important;
  }

  // 续费弹窗
  .renew-popup {
    padding: 32rpx;

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32rpx;

      .popup-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
      }

      .popup-close {
        padding: 10rpx;
      }
    }

    .popup-body {
      .contact-item {
        margin-bottom: 32rpx;

        .contact-label {
          font-size: 28rpx;
          color: #999;
          margin-bottom: 12rpx;
          display: block;
        }

        .contact-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 36rpx;
          font-weight: bold;
          color: #333;

          .copy-btn {
            display: flex;
            align-items: center;
            gap: 8rpx;
            padding: 12rpx 24rpx;
            background: #f0f0f0;
            border-radius: 8rpx;
            font-size: 26rpx;
            font-weight: normal;
            color: #07c160;

            &:active {
              opacity: 0.7;
            }
          }
        }

        .contact-desc {
          display: flex;
          flex-direction: column;
          gap: 12rpx;
          font-size: 28rpx;
          color: #666;
          line-height: 1.6;
        }
      }
    }

    .popup-footer {
      margin-top: 40rpx;
    }
  }

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
