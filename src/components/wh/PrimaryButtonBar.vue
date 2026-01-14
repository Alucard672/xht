<template>
  <view class="wh-primary-button-bar">
    <slot></slot>
  </view>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-primary-button-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $wh-spacing-md $wh-spacing-lg;
  background-color: $wh-bg-color-card;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  z-index: $wh-z-index-overlay;
  @include safe-area-bottom;

  :deep(.u-button) {
    width: 100%;
  }
}
</style>
