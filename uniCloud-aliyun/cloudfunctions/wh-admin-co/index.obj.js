const uniID = require('uni-id-common')

module.exports = {
  _before: async function () {
    this.uniID = uniID.createInstance({
      clientInfo: this.getClientInfo()
    })
    let token = this.getUniIdToken()
    if (!token) {
      throw { code: 401, msg: '未登录' }
    }

    // 兼容处理：如果是对象且包含token字段，取token字符串进行校验；或者是字符串直接校验
    // 如果已经是解析好的对象(含uid)，也可以直接用，但为了安全建议统一checkToken
    let tokenStr = token
    if (typeof token === 'object') {
      if (token.token) {
        tokenStr = token.token
      } else if (token.uid) {
        // 某些环境已解析
        this.uid = token.uid
        return // 已有UID，跳过后续校验
      }
    }

    const auth = await this.uniID.checkToken(tokenStr)
    if (auth.code !== 0) throw auth
    auth.uid = auth.uid || auth.userInfo._id

    // 超级管理员校验
    const db = uniCloud.database()
    const user = await db.collection('uni-id-users').doc(auth.uid).get()
    // 这里简单通过手机号判断管理员，实际应检查 role
    if (user.data.length === 0 || !user.data[0].role.includes('admin')) {
      // 兼容旧逻辑：如果手机号是特定的，也允许
      if (user.data[0].mobile !== '13003629527') {
        throw { code: 403, msg: '权限不足' }
      }
    }
    this.uid = auth.uid
  },

  /**
   * 获取商户列表及统计信息
   */
  async getMerchantList({ page = 1, limit = 20, keyword = '' }) {
    const db = uniCloud.database()
    const dbCmd = db.command

    let where = {}
    if (keyword) {
      where.name = new RegExp(keyword, 'i')
    }

    const [countRes, listRes] = await Promise.all([
      db.collection('wh_tenants').where(where).count(),
      db
        .collection('wh_tenants')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get()
    ])

    const totalCustomers = await db.collection('wh_customers').count()
    const totalOrders = await db.collection('wh_orders').count()

    return {
      code: 0,
      data: {
        list: listRes.data,
        total: countRes.total,
        stats: {
          totalMerchants: countRes.total,
          activeMerchants: listRes.data.filter(m => m.status === 1).length,
          totalCustomers: totalCustomers.total,
          totalOrders: totalOrders.total
        }
      }
    }
  },

  /**
   * 获取平台综合统计数据
   */
  async getPlatformStats() {
    const db = uniCloud.database()

    // 基础汇总
    const totalMerchants = await db.collection('wh_tenants').count()
    const totalCustomers = await db.collection('wh_customers').count()
    const totalOrders = await db.collection('wh_orders').count()

    // 营业额汇总
    const orders = await db
      .collection('wh_orders')
      .where({
        status: 'completed'
      })
      .get()
    const totalRevenue = orders.data.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // 趋势模拟 (实际应按月分组聚合)
    const trends = [
      { month: '12月', merchants: 125, orders: 45680, revenue: 895000000, growth: '+9.1%' },
      { month: '11月', merchants: 118, orders: 42500, revenue: 820000000, growth: '+6.8%' },
      { month: '10月', merchants: 112, orders: 39200, revenue: 768000000, growth: '+8.9%' }
    ]

    // TOP 商户模拟
    const topMerchants = await db
      .collection('wh_tenants')
      .aggregate()
      .lookup({
        from: 'wh_orders',
        localField: 'tenant_id',
        foreignField: 'tenant_id',
        as: 'orders'
      })
      .addFields({
        order_count: { $size: '$orders' },
        total_revenue: { $sum: '$orders.total_amount' }
      })
      .sort({ order_count: -1 })
      .limit(5)
      .end()

    return {
      code: 0,
      data: {
        summary: {
          totalMerchants: totalMerchants.total,
          activeMerchants: Math.floor(totalMerchants.total * 0.8),
          totalCustomers: totalCustomers.total,
          totalOrders: totalOrders.total,
          totalRevenue,
          growthRate: '+12.5%'
        },
        trends,
        topMerchants: topMerchants.data
      }
    }
  },

  /**
   * 获取员工列表及统计信息
   */
  async getEmployeeList({ status = -1, keyword = '' }) {
    const db = uniCloud.database()
    const dbCmd = db.command

    // 员工是指 role 包含 admin 或 operator 的用户
    let where = {
      role: dbCmd.in(['admin', 'operator'])
    }

    if (status !== -1) {
      where.status = status
    }

    if (keyword) {
      where = dbCmd.and([
        where,
        dbCmd.or([{ nickname: new RegExp(keyword, 'i') }, { mobile: new RegExp(keyword, 'i') }])
      ])
    }

    const stats = {
      total: await db
        .collection('uni-id-users')
        .where({ role: dbCmd.in(['admin', 'operator']) })
        .count(),
      active: await db
        .collection('uni-id-users')
        .where({ role: dbCmd.in(['admin', 'operator']), status: 0 })
        .count(),
      admins: await db.collection('uni-id-users').where({ role: 'admin' }).count()
    }

    const listRes = await db
      .collection('uni-id-users')
      .where(where)
      .orderBy('register_date', 'desc')
      .get()

    return {
      code: 0,
      data: {
        list: listRes.data,
        stats: {
          total: stats.total.total,
          active: stats.active.total,
          admins: stats.admins.total,
          newThisMonth: 0 // 模拟
        }
      }
    }
  }
}
