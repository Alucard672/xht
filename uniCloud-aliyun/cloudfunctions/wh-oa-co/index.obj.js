const crypto = require('crypto')

/**
 * MD5加密辅助函数
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

/**
 * 验证OA用户token
 */
function validateToken(token) {
  try {
    const tokenStr = Buffer.from(token, 'base64').toString('utf-8')
    const tokenData = JSON.parse(tokenStr)
    
    if (tokenData.exp < Date.now()) {
      return { code: 401, msg: 'token已过期' }
    }
    
    return { code: 0, data: tokenData }
  } catch (e) {
    return { code: 401, msg: '无效的token' }
  }
}

/**
 * 获取有效的到期时间（OA设置的优先）
 */
function getEffectiveExpiredAt(tenant) {
  return tenant.oa_expired_at || tenant.expired_at
}

module.exports = {
  _before: function () {
    // OA系统不使用uniID认证，使用自定义token
    // 验证token并获取当前用户信息
    let token = this.getUniIdToken ? this.getUniIdToken() : null
    
    // 支持从header或参数中获取token
    if (!token) {
      const headers = this.getClientInfo()
      token = headers['x-oa-token'] || headers.token
    }
    
    if (token) {
      const auth = validateToken(token)
      if (auth.code === 0) {
        this.currentUser = auth.data
      }
    }
  },

  /**
   * 初始化默认管理员（首次运行时调用）
   */
  async initDefaultAdmin() {
    const db = uniCloud.database()
    
    // 检查是否已存在管理员
    const admin = await db.collection('oa_users').where({
      role: 'super_admin'
    }).get()
    
    if (admin.data.length > 0) {
      return { code: 400, msg: '管理员已存在' }
    }
    
    // 创建默认管理员
    const defaultAdmin = {
      username: 'xhtoa',
      password: md5('xht2260119'),
      nickname: '超级管理员',
      role: 'super_admin',
      status: 0,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const res = await db.collection('oa_users').add(defaultAdmin)
    
    return {
      code: 0,
      msg: '初始化成功',
      data: { _id: res.id }
    }
  },

  /**
   * OA系统登录
   */
  async login({ username, password }) {
    const db = uniCloud.database()
    
    if (!username || !password) {
      return { code: 400, msg: '用户名和密码不能为空' }
    }
    
    const md5Password = md5(password)
    
    const res = await db.collection('oa_users').where({
      username: username,
      password: md5Password,
      status: 0
    }).get()
    
    if (res.data.length === 0) {
      return { code: 401, msg: '用户名或密码错误' }
    }
    
    const user = res.data[0]
    
    // 更新最后登录时间
    await db.collection('oa_users').doc(user._id).update({
      last_login_at: Date.now(),
      updated_at: Date.now()
    })
    
    // 生成token
    const token = Buffer.from(JSON.stringify({
      uid: user._id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
    })).toString('base64')
    
    return {
      code: 0,
      msg: '登录成功',
      data: {
        token: token,
        user: {
          _id: user._id,
          username: user.username,
          nickname: user.nickname,
          role: user.role
        }
      }
    }
  },

  /**
   * 获取员工列表
   * 超级管理员可以看到所有用户，包括自己
   * 普通管理员和员工看不到超级管理员
   */
  async getEmployeeList({ page = 1, limit = 20, keyword = '', status = -1 }) {
    const db = uniCloud.database()
    const dbCmd = db.command
    
    // 判断当前用户是否是超级管理员
    const isSuperAdmin = this.currentUser && this.currentUser.role === 'super_admin'
    
    let where = {}
    
    // 如果不是超级管理员，则过滤掉super_admin
    if (!isSuperAdmin) {
      where.role = dbCmd.neq('super_admin')
    }
    
    if (keyword) {
      where.$or = [
        { username: new RegExp(keyword, 'i') },
        { nickname: new RegExp(keyword, 'i') }
      ]
    }
    if (status !== -1) {
      where.status = status
    }
    
    const [countRes, listRes] = await Promise.all([
      db.collection('oa_users').where(where).count(),
      db.collection('oa_users')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get()
    ])
    
    // 计算统计数据
    const allUsers = await db.collection('oa_users').where(where).get()
    
    return {
      code: 0,
      data: {
        list: listRes.data.map(user => ({
          _id: user._id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          status: user.status,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        })),
        total: countRes.total,
        stats: {
          total: allUsers.data.length,
          active: allUsers.data.filter(u => u.status === 0).length,
          admins: allUsers.data.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
          disabled: allUsers.data.filter(u => u.status === 1).length
        }
      }
    }
  },

  /**
   * 添加员工
   */
  async addEmployee({ username, password, nickname, role = 'employee' }) {
    const db = uniCloud.database()
    
    // 检查用户名是否已存在
    const exist = await db.collection('oa_users').where({
      username: username
    }).get()
    
    if (exist.data.length > 0) {
      return { code: 400, msg: '用户名已存在' }
    }
    
    const employee = {
      username: username,
      password: md5(password),
      nickname: nickname,
      role: role,
      status: 0,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const res = await db.collection('oa_users').add(employee)
    
    return {
      code: 0,
      msg: '添加成功',
      data: { _id: res.id }
    }
  },

  /**
   * 修改员工
   */
  async updateEmployee(id, { username, nickname, role, status }) {
    const db = uniCloud.database()
    
    const user = await db.collection('oa_users').doc(id).get()
    if (user.data.length === 0) {
      return { code: 404, msg: '员工不存在' }
    }
    
    // 超级管理员不能被修改
    if (user.data[0].role === 'super_admin') {
      return { code: 400, msg: '不能修改超级管理员' }
    }
    
    // 检查用户名是否冲突
    if (username && username !== user.data[0].username) {
      const exist = await db.collection('oa_users').where({
        username: username,
        _id: db.command.neq(id)
      }).get()
      
      if (exist.data.length > 0) {
        return { code: 400, msg: '用户名已存在' }
      }
    }
    
    const updateData = {
      updated_at: Date.now()
    }
    
    if (username) updateData.username = username
    if (nickname) updateData.nickname = nickname
    if (role) updateData.role = role
    if (status !== undefined) updateData.status = status
    
    await db.collection('oa_users').doc(id).update(updateData)
    
    return { code: 0, msg: '修改成功' }
  },

  /**
   * 删除员工
   */
  async deleteEmployee(id) {
    const db = uniCloud.database()
    
    const user = await db.collection('oa_users').doc(id).get()
    if (user.data.length === 0) {
      return { code: 404, msg: '员工不存在' }
    }
    
    // 不能删除超级管理员
    if (user.data[0].role === 'super_admin') {
      return { code: 400, msg: '不能删除超级管理员' }
    }
    
    await db.collection('oa_users').doc(id).remove()
    
    return { code: 0, msg: '删除成功' }
  },

  /**
   * 重置员工密码
   */
  async resetEmployeePassword(id, { newPassword }) {
    const db = uniCloud.database()
    
    const user = await db.collection('oa_users').doc(id).get()
    if (user.data.length === 0) {
      return { code: 404, msg: '员工不存在' }
    }
    
    // 不能重置超级管理员的密码
    if (user.data[0].role === 'super_admin') {
      return { code: 400, msg: '不能重置超级管理员的密码' }
    }
    
    await db.collection('oa_users').doc(id).update({
      password: md5(newPassword),
      updated_at: Date.now()
    })
    
    return { code: 0, msg: '密码重置成功' }
  },

  /**
   * 获取商家列表
   */
  async getMerchantList({ page = 1, limit = 20, keyword = '', status = -1 }) {
    const db = uniCloud.database()
    const dbCmd = db.command
    
    let where = {}
    if (keyword) {
      where.name = new RegExp(keyword, 'i')
    }
    if (status !== -1) {
      where.status = status
    }
    
    const [countRes, listRes] = await Promise.all([
      db.collection('wh_tenants').where(where).count(),
      db.collection('wh_tenants')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get()
    ])
    
    const stats = {
      total: countRes.total,
      pending: 0,
      active: 0,
      frozen: 0,
      expired: 0
    }
    
    listRes.data.forEach(merchant => {
      if (merchant.status === 0) stats.pending++
      else if (merchant.status === 1) stats.active++
      else if (merchant.status === 2) stats.frozen++
      else if (merchant.status === 3) stats.expired++
    })
    
    return {
      code: 0,
      data: {
        list: listRes.data.map(merchant => ({
          _id: merchant._id,
          name: merchant.name,
          phone: merchant.phone,
          status: merchant.status,
          expired_at: getEffectiveExpiredAt(merchant),
          oa_expired_at: merchant.oa_expired_at,
          has_oa_password: !!merchant.oa_password,
          created_at: merchant.created_at
        })),
        total: countRes.total,
        stats: stats
      }
    }
  },

  /**
   * 设置商家登录密码
   */
  async setMerchantPassword(tenantId, { password }) {
    const db = uniCloud.database()
    
    const merchant = await db.collection('wh_tenants').doc(tenantId).get()
    if (merchant.data.length === 0) {
      return { code: 404, msg: '商家不存在' }
    }
    
    await db.collection('wh_tenants').doc(tenantId).update({
      oa_password: md5(password),
      updated_at: Date.now()
    })
    
    return { code: 0, msg: '密码设置成功' }
  },

  /**
   * 设置商家有效期
   */
  async setMerchantExpired(tenantId, { expiredAt }) {
    const db = uniCloud.database()
    
    const merchant = await db.collection('wh_tenants').doc(tenantId).get()
    if (merchant.data.length === 0) {
      return { code: 404, msg: '商家不存在' }
    }
    
    const updateData = {
      oa_expired_at: expiredAt ? new Date(expiredAt).getTime() : null,
      updated_at: Date.now()
    }
    
    // 如果设置了新的有效期且大于当前时间，状态改为正常
    if (expiredAt && new Date(expiredAt).getTime() > Date.now()) {
      updateData.status = 1
    }
    
    await db.collection('wh_tenants').doc(tenantId).update(updateData)
    
    return { code: 0, msg: '有效期设置成功' }
  },

  /**
   * 获取商家详情
   */
  async getMerchantDetail(tenantId) {
    const db = uniCloud.database()
    
    const merchant = await db.collection('wh_tenants').doc(tenantId).get()
    if (merchant.data.length === 0) {
      return { code: 404, msg: '商家不存在' }
    }
    
    const m = merchant.data[0]
    
    return {
      code: 0,
      data: {
        _id: m._id,
        name: m.name,
        phone: m.phone,
        status: m.status,
        expired_at: getEffectiveExpiredAt(m),
        oa_expired_at: m.oa_expired_at,
        has_oa_password: !!m.oa_password,
        created_at: m.created_at
      }
    }
   },

   //#region ========== 套餐管理API ==========

  /**
   * 获取套餐列表
   */
  async getPackageList() {
    const db = uniCloud.database()
    
    const res = await db.collection('wh_renewal_packages')
      .orderBy('sort_order', 'desc')
      .orderBy('created_at', 'desc')
      .get()
    
    return {
      code: 0,
      data: res.data.map(pkg => ({
        _id: pkg._id,
        name: pkg.name,
        duration_months: pkg.duration_months,
        price: pkg.price,
        description: pkg.description,
        is_active: pkg.is_active,
        sort_order: pkg.sort_order,
        created_at: pkg.created_at
      }))
    }
  },

  /**
   * 添加套餐
   */
  async addPackage({ name, duration_months, price, description = '', sort_order = 0 }) {
    const db = uniCloud.database()
    
    if (!name || !duration_months || price === undefined) {
      return { code: 400, msg: '套餐名称、时长和价格不能为空' }
    }
    
    const newPackage = {
      name,
      duration_months: parseInt(duration_months),
      price: parseInt(price),
      description,
      sort_order: parseInt(sort_order),
      is_active: true,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const res = await db.collection('wh_renewal_packages').add(newPackage)
    
    return {
      code: 0,
      msg: '添加成功',
      data: { _id: res.id }
    }
  },

  /**
   * 修改套餐
   */
  async updatePackage(id, { name, duration_months, price, description, sort_order, is_active }) {
    const db = uniCloud.database()
    
    const pkg = await db.collection('wh_renewal_packages').doc(id).get()
    if (pkg.data.length === 0) {
      return { code: 404, msg: '套餐不存在' }
    }
    
    const updateData = {
      updated_at: Date.now()
    }
    
    if (name !== undefined) updateData.name = name
    if (duration_months !== undefined) updateData.duration_months = parseInt(duration_months)
    if (price !== undefined) updateData.price = parseInt(price)
    if (description !== undefined) updateData.description = description
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order)
    if (is_active !== undefined) updateData.is_active = is_active
    
    await db.collection('wh_renewal_packages').doc(id).update(updateData)
    
    return { code: 0, msg: '修改成功' }
  },

  /**
   * 删除套餐
   */
  async deletePackage(id) {
    const db = uniCloud.database()
    
    const pkg = await db.collection('wh_renewal_packages').doc(id).get()
    if (pkg.data.length === 0) {
      return { code: 404, msg: '套餐不存在' }
    }
    
    await db.collection('wh_renewal_packages').doc(id).remove()
    
    return { code: 0, msg: '删除成功' }
  },

  /**
   * 套餐上架/下架
   */
  async togglePackageStatus(id) {
    const db = uniCloud.database()
    
    const pkg = await db.collection('wh_renewal_packages').doc(id).get()
    if (pkg.data.length === 0) {
      return { code: 404, msg: '套餐不存在' }
    }
    
    await db.collection('wh_renewal_packages').doc(id).update({
      is_active: !pkg.data[0].is_active,
      updated_at: Date.now()
    })
    
    return { code: 0, msg: pkg.data[0].is_active ? '已下架' : '已上架' }
  },

  //#endregion

  //#region ========== 有效期计算工具 ==========

  /**
   * 顺延有效期（按月对日）
   * 当前2024-01-15过期，续费1个月 → 2024-02-15
   */
  addMonths(expiredAt, months) {
    const date = new Date(expiredAt)
    const targetMonth = date.getMonth() + months
    const targetDate = new Date(date.getFullYear(), targetMonth, date.getDate())
    
    // 处理月末特殊情况：1月31日 + 1月 → 2月28日
    if (targetDate.getMonth() !== targetMonth % 12) {
      // 回退到月末最后一天
      return new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getTime()
    }
    
    return targetDate.getTime()
  },

  //#endregion

  //#region ========== 续费订单API ==========

  /**
   * 创建续费订单（在线支付）
   */
  async createRenewalOrder({ tenantId, packageId }) {
    const db = uniCloud.database()
    
    // 获取套餐信息
    const pkg = await db.collection('wh_renewal_packages').doc(packageId).get()
    if (pkg.data.length === 0) {
      return { code: 404, msg: '套餐不存在' }
    }
    
    if (!pkg.data[0].is_active) {
      return { code: 400, msg: '该套餐已下架' }
    }
    
    // 生成订单号
    const orderNo = 'R' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase()
    
    const order = {
      tenant_id: tenantId,
      package_id: packageId,
      order_no: orderNo,
      duration_months: pkg.data[0].duration_months,
      amount: pkg.data[0].price,
      status: 0, // 待支付
      source: 'online',
      is_gift: false,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const res = await db.collection('wh_renewal_orders').add(order)
    
    return {
      code: 0,
      msg: '订单创建成功',
      data: {
        order_id: res.id,
        order_no: orderNo,
        amount: pkg.data[0].price,
        duration_months: pkg.data[0].duration_months
      }
    }
  },

  /**
   * OA端赠送有效期
   */
  async giftRenewal({ tenantId, months, remark = '' }) {
    const db = uniCloud.database()
    
    if (!tenantId || !months) {
      return { code: 400, msg: '商家ID和月数不能为空' }
    }
    
    // 获取商家信息
    const merchant = await db.collection('wh_tenants').doc(tenantId).get()
    if (merchant.data.length === 0) {
      return { code: 404, msg: '商家不存在' }
    }
    
    const m = merchant.data[0]
    
    // 计算新的有效期
    const currentExpiredAt = getEffectiveExpiredAt(m) || Date.now()
    const newExpiredAt = addMonths(currentExpiredAt, parseInt(months))
    
    // 生成订单号
    const orderNo = 'G' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase()
    
    // 创建赠送订单
    const order = {
      tenant_id: tenantId,
      package_id: null,
      order_no: orderNo,
      duration_months: parseInt(months),
      amount: 0, // 免费
      status: 1, // 已支付
      source: 'oa_admin',
      is_gift: true,
      remark: remark || '管理员赠送',
      paid_at: Date.now(),
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const orderRes = await db.collection('wh_renewal_orders').add(order)
    
    // 更新商家有效期
    await db.collection('wh_tenants').doc(tenantId).update({
      oa_expired_at: newExpiredAt,
      status: 1, // 设置为正常
      updated_at: Date.now()
    })
    
    return {
      code: 0,
      msg: '赠送成功',
      data: {
        order_id: orderRes.id,
        order_no: orderNo,
        months: parseInt(months),
        new_expired_at: newExpiredAt
      }
    }
  },

  /**
   * 获取商家续费订单列表
   */
  async getRenewalOrders(tenantId) {
    const db = uniCloud.database()
    
    const res = await db.collection('wh_renewal_orders')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc')
      .get()
    
    return {
      code: 0,
      data: res.data.map(order => ({
        _id: order._id,
        order_no: order.order_no,
        duration_months: order.duration_months,
        amount: order.amount,
        status: order.status,
        source: order.source,
        is_gift: order.is_gift,
        paid_at: order.paid_at,
        created_at: order.created_at
      }))
    }
  },

  /**
   * 支付成功回调（示例，实际需要对接微信支付）
   */
  async handlePaymentCallback({ orderId, paymentInfo }) {
    const db = uniCloud.database()
    
    const order = await db.collection('wh_renewal_orders').doc(orderId).get()
    if (order.data.length === 0) {
      return { code: 404, msg: '订单不存在' }
    }
    
    if (order.data[0].status !== 0) {
      return { code: 400, msg: '订单状态异常' }
    }
    
    // 获取商家信息
    const merchant = await db.collection('wh_tenants').doc(order.data[0].tenant_id).get()
    if (merchant.data.length === 0) {
      return { code: 404, msg: '商家不存在' }
    }
    
    // 计算新的有效期
    const currentExpiredAt = getEffectiveExpiredAt(merchant.data[0]) || Date.now()
    const newExpiredAt = addMonths(currentExpiredAt, order.data[0].duration_months)
    
    // 开启事务
    const transaction = await db.startTransaction()
    
    try {
      // 更新订单状态
      await transaction.collection('wh_renewal_orders').doc(orderId).update({
        status: 1,
        payment_info: paymentInfo,
        paid_at: Date.now(),
        updated_at: Date.now()
      })
      
      // 更新商家有效期
      await transaction.collection('wh_tenants').doc(order.data[0].tenant_id).update({
        oa_expired_at: newExpiredAt,
        status: 1, // 设置为正常
        updated_at: Date.now()
      })
      
      await transaction.commit()
      
      return {
        code: 0,
        msg: '支付处理成功',
        data: {
          new_expired_at: newExpiredAt
        }
      }
    } catch (e) {
      await transaction.rollback()
      return { code: 500, msg: '支付处理失败: ' + e.message }
    }
  }

  //#endregion
}
