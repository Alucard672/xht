<template>
  <view class="wh-fab-button" :class="[position]" @click="handleClick">
    <slot>
      <u-icon :name="icon" color="#fff" :size="iconSize"></u-icon>
    </slot>
  </view>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  iconSize?: number
  position?: 'bottom-right' | 'bottom-left'
}

interface Emits {
  (e: 'click'): void
}

withDefaults(defineProps<Props>(), {
  icon: 'plus',
  iconSize: 24,
  position: 'bottom-right'
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-fab-button {
  position: fixed;
  width: 100rpx;
  height: 100rpx;
  background-color: $wh-color-primary;
  border-radius: $wh-border-radius-circle;
  @include flex-center;
  box-shadow: 0 10rpx 20rpx rgba(7, 193, 96, 0.3);
  z-index: $wh-z-index-overlay;
  transition: transform $wh-transition-fast $wh-easing-base;

  &:active {
    transform: scale(0.95);
  }

  &.bottom-right {
    right: 40rpx;
    // 避开 tabbar + 适配底部安全区（不要给按钮本身加 padding，否则会变形）
    bottom: 200rpx;
    bottom: calc(200rpx + constant(safe-area-inset-bottom));
    bottom: calc(200rpx + env(safe-area-inset-bottom));
  }

  &.bottom-left {
    left: 40rpx;
    bottom: 200rpx;
    bottom: calc(200rpx + constant(safe-area-inset-bottom));
    bottom: calc(200rpx + env(safe-area-inset-bottom));
  }
}
</style>
