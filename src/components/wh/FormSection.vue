<template>
  <view class="wh-form-section">
    <view v-if="title || extra" class="section-header">
      <view class="title-group">
        <text v-if="title" class="title">{{ title }}</text>
        <text v-if="desc" class="desc">{{ desc }}</text>
      </view>
      <view v-if="$slots.extra" class="extra">
        <slot name="extra"></slot>
      </view>
    </view>
    <view class="section-body">
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  desc?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  desc: ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-form-section {
  @include card-base;
  padding: $wh-spacing-lg;
  margin-bottom: $wh-spacing-md;

  .section-header {
    @include flex-between;
    margin-bottom: $wh-spacing-md;

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .title {
        @include text-title;
        font-size: $wh-font-size-lg;
      }
      .desc {
        @include text-tertiary;
        font-size: $wh-font-size-sm;
      }
    }

    .extra {
      flex-shrink: 0;
    }
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: $wh-spacing-sm;
  }
}
</style>
