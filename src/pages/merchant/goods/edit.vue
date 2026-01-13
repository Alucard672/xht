<template>
  <view class="goods-edit-container">
    <u-form ref="uForm" :model="form" label-width="180rpx">
      <u-form-item label="商品名称" prop="name" border-bottom required>
        <u-input v-model="form.name" placeholder="请输入商品名称" border="none" />
      </u-form-item>

      <u-form-item label="所属分类" border-bottom required @click="showCategoryPicker = true">
        <u-input
          v-model="categoryName"
          placeholder="请选择分类"
          border="none"
          disabled
          disabled-color="#ffffff"
        />
        <template #right>
          <u-icon name="arrow-right"></u-icon>
        </template>
      </u-form-item>

      <!-- 添加快速入口 -->
      <view class="form-tip-row">
        <text class="link-text" @click="goToCategoryManage">没有分类？去新增</text>
      </view>

      <u-form-item label="商品图片" border-bottom>
        <u-upload
          :file-list="fileList"
          name="goods_img"
          multiple
          :max-count="1"
          @after-read="afterRead"
          @delete="deletePic"
        ></u-upload>
      </u-form-item>

      <u-form-item label="多单位设置" border-bottom>
        <u-switch v-model="form.is_multi_unit"></u-switch>
      </u-form-item>

      <view v-if="form.is_multi_unit" class="unit-section">
        <u-form-item label="大单位名称" border-bottom>
          <u-input v-model="form.unit_big.name" placeholder="如：箱" border="none" />
        </u-form-item>
        <u-form-item label="换算率" border-bottom>
          <u-input
            v-model="form.rate"
            type="number"
            placeholder="1大单位 = N小单位"
            border="none"
          />
        </u-form-item>
        <u-form-item label="大单位价格" border-bottom>
          <u-input
            v-model="form.unit_big_price_display"
            type="digit"
            placeholder="大单位单价"
            border="none"
          />
        </u-form-item>
      </view>

      <u-form-item :label="form.is_multi_unit ? '小单位名称' : '计量单位'" border-bottom required>
        <u-input v-model="form.unit_small.name" placeholder="如：瓶/包/个" border="none" />
      </u-form-item>

      <u-form-item :label="form.is_multi_unit ? '小单位价格' : '销售价格'" border-bottom required>
        <u-input
          v-model="form.unit_small_price_display"
          type="digit"
          placeholder="单价"
          border="none"
        />
      </u-form-item>

      <u-form-item label="当前总库存" border-bottom required>
        <u-input
          v-model="form.stock"
          type="number"
          :placeholder="'以' + (form.unit_small.name || '最小单位') + '计'"
          border="none"
        />
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
      key-name="name"
      @confirm="confirmCategory"
      @cancel="showCategoryPicker = false"
    ></u-picker>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import type { GoodsFormData } from '@/types/goods'

const loading = ref(false)
import { importObject } from '@/utils/cloud'

const goodsCo = importObject('wh-goods-co')
const goods_id = ref('')
const isEdit = ref(false)

const form = reactive<
  GoodsFormData & {
    unit_big_price_display: string
    unit_small_price_display: string
  }
>({
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

onLoad(async options => {
  // 优先加载分类，确保后续回显正常
  await fetchCategories()

  if (options && options.id) {
    goods_id.value = options.id
    isEdit.value = true
    loadGoodsDetail()
  }
})

// onMounted 里的调用可以移除或保留作为双重保险（注意避免重复）
onMounted(() => {
  // fetchCategories() // 已移至 onLoad 并等待
})

const categoryCo = importObject('wh-category-co')

const fetchCategories = async () => {
  // 弃用 clientDB，改用 cloud object 以确保权限和数据一致性
  // const db = uniCloud.database()
  // const tenant_id = uni.getStorageSync('tenant_id')

  try {
    console.log('[Edit] 开始加载分类列表...')
    const res = await categoryCo.getCategoryList()

    console.log('[Edit] 分类列表返回:', res)
    if (res.code === 0) {
      categories.value = res.data
      console.log('[Edit] categories.value 更新为:', categories.value)
    }
  } catch (e: any) {
    console.error('获取分类失败', e)
    uni.showToast({ title: '加载分类失败', icon: 'none' })
  }
}

const loadGoodsDetail = async () => {
  try {
    const res = await goodsCo.getGoodsDetail(goods_id.value)
    if (res.code === 0) {
      const data = res.data
      form.name = data.name
      form.category_id = data.category_id
      form.img_url = data.img_url || ''
      form.is_multi_unit = data.is_multi_unit
      form.rate = data.rate
      form.unit_big = data.unit_big
      form.unit_small = data.unit_small
      form.stock = data.stock

      // 转换价格显示
      form.unit_small_price_display = priceHelper.format(data.unit_small.price)
      if (data.is_multi_unit && data.unit_big) {
        form.unit_big_price_display = priceHelper.format(data.unit_big.price)
      }

      // 设置图片
      if (data.img_url) {
        fileList.value = [{ url: data.img_url, status: 'success', message: '' }]
      }

      // 设置分类名称
      console.log('[Edit] 准备匹配分类, goods.category_id:', data.category_id)
      console.log('[Edit] 当前可选分类列表:', categories.value)

      if (data.category_id) {
        const cat = categories.value.find((c: any) => c._id === data.category_id)
        if (cat) {
          console.log('[Edit] 匹配成功:', cat.name)
          categoryName.value = cat.name
        } else {
          console.warn('[Edit] 未找到对应的分类ID:', data.category_id)
          // 尝试降级显示（仅为了调试看到ID）
          // categoryName.value = `未知分类 (${data.category_id})`
        }
      } else {
        console.log('[Edit] 该商品未设置分类ID')
      }
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

const confirmCategory = (e: any) => {
  if (!e.value || e.value.length === 0 || !e.value[0]) return
  const selected = e.value[0]
  form.category_id = selected._id
  categoryName.value = selected.name
  showCategoryPicker.value = false
}

const goToCategoryManage = () => {
  uni.navigateTo({
    url: '/pages/merchant/goods/category'
  })
}

const deletePic = (event: any) => {
  fileList.value.splice(event.index, 1)
  form.img_url = ''
}

const afterRead = async (event: any) => {
  const tenant_id = uni.getStorageSync('tenant_id')
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
  if (!form.unit_small.name) return uni.showToast({ title: '请输入单位', icon: 'none' })
  if (!form.unit_small_price_display) return uni.showToast({ title: '请输入价格', icon: 'none' })

  loading.value = true

  // 转换价格为分
  const goodsData: GoodsFormData = {
    name: form.name,
    category_id: form.category_id,
    img_url: form.img_url,
    is_multi_unit: form.is_multi_unit,
    rate: parseInt(String(form.rate)) || 1,
    unit_small: {
      name: form.unit_small.name,
      price: priceHelper.toFen(form.unit_small_price_display)
    },
    stock: parseInt(String(form.stock)) || 0
  }

  if (form.is_multi_unit && form.unit_big.name) {
    goodsData.unit_big = {
      name: form.unit_big.name,
      price: priceHelper.toFen(form.unit_big_price_display || '0')
    }
  }

  try {
    let res
    if (isEdit.value) {
      res = await goodsCo.updateGoods(goods_id.value, goodsData)
    } else {
      res = await goodsCo.createGoods(goodsData)
    }

    if (res.code === 0) {
      uni.showToast({ title: res.msg })
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
.goods-edit-container {
  padding: 30rpx;
  background-color: #fff;
  min-height: 100vh;
  .form-tip-row {
    display: flex;
    justify-content: flex-end;
    padding: 10rpx 0;
    .link-text {
      font-size: 24rpx;
      color: #2979ff;
      text-decoration: underline;
    }
  }
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
