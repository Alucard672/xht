<template>
  <view class="wh-section-card" :class="[size, customClass]">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
interface Props {
  size?: 'base' | 'large'
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  size: 'base',
  customClass: ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-section-card {
  @include card-base;

  &.large {
    @include card-large;
  }
}
</style>
