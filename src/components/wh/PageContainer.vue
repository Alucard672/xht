<template>
  <view class="wh-page-container" :class="[customClass]">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
interface Props {
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  customClass: ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-page-container {
  min-height: 100vh;
  background-color: $wh-bg-color-page;
  padding-bottom: 180rpx; // 预留 tabbar 与安全区
  @include safe-area-bottom;
}
</style>
