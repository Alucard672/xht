<template>
  <view class="wh-status-tag" :class="[type, size]">
    <text class="tag-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  type?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'small' | 'medium'
  text: string
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'small'
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $wh-border-radius-sm;
  padding: 4rpx 12rpx;

  &.small {
    .tag-text {
      font-size: $wh-font-size-xs;
    }
  }

  &.medium {
    padding: 6rpx 16rpx;
    .tag-text {
      font-size: $wh-font-size-sm;
    }
  }

  .tag-text {
    font-weight: $wh-font-weight-medium;
  }

  &.success {
    color: $wh-color-success;
    background-color: $wh-color-success-light;
  }

  &.warning {
    color: $wh-color-warning;
    background-color: $wh-color-warning-light;
  }

  &.danger {
    color: $wh-color-danger;
    background-color: $wh-color-danger-light;
  }

  &.info {
    color: $wh-color-info;
    background-color: $wh-color-info-light;
  }

  &.default {
    color: $wh-text-color-tertiary;
    background-color: $wh-bg-color-hover;
  }
}
</style>
