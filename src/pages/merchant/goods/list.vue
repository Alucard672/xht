<template>
  <wh-page-container>
    <wh-filter-bar
      v-model="keyword"
      placeholder="搜索商品或拼音"
      @search="handleSearch"
      @clear="handleClear"
    >
      <template #action>
        <u-button
          type="primary"
          icon="plus"
          text="加商品"
          custom-style="width: 180rpx; height: 64rpx; border-radius: 32rpx;"
          @click="navTo('/pages/merchant/goods/edit')"
        ></u-button>
      </template>
    </wh-filter-bar>

    <!-- 库存预警入口 -->
    <view class="stock-warning-bar" @click="showLowStockList">
      <view class="warning-icon">
        <u-icon name="warning" size="24" color="#ff4d4f"></u-icon>
      </view>
      <view class="warning-info">
        <text class="warning-title">库存预警</text>
        <text class="warning-desc">当前有 {{ lowStockCount }} 个商品库存不足</text>
      </view>
      <view class="warning-action">
        <text class="action-text">去处理</text>
        <u-icon name="arrow-right" size="16" color="#999"></u-icon>
      </view>
    </view>

    <view class="list-container">
      <view v-if="loading" class="loading-box">
        <u-loading-icon></u-loading-icon>
      </view>
      <wh-empty-state
        v-else-if="goodsList.length === 0"
        icon="/static/empty/list.png"
        text="暂无商品"
      >
        <u-button
          type="primary"
          text="去添加商品"
          @click="navTo('/pages/merchant/goods/edit')"
        ></u-button>
      </wh-empty-state>
      <view v-else class="card-list">
        <wh-goods-card
          v-for="item in goodsList"
          :key="item._id"
          :goods="item"
          @click="handleGoodsClick"
        ></wh-goods-card>
      </view>
    </view>

    <u-tabbar
      :value="2"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#07c160"
      @change="handleModuleChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag-fill"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </wh-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGoods } from '@/composables/useGoods'
import WhPageContainer from '@/components/wh/PageContainer.vue'
import WhFilterBar from '@/components/wh/FilterBar.vue'
import WhEmptyState from '@/components/wh/EmptyState.vue'
import WhGoodsCard from '@/components/wh/GoodsCard.vue'
import type { Goods } from '@/types/goods'

const { goodsList, loading, total, fetchGoodsList, toggleOnSale, deleteGoods } = useGoods()

const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const lowStockCount = ref(0)
const LOW_STOCK_THRESHOLD = 10 // 库存预警阈值

let lastLoadTime = 0

const handleSearch = (value: string) => {
  keyword.value = value
  currentPage.value = 1
  loadGoodsList(true)
}

const handleClear = () => {
  keyword.value = ''
  currentPage.value = 1
  loadGoodsList(true)
}

const loadGoodsList = async (force = false) => {
  const now = Date.now()
  if (!force && lastLoadTime && now - lastLoadTime < 300000) {
    return
  }
  await fetchGoodsList({
    keyword: keyword.value === 'low_stock' ? '' : keyword.value,
    page: currentPage.value,
    limit: pageSize.value,
    showLowStock: keyword.value === 'low_stock'
  })
  lastLoadTime = now
  countLowStock()
}

const handleGoodsClick = (goods: Goods) => {
  navTo('/pages/merchant/goods/edit?id=' + goods._id)
}

const handleToggleSale = async (item: any, newVal: any) => {
  // 立即触发，无需取反，组件直接返回新值
  const success = await toggleOnSale(item._id, !!newVal)
  if (success) {
    loadGoodsList(true)
  }
}

const handleDelete = (item: any) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除"${item.name}"吗？`,
    success: async res => {
      if (res.confirm) {
        const success = await deleteGoods(item._id)
        if (success) {
          loadGoodsList(true)
        }
      }
    }
  })
}

const navTo = (url: string) => {
  uni.navigateTo({ url })
}

const handleModuleChange = (index: number) => {
  const paths = [
    '/pages/merchant/dashboard',
    '/pages/merchant/order/list',
    '/pages/merchant/goods/list',
    '/pages/merchant/customer/list'
  ]
  uni.switchTab({ url: paths[index] })
}

onMounted(() => {
  loadGoodsList()
})

const countLowStock = () => {
  lowStockCount.value = goodsList.value.filter((item: any) => {
    const stock = item.stock || 0
    return stock > 0 && stock <= LOW_STOCK_THRESHOLD
  }).length
}

const showLowStockList = () => {
  if (lowStockCount.value === 0) {
    uni.showToast({ title: '暂无库存预警', icon: 'none' })
    return
  }
  uni.showModal({
    title: '库存预警',
    content: `当前有 ${lowStockCount.value} 个商品库存不足（≤${LOW_STOCK_THRESHOLD}件），建议及时补货。`,
    showCancel: true,
    confirmText: '去补货',
    cancelText: '知道了',
    success: res => {
      if (res.confirm) {
        keyword.value = 'low_stock'
        currentPage.value = 1
        loadGoodsList(true)
      }
    }
  })
}

onShow(() => {
  uni.hideTabBar()
  loadGoodsList()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.list-container {
  padding: $wh-spacing-md;
}

.loading-box {
  @include flex-center;
  padding: $wh-spacing-xxl;
}

.card-list {
}

.stock-warning-bar {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  margin: 0 $wh-spacing-md;
  margin-top: $wh-spacing-md;
  background-color: #fff2f0;
  border-radius: 16rpx;
  border: 1rpx solid #ffccc7;

  .warning-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
  }

  .warning-info {
    flex: 1;

    .warning-title {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      display: block;
    }

    .warning-desc {
      font-size: 24rpx;
      color: #ff4d4f;
      margin-top: 4rpx;
      display: block;
    }
  }

  .warning-action {
    display: flex;
    align-items: center;

    .action-text {
      font-size: 26rpx;
      color: #999;
      margin-right: 8rpx;
    }
  }
}
</style>
