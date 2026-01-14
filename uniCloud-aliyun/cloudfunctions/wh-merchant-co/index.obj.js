const uniID = require('uni-id-common')

module.exports = {
  _before: function () {
    this.uniID = uniID.createInstance({
      clientInfo: this.getClientInfo()
    })
  },
  /**
   * 商家入驻
   * @param {String} shopName 店铺名称
   */
  async onboard(shopName) {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const uid = auth.uid
    const db = uniCloud.database()

    // 1. 检查是否已经入驻
    const userRecord = await db.collection('uni-id-users').doc(uid).get()
    if (userRecord.data[0] && userRecord.data[0].tenant_id) {
      return {
        code: 0,
        msg: '您已拥有店铺',
        tenant_id: userRecord.data[0].tenant_id
      }
    }

    // 2. 创建租户
    const tenantRes = await db.collection('wh_tenants').add({
      name: shopName,
      owner_uid: uid,
      expired_at: Date.now() + 30 * 24 * 3600 * 1000, // 默认30天试用
      settings: {
        allow_credit: true,
        min_delivery_amount: 0
      }
    })

    const tenant_id = tenantRes.id

    // 3. 更新用户 tenant_id
    await db
      .collection('uni-id-users')
      .doc(uid)
      .update({
        tenant_id: tenant_id,
        role: ['merchant']
      })

    return {
      code: 0,
      msg: '入驻成功',
      tenant_id
    }
  },

  /**
   * 开发阶段免密登录
   * @param {String} mobile 手机号
   */
  async devLogin(mobile) {
    const db = uniCloud.database()
    // 1. 查找或创建用户
    let userRes = await db.collection('uni-id-users').where({ mobile }).get()
    let uid
    let userInfo

    if (userRes.data.length === 0) {
      // uni-id-common 不提供 addUser，这里直接写 uni-id-users（仅开发期免密登录用）
      const role = mobile === '13003629527' ? ['admin'] : ['merchant']
      const now = Date.now()
      const addRes = await db.collection('uni-id-users').add({
        mobile,
        role,
        status: 0,
        nickname: '用户' + String(mobile).slice(-4),
        register_date: now,
        last_login_date: now
      })
      uid = addRes.id
      userInfo = { mobile, _id: uid, role }
    } else {
      uid = userRes.data[0]._id
      userInfo = userRes.data[0]
    }

    // 2. 生成 Token
    const tokenRes = await this.uniID.createToken({
      uid,
      role: userInfo.role || (mobile === '13003629527' ? ['admin'] : ['merchant'])
    })

    return {
      code: 0,
      msg: '登录成功',
      token: tokenRes.token,
      tokenExpired: tokenRes.tokenExpired,
      userInfo: {
        _id: uid,
        mobile: userInfo.mobile,
        tenant_id: userInfo.tenant_id || '',
        nickname: userInfo.nickname || '用户' + mobile.substring(7)
      }
    }
  },

  /**
   * 客户还款处理
   * @param {Object} params { customer_id, amount, remark }
   */
  async repay({ customer_id, amount, remark }) {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const dbCmd = db.command
    const transaction = await db.startTransaction()

    try {
      // 1. 获取客户当前状态
      const customerRes = await transaction.collection('wh_customers').doc(customer_id).get()
      const customer = customerRes.data[0]
      if (!customer) throw new Error('客户不存在')

      // 2. 更新总欠款 (减去还款金额)
      await transaction
        .collection('wh_customers')
        .doc(customer_id)
        .update({
          total_debt: dbCmd.inc(-amount)
        })

      // 3. 记录流水
      await transaction.collection('wh_debt_logs').add({
        tenant_id: customer.tenant_id,
        customer_id,
        amount: -amount, // 负数代表欠款减少
        type: 'repayment',
        source: 'manual',
        remark: remark || '客户还款',
        create_time: Date.now()
      })

      await transaction.commit()
      return { code: 0, msg: '还款成功' }
    } catch (e) {
      await transaction.rollback()
      return { code: 500, msg: e.message }
    }
  },

  /**
   * 获取商户工作台统计
   */
  async getDashboardStats() {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '未入驻商户' }

    // 1. 今日订单 & 销售额 (此处为演示，简化逻辑)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const todayOrders = await db
      .collection('wh_orders')
      .where({
        tenant_id,
        create_time: db.command.gte(todayStart)
      })
      .get()

    const stats = {
      todayOrderCount: todayOrders.data.length,
      todayRevenue: todayOrders.data.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      pendingOrderCount: (
        await db.collection('wh_orders').where({ tenant_id, status: 'pending' }).count()
      ).total,
      unsettledOrderCount: (
        await db.collection('wh_orders').where({ tenant_id, payment_status: 'unpaid' }).count()
      ).total
    }

    // 2. 待处理订单
    const pendingOrders = await db
      .collection('wh_orders')
      .where({ tenant_id, status: db.command.in(['pending', 'confirmed']) })
      .orderBy('create_time', 'desc')
      .limit(3)
      .get()

    // 3. 库存预警
    const stockAlerts = await db
      .collection('wh_goods')
      .where({
        tenant_id,
        stock: db.command.lte(10) // 假设小于10为预警
      })
      .limit(3)
      .get()

    return {
      code: 0,
      data: {
        stats,
        pendingOrders: pendingOrders.data,
        stockAlerts: stockAlerts.data
      }
    }
  },

  /**
   * 获取店铺基础设置
   */
  async getTenantInfo() {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '未绑定店铺' }

    const tenantRes = await db.collection('wh_tenants').doc(tenant_id).get()
    if (!tenantRes.data[0]) return { code: 404, msg: '店铺不存在' }

    return {
      code: 0,
      data: tenantRes.data[0]
    }
  },

  /**
   * 更新店铺基础设置
   * @param {Object} data { name, logo_url, phone, settings }
   */
  async updateTenantInfo(data) {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '无权修改' }

    // 过滤允许修改的字段，防止意外覆盖敏感字段
    const allowedData = {}
    if (data.name) allowedData.name = data.name
    if (data.logo_url) allowedData.logo_url = data.logo_url
    if (data.phone) allowedData.phone = data.phone
    if (data.settings) allowedData.settings = data.settings

    await db.collection('wh_tenants').doc(tenant_id).update(allowedData)

    return {
      code: 0,
      msg: '更新成功'
    }
  }
}
