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
      const customerRes = await transaction.collection('wh_customers').doc(customer_id).get()
      const customer = customerRes.data[0]
      if (!customer) throw new Error('客户不存在')

      await transaction
        .collection('wh_customers')
        .doc(customer_id)
        .update({
          total_debt: dbCmd.inc(-amount)
        })

      await transaction.collection('wh_debt_logs').add({
        tenant_id: customer.tenant_id,
        customer_id,
        amount: -amount,
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

    const pendingOrders = await db
      .collection('wh_orders')
      .where({ tenant_id, status: db.command.in(['pending', 'confirmed']) })
      .orderBy('create_time', 'desc')
      .limit(3)
      .get()

    const stockAlerts = await db
      .collection('wh_goods')
      .where({
        tenant_id,
        stock: db.command.lte(10)
      })
      .limit(3)
      .get()

    const tenantRes = await db.collection('wh_tenants').doc(tenant_id).get()
    const tenantInfo = tenantRes.data[0] || {}

    return {
      code: 0,
      data: {
        stats,
        pendingOrders: pendingOrders.data,
        stockAlerts: stockAlerts.data,
        tenantName: tenantInfo.name || '我的店铺'
      }
    }
  },

  /**
   * 获取店铺基础设置 (支持 C 端通过 tenant_id 获取)
   * @param {String} tenant_id 可选，传入则获取对应店铺信息
   */
  async getTenantInfo(params = {}) {
    let { tenantId } = params
    const db = uniCloud.database()

    if (!tenantId) {
      let token = this.getUniIdToken()
      if (typeof token === 'object' && token.token) token = token.token
      const auth = await this.uniID.checkToken(token)
      if (auth.code !== 0) return auth

      const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
      tenantId = userRes.data[0].tenant_id
    }

    if (!tenantId) return { code: 403, msg: '未指定店铺' }

    const tenantRes = await db.collection('wh_tenants').doc(tenantId).get()
    if (!tenantRes.data[0]) return { code: 404, msg: '店铺不存在' }

    const data = tenantRes.data[0]
    return {
      code: 0,
      data: {
        _id: data._id,
        name: data.name,
        logo_url: data.logo_url,
        phone: data.phone,
        settings: data.settings || {}
      }
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
  },

  /**
   * 生成店铺二维码
   * @returns {Object}
   */
  async generateShopCode() {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '未入驻商户' }

    const tenantRes = await db.collection('wh_tenants').doc(tenant_id).get()
    const tenant = tenantRes.data[0]
    if (!tenant) return { code: 404, msg: '店铺不存在' }

    // 检查是否已有有效的二维码
    const existRes = await db
      .collection('wh_shop_codes')
      .where({ tenant_id, is_active: true })
      .get()

    if (existRes.data.length > 0) {
      // 返回已有的二维码
      return {
        code: 0,
        data: {
          code: existRes.data[0].code,
          qr_url: existRes.data[0].qr_url
        }
      }
    }

    // 生成新的店铺码
    const codeData = {
      tenant_id: tenant_id,
      timestamp: Date.now()
    }
    const code = Buffer.from(JSON.stringify(codeData)).toString('base64')

    // 生成二维码图片 URL (使用 uni-app 的二维码生成 API)
    // 这里使用前端组件生成二维码图片
    const qr_url = `/api/qrcode?content=${encodeURIComponent(code)}`

    // 保存到数据库
    await db.collection('wh_shop_codes').add({
      tenant_id,
      code,
      qr_url,
      is_active: true,
      scan_count: 0,
      created_at: Date.now()
    })

    return {
      code: 0,
      data: {
        code,
        qr_url
      }
    }
  },

  /**
   * 获取店铺二维码信息
   * @returns {Object}
   */
  async getShopCode() {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '未入驻商户' }

    const res = await db.collection('wh_shop_codes').where({ tenant_id, is_active: true }).get()

    if (res.data.length === 0) {
      return { code: 404, message: '暂二维码' }
    }

    return {
      code: 0,
      data: res.data[0]
    }
  },

  /**
   * 停用店铺二维码
   * @returns {Object}
   */
  async deactivateShopCode() {
    let token = this.getUniIdToken()
    if (typeof token === 'object' && token.token) token = token.token
    const auth = await this.uniID.checkToken(token)
    if (auth.code !== 0) return auth

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(auth.uid).get()
    const tenant_id = userRes.data[0].tenant_id

    if (!tenant_id) return { code: 403, msg: '未入驻商户' }

    await db
      .collection('wh_shop_codes')
      .where({ tenant_id, is_active: true })
      .update({ is_active: false })

    return {
      code: 0,
      message: '已停用'
    }
  }
}
