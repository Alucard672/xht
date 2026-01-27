/**
 * 商品测试数据 Mock
 * 符合 wh_goods 数据库 schema
 */

export const mockSingleUnitGoods = {
  _id: 'goods_single_001',
  tenant_id: 'tenant_001',
  name: '可口可乐',
  barcode: '6901234567890',
  category_id: 'cat_001',
  is_multi_unit: false,
  unit_small: {
    name: '瓶',
    price: 300 // 3.00元
  },
  stock: 100,
  cost_price: 200, // 2.00元
  is_on_sale: true,
  sort: 1,
  create_time: new Date('2024-01-15').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockMultiUnitGoods = {
  _id: 'goods_multi_001',
  tenant_id: 'tenant_001',
  name: '百事可乐',
  barcode: '6901234567891',
  category_id: 'cat_001',
  is_multi_unit: true,
  unit_big: {
    name: '箱',
    price: 7200 // 72.00元
  },
  unit_small: {
    name: '瓶',
    price: 300 // 3.00元
  },
  rate: 24, // 1箱 = 24瓶
  stock: 240, // 10箱 = 240瓶
  cost_price: 200, // 2.00元
  is_on_sale: true,
  sort: 2,
  create_time: new Date('2024-01-15').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockOutOfStockGoods = {
  _id: 'goods_out_001',
  tenant_id: 'tenant_001',
  name: '雪碧',
  barcode: '6901234567892',
  category_id: 'cat_001',
  is_multi_unit: false,
  unit_small: {
    name: '瓶',
    price: 300 // 3.00元
  },
  stock: 0,
  cost_price: 200, // 2.00元
  is_on_sale: true,
  sort: 3,
  create_time: new Date('2024-01-15').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockOffSaleGoods = {
  _id: 'goods_off_001',
  tenant_id: 'tenant_001',
  name: '芬达',
  barcode: '6901234567893',
  category_id: 'cat_001',
  is_multi_unit: false,
  unit_small: {
    name: '瓶',
    price: 300 // 3.00元
  },
  stock: 50,
  cost_price: 200, // 2.00元
  is_on_sale: false,
  sort: 4,
  create_time: new Date('2024-01-15').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockGoodsList = [
  mockSingleUnitGoods,
  mockMultiUnitGoods,
  mockOutOfStockGoods,
  mockOffSaleGoods
]

// 获取可售商品列表
export function getMockOnSaleGoods() {
  return mockGoodsList.filter(g => g.is_on_sale)
}

// 根据ID查找商品
export function getMockGoodsById(id: string) {
  return mockGoodsList.find(g => g._id === id)
}

// 重置商品 Mock 数据
export function resetMockGoods() {
  // 在实际测试中，这里可以重置任何修改过的状态
}
