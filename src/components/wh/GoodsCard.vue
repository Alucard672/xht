<template>
  <view class="wh-goods-card" @click="handleClick">
    <view class="card-main">
      <image :src="goods.img_url || '/static/logo.png'" mode="aspectFill" class="goods-img"></image>
      <view class="goods-info">
        <view class="name-row">
          <text class="name u-line-1">{{ goods.name }}</text>
        </view>
        <view class="stock-row">
          <text>库存: </text>
          <text :class="{ warn: goods.stock < 10 }">{{ goods.stock }}</text>
          <text> {{ goods.unit_small.name }}</text>
        </view>
        <view class="price-row">
          <text class="price"
            >¥{{ priceHelper.format(goods.unit_small.price) }}/{{ goods.unit_small.name }}</text
          >
        </view>
      </view>
    </view>
    <view class="card-right">
      <wh-status-tag
        :type="goods.is_on_sale !== false ? 'success' : 'default'"
        :text="goods.is_on_sale !== false ? '已上架' : '已下架'"
      ></wh-status-tag>
      <u-icon name="arrow-right" color="#ccc" size="18"></u-icon>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Goods } from '@/types/goods'
import { priceHelper } from '@/common/price-helper'
import WhStatusTag from './StatusTag.vue'

interface Props {
  goods: Goods
}

interface Emits {
  (e: 'click', goods: Goods): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click', props.goods)
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-goods-card {
  @include card-base;
  display: flex;
  gap: $wh-spacing-md;
  margin-bottom: $wh-spacing-md;
  cursor: pointer;
  transition: transform $wh-transition-fast $wh-easing-base;

  &:active {
    transform: scale(0.98);
  }

  .card-main {
    flex: 1;
    display: flex;
    gap: $wh-spacing-md;

    .goods-img {
      width: 160rpx;
      height: 160rpx;
      border-radius: $wh-border-radius-md;
      background-color: $wh-bg-color-hover;
      flex-shrink: 0;
    }

    .goods-info {
      flex: 1;
      @include flex-column;
      justify-content: space-between;

      .name-row {
        .name {
          @include text-title;
          font-size: $wh-font-size-md;
        }
      }

      .stock-row {
        @include text-secondary;
        font-size: $wh-font-size-sm;

        .warn {
          color: $wh-color-danger;
          font-weight: $wh-font-weight-bold;
        }
      }

      .price-row {
        .price {
          @include text-price;
          font-size: $wh-font-size-md;
        }
      }
    }
  }

  .card-right {
    @include flex-column;
    justify-content: space-between;
    align-items: flex-end;
    padding: 10rpx 0;
    flex-shrink: 0;
  }
}
</style>
