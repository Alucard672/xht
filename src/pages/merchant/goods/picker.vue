<template>
  <view class="goods-picker-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索商品名称"
        :show-action="false"
        @change="onSearch"
        @clear="onSearch"
      ></u-search>
    </view>

    <!-- 商品列表 -->
    <view class="list-content">
      <u-list @scrolltolower="loadMore">
        <u-list-item v-for="item in list" :key="item._id">
          <view class="goods-item card-box" hover-class="item-hover" @click="selectGoods(item)">
            <view class="left">
              <image v-if="item.img_url" :src="item.img_url" class="goods-img" mode="aspectFill" />
              <view v-else class="goods-img placeholder">
                <u-icon name="shopping-bag" size="40" color="#ccc"></u-icon>
              </view>
              <view class="goods-info">
                <text class="name">{{ item.name }}</text>
                <text v-if="item.category_name" class="category">{{ item.category_name }}</text>
              </view>
            </view>
            <view class="right">
              <view class="stock-info">
                <text class="label">库存</text>
                <text class="amount">{{ formatStock(item) }}</text>
              </view>
              <view class="price-info">
                <text class="price">¥{{ formatPrice(item) }}</text>
              </view>
              <u-icon name="arrow-right" color="#ccc" size="16"></u-icon>
            </view>
          </view>
        </u-list-item>
      </u-list>

      <u-loadmore :status="loadStatus" @loadmore="loadMore" />
      <u-empty
        v-if="list.length === 0 && !loading"
        mode="list"
        icon="/static/empty/list.png"
        text="暂无商品"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { priceHelper } from '@/common/price-helper'

const goodsCo = importObject('wh-goods-co')
const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const loadStatus = ref('loadmore')

// 加载商品数据
const loadData = async (reset = false) => {
  if (loading.value) return
  if (reset) {
    page.value = 1
    list.value = []
    loadStatus.value = 'loadmore'
  }

  loading.value = true
  try {
    const res = await goodsCo.getGoodsList({
      page: page.value,
      limit: 20,
      keyword: keyword.value
    })

    if (res.code === 0) {
      const newList = res.data.list || []
      if (reset) {
        list.value = newList
      } else {
        list.value = [...list.value, ...newList]
      }

      // 判断是否还有更多数据
      if (newList.length < 20) {
        loadStatus.value = 'nomore'
      } else {
        loadStatus.value = 'loadmore'
      }
    } else {
      uni.showToast({
        title: res.msg || '加载失败',
        icon: 'none'
      })
    }
  } catch (e: any) {
    console.error('加载商品列表失败:', e)
    uni.showToast({
      title: e.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (loadStatus.value === 'nomore' || loading.value) return
  page.value++
  loadData()
}

// 搜索
const onSearch = () => {
  loadData(true)
}

// 选择商品
const selectGoods = (item: any) => {
  // 返回选中的商品信息
  uni.$emit('goodsSelected', item)
  uni.navigateBack()
}

// 格式化库存显示
const formatStock = (item: any) => {
  if (item.is_multi_unit) {
    const bigUnits = Math.floor(item.stock / item.rate)
    const smallUnits = item.stock % item.rate
    if (bigUnits > 0 && smallUnits > 0) {
      return `${bigUnits}${item.unit_big.name}+${smallUnits}${item.unit_small.name}`
    } else if (bigUnits > 0) {
      return `${bigUnits}${item.unit_big.name}`
    } else {
      return `${smallUnits}${item.unit_small.name}`
    }
  } else {
    return `${item.stock}${item.unit_small.name}`
  }
}

// 格式化价格显示
const formatPrice = (item: any) => {
  // 显示小单位价格
  return priceHelper.format(item.unit_small.price)
}

onLoad(() => {
  loadData(true)
})
</script>

<style lang="scss" scoped>
.goods-picker-container {
  height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;

  .search-bar {
    background-color: #fff;
    padding: 20rpx;
    border-bottom: 1px solid #eee;
  }

  .list-content {
    flex: 1;
    overflow: hidden;

    .goods-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx;
      margin: 20rpx;
      background-color: #fff;
      border-radius: 16rpx;

      .left {
        display: flex;
        align-items: center;
        flex: 1;

        .goods-img {
          width: 120rpx;
          height: 120rpx;
          border-radius: 12rpx;
          margin-right: 20rpx;

          &.placeholder {
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .goods-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8rpx;

          .name {
            font-size: 32rpx;
            font-weight: 500;
            color: #333;
          }

          .category {
            font-size: 24rpx;
            color: #999;
          }
        }
      }

      .right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12rpx;

        .stock-info {
          display: flex;
          align-items: center;
          gap: 8rpx;

          .label {
            font-size: 24rpx;
            color: #999;
          }

          .amount {
            font-size: 26rpx;
            color: #666;
          }
        }

        .price-info {
          .price {
            font-size: 32rpx;
            font-weight: 500;
            color: #ff4d4f;
          }
        }
      }
    }
  }
}

.card-box {
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.item-hover {
  opacity: 0.8;
}
</style>
