<template>
  <view class="wh-customer-card" hover-class="item-hover" @click="handleClick">
    <view class="card-left">
      <view class="name-row">
        <text class="name">{{ customer.alias }}</text>
        <text v-if="customer.phone" class="phone">{{ customer.phone }}</text>
      </view>
      <view class="time-row">
        <text class="time"
          >最后交易：{{
            customer.last_trade_time ? formatDate(customer.last_trade_time) : '无'
          }}</text
        >
      </view>
    </view>
    <view class="card-right">
      <view class="debt-box" :class="{ 'has-debt': customer.total_debt > 0 }">
        <text class="label">欠款</text>
        <text class="amount">¥{{ priceHelper.format(customer.total_debt) }}</text>
      </view>
      <u-icon name="arrow-right" color="#ccc" size="16"></u-icon>
    </view>
  </view>
</template>

<script setup lang="ts">
import { priceHelper } from '@/common/price-helper'

interface Customer {
  _id: string
  alias: string
  phone?: string
  total_debt: number // 分
  last_trade_time?: number
}

interface Props {
  customer: Customer
}

interface Emits {
  (e: 'click', customer: Customer): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click', props.customer)
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-customer-card {
  @include card-base;
  @include flex-between;
  margin-bottom: $wh-spacing-sm;
  transition: transform $wh-transition-fast $wh-easing-base;

  &.item-hover {
    transform: scale(0.98);
    background-color: $wh-bg-color-hover;
  }

  .card-left {
    flex: 1;
    @include flex-column;

    .name-row {
      margin-bottom: $wh-spacing-xs;
      @include flex-start;
      gap: $wh-spacing-sm;

      .name {
        @include text-title;
        font-size: $wh-font-size-md;
      }

      .phone {
        @include text-secondary;
        font-size: $wh-font-size-sm;
      }
    }

    .time-row {
      .time {
        @include text-tertiary;
        font-size: $wh-font-size-xs;
      }
    }
  }

  .card-right {
    @include flex-start;
    gap: $wh-spacing-md;
    flex-shrink: 0;

    .debt-box {
      text-align: right;
      @include flex-column;

      .label {
        @include text-tertiary;
        font-size: $wh-font-size-xs;
        margin-bottom: 4rpx;
      }

      .amount {
        @include text-secondary;
        font-size: $wh-font-size-md;
        font-weight: $wh-font-weight-medium;
      }

      &.has-debt {
        .amount {
          color: $wh-color-danger;
          font-weight: $wh-font-weight-bold;
        }
      }
    }
  }
}
</style>
