<template>
  <view class="merchant-page">
    <view class="action-bar">
      <view class="search">
        <u-search
          v-model="keyword"
          placeholder="搜索商品或拼音"
          :show-action="false"
          @search="refresh"
          @clear="refresh"
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
      <unicloud-db
        ref="udb"
        v-slot="{ data, loading, error, hasMore }"
        collection="wh_goods"
        :where="whereClause"
        orderby="create_time desc"
      >
        <view v-if="loading" class="loading-box"><u-loading-icon></u-loading-icon></view>
        <view v-else-if="error" class="error-box">{{ error.message }}</view>
        <view v-else class="card-list">
          <!-- 展示模拟数据或实际数据 -->
          <view
            v-for="item in data.length > 0 ? data : mockGoods"
            :key="item._id"
            class="card goods-card"
            @click="navTo('/pages/merchant/goods/edit?id=' + item._id)"
          >
            <image
              :src="item.img_url || '/static/logo.png'"
              mode="aspectFill"
              class="goods-img"
            ></image>
            <view class="goods-info">
              <view class="name-row">
                <text class="name u-line-1">{{ item.name }}</text>
                <u-switch :value="item.is_on_sale" size="16" @change="toggleSale(item)"></u-switch>
              </view>
              <view class="stock-row">
                库存: <text :class="{ warn: item.stock < 10 }">{{ item.stock }}</text>
                {{ item.unit_small.name }}
              </view>
              <view class="price-row">
                <text class="price"
                  >¥{{ (item.unit_small.price / 100).toFixed(2) }}/{{ item.unit_small.name }}</text
                >
                <u-icon name="edit-pen" color="#999" size="18"></u-icon>
              </view>
            </view>
          </view>
          <u-loadmore :status="data.length > 0 && hasMore ? 'loadmore' : 'nomore'" />
        </view>
      </unicloud-db>
    </view>

    <!-- 底部导航 -->
    <u-tabbar
      :value="2"
      :fixed="true"
      :placeholder="true"
      :safe-area-inset-bottom="true"
      active-color="#1890ff"
      @change="handleTabChange"
    >
      <u-tabbar-item text="工作台" icon="home"></u-tabbar-item>
      <u-tabbar-item text="订单" icon="order"></u-tabbar-item>
      <u-tabbar-item text="商品" icon="bag"></u-tabbar-item>
      <u-tabbar-item text="客户" icon="account"></u-tabbar-item>
    </u-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tenant_id = uni.getStorageSync('tenant_id')
const udb = ref(null)
const keyword = ref('')

const mockGoods = [
  {
    _id: 'm1',
    name: '农夫山泉 550ml',
    stock: 120,
    is_on_sale: true,
    unit_small: { name: '瓶', price: 100 },
    img_url: ''
  },
  {
    _id: 'm2',
    name: '康师傅红烧牛肉面',
    stock: 5,
    is_on_sale: true,
    unit_small: { name: '包', price: 300 },
    img_url: ''
  },
  {
    _id: 'm3',
    name: '雪碧 330ml',
    stock: 45,
    is_on_sale: true,
    unit_small: { name: '罐', price: 200 },
    img_url: ''
  },
  {
    _id: 'm4',
    name: '金龙鱼大米 5kg',
    stock: 20,
    is_on_sale: true,
    unit_small: { name: '袋', price: 4500 },
    img_url: ''
  },
  {
    _id: 'm5',
    name: '海天酱油 500ml',
    stock: 8,
    is_on_sale: false,
    unit_small: { name: '瓶', price: 800 },
    img_url: ''
  }
]

const whereClause = computed(() => {
  let clause = `tenant_id == "${tenant_id}"`
  if (keyword.value) {
    clause += ` && name.indexOf("${keyword.value}") >= 0`
  }
  return clause
})

const refresh = () => {
  // @ts-ignore
  udb.value.refresh()
}

const toggleSale = async (item: any) => {
  const db = uniCloud.database()
  try {
    await db.collection('wh_goods').doc(item._id).update({
      is_on_sale: !item.is_on_sale
    })
    uni.showToast({ title: '已' + (item.is_on_sale ? '下架' : '上架') })
    refresh()
  } catch (e) {
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const navTo = (url: string) => {
  uni.navigateTo({ url })
}

const handleTabChange = (index: number) => {
  if (index === 2) return
  const paths = [
    '/pages/merchant/dashboard',
    '/pages/merchant/order/list',
    '/pages/merchant/goods/list',
    '/pages/merchant/customer/list'
  ]
  uni.redirectTo({ url: paths[index] })
}

onShow(() => {
  refresh()
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
}
</style>
