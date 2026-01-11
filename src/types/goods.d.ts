export interface Goods {
  _id: string
  tenant_id: string
  name: string
  category_id?: string
  img_url?: string
  is_multi_unit: boolean
  unit_big: {
    name: string
    price: number // 分
  }
  unit_small: {
    name: string
    price: number // 分
  }
  rate: number
  stock: number // 最小单位
  is_on_sale: boolean
}

export interface Category {
  _id: string
  tenant_id: string
  name: string
  sort: number
}

export interface GoodsListParams {
  category_id?: string
  keyword?: string
  page?: number
  limit?: number
  on_sale_only?: boolean
}

export interface GoodsFormData {
  name: string
  category_id?: string
  img_url?: string
  is_multi_unit: boolean
  unit_small: {
    name: string
    price: number
  }
  unit_big?: {
    name: string
    price: number
  }
  rate: number
  stock: number
}
