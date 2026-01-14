<template>
  <view class="wh-empty-state">
    <image v-if="icon" :src="icon" class="empty-icon" mode="aspectFit"></image>
    <u-empty v-else mode="list" :text="text"></u-empty>
    <view v-if="text && icon" class="empty-text">{{ text }}</view>
    <view v-if="$slots.default" class="empty-action">
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  text?: string
}

withDefaults(defineProps<Props>(), {
  icon: '',
  text: '暂无数据'
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-empty-state {
  @include flex-column;
  @include flex-center;
  padding: $wh-spacing-xxl $wh-spacing-lg;
  min-height: 400rpx;

  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: $wh-spacing-md;
    opacity: 0.6;
  }

  .empty-text {
    @include text-secondary;
    margin-bottom: $wh-spacing-lg;
  }

  .empty-action {
    margin-top: $wh-spacing-md;
  }
}
</style>
