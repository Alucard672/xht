<template>
  <view class="merchant-page">
    <view class="action-bar">
      <view class="search">
        <u-search
          v-model="keyword"
          placeholder="搜索商品或拼音"
          :show-action="false"
          @search="handleSearch"
          @clear="handleClear"
        ></u-search>
      </view>
      <u-button
        type="primary"
        icon="plus"
        text="加商品"
        custom-style="width: 180rpx; height: 64rpx; border-radius: 32rpx;"
        @click="navTo('/pages/merchant/goods/edit')"
      ></u-button>
    </view>

    <view class="list-container">
      <view v-if="loading" class="loading-box"><u-loading-icon></u-loading-icon></view>
      <view v-else-if="goodsList.length === 0" class="empty-box">
        <u-empty mode="list" icon="/static/empty/list.png" text="暂无商品"></u-empty>
      </view>
      <view v-else class="card-list">
        <view v-for="item in goodsList" :key="item._id" class="card goods-card">
          <view class="card-main" @click="navTo('/pages/merchant/goods/edit?id=' + item._id)">
            <image
              :src="item.img_url || '/static/logo.png'"
              mode="aspectFill"
              class="goods-img"
            ></image>
            <view class="goods-info">
              <view class="name-row">
                <text class="name u-line-1">{{ item.name }}</text>
              </view>
              <view class="stock-row">
                库存: <text :class="{ warn: item.stock < 10 }">{{ item.stock }}</text>
                {{ item.unit_small.name }}
              </view>
              <view class="price-row">
                <text class="price"
                  >¥{{ (item.unit_small.price / 100).toFixed(2) }}/{{ item.unit_small.name }}</text
                >
              </view>
            </view>
          </view>
          <view class="card-right">
            <view class="status-box">
              <text :class="['status-text', item.is_on_sale !== false ? 'on' : 'off']">
                {{ item.is_on_sale !== false ? '已上架' : '已下架' }}
              </text>
            </view>
            <u-icon name="arrow-right" color="#ccc" size="18"></u-icon>
          </view>
        </view>
      </view>
    </view>

    <u-tabbar
      :value="2"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#1890ff"
      @change="handleModuleChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag-fill"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGoods } from '@/composables/useGoods'

const { goodsList, loading, total, fetchGoodsList, toggleOnSale, deleteGoods } = useGoods()

const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const loadGoodsList = async () => {
  await fetchGoodsList({
    keyword: keyword.value,
    page: currentPage.value,
    limit: pageSize.value
  })
}

const handleSearch = () => {
  currentPage.value = 1
  loadGoodsList()
}

const handleClear = () => {
  keyword.value = ''
  currentPage.value = 1
  loadGoodsList()
}

const handleToggleSale = async (item: any, newVal: any) => {
  // 立即触发，无需取反，组件直接返回新值
  const success = await toggleOnSale(item._id, !!newVal)
  if (success) {
    loadGoodsList()
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
          loadGoodsList()
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

onShow(() => {
  uni.hideTabBar()
  loadGoodsList()
})
</script>

<style lang="scss" scoped>
.merchant-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 180rpx; // 预留 tabbar 与安全区
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background-color: #fff;
  position: relative;
  z-index: 10;
  .search {
    flex: 1;
  }
}

.list-container {
  padding: 24rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 24rpx;

  .goods-img {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background-color: #f9f9f9;
  }

  .goods-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .name {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .stock-row {
      font-size: 24rpx;
      color: #999;
      .warn {
        color: #ff4d4f;
        font-weight: bold;
      }
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .price {
        color: #ff6b00;
        font-size: 32rpx;
        font-weight: bold;
      }
    }
  }

  .card-main {
    flex: 1;
    display: flex;
    gap: 24rpx;
  }

  .card-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    padding: 10rpx 0;

    .status-box {
      .status-text {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 6rpx;
        &.on {
          color: #07c160;
          background-color: rgba(7, 193, 96, 0.1);
        }
        &.off {
          color: #999;
          background-color: #f0f0f0;
        }
      }
    }
  }
}
</style>
