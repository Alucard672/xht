<template>
  <view class="store-container">
    <!-- Tabs -->
    <u-tabs
      :list="tabList"
      :current="activeTab"
      active-color="#2d7ff9"
      line-color="#2d7ff9"
      @change="handleTabChange"
    ></u-tabs>

    <!-- 店铺信息 Tab -->
    <view v-if="activeTab === 0" class="tab-content">
      <!-- 到期信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <view class="card-title">订阅信息</view>
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
          <view class="renew-btn" @click="goToRenewal">
            <text>立即续费</text>
          </view>
        </view>
      </view>

      <!-- 店铺设置表单 -->
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
        <u-button
          type="primary"
          text="保存设置"
          :loading="loading"
          @click="saveSettings"
        ></u-button>
      </view>
    </view>

    <!-- 二维码 Tab -->
    <view v-if="activeTab === 1" class="tab-content">
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
          <image
            v-if="qrUrl"
            :src="qrUrl"
            mode="aspectFit"
            class="qrcode-image"
            @click="previewImage"
          />
          <view v-else class="qrcode-placeholder">
            <u-loading-icon></u-loading-icon>
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
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'

const merchantCo = importObject('wh-merchant-co')
const loading = ref(false)
const saving = ref(false)
const deactivating = ref(false)

const activeTab = ref(0)
const tabList = ref([{ name: '店铺信息' }, { name: '二维码' }])

const expired_at = ref<string | null>(null)
const daysLeft = ref<number | null>(null)
const isExpired = ref(false)

const form = reactive({
  name: '',
  phone: ''
})

const tenantInfo = ref<any>({})
const scanCount = ref(0)
const qrUrl = ref('')
const showDeactivatePopup = ref(false)

// 页面加载时接收 tab 参数
onLoad((options: any) => {
  if (options.tab !== undefined) {
    activeTab.value = parseInt(options.tab)
  }
})

onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/store')) return
  loadTenantInfo()
})

const handleTabChange = (index: number) => {
  activeTab.value = index
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '未设置'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

const loadTenantInfo = async () => {
  loading.value = true
  try {
    const res = await merchantCo.getTenantInfo()
    if (res.code === 0) {
      const tenant = res.data.tenant
      tenantInfo.value = tenant
      form.name = tenant.name || ''
      form.phone = tenant.phone || ''
      expired_at.value = tenant.expired_at || null
      scanCount.value = tenant.scan_count || 0

      // 计算剩余天数
      if (expired_at.value) {
        const now = Date.now()
        const expireTime = new Date(expired_at.value).getTime()
        const diff = expireTime - now
        daysLeft.value = Math.floor(diff / (24 * 60 * 60 * 1000))

        if (diff < 0) {
          isExpired.value = true
          daysLeft.value = 0
        }
      }

      // 加载二维码
      if (tenant.qr_code_url) {
        qrUrl.value = tenant.qr_code_url
      }
    }
  } catch (e) {
    console.error('加载店铺信息失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入店铺名称', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res = await merchantCo.updateTenantInfo({
      name: form.name,
      phone: form.phone
    })
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' })
      // 通知其他页面刷新
      uni.$emit('refresh-dashboard')
    }
  } catch (e) {
    console.error('保存失败:', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goToRenewal = () => {
  uni.navigateTo({ url: '/pages/merchant/renewal/index' })
}

const previewImage = () => {
  if (qrUrl.value) {
    uni.previewImage({
      urls: [qrUrl.value],
      current: qrUrl.value
    })
  }
}

const saveImage = async () => {
  if (!qrUrl.value) {
    uni.showToast({ title: '二维码未生成', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await uni.downloadFile({
      url: qrUrl.value,
      success: res => {
        if (res.statusCode === 200) {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: () => {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      },
      fail: () => {
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  } finally {
    saving.value = false
  }
}

const shareToFriend = () => {
  // 微信小程序分享功能
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      uni.showToast({ title: '请点击右上角分享', icon: 'none' })
    }
  })
}

const showDeactivateConfirm = () => {
  showDeactivatePopup.value = true
}

const handleDeactivate = async () => {
  deactivating.value = true
  try {
    const res = await merchantCo.resetShopCode()
    if (res.code === 0) {
      uni.showToast({ title: '已停用', icon: 'success' })
      showDeactivatePopup.value = false
      loadTenantInfo()
    }
  } catch (e) {
    console.error('停用失败:', e)
    uni.showToast({ title: '停用失败', icon: 'none' })
  } finally {
    deactivating.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.store-container {
  min-height: 100vh;
  background: $wh-bg-color-gradient;
}

.tab-content {
  padding: $wh-spacing-lg;
}

.info-card {
  @include card-modern;
  margin-bottom: $wh-spacing-lg;

  .card-header {
    padding: $wh-spacing-lg;
    border-bottom: 1rpx solid $wh-border-color-light;

    .card-title {
      font-size: $wh-font-size-lg;
      font-weight: $wh-font-weight-semibold;
      color: $wh-text-color-dark;
    }
  }

  .card-body {
    padding: $wh-spacing-lg;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $wh-spacing-md 0;

      .label {
        font-size: $wh-font-size-base;
        color: $wh-text-color-secondary;
      }

      .value {
        font-size: $wh-font-size-base;
        font-weight: $wh-font-weight-semibold;
        color: $wh-text-color-dark;

        &.text-danger {
          color: $wh-color-danger-modern;
        }
      }
    }
  }

  .card-footer {
    padding: $wh-spacing-lg;
    background: $wh-bg-color-tertiary;
    border-top: 1rpx solid $wh-border-color-light;

    .renew-hint {
      display: flex;
      align-items: center;
      margin-bottom: $wh-spacing-md;

      text {
        margin-left: $wh-spacing-xs;
        font-size: $wh-font-size-sm;
        color: $wh-color-danger-modern;
      }
    }

    .renew-btn {
      padding: $wh-spacing-sm $wh-spacing-lg;
      background: $wh-color-danger-modern;
      color: #fff;
      text-align: center;
      border-radius: $wh-border-radius-full;
      font-size: $wh-font-size-base;
      font-weight: $wh-font-weight-semibold;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.95);
        opacity: 0.9;
      }
    }
  }
}

.form-box {
  @include card-modern;
  margin-bottom: $wh-spacing-lg;
}

.footer-btn {
  padding: 0 $wh-spacing-lg;
}

.loading {
  @include flex-center;
  padding: $wh-spacing-xxl;
}

.qrcode-content {
  .shop-info {
    @include card-modern;
    display: flex;
    align-items: center;
    padding: $wh-spacing-xl;
    margin-bottom: $wh-spacing-lg;

    .shop-logo-placeholder {
      width: 88rpx;
      height: 88rpx;
      border-radius: $wh-border-radius-circle;
      background: $wh-gradient-blue-vertical;
      color: #fff;
      font-size: $wh-font-size-2xl;
      font-weight: $wh-font-weight-extrabold;
      @include flex-center;
      margin-right: $wh-spacing-md;
      flex-shrink: 0;
    }

    .shop-detail {
      flex: 1;

      .shop-name {
        font-size: $wh-font-size-lg;
        font-weight: $wh-font-weight-semibold;
        color: $wh-text-color-dark;
        margin-bottom: $wh-spacing-xs;
      }

      .shop-stats {
        font-size: $wh-font-size-sm;
        color: $wh-text-color-gray;
      }
    }
  }

  .qrcode-card {
    @include card-modern;
    padding: $wh-spacing-xxl;
    margin-bottom: $wh-spacing-lg;
    @include flex-center;

    .qrcode-image {
      width: 500rpx;
      height: 500rpx;
      border-radius: $wh-border-radius-lg;
    }

    .qrcode-placeholder {
      @include flex-column;
      gap: $wh-spacing-md;
      color: $wh-text-color-gray;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: space-around;
    margin-bottom: $wh-spacing-xl;
  }

  .tips {
    @include card-modern;
    padding: $wh-spacing-lg;
    margin-bottom: $wh-spacing-xl;

    .tip-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: $wh-spacing-md;

      &:last-child {
        margin-bottom: 0;
      }

      text {
        margin-left: $wh-spacing-sm;
        font-size: $wh-font-size-sm;
        color: $wh-text-color-secondary;
        line-height: $wh-line-height-relaxed;
      }
    }
  }

  .danger-zone {
    @include flex-center;
    padding: $wh-spacing-xl;
  }
}

.deactivate-popup {
  padding: $wh-spacing-xl;
  background: #fff;
  border-radius: $wh-border-radius-lg;

  .popup-header {
    font-size: $wh-font-size-lg;
    font-weight: $wh-font-weight-semibold;
    text-align: center;
    margin-bottom: $wh-spacing-lg;
  }

  .popup-body {
    @include flex-column;
    gap: $wh-spacing-sm;
    margin-bottom: $wh-spacing-xl;

    text {
      font-size: $wh-font-size-base;
      color: $wh-text-color-dark;
      text-align: center;
    }

    .warning {
      font-size: $wh-font-size-sm;
      color: $wh-color-danger-modern;
    }
  }

  .popup-footer {
    display: flex;
    gap: $wh-spacing-md;
  }
}
</style>
