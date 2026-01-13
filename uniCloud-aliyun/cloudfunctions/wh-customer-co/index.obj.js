// 云对象: 客户管理
const uniIdCommon = require('uni-id-common')

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })

    let token = this.getUniIdToken()
    let uid

    if (!token) {
      throw new Error('未登录')
    }

    if (typeof token === 'string') {
      const checkRes = await this.uniIdCommon.checkToken(token)
      if (checkRes.code !== 0) {
        throw new Error('登录失效')
      }
      uid = checkRes.uid
    } else if (token.uid) {
      uid = token.uid
    } else {
      throw new Error('未登录 (无效Token)')
    }

    const db = uniCloud.database()
    const userRes = await db.collection('uni-id-users').doc(uid).field({ tenant_id: true }).get()

    if (!userRes.data || !userRes.data.length || !userRes.data[0].tenant_id) {
      throw new Error('用户未绑定租户')
    }

    this.tenant_id = userRes.data[0].tenant_id
    this.current_uid = uid
  },

  /**
   * 获取客户列表
   * @param {Object} params { page, limit, keyword }
   */
  async getCustomerList(params = {}) {
    const { page = 1, limit = 20, keyword = '' } = params
    const db = uniCloud.database()
    const dbCmd = db.command

    let where = { tenant_id: this.tenant_id }
    if (keyword) {
      where = dbCmd.and([
        where,
        dbCmd.or([{ alias: new RegExp(keyword, 'i') }, { phone: new RegExp(keyword, 'i') }])
      ])
    }

    const countRes = await db.collection('wh_customers').where(where).count()
    const total = countRes.total

    const skip = (page - 1) * limit
    const listRes = await db
      .collection('wh_customers')
      .where(where)
      .orderBy('last_trade_time', 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    return {
      code: 0,
      msg: '获取成功',
      data: {
        list: listRes.data,
        total
      }
    }
  },

  /**
   * 获取客户详情
   * @param {String} id
   */
  async getCustomerDetail(id) {
    const db = uniCloud.database()
    const res = await db
      .collection('wh_customers')
      .where({
        _id: id,
        tenant_id: this.tenant_id
      })
      .get()

    if (!res.data || res.data.length === 0) {
      return { code: 404, msg: '客户不存在' }
    }

    // 获取最近10条欠款记录
    const logsRes = await db
      .collection('wh_debt_logs')
      .where({
        customer_id: id,
        tenant_id: this.tenant_id
      })
      .orderBy('create_time', 'desc')
      .limit(10)
      .get()

    return {
      code: 0,
      data: {
        info: res.data[0],
        recentLogs: logsRes.data
      }
    }
  },

  /**
   * 创建客户
   * @param {Object} data { alias, phone, remark }
   */
  async createCustomer(data) {
    const { alias, phone, remark } = data

    if (!alias) {
      return { code: 400, msg: '客户姓名/备注名不能为空' }
    }

    const db = uniCloud.database()

    // 检查手机号冲突 (同一个租户下手机号唯一比较合理)
    if (phone) {
      const existRes = await db
        .collection('wh_customers')
        .where({
          tenant_id: this.tenant_id,
          phone: phone
        })
        .count()
      if (existRes.total > 0) {
        return { code: 400, msg: '该手机号已存在' }
      }
    }

    const res = await db.collection('wh_customers').add({
      tenant_id: this.tenant_id,
      alias,
      phone,
      address: data.address || '',
      remark: remark || '',
      total_debt: 0,
      create_time: Date.now()
    })

    return {
      code: 0,
      msg: '添加成功',
      data: { _id: res.id }
    }
  },

  /**
   * 更新客户
   */
  async updateCustomer(id, data) {
    const { alias, phone, remark } = data
    const db = uniCloud.database()

    const checkRes = await db
      .collection('wh_customers')
      .where({
        _id: id,
        tenant_id: this.tenant_id
      })
      .count()

    if (checkRes.total === 0) {
      return { code: 404, msg: '客户不存在' }
    }

    await db
      .collection('wh_customers')
      .doc(id)
      .update({
        alias,
        phone,
        address: data.address || '',
        remark
      })

    return { code: 0, msg: '保存成功' }
  },

  /**
   * 录入还款
   * @param {Object} params { customer_id, amount, remark }
   */
  async repayDebt({ customer_id, amount, remark }) {
    if (!amount || amount <= 0) {
      return { code: 400, msg: '还款金额必须大于0' }
    }

    const db = uniCloud.database()
    const dbCmd = db.command
    const transaction = await db.startTransaction()

    try {
      console.log(
        `[Repay] 开始还款, customer_id: ${customer_id}, amount: ${amount}, current_tenant: ${this.tenant_id}`
      )

      const customerRes = await transaction.collection('wh_customers').doc(customer_id).get()
      console.log('[Repay] 数据库查询结果:', JSON.stringify(customerRes))

      const customer =
        customerRes.data && customerRes.data.length > 0 ? customerRes.data[0] : customerRes.data

      if (!customer) {
        throw new Error(`找不到该客户记录 (ID: ${customer_id})`)
      }

      if (customer.tenant_id !== this.tenant_id) {
        throw new Error(`租户不匹配: 记录租户=${customer.tenant_id}, 当前租户=${this.tenant_id}`)
      }

      // 1. 更新总欠款
      await transaction
        .collection('wh_customers')
        .doc(customer_id)
        .update({
          total_debt: dbCmd.inc(-amount),
          last_trade_time: Date.now()
        })

      // 2. 增加流水记录
      await transaction.collection('wh_debt_logs').add({
        tenant_id: this.tenant_id,
        customer_id,
        amount: -amount,
        type: 'repayment',
        source: 'manual', // 手动还款
        remark: remark || '客户还款',
        create_time: Date.now()
      })

      await transaction.commit()
      return { code: 0, msg: '还款成功' }
    } catch (e) {
      await transaction.rollback()
      return { code: 500, msg: e.message }
    }
  }
}
