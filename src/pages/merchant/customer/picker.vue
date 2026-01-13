<template>
  <view class="customer-list-container">
    <view class="search-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索姓名或手机号"
        :show-action="false"
        @change="onSearch"
        @clear="onSearch"
      ></u-search>
    </view>

    <view class="list-content">
      <u-list @scrolltolower="loadMore">
        <u-list-item v-for="item in list" :key="item._id">
          <view class="customer-item card-box" hover-class="item-hover" @click="selectItem(item)">
            <view class="left">
              <view class="name-row">
                <text class="name">{{ item.alias }}</text>
                <text v-if="item.phone" class="phone">{{ item.phone }}</text>
              </view>
              <view class="time-row">
                <text class="time"
                  >最后交易：{{
                    item.last_trade_time ? formatDate(item.last_trade_time) : '无'
                  }}</text
                >
              </view>
            </view>
            <view class="right">
              <view class="debt-box" :class="{ 'has-debt': item.total_debt > 0 }">
                <text class="label">欠款</text>
                <text class="amount">¥{{ (item.total_debt / 100).toFixed(2) }}</text>
              </view>
              <u-icon name="arrow-right" color="#ccc" size="16"></u-icon>
            </view>
          </view>
        </u-list-item>
      </u-list>

      <u-loadmore :status="loadStatus" @loadmore="loadMore" />
      <u-empty
        v-if="list.length === 0 && !loading"
        mode="list"
        icon="/static/empty/list.png"
        text="暂无客户"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { importObject } from '@/utils/cloud'

const customerCo = importObject('wh-customer-co')
const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const loadStatus = ref('loadmore')

const loadData = async (reset = false) => {
  if (loading.value) return
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
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  loadData(true)
}

const loadMore = () => {
  if (loadStatus.value === 'loadmore') {
    loadData()
  }
}

const selectItem = (item: any) => {
  uni.$emit('select-customer', item)
  uni.navigateBack()
}

const formatDate = (ts: any) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
}

onLoad(() => {
  loadData(true)
})
</script>

<style lang="scss" scoped>
.customer-list-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx 0 env(safe-area-inset-bottom);
}

.search-bar {
  padding: 20rpx 30rpx;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.customer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  margin: 10rpx 20rpx;
  background-color: #fff;
  border-radius: 16rpx;

  .name-row {
    margin-bottom: 10rpx;
    .name {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-right: 20rpx;
    }
    .phone {
      font-size: 26rpx;
      color: #999;
    }
  }

  .time-row {
    .time {
      font-size: 24rpx;
      color: #ccc;
    }
  }

  .right {
    display: flex;
    align-items: center;
    gap: 20rpx;

    .debt-box {
      text-align: right;
      display: flex;
      flex-direction: column;

      .label {
        font-size: 22rpx;
        color: #999;
      }
      .amount {
        font-size: 30rpx;
        color: #666;
      }

      &.has-debt {
        .amount {
          color: #ff4d4f;
          font-weight: bold;
        }
      }
    }
  }
}

.card-box {
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}
</style>
