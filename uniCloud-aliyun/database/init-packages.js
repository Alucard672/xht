/**
 * 初始化默认套餐数据
 * 在uniCloud控制台运行此脚本
 */

const db = uniCloud.database()

exports.main = async () => {
  const now = Date.now()

  // 默认套餐列表
  const defaultPackages = [
    {
      name: '1个月套餐',
      duration_months: 1,
      price: 2900, // 29元
      description: '适合短期试用',
      sort_order: 4,
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      name: '3个月套餐',
      duration_months: 3,
      price: 7900, // 79元
      description: '性价比之选',
      sort_order: 3,
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      name: '6个月套餐',
      duration_months: 6,
      price: 14900, // 149元
      description: '长期使用推荐',
      sort_order: 2,
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      name: '12个月套餐',
      duration_months: 12,
      price: 26900, // 269元
      description: '年度套餐，更优惠',
      sort_order: 1,
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ]

  // 检查是否已有套餐数据
  const existing = await db.collection('wh_renewal_packages').count()

  if (existing.total > 0) {
    return {
      msg: '套餐数据已存在，无需初始化',
      count: existing.total
    }
  }

  // 批量添加套餐
  const results = await Promise.all(
    defaultPackages.map(pkg => db.collection('wh_renewal_packages').add(pkg))
  )

  return {
    msg: '套餐初始化成功',
    count: results.length,
    packages: defaultPackages.map(p => p.name)
  }
}
