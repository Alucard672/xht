<template>
  <view class="wh-filter-bar" :class="{ sticky: sticky }">
    <view class="search-wrapper">
      <u-search
        v-model="searchValue"
        :placeholder="placeholder"
        :show-action="false"
        @search="handleSearch"
        @clear="handleClear"
        @change="handleChange"
      ></u-search>
    </view>
    <view v-if="$slots.action" class="action-wrapper">
      <slot name="action"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  sticky?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
  (e: 'clear'): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索',
  sticky: true
})

const emit = defineEmits<Emits>()

const searchValue = ref(props.modelValue)

// 同步外部传入的值
watch(
  () => props.modelValue,
  newVal => {
    searchValue.value = newVal
  }
)

// 同步内部值到外部
watch(searchValue, newVal => {
  emit('update:modelValue', newVal)
})

const handleSearch = (value: string) => {
  emit('search', value)
}

const handleClear = () => {
  searchValue.value = ''
  emit('clear')
}

const handleChange = (value: string) => {
  emit('change', value)
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.wh-filter-bar {
  display: flex;
  align-items: center;
  gap: $wh-spacing-md;
  padding: $wh-spacing-md;
  background-color: $wh-bg-color-card;
  position: relative;
  z-index: $wh-z-index-sticky;

  &.sticky {
    position: sticky;
    top: 0;
  }

  .search-wrapper {
    flex: 1;
  }

  .action-wrapper {
    flex-shrink: 0;
  }
}
</style>
