const uniIdCommon = require('uni-id-common')

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })

    let token = this.getUniIdToken()
    let uid

    if (!token) {
      // 下单接口可能允许匿名或由 H5 内部逻辑处理，但此处强制校验以确保 tenant_id
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
   * 创建订单
   * @param {Object} data { items, payment_method, remark, address_info }
   */
  async createOrder(data) {
    const { items, payment_method = 'cash', remark = '', address_info = {} } = data

    if (!items || items.length === 0) {
      return { code: 400, msg: '购物车不能为空' }
    }

    const db = uniCloud.database()
    const dbCmd = db.command

    // 计算金额并构建订单项
    let total_amount = 0
    const orderItems = []

    for (const item of items) {
      // 实际开发中应从数据库校验价格，此处先透传前端计算结果以保证流程通畅
      total_amount += item.priceSmall * item.countSmall
      if (item.countBig && item.priceBig) {
        total_amount += item.priceBig * item.countBig
      }

      orderItems.push({
        goods_id: item._id,
        name: item.name,
        countSmall: item.countSmall || 0,
        countBig: item.countBig || 0,
        unitSmallName: item.unitSmallName,
        unitBigName: item.unitBigName,
        priceSmall: item.priceSmall,
        priceBig: item.priceBig || 0
      })
    }

    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`

    const res = await db.collection('wh_orders').add({
      tenant_id: this.tenant_id,
      customer_id: this.current_uid, // C端用户ID
      order_no: orderNo,
      items: orderItems,
      total_amount,
      status: 0, // 待确认
      payment_method,
      remark,
      address_info,
      create_time: Date.now()
    })

    return {
      code: 0,
      msg: '下单成功',
      data: {
        _id: res.id,
        order_no: orderNo
      }
    }
  },

  /**
   * 获取订单列表
   */
  async getOrderList(params = {}) {
    const { status, page = 1, limit = 20 } = params
    const db = uniCloud.database()

    const where = { tenant_id: this.tenant_id }
    if (status !== undefined) {
      where.status = parseInt(status)
    }

    const countRes = await db.collection('wh_orders').where(where).count()
    const skip = (page - 1) * limit
    const listRes = await db
      .collection('wh_orders')
      .where(where)
      .orderBy('create_time', 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    return {
      code: 0,
      data: {
        list: listRes.data,
        total: countRes.total
      }
    }
  },

  /**
   * 商家确认接单
   */
  async confirmOrder(orderId) {
    const db = uniCloud.database()
    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    if (!orderRes.data || orderRes.data[0].tenant_id !== this.tenant_id) {
      return { code: 403, msg: '无权操作' }
    }

    await db.collection('wh_orders').doc(orderId).update({
      status: 1
    })

    return { code: 0, msg: '已接单' }
  },

  /**
   * 商家确认送达并完成订单
   */
  async completeOrder(orderId) {
    const db = uniCloud.database()
    const dbCmd = db.command

    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    const order = orderRes.data[0]

    if (!order || order.tenant_id !== this.tenant_id) {
      return { code: 404, msg: '订单不存在' }
    }

    if (order.status === 2) {
      return { code: 400, msg: '订单已完成' }
    }

    const transaction = await db.startTransaction()
    try {
      // 1. 更新订单状态
      await transaction.collection('wh_orders').doc(orderId).update({
        status: 2,
        complete_time: Date.now()
      })

      // 2. 如果是赊账支付，处理账务
      if (order.payment_method === 'credit') {
        const customerId = order.customer_id

        // 我们需要找到对应的客户记录。通常 C端用户关联一个客户记录。
        // 这里简化逻辑：如果订单里有 customer_id (UID)，尝试匹配 wh_customers 表里的 user_uid
        const customerLookup = await transaction
          .collection('wh_customers')
          .where({ user_uid: customerId, tenant_id: this.tenant_id })
          .get()

        if (customerLookup.data && customerLookup.data.length > 0) {
          const customer = customerLookup.data[0]
          // 更新欠款
          await transaction
            .collection('wh_customers')
            .doc(customer._id)
            .update({
              total_debt: dbCmd.inc(order.total_amount),
              last_trade_time: Date.now()
            })

          // 记录流水
          await transaction.collection('wh_debt_logs').add({
            tenant_id: this.tenant_id,
            customer_id: customer._id,
            amount: order.total_amount,
            type: 'order',
            source: orderId,
            remark: `订单欠款: ${order.order_no}`,
            create_time: Date.now()
          })
        }
      }

      await transaction.commit()
      return { code: 0, msg: '订单已完成' }
    } catch (e) {
      await transaction.rollback()
      return { code: 500, msg: e.message }
    }
  }
}
