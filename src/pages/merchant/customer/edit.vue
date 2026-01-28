<template>
  <view class="customer-edit-container">
    <u-form ref="uForm" :model="form" label-width="180rpx">
      <u-form-item label="姓名/备注" prop="alias" border-bottom required>
        <u-input v-model="form.alias" placeholder="请输入客户姓名或称呼" border="none" />
      </u-form-item>

      <u-form-item label="手机号" prop="phone" border-bottom>
        <u-input
          v-model="form.phone"
          type="number"
          placeholder="请输入手机号(可选)"
          border="none"
        />
      </u-form-item>

      <u-form-item label="收货地址" prop="address" border-bottom>
        <u-input v-model="form.address" placeholder="请输入详细地址" border="none" />
      </u-form-item>

      <u-form-item label="备注信息" prop="remark" border-bottom>
        <u-textarea
          v-model="form.remark"
          placeholder="其他备注信息..."
          border="none"
          auto-height
        ></u-textarea>
      </u-form-item>
    </u-form>

    <view class="footer-btn">
      <u-button
        type="primary"
        :text="isEdit ? '保存修改' : '确认添加'"
        :loading="loading"
        @click="save"
      ></u-button>
      <view v-if="isEdit" class="delete-link" @click="handleDelete">删除客户</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'

const customerCo = importObject('wh-customer-co')
const loading = ref(false)
const isEdit = ref(false)
const customer_id = ref('')

const form = reactive({
  alias: '',
  phone: '',
  address: '',
  remark: ''
})

onLoad(options => {
  if (options && options.id) {
    customer_id.value = options.id
    isEdit.value = true
    loadDetail()
  }
})

onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/customer/edit')) return
})

const loadDetail = async () => {
  try {
    const res = await customerCo.getCustomerDetail(customer_id.value)
    if (res.code === 0) {
      const info = res.data.info
      form.alias = info.alias
      form.phone = info.phone || ''
      form.address = info.address || ''
      form.remark = info.remark || ''
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const save = async () => {
  if (!form.alias) return uni.showToast({ title: '请输入姓名', icon: 'none' })

  loading.value = true
  try {
    let res
    if (isEdit.value) {
      res = await customerCo.updateCustomer(customer_id.value, form)
    } else {
      res = await customerCo.createCustomer(form)
    }

    if (res.code === 0) {
      uni.showToast({ title: res.msg })
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const handleDelete = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该客户吗？',
    success: async res => {
      if (res.confirm) {
        // 后端暂未实现删除接口，或者我们需要在这里调用
        uni.showToast({ title: '演示环境，暂不支持删除', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.customer-edit-container {
  @include page-container-with-top($wh-spacing-xl);
  background: $wh-bg-color-gradient;
  padding-bottom: 180rpx;

  ::v-deep .u-form {
    .u-form-item {
      background: $wh-bg-color-card;
      padding: $wh-spacing-xl;
      margin-bottom: $wh-spacing-md;
      border-radius: $wh-border-radius-lg;
      box-shadow: $wh-shadow-sm;
      border: 1rpx solid $wh-border-color-light;

      .u-form-item__body {
        padding: 0;
      }

      .u-form-item__body__left {
        @include text-subheading;
        margin-bottom: $wh-spacing-sm;
      }

      .u-form-item__body__right {
        .u-input,
        .u-textarea {
          background: $wh-bg-color-tertiary;
          border-radius: $wh-border-radius-md;
          padding: $wh-spacing-md;
          font-size: $wh-font-size-md;
          color: $wh-text-color-dark;
          transition: all $wh-transition-normal;

          &:focus {
            background: $wh-bg-color-card;
            border-color: $wh-color-blue;
            box-shadow: 0 0 0 6rpx rgba(45, 127, 249, 0.1);
          }

          &::placeholder {
            color: $wh-text-color-placeholder;
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
    height: 100rpx;
    border-radius: $wh-border-radius-full;
    font-weight: $wh-font-weight-semibold;
    font-size: $wh-font-size-xl;
    box-shadow: $wh-shadow-colored;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.98);
      box-shadow: $wh-shadow-md;
    }
  }

  .delete-link {
    text-align: center;
    margin-top: $wh-spacing-xl;
    color: $wh-color-danger-modern;
    font-size: $wh-font-size-md;
    font-weight: $wh-font-weight-semibold;
    padding: $wh-spacing-sm;
    border-radius: $wh-border-radius-full;
    transition: all $wh-transition-normal;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
}
</style>
