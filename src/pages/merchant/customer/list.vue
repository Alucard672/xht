<template>
  <wh-page-container>
    <wh-filter-bar
      v-model="keyword"
      placeholder="搜索姓名或手机号"
      @change="onSearch"
      @clear="onSearch"
    ></wh-filter-bar>

    <view class="list-content">
      <u-list @scrolltolower="loadMore">
        <u-list-item v-for="item in list" :key="item._id">
          <wh-customer-card :customer="item" @click="handleCustomerClick"></wh-customer-card>
        </u-list-item>
      </u-list>

      <u-loadmore :status="loadStatus" @loadmore="loadMore" />
      <wh-empty-state
        v-if="list.length === 0 && !loading"
        icon="/static/empty/list.png"
        text="暂无客户"
      >
        <u-button
          type="primary"
          text="去添加客户"
          @click="navTo('/pages/merchant/customer/edit')"
        ></u-button>
      </wh-empty-state>
    </view>

    <wh-fab-button @click="navTo('/pages/merchant/customer/edit')"></wh-fab-button>
  </wh-page-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'
import { merchantRouteGuard } from '@/utils/routeGuard'
import WhPageContainer from '@/components/wh/PageContainer.vue'
import WhFilterBar from '@/components/wh/FilterBar.vue'
import WhEmptyState from '@/components/wh/EmptyState.vue'
import WhCustomerCard from '@/components/wh/CustomerCard.vue'
import WhFabButton from '@/components/wh/FabButton.vue'

const customerCo = importObject('wh-customer-co')
const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const loadStatus = ref('loadmore')
const isPicker = ref(false)

let lastLoadTime = 0
const loadData = async (reset = false) => {
  if (loading.value) return

  const now = Date.now()
  // 节流逻辑：非强制重置 且 5分钟内加载过，则直接跳过
  if (!reset && lastLoadTime && now - lastLoadTime < 300000) {
    return
  }

  if (reset) {
    page.value = 1
    list.value = []
    loadStatus.value = 'loadmore'
  }

  loading.value = true
  try {
    const res = await customerCo.getCustomerList({
      page: page.value,
      limit: 20,
      keyword: keyword.value
    })

    if (res.code === 0) {
      const newList = res.data.list
      list.value = [...list.value, ...newList]
      if (list.value.length >= res.data.total) {
        loadStatus.value = 'nomore'
      } else {
        loadStatus.value = 'loadmore'
        page.value++
      }
      lastLoadTime = now
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onSearch = (value?: string) => {
  if (value !== undefined) {
    keyword.value = value
  }
  loadData(true)
}

const loadMore = () => {
  if (loadStatus.value === 'loadmore') {
    loadData()
  }
}

const handleCustomerClick = (customer: any) => {
  if (isPicker.value) {
    uni.$emit('select-customer', customer)
    uni.navigateBack()
    return
  }
  uni.navigateTo({ url: `/pages/merchant/customer/detail?id=${customer._id}` })
}

const navTo = (url: string) => {
  uni.navigateTo({ url })
}

onShow(() => {
  if (!merchantRouteGuard('/pages/merchant/customer/list')) return
  loadData(true)
})

onLoad((options: any) => {
  if (options.mode === 'picker') {
    isPicker.value = true
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';

.list-content {
  padding: $wh-spacing-sm $wh-spacing-md;
}
</style>
