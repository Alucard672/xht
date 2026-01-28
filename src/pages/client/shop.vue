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
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @search="handleSearch"
          ></u-search>
        </view>
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

const handleSearch = () => {
  // Simplified search - just trigger filtering
}

const handleSearchFocus = () => {
  // Search focus handler - can be expanded later
}

const handleSearchBlur = () => {
  // Search blur handler
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
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.shop-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
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
  background: $wh-gradient-blue;
  padding: calc($wh-spacing-lg + env(safe-area-inset-top)) $wh-spacing-xl 0;

  .top-row {
    display: flex;
    align-items: center;
    gap: $wh-spacing-sm;
    margin-bottom: $wh-spacing-md;

    .shop-logo {
      width: 88rpx;
      height: 88rpx;
      border-radius: $wh-border-radius-lg;
      border: 2rpx solid rgba(255, 255, 255, 0.4);
      box-shadow: $wh-shadow-sm;
    }

    .shop-name {
      color: $wh-text-color-inverse;
      font-size: $wh-font-size-xl;
      font-weight: $wh-font-weight-extrabold;
      letter-spacing: 0.5rpx;
    }
  }

  .search-box {
    margin-bottom: $wh-spacing-sm;
  }
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: 0;

  .category-list {
    width: 160rpx;
    background: $wh-bg-color-secondary;
    height: 100%;
    .cat-item {
      padding: $wh-spacing-lg $wh-spacing-md;
      font-size: $wh-font-size-sm;
      color: $wh-text-color-secondary;
      text-align: center;
      font-weight: $wh-font-weight-medium;
      transition: all $wh-transition-normal;
      position: relative;

      &.active {
        background: $wh-bg-color-card;
        color: $wh-color-blue;
        font-weight: $wh-font-weight-semibold;
        position: relative;
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          bottom: 25%;
          width: 6rpx;
          background: $wh-gradient-blue-vertical;
          border-radius: 0 $wh-border-radius-xs $wh-border-radius-xs 0;
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
      gap: $wh-spacing-md;
      position: relative;
      padding-bottom: $wh-spacing-md;
      border-bottom: 1rpx solid $wh-border-color-light;

      .goods-img {
        width: 160rpx;
        height: 160rpx;
        border-radius: $wh-border-radius-lg;
        background: $wh-gradient-empty;
        border: 1rpx solid $wh-border-color-light;
      }

      .goods-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: $wh-spacing-xs 0;

        .name {
          font-size: $wh-font-size-lg;
          font-weight: $wh-font-weight-semibold;
          color: $wh-text-color-dark;
          letter-spacing: 0.3rpx;
        }
        .spec {
          font-size: $wh-font-size-xs;
          color: $wh-text-color-light-gray;
          margin-top: $wh-spacing-xs;
          font-weight: $wh-font-weight-medium;
        }

        .price-row {
          margin-top: $wh-spacing-xs;
          .price-main {
            display: flex;
            align-items: baseline;
            .symbol {
              font-size: $wh-font-size-sm;
              background: $wh-gradient-price;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .val {
              @include price-text-small;
            }
            .unit {
              font-size: $wh-font-size-xs;
              color: $wh-text-color-light-gray;
              margin-left: $wh-spacing-xs;
              font-weight: $wh-font-weight-medium;
            }
          }
          .price-sub {
            font-size: $wh-font-size-xs;
            color: $wh-text-color-gray;
            margin-top: 2rpx;
            font-weight: $wh-font-weight-medium;
          }
        }

        .add-btn {
          position: absolute;
          right: 0;
          bottom: $wh-spacing-md;
          width: 64rpx;
          height: 64rpx;
          background: $wh-color-blue;
          border-radius: $wh-border-radius-circle;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: $wh-shadow-colored;
          transition: all $wh-transition-normal;

          &:active {
            transform: scale(0.9);
            box-shadow: $wh-shadow-md;
          }
        }
      }
    }
  }
}

// Cart bar with glass effect
.cart-bar {
  position: fixed;
  left: $wh-spacing-xl;
  right: $wh-spacing-xl;
  bottom: calc(110rpx + env(safe-area-inset-bottom) + $wh-spacing-md);
  height: 100rpx;
  background: rgba(51, 51, 51, 0.95);
  @include glass-effect(20rpx, 0.95);
  border-radius: $wh-border-radius-full;
  display: flex;
  align-items: center;
  padding: 0 $wh-spacing-sm 0 $wh-spacing-xl;
  z-index: $wh-z-index-footer;
  box-shadow: $wh-shadow-bottom-bar;

  .cart-icon {
    position: relative;
    background: $wh-color-blue;
    width: 90rpx;
    height: 90rpx;
    border-radius: $wh-border-radius-circle;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: $wh-shadow-colored;
    z-index: $wh-z-index-sticky;
    flex-shrink: 0;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.95);
    }

    .badge {
      position: absolute;
      right: -6rpx;
      top: -6rpx;
      background-color: $wh-color-danger-modern;
      color: #fff;
      font-size: $wh-font-size-xs;
      min-width: 32rpx;
      height: 32rpx;
      border-radius: $wh-border-radius-full;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 $wh-spacing-xs;
      border: 2rpx solid #fff;
      font-weight: $wh-font-weight-semibold;
    }
  }

  .cart-info {
    flex: 1;
    margin-left: $wh-spacing-md;
    display: flex;
    flex-direction: column;
    .total-price {
      color: $wh-text-color-inverse;
      font-size: $wh-font-size-2xl;
      font-weight: $wh-font-weight-extrabold;
      letter-spacing: -0.5rpx;
    }
    .delivery-tip {
      color: rgba(255, 255, 255, 0.7);
      font-size: $wh-font-size-xs;
      font-weight: $wh-font-weight-medium;
    }
  }

  .checkout-btn {
    width: 180rpx;
    height: 80rpx;
    background: $wh-color-blue;
    border-radius: $wh-border-radius-full;
    color: #fff;
    font-size: $wh-font-size-lg;
    font-weight: $wh-font-weight-semibold;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all $wh-transition-normal;

    &:active {
      transform: scale(0.95);
    }
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
