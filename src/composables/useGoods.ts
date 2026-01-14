import { ref } from 'vue'
import type { Goods, GoodsListParams } from '@/types/goods'

export function useGoods() {
  const goodsList = ref<Goods[]>([])
  const loading = ref(false)
  const total = ref(0)

  const goodsCo = uniCloud.importObject('wh-goods-co')

  /**
   * 获取商品列表
   */
  const fetchGoodsList = async (params: GoodsListParams = {}) => {
    loading.value = true
    try {
      const res = await goodsCo.getGoodsList(params)
      if (res.code === 0) {
        let list = res.data.list
        // 前端过滤低库存
        if (params.showLowStock) {
          const LOW_THRESHOLD = 10
          list = list.filter((item: any) => item.stock > 0 && item.stock <= LOW_THRESHOLD)
        }
        goodsList.value = list
        total.value = res.data.total
        return true
      } else {
        uni.showToast({ title: res.msg || '获取失败', icon: 'none' })
        return false
      }
    } catch (e: any) {
      uni.showToast({ title: e.message || '网络错误', icon: 'none' })
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索商品
   */
  const searchGoods = async (keyword: string) => {
    return fetchGoodsList({ keyword, page: 1 })
  }

  /**
   * 按分类筛选
   */
  const filterByCategory = async (category_id: string) => {
    return fetchGoodsList({ category_id, page: 1 })
  }

  /**
   * 上下架切换
   */
  const toggleOnSale = async (goods_id: string, is_on_sale: boolean) => {
    try {
      const res = await goodsCo.toggleOnSale(goods_id, is_on_sale)
      if (res.code === 0) {
        uni.showToast({ title: res.msg, icon: 'success' })
        return true
      } else {
        uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
        return false
      }
    } catch (e: any) {
      uni.showToast({ title: e.message || '网络错误', icon: 'none' })
      return false
    }
  }

  /**
   * 删除商品
   */
  const deleteGoods = async (goods_id: string) => {
    try {
      const res = await goodsCo.deleteGoods(goods_id)
      if (res.code === 0) {
        uni.showToast({ title: res.msg, icon: 'success' })
        return true
      } else {
        uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
        return false
      }
    } catch (e: any) {
      uni.showToast({ title: e.message || '网络错误', icon: 'none' })
      return false
    }
  }

  return {
    goodsList,
    loading,
    total,
    fetchGoodsList,
    searchGoods,
    filterByCategory,
    toggleOnSale,
    deleteGoods
  }
}
