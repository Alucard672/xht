<template>
  <view class="shop-container">
    <!-- 店铺无法访问时的状态 -->
    <view v-if="shopInvalid" class="invalid-shop">
      <u-empty mode="permission" text="店铺不存在或已关闭"></u-empty>
      <u-button
        type="primary"
        text="返回首页"
        custom-style="margin-top: 40rpx; width: 300rpx;"
        @click="navTo('/pages/index/index')"
      ></u-button>
    </view>

    <template v-else>
      <view v-if="mode !== 'agent'" class="shop-header">
        <view class="top-row">
          <image
            v-if="shopInfo?.logo_url"
            :src="shopInfo.logo_url"
            mode="aspectFill"
            class="shop-logo"
          ></image>
          <text class="shop-name">{{ shopInfo?.name || '商家店铺' }}</text>
          <u-icon name="arrow-right" color="#fff" size="14"></u-icon>
        </view>
        <view class="search-box">
          <u-search
            v-model="keyword"
            placeholder="搜索商品或首字母"
            :show-action="false"
            shape="round"
            bg-color="#ffffff"
            @focus="showSearchPanel = true"
            @blur="handleSearchBlur"
            @search="handleSearch"
          ></u-search>
        </view>

        <!-- 搜索面板 -->
        <view v-if="showSearchPanel && !keyword" class="search-panel">
          <!-- 热门搜索 -->
          <view v-if="hotSearch.length > 0" class="search-section">
            <view class="section-header">
              <text class="section-title">热门搜索</text>
            </view>
            <view class="tag-list">
              <view
                v-for="(item, index) in hotSearch"
                :key="index"
                class="tag-item"
                @click="handleHotSearch(item)"
              >
                {{ item }}
              </view>
            </view>
          </view>

          <!-- 搜索历史 -->
          <view v-if="searchHistory.length > 0" class="search-section">
            <view class="section-header">
              <text class="section-title">搜索历史</text>
              <text class="clear-btn" @click="clearSearchHistory">清空</text>
            </view>
            <view class="history-list">
              <view
                v-for="(item, index) in searchHistory"
                :key="index"
                class="history-item"
                @click="handleHistorySearch(item)"
              >
                <u-icon name="clock" size="16" color="#999"></u-icon>
                <text class="history-text">{{ item }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="mode !== 'agent'" class="notice-bar">
        <u-notice-bar
          text="通知：本周新品上架，茅台酒特价优惠中！欢迎选购！"
          color="#d48806"
          bg-color="#fff7e6"
          mode="horizontal"
        ></u-notice-bar>
      </view>

      <view v-if="currentTab === 0" class="content">
        <scroll-view class="category-list" scroll-y>
          <view
            v-for="cat in categories"
            :key="cat._id"
            :class="['cat-item', activeCat === cat._id ? 'active' : '']"
            @click="activeCat = cat._id"
          >
            <text class="cat-name">{{ cat.name }}</text>
          </view>
        </scroll-view>

        <scroll-view class="goods-list" scroll-y @scrolltolower="loadMore">
          <unicloud-db
            ref="udb"
            v-slot="{ data, loading, error }"
            collection="wh_goods"
            :where="whereClause"
            :page-size="20"
          >
            <view v-if="error" class="error">{{ error.message }}</view>
            <view v-else class="goods-grid">
              <view v-for="item in data" :key="item._id" class="goods-card">
                <image
                  :src="item.img_url || '/static/logo.png'"
                  mode="aspectFill"
                  class="goods-img"
                ></image>
                <view class="goods-info">
                  <view class="name u-line-1">{{ item.name }}</view>
                  <view class="spec">{{
                    item.unit_big?.name
                      ? `${item.rate || 1}${item.unit_small?.name || ''}/${item.unit_big.name}`
                      : item.unit_small?.name || ''
                  }}</view>
                  <view class="price-row">
                    <view class="price-main">
                      <text class="symbol">¥</text>
                      <text class="val">{{
                        priceHelper.format(item.unit_big?.price || item.unit_small?.price || 0)
                      }}</text>
                      <text class="unit"
                        >/{{ item.unit_big?.name || item.unit_small?.name || '' }}</text
                      >
                    </view>
                    <view v-if="item.unit_big?.name" class="price-sub">
                      ¥{{ priceHelper.format(item.unit_small?.price || 0) }}/{{
                        item.unit_small?.name || ''
                      }}
                    </view>
                  </view>
                  <view class="add-btn" @click.stop="addToCart(item)">
                    <u-icon name="plus" color="#fff" size="14"></u-icon>
                  </view>
                </view>
              </view>
              <view class="list-bottom-space" :style="{ height: bottomSpaceHeight }"></view>
            </view>
            <u-loading-icon v-if="loading"></u-loading-icon>
          </unicloud-db>
        </scroll-view>
      </view>

      <view v-if="currentTab === 1" class="cart-page">
        <view class="cart-header">
          <text class="title">购物车 ({{ cartTotalCount }})</text>
          <text class="clear" @click="clearCart">清空</text>
        </view>

        <scroll-view class="cart-list" scroll-y>
          <view v-if="cartTotalCount === 0" class="empty-cart">
            <u-empty mode="car" text="购物车是空的"></u-empty>
            <u-button
              type="primary"
              text="去凑单"
              size="small"
              custom-style="margin-top: 40rpx; width: 200rpx;"
              @click="currentTab = 0"
            ></u-button>
          </view>
          <view v-else class="cart-items">
            <view v-for="(item, id) in cart" :key="id" class="cart-item">
              <image :src="item.img_url || '/static/logo.png'" class="item-img"></image>
              <view class="item-info">
                <view class="item-name">{{ item.name }}</view>
                <view class="unit-controls-list">
                  <!-- 大单位控制 -->
                  <view v-if="item.unitBigName" class="unit-control-row">
                    <text class="unit-label">{{ item.unitBigName }}</text>
                    <view class="control-right">
                      <u-number-box
                        v-model="item.countBig"
                        :min="0"
                        size="22"
                        @change="onCartNumChange(item)"
                      ></u-number-box>
                      <text class="unit-price">¥{{ priceHelper.format(item.priceBig) }}</text>
                    </view>
                  </view>
                  <!-- 小单位控制 -->
                  <view class="unit-control-row">
                    <text class="unit-label">{{ item.unitSmallName }}</text>
                    <view class="control-right">
                      <u-number-box
                        v-model="item.countSmall"
                        :min="0"
                        size="22"
                        @change="onCartNumChange(item)"
                      ></u-number-box>
                      <text class="unit-price">¥{{ priceHelper.format(item.priceSmall) }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view class="list-bottom-space" :style="{ height: bottomSpaceHeight }"></view>
          </view>
        </scroll-view>

        <view v-if="cartTotalCount > 0" class="cart-footer">
          <view class="total-info">
            <text class="label">合计:</text>
            <text class="symbol">¥</text>
            <text class="amount">{{ priceHelper.format(cartTotalAmount) }}</text>
          </view>
          <u-button
            type="primary"
            text="提交订单"
            custom-style="width: 240rpx; height: 80rpx; border-radius: 40rpx;"
            @click="goToCheckout"
          ></u-button>
        </view>
      </view>

      <scroll-view v-if="currentTab === 2" class="my-page" scroll-y>
        <view class="my-header">
          <view class="user-info">
            <image class="avatar" src="/static/logo.png"></image>
            <view class="info-right">
              <view class="nickname">{{ userInfo.nickname }}</view>
              <view class="mobile">{{ userInfo.mobile }}</view>
            </view>
          </view>
          <view class="debt-card">
            <view class="label">当前欠款 (元)</view>
            <view class="amount">{{ priceHelper.format(userInfo.total_debt) }}</view>
            <view class="btn-row">
              <text class="btn" @click="navTo('/pages/client/orders')">账单详情 ></text>
            </view>
          </view>
        </view>

        <view class="menu-list">
          <view class="menu-item" @click="navTo('/pages/client/orders')">
            <u-icon name="order" size="24" color="#07c160"></u-icon>
            <text class="menu-text">历史订单</text>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          <view class="menu-item" @click="navTo('/pages/client/assets')">
            <u-icon name="rmb-circle" size="24" color="#07c160"></u-icon>
            <text class="menu-text">我的资产</text>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          <view class="menu-item" @click="showToast('演示功能')">
            <u-icon name="map" size="24" color="#07c160"></u-icon>
            <text class="menu-text">收货地址</text>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          <view class="menu-item" @click="showToast('演示功能')">
            <u-icon name="kefu-ermai" size="24" color="#07c160"></u-icon>
            <text class="menu-text">联系商家</text>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>

        <view class="logout-btn" @click="logout">退出登录</view>
        <view class="list-bottom-space" :style="{ height: bottomSpaceHeight }"></view>
      </scroll-view>

      <view v-if="currentTab === 0 && cartTotalCount > 0" class="cart-bar" @click="currentTab = 1">
        <view class="cart-icon">
          <u-icon name="shopping-cart-fill" color="#fff" size="28"></u-icon>
          <view class="badge">{{ cartTotalCount }}</view>
        </view>
        <view class="cart-info">
          <text class="total-price">¥{{ priceHelper.format(cartTotalAmount) }}</text>
          <text class="delivery-tip">免费配送</text>
        </view>
        <view class="checkout-btn" @click.stop="goToCheckout">去结算</view>
      </view>

      <!-- 单位选择弹窗 -->
      <u-popup :show="showUnitPopup" mode="bottom" round="20" @close="showUnitPopup = false">
        <view v-if="activeItem" class="unit-popup-content">
          <view class="popup-header">
            <image :src="activeItem.img_url || '/static/logo.png'" class="p-img"></image>
            <view class="p-info">
              <view class="p-name">{{ activeItem.name }}</view>
              <view class="p-price"
                >已选：{{ tempCartItem.countBig || 0 }}{{ activeItem.unit_big?.name || '' }}
                {{ tempCartItem.countSmall || 0 }}{{ activeItem.unit_small?.name }}</view
              >
            </view>
          </view>

          <view class="popup-body">
            <view v-if="activeItem.unit_big?.name" class="unit-select-item">
              <view class="u-left">
                <text class="u-name">{{ activeItem.unit_big.name }}</text>
                <text class="u-sub"
                  >¥{{ priceHelper.format(activeItem.unit_big.price) }} /
                  {{ activeItem.unit_big.name }}</text
                >
              </view>
              <u-number-box v-model="tempCartItem.countBig" :min="0"></u-number-box>
            </view>

            <view class="unit-select-item">
              <view class="u-left">
                <text class="u-name">{{ activeItem.unit_small.name }}</text>
                <text class="u-sub"
                  >¥{{ priceHelper.format(activeItem.unit_small.price) }} /
                  {{ activeItem.unit_small.name }}</text
                >
              </view>
              <u-number-box v-model="tempCartItem.countSmall" :min="0"></u-number-box>
            </view>
          </view>

          <view class="popup-footer">
            <u-button type="primary" text="加入购物车" @click="confirmAddToCart"></u-button>
          </view>
        </view>
      </u-popup>

      <view class="bottom-tabbar">
        <view :class="['tab-item', currentTab === 0 ? 'active' : '']" @click="handleTabChange(0)">
          <u-icon name="home" :color="currentTab === 0 ? '#07c160' : '#7d7e80'" size="26"></u-icon>
          <text class="txt">首页</text>
        </view>
        <view :class="['tab-item', currentTab === 1 ? 'active' : '']" @click="handleTabChange(1)">
          <u-icon
            name="shopping-cart"
            :color="currentTab === 1 ? '#07c160' : '#7d7e80'"
            size="26"
          ></u-icon>
          <text class="txt">购物车</text>
        </view>
        <view
          v-if="mode !== 'agent'"
          :class="['tab-item', currentTab === 2 ? 'active' : '']"
          @click="handleTabChange(2)"
        >
          <u-icon
            name="account"
            :color="currentTab === 2 ? '#07c160' : '#7d7e80'"
            size="26"
          ></u-icon>
          <text class="txt">我的</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { priceHelper } from '@/common/price-helper'
import { importObject } from '@/utils/cloud'

const merchantCo = importObject('wh-merchant-co')

const mode = ref('')
const tenant_id = ref('')
const shopInfo = ref<any>(null)
const shopInvalid = ref(false)
const udb = ref<any>(null)
const activeCat = ref('all')
const keyword = ref('')
const currentTab = ref(0)
const userInfo = ref({
  nickname: '张小店',
  mobile: '13800138000',
  total_debt: 125000 // 1250.00
})

const categories = ref([{ _id: 'all', name: '全部商品' }])

const cart = reactive<any>({})
const showCartPopup = ref(false)

const showUnitPopup = ref(false)
const activeItem = ref<any>(null)
const tempCartItem = reactive<any>({
  countBig: 0,
  countSmall: 0
})

// 搜索相关
const showSearchPanel = ref(false)
const searchHistory = ref<string[]>([])
const hotSearch = ref<string[]>(['茅台', '五粮液', '食用油', '方便面', '矿泉水'])

const getSearchHistoryKey = () => `search_history_${tenant_id.value}`

const loadSearchHistory = () => {
  const key = getSearchHistoryKey()
  const saved = uni.getStorageSync(key)
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved)
    } catch (e) {
      searchHistory.value = []
    }
  }
}

const saveSearchHistory = (keyword: string) => {
  if (!keyword.trim()) return
  const key = getSearchHistoryKey()
  const list = [...searchHistory.value]
  const index = list.indexOf(keyword)
  if (index > -1) {
    list.splice(index, 1)
  }
  list.unshift(keyword)
  if (list.length > 20) {
    list.pop()
  }
  searchHistory.value = list
  uni.setStorageSync(key, JSON.stringify(list))
}

const clearSearchHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清空搜索历史吗？',
    success: res => {
      if (res.confirm) {
        searchHistory.value = []
        uni.removeStorageSync(getSearchHistoryKey())
      }
    }
  })
}

const handleSearch = () => {
  if (keyword.value.trim()) {
    saveSearchHistory(keyword.value)
    showSearchPanel.value = false
  }
}

const handleSearchBlur = () => {
  setTimeout(() => {
    showSearchPanel.value = false
  }, 200)
}

const handleHotSearch = (item: string) => {
  keyword.value = item
  saveSearchHistory(item)
  showSearchPanel.value = false
}

const handleHistorySearch = (item: string) => {
  keyword.value = item
  showSearchPanel.value = false
}

onLoad(async options => {
  if (options?.mode) {
    mode.value = options.mode
  }
  if (options?.tenant_id) {
    tenant_id.value = options.tenant_id
  } else {
    tenant_id.value = uni.getStorageSync('tenant_id') || 'demo-tenant-id'
  }
  fetchShopInfo()
  fetchCategories()
  loadCartFromStorage()
  loadSearchHistory()
})

const getCartKey = () => `cart_${tenant_id.value}`

const loadCartFromStorage = () => {
  const key = getCartKey()
  const saved = uni.getStorageSync(key)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      // 清空当前内存购物车并恢复
      Object.keys(cart).forEach(k => delete cart[k])
      Object.assign(cart, data)
    } catch (e) {
      console.error('Failed to parse saved cart:', e)
    }
  }
}

const saveCartToStorage = () => {
  const key = getCartKey()
  uni.setStorageSync(key, JSON.stringify(cart))
}

const fetchShopInfo = async () => {
  shopInvalid.value = false
  try {
    const res = await merchantCo.getTenantInfo({ tenantId: tenant_id.value })
    if (res.code === 0 && res.data) {
      shopInfo.value = res.data
    } else {
      shopInvalid.value = true
    }
  } catch (e) {
    console.error('Fetch shop info failed:', e)
    shopInvalid.value = true
  }
}

const fetchCategories = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('wh_categories').where({ tenant_id: tenant_id.value }).get()
    if (res.result.data.length > 0) {
      categories.value = [{ _id: 'all', name: '全部商品' }, ...res.result.data]
    }
  } catch (e) {
    // ignore
  }
}

const whereClause = computed(() => {
  // 修改为 ！= false，兼容旧数据或属性缺失的情况
  let clause = `tenant_id == "${tenant_id.value}" && is_on_sale != false`
  if (activeCat.value !== 'all') {
    clause += ` && category_id == "${activeCat.value}"`
  }
  if (keyword.value) {
    clause += ` && name.indexOf("${keyword.value}") >= 0`
  }
  return clause
})

const addToCart = (item: any) => {
  activeItem.value = item
  const existing = cart[item._id]
  if (existing) {
    tempCartItem.countBig = existing.countBig || 0
    tempCartItem.countSmall = existing.countSmall || 0
  } else {
    tempCartItem.countBig = 0
    tempCartItem.countSmall = 0
  }
  showUnitPopup.value = true
}

const confirmAddToCart = () => {
  const item = activeItem.value
  if (tempCartItem.countBig === 0 && tempCartItem.countSmall === 0) {
    delete cart[item._id]
  } else {
    cart[item._id] = {
      _id: item._id,
      name: item.name,
      img_url: item.img_url,
      unitSmallName: item.unit_small.name,
      priceSmall: item.unit_small.price,
      countSmall: tempCartItem.countSmall,
      unitBigName: item.unit_big?.name,
      priceBig: item.unit_big?.price,
      countBig: tempCartItem.countBig
    }
  }
  saveCartToStorage() // 持久化保存
  showUnitPopup.value = false
  uni.showToast({ title: '已更新购物车', icon: 'none' })
}

const clearCart = () => {
  Object.keys(cart).forEach(k => delete cart[k])
  saveCartToStorage()
}

const cartTotalCount = computed(() => {
  return Object.values(cart).reduce(
    (total: number, item: any) => total + (item.countSmall || 0) + (item.countBig || 0),
    0
  )
})

const cartTotalAmount = computed(() => {
  return Object.values(cart).reduce((total: number, item: any) => {
    let sum = total + item.priceSmall * (item.countSmall || 0)
    if (item.countBig && item.priceBig) {
      sum += item.priceBig * item.countBig
    }
    return sum
  }, 0)
})

const bottomSpaceHeight = computed(() => {
  // 首页有“去结算”浮层时，需要更大的底部留白；否则只需要避开底部导航
  const hasCheckoutBar = currentTab.value === 0 && cartTotalCount.value > 0
  return hasCheckoutBar ? '320rpx' : '160rpx'
})

const goToCheckout = () => {
  if (cartTotalCount.value === 0) return
  uni.setStorageSync('current_cart', JSON.stringify(Object.values(cart)))
  uni.navigateTo({ url: `/pages/client/checkout?tenant_id=${tenant_id.value}&mode=${mode.value}` })
}

const onCartNumChange = (item: any) => {
  if (item.countSmall <= 0 && (item.countBig || 0) <= 0) {
    delete cart[item._id]
  }
  saveCartToStorage()
}

const handleTabChange = (index: number) => {
  currentTab.value = index
}

const navTo = (url: string) => {
  uni.navigateTo({ url })
}

const showToast = (title: string) => {
  uni.showToast({ title, icon: 'none' })
}

const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res: any) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.reLaunch({ url: '/pages/merchant/login' })
      }
    }
  })
}

const loadMore = () => {
  // udb 自动处理分页
}
</script>

<style lang="scss" scoped>
.shop-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  // 关键修改：背景改为白色，避免用户觉得有灰色蒙层
  background-color: #ffffff;
  overflow: hidden;

  .invalid-shop {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 200rpx;
  }
}

.shop-header {
  flex-shrink: 0;
  background-color: #07c160;
  padding: calc(40rpx + env(safe-area-inset-top)) 32rpx 0;

  .top-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;

    .shop-logo {
      width: 80rpx;
      height: 80rpx;
      border-radius: 12rpx;
      border: 2rpx solid rgba(255, 255, 255, 0.4);
    }

    .shop-name {
      color: #fff;
      font-size: 34rpx;
      font-weight: bold;
    }
  }

  .search-box {
    margin-bottom: 16rpx;
  }

  .search-panel {
    position: absolute;
    top: calc(100% + 16rpx);
    left: 32rpx;
    right: 32rpx;
    background-color: #fff;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
    max-height: 60vh;
    overflow-y: auto;
    z-index: 100;

    .search-section {
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16rpx;

        .section-title {
          font-size: 26rpx;
          color: #333;
          font-weight: 500;
        }

        .clear-btn {
          font-size: 24rpx;
          color: #999;
        }
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;

        .tag-item {
          padding: 12rpx 24rpx;
          background-color: #f5f5f5;
          border-radius: 8rpx;
          font-size: 26rpx;
          color: #666;
        }
      }

      .history-list {
        .history-item {
          display: flex;
          align-items: center;
          gap: 12rpx;
          padding: 16rpx 0;

          .history-text {
            font-size: 28rpx;
            color: #333;
          }
        }
      }
    }
  }
}

.notice-bar {
  flex-shrink: 0;
  margin-bottom: 2rpx;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: 0;

  .category-list {
    width: 160rpx;
    background-color: #f8f8f8;
    height: 100%;
    .cat-item {
      padding: 32rpx 20rpx;
      font-size: 26rpx;
      color: #666;
      text-align: center;
      &.active {
        background-color: #fff;
        color: #07c160;
        font-weight: bold;
        position: relative;
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 30%;
          bottom: 30%;
          width: 6rpx;
          background-color: #07c160;
          border-radius: 0 4rpx 4rpx 0;
        }
      }
    }
  }

  .goods-list {
    flex: 1;
    background-color: #fff;
    padding: 20rpx;
    padding-bottom: 0;
    height: 100%;

    .goods-grid {
      display: flex;
      flex-direction: column;
      gap: 32rpx;
    }

    .goods-card {
      display: flex;
      gap: 20rpx;
      position: relative;
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid #f0f0f0; // 增加分割线，视觉更清晰

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
        padding: 4rpx 0;

        .name {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
        }
        .spec {
          font-size: 24rpx;
          color: #999;
          margin-top: 4rpx;
        }

        .price-row {
          margin-top: 10rpx;
          .price-main {
            display: flex;
            align-items: baseline;
            color: #ff4d4f;
            .symbol {
              font-size: 24rpx;
            }
            .val {
              font-size: 36rpx;
              font-weight: bold;
            }
            .unit {
              font-size: 24rpx;
              color: #999;
              margin-left: 4rpx;
            }
          }
          .price-sub {
            font-size: 22rpx;
            color: #999;
            margin-top: 2rpx;
          }
        }

        .add-btn {
          position: absolute;
          right: 0;
          bottom: 20rpx;
          width: 56rpx;
          height: 56rpx;
          background-color: #07c160;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
        }
      }
    }
  }
}

// 关键 CSS 修改：处理底部固定栏位置
.cart-bar {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  // 位于自定义底部导航上方
  bottom: calc(110rpx + env(safe-area-inset-bottom) + 16rpx);
  height: 100rpx;
  background-color: #333;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  padding: 0 10rpx 0 30rpx;
  z-index: 99; // 高于底部导航
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.2);

  .cart-icon {
    position: relative;
    margin-top: 0; // 移除负边距，实现垂直居中
    background-color: #07c160;
    width: 90rpx;
    height: 90rpx;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    z-index: 101;
    flex-shrink: 0;

    .badge {
      position: absolute;
      right: -6rpx; // 稍微向右偏移
      top: -6rpx; // 稍微向上偏移
      background-color: #ff4d4f;
      color: #fff;
      font-size: 18rpx;
      min-width: 30rpx;
      height: 30rpx;
      border-radius: 15rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 4rpx;
      border: 2rpx solid #fff;
    }
  }

  .cart-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    .total-price {
      color: #fff;
      font-size: 36rpx;
      font-weight: bold;
    }
    .delivery-tip {
      color: rgba(255, 255, 255, 0.6);
      font-size: 22rpx;
    }
  }

  .checkout-btn {
    width: 180rpx;
    height: 80rpx;
    background-color: #07c160;
    border-radius: 40rpx;
    color: #fff;
    font-size: 30rpx;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

// 底部占位高度由模板 style 动态控制
.list-bottom-space {
  height: 0;
  width: 100%;
}

.bottom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  // 关键：高度改为自动，使用 padding-bottom 撑开安全区，避免遮挡
  height: calc(110rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: flex-start; // 对齐到顶部
  justify-content: space-around;
  z-index: 98;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  height: 110rpx; // 保持交互区域高度
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;

  .txt {
    color: #7d7e80;
    font-size: 24rpx; // 稍微调大一点点
  }

  &.active {
    .txt {
      color: #07c160;
      font-weight: bold;
    }
  }
}

.cart-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff; // 改为白色
  overflow: hidden;
  height: 0;
  padding-bottom: calc(110rpx + env(safe-area-inset-bottom)); // 避开底部导航

  .cart-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    background-color: #fff;
    border-bottom: 1rpx solid #f5f5f5;
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    .clear {
      font-size: 26rpx;
      color: #999;
    }
  }

  .cart-list {
    flex: 1;
    padding: 20rpx;
    .empty-cart {
      padding-top: 200rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cart-items {
      .cart-item {
        background-color: #fff;
        border-radius: 16rpx;
        padding: 24rpx;
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid #f5f5f5;
        .item-img {
          width: 120rpx;
          height: 120rpx;
          border-radius: 8rpx;
          margin-right: 20rpx;
        }
        .item-info {
          flex: 1;
          .item-name {
            font-size: 30rpx;
            font-weight: bold;
            color: #333;
            margin-bottom: 12rpx;
          }
          .unit-controls-list {
            display: flex;
            flex-direction: column;
            gap: 16rpx;
            .unit-control-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              .unit-label {
                font-size: 26rpx;
                color: #666;
                min-width: 60rpx;
              }
              .control-right {
                display: flex;
                align-items: center;
                gap: 16rpx;
                .unit-price {
                  font-size: 28rpx;
                  color: #333;
                  font-weight: 500;
                  min-width: 100rpx;
                  text-align: right;
                }
              }
            }
          }
        }
      }
    }
  }

  .cart-footer {
    background-color: #fff;
    padding: 20rpx 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1rpx solid #f0f0f0;

    .total-info {
      display: flex;
      align-items: baseline;
      .label {
        font-size: 28rpx;
        color: #333;
        margin-right: 8rpx;
      }
      .symbol {
        font-size: 24rpx;
        color: #ff4d4f;
      }
      .amount {
        font-size: 40rpx;
        font-weight: bold;
        color: #ff4d4f;
      }
    }
  }
}

.my-page {
  flex: 1;
  background-color: #f5f5f5;
  height: 0;
  padding-bottom: 0;

  .my-header {
    background-color: #07c160;
    padding: 60rpx 32rpx 100rpx;

    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 40rpx;
      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
        border: 4rpx solid rgba(255, 255, 255, 0.3);
        margin-right: 24rpx;
      }
      .info-right {
        .nickname {
          font-size: 40rpx;
          font-weight: bold;
          color: #fff;
          margin-bottom: 8rpx;
        }
        .mobile {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    .debt-card {
      background-color: #fff;
      border-radius: 24rpx;
      padding: 32rpx;
      box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
      position: relative;
      margin-bottom: -140rpx;
      z-index: 1;

      .label {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      .amount {
        font-size: 56rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 16rpx;
      }
      .btn-row {
        border-top: 1rpx solid #f5f5f5;
        padding-top: 20rpx;
        .btn {
          font-size: 26rpx;
          color: #07c160;
        }
      }
    }
  }

  .menu-list {
    margin-top: 80rpx;
    background-color: #fff;
    padding: 0 32rpx;
    .menu-item {
      display: flex;
      align-items: center;
      padding: 32rpx 0;
      border-bottom: 1rpx solid #f5f5f5;
      &:last-child {
        border-bottom: none;
      }
      .menu-text {
        flex: 1;
        margin-left: 20rpx;
        font-size: 30rpx;
        color: #333;
      }
    }
  }

  .logout-btn {
    margin: 60rpx 32rpx;
    height: 100rpx;
    background-color: #fff;
    border-radius: 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32rpx;
    color: #ff4d4f;
  }
}
</style>
