/**
 * 客户测试数据 Mock
 * 符合 wh_customers 数据库 schema
 */

export const mockNormalCustomer = {
  _id: 'customer_001',
  tenant_id: 'tenant_001',
  user_uid: 'user_001',
  name: '张三',
  mobile: '13800138001',
  total_debt: 5000, // 当前欠款 50.00元
  credit_limit: 10000, // 信用额度 100.00元
  address: '某某村1组',
  remark: '',
  create_time: new Date('2024-01-10').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockZeroDebtCustomer = {
  _id: 'customer_002',
  tenant_id: 'tenant_001',
  user_uid: 'user_002',
  name: '李四',
  mobile: '13800138002',
  total_debt: 0, // 无欠款
  credit_limit: 5000, // 信用额度 50.00元
  address: '某某村2组',
  remark: '信用良好',
  create_time: new Date('2024-01-12').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockOverLimitCustomer = {
  _id: 'customer_003',
  tenant_id: 'tenant_001',
  user_uid: 'user_003',
  name: '王五',
  mobile: '13800138003',
  total_debt: 15000, // 当前欠款 150.00元
  credit_limit: 10000, // 信用额度 100.00元（已超限）
  address: '某某村3组',
  remark: '需要注意',
  create_time: new Date('2024-01-08').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockHighCreditCustomer = {
  _id: 'customer_004',
  tenant_id: 'tenant_001',
  user_uid: 'user_004',
  name: '赵六',
  mobile: '13800138004',
  total_debt: 0,
  credit_limit: 50000, // 高信用额度 500.00元
  address: '某某村4组',
  remark: 'VIP客户',
  create_time: new Date('2024-01-05').getTime(),
  update_time: new Date('2024-01-15').getTime()
}

export const mockCustomersList = [
  mockNormalCustomer,
  mockZeroDebtCustomer,
  mockOverLimitCustomer,
  mockHighCreditCustomer
]

// 获取有欠款的客户
export function getMockCustomersWithDebt() {
  return mockCustomersList.filter(c => c.total_debt > 0)
}

// 获取超限客户
export function getMockOverLimitCustomers() {
  return mockCustomersList.filter(c => c.total_debt > c.credit_limit)
}

// 根据ID查找客户
export function getMockCustomerById(id: string) {
  return mockCustomersList.find(c => c._id === id)
}

// 根据手机号查找客户
export function getMockCustomerByMobile(mobile: string) {
  return mockCustomersList.find(c => c.mobile === mobile)
}

// 重置客户 Mock 数据
export function resetMockCustomers() {
  // 在实际测试中，这里可以重置任何修改过的状态
}
