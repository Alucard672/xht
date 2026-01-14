<template>
  <view class="wh-field-row" @click="handleClick">
    <view class="left">
      <text class="label">{{ label }}</text>
      <text v-if="tip" class="tip">{{ tip }}</text>
    </view>
    <view class="right">
      <text v-if="value !== undefined && value !== null && value !== ''" class="value">{{
        value
      }}</text>
      <slot></slot>
      <u-icon v-if="clickable" name="arrow-right" size="18" color="#ccc"></u-icon>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value?: string | number
  tip?: string
  clickable?: boolean
}

interface Emits {
  (e: 'click'): void
}

const emit = defineEmits<Emits>()

withDefaults(defineProps<Props>(), {
  value: '',
  tip: '',
  clickable: false
})

const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-field-row {
  @include flex-between;
  padding: $wh-spacing-sm 0;
  gap: $wh-spacing-md;

  .left {
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    .label {
      @include text-primary;
      font-size: $wh-font-size-md;
    }
    .tip {
      @include text-tertiary;
      font-size: $wh-font-size-xs;
    }
  }

  .right {
    display: inline-flex;
    align-items: center;
    gap: $wh-spacing-sm;
    max-width: 60%;

    .value {
      @include text-secondary;
      font-size: $wh-font-size-md;
    }
  }
}
</style>
