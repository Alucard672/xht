/**
 * 订单测试数据 Mock
 * 符合 wh_orders 数据库 schema
 */

export const mockPendingCreditOrder = {
  _id: 'order_001',
  tenant_id: 'tenant_001',
  customer_id: 'customer_001',
  order_no: 'ORD1705789012345',
  order_type: 'customer', // 客户下单
  items: [
    {
      goods_id: 'goods_multi_001',
      goods_name: '百事可乐',
      is_multi_unit: true,
      big_qty: 2,
      small_qty: 5,
      rate: 24,
      unit_small: { name: '瓶', price: 300 },
      subtotal: 5300 // (2*24 + 5) * 300 = 53瓶 * 300 = 15900分
    }
  ],
  total_amount: 5300, // 53.00元
  payment_method: 'credit', // 赊账
  status: 0, // 待处理
  remark: '请尽快送达',
  create_time: new Date('2024-01-20T10:30:00').getTime(),
  update_time: new Date('2024-01-20T10:30:00').getTime()
}

export const mockCompletedWechatOrder = {
  _id: 'order_002',
  tenant_id: 'tenant_001',
  customer_id: 'customer_002',
  order_no: 'ORD1705789023456',
  order_type: 'customer', // 客户下单
  items: [
    {
      goods_id: 'goods_single_001',
      goods_name: '可口可乐',
      is_multi_unit: false,
      small_qty: 10,
      unit_small: { name: '瓶', price: 300 },
      subtotal: 3000 // 10瓶 * 300 = 3000分
    }
  ],
  total_amount: 3000, // 30.00元
  payment_method: 'wechat', // 微信支付
  status: 1, // 已完成
  remark: '',
  create_time: new Date('2024-01-19T14:20:00').getTime(),
  update_time: new Date('2024-01-19T14:25:00').getTime()
}

export const mockAgentOrder = {
  _id: 'order_003',
  tenant_id: 'tenant_001',
  customer_id: 'customer_001',
  order_no: 'ORD1705789034567',
  order_type: 'agent', // 代下单
  items: [
    {
      goods_id: 'goods_multi_001',
      goods_name: '百事可乐',
      is_multi_unit: true,
      big_qty: 1,
      small_qty: 0,
      rate: 24,
      unit_small: { name: '瓶', price: 300 },
      subtotal: 7200 // 1箱 * 7200 = 7200分
    }
  ],
  total_amount: 7200, // 72.00元
  payment_method: 'credit', // 赊账
  status: 1, // 已完成
  remark: '代客下单',
  create_time: new Date('2024-01-18T09:15:00').getTime(),
  update_time: new Date('2024-01-18T09:20:00').getTime()
}

export const mockCancelledOrder = {
  _id: 'order_004',
  tenant_id: 'tenant_001',
  customer_id: 'customer_003',
  order_no: 'ORD1705789045678',
  order_type: 'customer',
  items: [],
  total_amount: 0,
  payment_method: 'credit',
  status: -1, // 已取消
  remark: '客户取消',
  create_time: new Date('2024-01-17T16:00:00').getTime(),
  update_time: new Date('2024-01-17T16:30:00').getTime()
}

export const mockOrdersList = [
  mockPendingCreditOrder,
  mockCompletedWechatOrder,
  mockAgentOrder,
  mockCancelledOrder
]

// 获取待处理订单
export function getMockPendingOrders() {
  return mockOrdersList.filter(o => o.status === 0)
}

// 获取已完成订单
export function getMockCompletedOrders() {
  return mockOrdersList.filter(o => o.status === 1)
}

// 获取客户订单
export function getMockOrdersByCustomerId(customerId: string) {
  return mockOrdersList.filter(o => o.customer_id === customerId)
}

// 根据ID查找订单
export function getMockOrderById(id: string) {
  return mockOrdersList.find(o => o._id === id)
}

// 重置订单 Mock 数据
export function resetMockOrders() {
  // 在实际测试中，这里可以重置任何修改过的状态
}

// 计算订单总金额（辅助函数）
export function calculateOrderAmount(items: any[]): number {
  return items.reduce((total, item) => {
    if (item.is_multi_unit) {
      const totalQty = item.big_qty * item.rate + item.small_qty
      return total + totalQty * item.unit_small.price
    } else {
      return total + item.small_qty * item.unit_small.price
    }
  }, 0)
}
