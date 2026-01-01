<template>
  <view class="goods-edit-container">
    <u-form :model="form" ref="uForm" labelWidth="180rpx">
      <u-form-item label="商品名称" prop="name" borderBottom required>
        <u-input v-model="form.name" placeholder="请输入商品名称" border="none" />
      </u-form-item>

      <u-form-item label="所属分类" borderBottom required @click="showCategoryPicker = true">
        <u-input v-model="categoryName" placeholder="请选择分类" border="none" disabled disabledColor="#ffffff" />
        <u-icon slot="right" name="arrow-right"></u-icon>
      </u-form-item>

      <u-form-item label="商品图片" borderBottom>
        <u-upload
          :fileList="fileList"
          @afterRead="afterRead"
          @delete="deletePic"
          name="goods_img"
          multiple
          :maxCount="1"
        ></u-upload>
      </u-form-item>

      <u-form-item label="多单位设置" borderBottom>
        <u-switch v-model="form.is_multi_unit"></u-switch>
      </u-form-item>

      <view v-if="form.is_multi_unit" class="unit-section">
        <u-form-item label="大单位名称" borderBottom>
          <u-input v-model="form.unit_big.name" placeholder="如：箱" border="none" />
        </u-form-item>
        <u-form-item label="换算率" borderBottom>
          <u-input v-model="form.rate" type="number" placeholder="1大单位 = N小单位" border="none" />
        </u-form-item>
        <u-form-item label="大单位价格" borderBottom>
          <u-input v-model="form.unit_big_price_display" type="digit" placeholder="大单位单价" border="none" />
        </u-form-item>
      </view>

      <u-form-item :label="form.is_multi_unit ? '小单位名称' : '计量单位'" borderBottom required>
        <u-input v-model="form.unit_small.name" placeholder="如：瓶/包/个" border="none" />
      </u-form-item>

      <u-form-item :label="form.is_multi_unit ? '小单位价格' : '销售价格'" borderBottom required>
        <u-input v-model="form.unit_small_price_display" type="digit" placeholder="单价" border="none" />
      </u-form-item>

      <u-form-item label="当前总库存" borderBottom required>
        <u-input v-model="form.stock" type="number" :placeholder="'以' + (form.unit_small.name || '最小单位') + '计'" border="none" />
        <template #right>
          <text class="unit-tip">{{ form.unit_small.name }}</text>
        </template>
      </u-form-item>
    </u-form>

    <view class="footer-btn">
      <u-button type="primary" text="保存商品" :loading="loading" @click="saveGoods"></u-button>
    </view>

    <!-- 分类选择器 -->
    <u-picker
      :show="showCategoryPicker"
      :columns="[categories]"
      keyName="name"
      @confirm="confirmCategory"
      @cancel="showCategoryPicker = false"
    ></u-picker>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onReady } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'

const loading = ref(false)
const tenant_id = uni.getStorageSync('tenant_id')

const form = reactive({
  name: '',
  category_id: '',
  img_url: '',
  is_multi_unit: false,
  rate: 1,
  unit_big: { name: '箱', price: 0 },
  unit_small: { name: '瓶', price: 0 },
  stock: 0,
  unit_big_price_display: '',
  unit_small_price_display: ''
})

const categoryName = ref('')
const categories = ref([])
const showCategoryPicker = ref(false)
const fileList = ref([])

onReady(() => {
  fetchCategories()
})

const fetchCategories = async () => {
  const db = uniCloud.database()
  const res = await db.collection('wh_categories').where(`tenant_id == '${tenant_id}'`).get()
  categories.value = res.result.data
}

const confirmCategory = (e) => {
  const selected = e.value[0]
  form.category_id = selected._id
  categoryName.value = selected.name
  showCategoryPicker.value = false
}

const deletePic = (event) => {
  fileList.value.splice(event.index, 1)
  form.img_url = ''
}

const afterRead = async (event) => {
  const file = event.file[0]
  fileList.value.push({
    ...file,
    status: 'uploading',
    message: '上传中'
  })

  try {
    const result = await uniCloud.uploadFile({
      filePath: file.url,
      cloudPath: `goods/${tenant_id}/${Date.now()}.png`
    })
    form.img_url = result.fileID
    fileList.value[0].status = 'success'
    fileList.value[0].message = ''
  } catch (e) {
    fileList.value[0].status = 'failed'
    fileList.value[0].message = '上传失败'
  }
}

const saveGoods = async () => {
  if (!form.name) return uni.showToast({ title: '请输入名称', icon: 'none' })
  if (!form.category_id) return uni.showToast({ title: '请选择分类', icon: 'none' })
  if (!tenant_id) return uni.showToast({ title: '租户异常', icon: 'none' })

  loading.value = true
  
  // 转换价格为分
  form.unit_small.price = priceHelper.toFen(form.unit_small_price_display)
  if (form.is_multi_unit) {
    form.unit_big.price = priceHelper.toFen(form.unit_big_price_display)
    
    // 基础价格校验
    if (form.unit_big.price < form.unit_small.price) {
      loading.value = false
      return uni.showToast({ title: '大单位价格不能小于小单位价格', icon: 'none' })
    }
  }

  const db = uniCloud.database()
  try {
    const data = {
      tenant_id,
      name: form.name,
      category_id: form.category_id,
      img_url: form.img_url,
      is_multi_unit: form.is_multi_unit,
      rate: parseInt(String(form.rate)) || 1,
      unit_big: form.unit_big,
      unit_small: form.unit_small,
      stock: parseInt(String(form.stock)) || 0,
      is_on_sale: true
    }

    await db.collection('wh_goods').add(data)
    uni.showToast({ title: '保存成功' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.goods-edit-container {
  padding: 30rpx;
  background-color: #fff;
  min-height: 100vh;
  .unit-section {
    background-color: #f9f9f9;
    padding: 0 20rpx;
    border-radius: 8rpx;
    margin: 20rpx 0;
  }
  .unit-tip {
    font-size: 24rpx;
    color: #999;
  }
  .footer-btn {
    margin-top: 60rpx;
    padding-bottom: 40rpx;
  }
}
</style>
