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
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.setting-container {
  @include page-container-with-top;
  padding-bottom: 180rpx;

  // 店铺信息卡片
  .info-card {
    @include card-modern;
    background: $wh-gradient-blue-vertical;
    padding: $wh-spacing-xxl;
    margin-bottom: $wh-spacing-xl;
    color: $wh-text-color-inverse;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300rpx;
      height: 300rpx;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
      border-radius: 50%;
    }

    &.is-expired {
      background: linear-gradient(135deg, $wh-color-danger-modern 0%, #d9363e 100%);
    }

    .card-header {
      @include flex-between;
      align-items: center;
      margin-bottom: $wh-spacing-lg;
      position: relative;
      z-index: 1;

      .card-title {
        @include text-heading;
        letter-spacing: 0.5rpx;
      }
    }

    .card-body {
      position: relative;
      z-index: 1;

      .info-row {
        @include flex-between;
        align-items: center;
        padding: $wh-spacing-md 0;
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.15);

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: $wh-font-size-md;
          opacity: 0.9;
          font-weight: $wh-font-weight-medium;
        }

        .value {
          font-size: $wh-font-size-lg;
          font-weight: $wh-font-weight-semibold;
          letter-spacing: 0.3rpx;

          &.text-danger {
            color: #ffec3d;
          }
        }
      }
    }

    .card-footer {
      margin-top: $wh-spacing-lg;
      padding-top: $wh-spacing-lg;
      border-top: 1rpx solid rgba(255, 255, 255, 0.15);

      .renew-hint {
        @include flex-start;
        font-size: $wh-font-size-sm;
        margin-bottom: $wh-spacing-md;
        opacity: 0.95;
        font-weight: $wh-font-weight-medium;

        text {
          margin-left: $wh-spacing-xs;
        }
      }

      .renew-btn {
        @include flex-center;
        padding: $wh-spacing-md $wh-spacing-xl;
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(10rpx);
        border-radius: $wh-border-radius-full;
        font-size: $wh-font-size-md;
        font-weight: $wh-font-weight-semibold;
        box-shadow: $wh-shadow-xs;
        transition: all $wh-transition-normal;

        &:active {
          transform: scale(0.98);
          opacity: 0.8;
        }
      }
    }
  }

  // 续费弹窗
  .renew-popup {
    @include popup-content;
    padding: $wh-spacing-xxl;

    .popup-header {
      @include popup-header;
    }

    .popup-body {
      .contact-item {
        margin-bottom: $wh-spacing-xl;

        .contact-label {
          font-size: $wh-font-size-sm;
          color: $wh-text-color-light-gray;
          margin-bottom: $wh-spacing-sm;
          display: block;
          font-weight: $wh-font-weight-medium;
        }

        .contact-value {
          @include flex-between;
          font-size: $wh-font-size-2xl;
          font-weight: $wh-font-weight-extrabold;
          color: $wh-text-color-dark;

          .copy-btn {
            @include flex-start;
            gap: $wh-spacing-xs;
            padding: $wh-spacing-sm $wh-spacing-md;
            background: $wh-bg-color-tertiary;
            border-radius: $wh-border-radius-full;
            font-size: $wh-font-size-sm;
            font-weight: $wh-font-weight-semibold;
            color: $wh-color-blue;
            transition: all $wh-transition-normal;

            &:active {
              background: rgba(45, 127, 249, 0.1);
              transform: scale(0.98);
            }
          }
        }

        .contact-desc {
          @include flex-column;
          gap: $wh-spacing-sm;
          font-size: $wh-font-size-sm;
          color: $wh-text-color-secondary;
          line-height: $wh-line-height-relaxed;

          text {
            position: relative;
            padding-left: $wh-spacing-md;

            &::before {
              content: '•';
              position: absolute;
              left: 0;
              color: $wh-color-blue;
            }
          }
        }
      }
    }

    .popup-footer {
      margin-top: $wh-spacing-xxl;

      ::v-deep .u-button {
        border-radius: $wh-border-radius-full !important;
        font-weight: $wh-font-weight-semibold !important;
      }
    }
  }

  .form-box {
    @include section-base;
    padding: 0 $wh-spacing-xl;
    margin-bottom: $wh-spacing-xl;

    ::v-deep .u-form {
      .u-form-item {
        margin-bottom: $wh-spacing-xl;
        padding: $wh-spacing-lg 0;

        .u-form-item__body__left {
          .u-form-item__body__left__content__label {
            @include text-subheading;
            font-size: $wh-font-size-md !important;
          }
        }

        .u-form-item__body__right {
          .u-input {
            background: $wh-bg-color-tertiary !important;
            border-radius: $wh-border-radius-md !important;
            padding: $wh-spacing-sm $wh-spacing-md !important;
            font-size: $wh-font-size-md !important;
            color: $wh-text-color-dark !important;
            transition: all $wh-transition-normal !important;

            &:focus {
              background: $wh-bg-color-card !important;
              border-color: $wh-color-blue !important;
              box-shadow: 0 0 0 6rpx rgba(45, 127, 249, 0.1) !important;
            }
          }
        }
      }
    }
  }

  .footer-btn {
    margin-top: $wh-spacing-3xl;
    padding: 0 $wh-spacing-xl;

    ::v-deep .u-button {
      width: 100%;
      height: 100rpx;
      border-radius: $wh-border-radius-full !important;
      font-weight: $wh-font-weight-semibold !important;
      font-size: $wh-font-size-xl !important;
      box-shadow: $wh-shadow-colored !important;
      transition: all $wh-transition-normal !important;

      &:active {
        transform: scale(0.98) !important;
        box-shadow: $wh-shadow-md !important;
      }
    }
  }
}
</style>
