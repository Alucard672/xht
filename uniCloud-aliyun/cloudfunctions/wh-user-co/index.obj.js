const uniIdCommon = require('uni-id-common')
const crypto = require('crypto')

/**
 * 密码加密工具
 * @param {String} password
 */
function encryptPassword(password) {
  const hmac = crypto.createHmac('sha256', 'xht-super-secret-key')
  hmac.update(password)
  return hmac.digest('hex')
}

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })

    // 获取当前用户信息
    let token = this.getUniIdToken()
    let uid

    if (!token) {
      // 可选：允许未登录用户调用某些方法
      this.current_uid = null
      return
    }

    if (typeof token === 'string') {
      const checkRes = await this.uniIdCommon.checkToken(token)
      if (checkRes.code !== 0) {
        this.current_uid = null
        return
      }
      uid = checkRes.uid
    } else if (token.uid) {
      uid = token.uid
    } else {
      this.current_uid = null
      return
    }

    this.current_uid = uid
  },

  /**
   * 商家登录
   */
  async loginMerchant(params) {
    const { username, password } = params

    if (!username || !password) {
      throw new Error('用户名和密码不能为空')
    }

    const db = uniCloud.database()

    const userRes = await db.collection('uni-id-users').where({ mobile: username }).get()

    if (userRes.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userRes.data[0]
    const safePassword = encryptPassword(password)
    if (user.password !== safePassword) {
      throw new Error('密码错误')
    }

    const { token, tokenExpired } = await this.uniIdCommon.createToken({
      uid: user._id,
      role: user.role || []
    })

    let tenantInfo = null
    if (user.tenant_id) {
      const tenantRes = await db.collection('wh_tenants').doc(user.tenant_id).get()
      if (tenantRes.data.length > 0) {
        tenantInfo = tenantRes.data[0]
      }
    }

    return {
      code: 0,
      msg: '登录成功',
      token,
      tokenExpired,
      userInfo: {
        _id: user._id,
        username: user.mobile,
        role: user.role || [],
        tenant_id: user.tenant_id
      },
      tenantInfo
    }
  },

  /**
   * 注册商家并创建租户（待审核状态）
   */
  async registerMerchant(params) {
    const { username, password, shopName } = params

    if (!username || !password || !shopName) {
      throw new Error('参数不完整')
    }

    if (!/^1\d{10}$/.test(username)) {
      throw new Error('手机号格式不正确')
    }

    const db = uniCloud.database()
    const now = Date.now()

    const existUser = await db.collection('uni-id-users').where({ mobile: username }).get()

    if (existUser.data.length > 0) {
      throw new Error('该手机号已注册')
    }

    const safePassword = encryptPassword(password)

    // 先创建用户
    const userRes = await db.collection('uni-id-users').add({
      username: username,
      mobile: username,
      password: safePassword,
      role: ['merchant'],
      register_date: now,
      register_ip: this.getClientInfo().clientIP
    })

    if (!userRes.id) {
      throw new Error('注册用户失败')
    }

    const uid = userRes.id

    // 创建租户（待审核状态，暂不关联用户）
    const tenantRes = await db.collection('wh_tenants').add({
      name: shopName,
      owner_uid: uid,
      status: 0, // 待审核
      created_at: now,
      // 不设置 expired_at，等待审核时由管理员设置
      settings: {
        allow_debt: true,
        min_delivery_price: 0
      }
    })

    if (!tenantRes.id) {
      await db.collection('uni-id-users').doc(uid).remove()
      throw new Error('店铺创建失败')
    }

    // 更新用户的 tenant_id
    await db.collection('uni-id-users').doc(uid).update({
      tenant_id: tenantRes.id
    })

    return {
      code: 0,
      msg: '注册成功，请等待管理员审核',
      data: {
        tenant_id: tenantRes.id,
        status: 0 // 待审核
      }
    }
  },

  /**
   * 客户关联商家（扫码进店时调用）
   * @param {Object} params
   * @param {String} params.tenant_id - 商家ID
   */
  async bindTenant(params) {
    const { tenant_id } = params

    if (!tenant_id) {
      return { code: 400, message: '商家ID不能为空' }
    }

    // 检查是否已登录
    if (!this.current_uid) {
      return { code: 401, message: '请先登录' }
    }

    const db = uniCloud.database()
    const now = Date.now()

    // 检查商家是否存在
    const tenantRes = await db.collection('wh_tenants').doc(tenant_id).get()
    if (!tenantRes.data || tenantRes.data.length === 0) {
      return { code: 404, message: '商家不存在' }
    }
    const tenant = tenantRes.data[0]

    // 检查是否已有关联
    const existRes = await db
      .collection('wh_customer_tenants')
      .where({
        user_uid: this.current_uid,
        tenant_id: tenant_id
      })
      .get()

    if (existRes.data.length > 0) {
      // 已有关联，更新访问时间
      await db.collection('wh_customer_tenants').doc(existRes.data[0]._id).update({
        last_visit_at: now
      })

      return {
        code: 0,
        message: '已关联商家',
        data: {
          tenant_id: tenant._id,
          tenant_name: tenant.name
        }
      }
    }

    // 创建新关联
    const res = await db.collection('wh_customer_tenants').add({
      user_uid: this.current_uid,
      tenant_id: tenant_id,
      first_scan_at: now,
      last_visit_at: now,
      total_orders: 0,
      total_spent: 0,
      created_at: now
    })

    // 同时在商家侧创建客户记录
    const customerRes = await db
      .collection('wh_customers')
      .where({
        tenant_id: tenant_id,
        user_uid: this.current_uid
      })
      .get()

    if (customerRes.data.length === 0) {
      await db.collection('wh_customers').add({
        tenant_id: tenant_id,
        user_uid: this.current_uid,
        alias: '客户' + String(this.current_uid).slice(-4),
        total_debt: 0,
        created_at: now
      })
    }

    return {
      code: 0,
      message: '关联成功',
      data: {
        tenant_id: tenant._id,
        tenant_name: tenant.name
      }
    }
  },

  /**
   * 获取客户的商家列表
   * @returns {Object}
   */
  async getMyTenants() {
    if (!this.current_uid) {
      return { code: 401, message: '请先登录' }
    }

    const db = uniCloud.database()

    // 获取客户关联的所有商家
    const relationsRes = await db
      .collection('wh_customer_tenants')
      .where({ user_uid: this.current_uid })
      .orderBy('last_visit_at', 'desc')
      .get()

    if (relationsRes.data.length === 0) {
      return { code: 0, data: { list: [] } }
    }

    // 获取商家详细信息
    const tenantIds = relationsRes.data.map(r => r.tenant_id)
    const tenantsRes = await db
      .collection('wh_tenants')
      .where({
        _id: db.command.in(tenantIds)
      })
      .get()

    // 合并数据
    const tenantMap = {}
    tenantsRes.data.forEach(t => {
      tenantMap[t._id] = t
    })

    const list = relationsRes.data.map(r => ({
      _id: r._id,
      tenant_id: r.tenant_id,
      tenant_name: tenantMap[r.tenant_id]?.name || '未知店铺',
      tenant_logo: tenantMap[r.tenant_id]?.logo_url || '',
      first_scan_at: r.first_scan_at,
      last_visit_at: r.last_visit_at,
      total_orders: r.total_orders,
      total_spent: r.total_spent
    }))

    return {
      code: 0,
      data: { list }
    }
  },

  /**
   * 客户解绑商家
   * @param {Object} params
   * @param {String} params.tenant_id - 商家ID
   */
  async unbindTenant(params) {
    const { tenant_id } = params

    if (!tenant_id) {
      return { code: 400, message: '商家ID不能为空' }
    }

    if (!this.current_uid) {
      return { code: 401, message: '请先登录' }
    }

    const db = uniCloud.database()

    // 删除关联记录
    const res = await db
      .collection('wh_customer_tenants')
      .where({
        user_uid: this.current_uid,
        tenant_id: tenant_id
      })
      .remove()

    if (res.deleted === 0) {
      return { code: 404, message: '关联记录不存在' }
    }

    return {
      code: 0,
      message: '解绑成功'
    }
  },

  /**
   * 更新客户消费统计
   * @param {Object} params
   * @param {String} params.tenant_id - 商家ID
   * @param {Number} params.order_amount - 订单金额(分)
   */
  async updateSpendStats(params) {
    const { tenant_id, order_amount } = params

    if (!tenant_id || !order_amount) {
      return { code: 400, message: '参数不完整' }
    }

    if (!this.current_uid) {
      return { code: 401, message: '请先登录' }
    }

    const db = uniCloud.database()

    await db
      .collection('wh_customer_tenants')
      .where({
        user_uid: this.current_uid,
        tenant_id: tenant_id
      })
      .update({
        total_orders: db.command.inc(1),
        total_spent: db.command.inc(order_amount),
        last_visit_at: Date.now()
      })

    return { code: 0, message: '更新成功' }
  }
}
