<template>
  <view class="setting-container">
    <!-- 店铺信息卡片 -->
    <view class="info-card">
      <view class="card-header">
        <view class="card-title">店铺信息</view>
      </view>
      <view class="card-body">
        <view class="info-row">
          <text class="label">到期时间</text>
          <text class="value">{{ formatDate(expired_at) }}</text>
        </view>
        <view v-if="daysLeft !== undefined && daysLeft !== null" class="info-row">
          <text class="label">剩余天数</text>
          <text class="value" :class="{ 'text-danger': daysLeft <= 7 }"> {{ daysLeft }} 天 </text>
        </view>
      </view>
      <view
        v-if="isExpired || (daysLeft !== undefined && daysLeft !== null && daysLeft <= 7)"
        class="card-footer"
      >
        <view class="renew-hint">
          <u-icon name="info-circle" color="#ff4d4f" size="16"></u-icon>
          <text>{{ isExpired ? '您的店铺已过期，请尽快续费' : '店铺即将到期，请及时续费' }}</text>
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
      </u-form>
    </view>

    <view class="footer-btn">
      <u-button type="primary" text="保存设置" :loading="loading" @click="saveSettings"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'

const merchantCo = importObject('wh-merchant-co')
const loading = ref(false)
const showRenewPopup = ref(false)

const expired_at = ref<string | null>(null)
const isExpired = ref(false)
const daysLeft = ref<number | null>(null)

const form = reactive({
  name: '',
  phone: ''
})

onMounted(() => {
  loadData()
  loadMembership()
})

onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/setting/index')) return
})

const loadData = async () => {
  uni.showLoading({ title: '加载中' })
  try {
    const res = await merchantCo.getTenantInfo()
    if (res.code === 0) {
      const data = res.data
      form.name = data.name || ''
      form.phone = data.phone || ''
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
      expired_at.value = data.expired_at
      isExpired.value = data.isExpired
      daysLeft.value = data.daysLeft
    }
  } catch (e) {
    console.error('加载店铺信息失败', e)
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

const saveSettings = async () => {
  if (!form.name) return uni.showToast({ title: '请输入店铺名称', icon: 'none' })

  loading.value = true
  try {
    const updateData = {
      name: form.name,
      phone: form.phone
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

  // 店铺信息卡片
  .info-card {
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

  .footer-btn {
    margin-top: 60rpx;
    padding: 0 40rpx;
  }
}
</style>
