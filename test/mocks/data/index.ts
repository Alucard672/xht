/**
 * 统一 Mock 数据导出
 */

export * from './goods'
export * from './customers'
export * from './orders'

/**
 * 商户 Mock 数据
 */
export const mockTenant = {
  _id: 'tenant_001',
  name: '测试店铺',
  owner_uid: 'user_merchant_001',
  status: 1, // 正常营业
  expired_at: new Date('2025-12-31').getTime(),
  address: '测试地址123号',
  mobile: '13900139000',
  create_time: new Date('2024-01-01').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

/**
 * 用户 Mock 数据
 */
export const mockMerchantUser = {
  _id: 'user_merchant_001',
  username: 'merchant_test',
  mobile: '13900139000',
  nickname: '测试商家',
  role: 'merchant'
}

export const mockCustomerUser = {
  _id: 'user_001',
  username: 'customer_test',
  mobile: '13800138001',
  nickname: '张三',
  role: 'customer'
}

/**
 * 登录 token Mock
 */
export const mockToken = 'mock_test_token_123456'

/**
 * 重置所有 Mock 数据
 */
export function resetAllMockData() {
  // 在实际测试中，这里可以重置任何修改过的状态
  // 目前主要是通过 vi.clearAllMocks() 来清除 mock 调用记录
}
