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
   * 创建订单
   * @param {Object} data
   * @param {String} data.tenant_id - 租户ID (可选，从上下文获取)
   * @param {String} data.customer_id - 客户ID (可选)
   * @param {Array} data.items - 商品列表
   * @param {String} data.payment_method - 支付方式 credit/wechat
   * @param {String} data.remark - 备注
   * @param {Object} data.address - 地址信息
   * @param {String} data.created_by - 下单人UID (可选，默认当前用户)
   * @returns {Object}
   */
  createOrder: async function (data) {
    const {
      tenant_id,
      customer_id,
      items,
      payment_method = 'credit',
      remark = '',
      address = {},
      created_by
    } = data || {}

    if (!items || items.length === 0) {
      return { status: 400, message: '购物车不能为空' }
    }

    const db = uniCloud.database()

    // 计算金额
    let total_amount = 0
    const orderItems = []

    for (const item of items) {
      const itemTotal = (item.price || 0) * (item.count || 0)
      total_amount += itemTotal

      orderItems.push({
        goods_id: item.goods_id,
        name: item.name,
        count: item.count,
        unit_name: item.unit_name || item.unit,
        price: item.price
      })
    }

    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`

    // 确定下单人：优先使用传入的 created_by，否则使用当前用户
    const orderCreator = created_by || this.current_uid

    try {
      const res = await db.collection('wh_orders').add({
        tenant_id: tenant_id || this.tenant_id,
        customer_id: customer_id || this.current_uid,
        order_no: orderNo,
        items: orderItems,
        total_amount: total_amount,
        status: 0,
        payment_method,
        remark,
        address,
        created_by: orderCreator,
        create_time: Date.now()
      })

      return {
        status: 0,
        message: '下单成功',
        data: {
          _id: res.id,
          order_no: orderNo
        }
      }
    } catch (e) {
      return { status: 500, message: e.message }
    }
  },

  /**
   * 商家直接开单
   * @param {Object} data
   * @param {String} data.customer_id - 客户ID
   * @param {Array} data.items - 商品列表
   * @param {String} data.payment_method - 支付方式
   * @param {String} data.remark - 备注
   * @param {Object} data.address - 地址信息
   * @returns {Object}
   */
  createByMerchant: async function (data) {
    const { customer_id, items, payment_method = 'credit', remark = '', address = {} } = data || {}

    if (!items || items.length === 0) {
      return { status: 400, message: '商品列表不能为空' }
    }

    if (!customer_id) {
      return { status: 400, message: '请选择客户' }
    }

    const db = uniCloud.database()

    // 验证客户是否存在
    const customerRes = await db.collection('wh_customers').doc(customer_id).get()
    if (!customerRes.data || customerRes.data.length === 0) {
      return { status: 404, message: '客户不存在' }
    }

    // 计算金额
    let total_amount = 0
    const orderItems = []

    for (const item of items) {
      const itemTotal = (item.price || 0) * (item.count || 0)
      total_amount += itemTotal

      orderItems.push({
        goods_id: item.goods_id,
        name: item.name,
        count: item.count,
        unit_name: item.unit_name || item.unit,
        price: item.price
      })
    }

    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`

    try {
      const res = await db.collection('wh_orders').add({
        tenant_id: this.tenant_id,
        customer_id: customer_id,
        order_no: orderNo,
        items: orderItems,
        total_amount: total_amount,
        status: 1, // 商家开单直接进入待发货状态
        payment_method,
        remark,
        address,
        created_by: this.current_uid, // 记录商家UID
        create_time: Date.now()
      })

      return {
        status: 0,
        message: '开单成功',
        data: {
          _id: res.id,
          order_no: orderNo
        }
      }
    } catch (e) {
      return { status: 500, message: e.message }
    }
  },

  /**
   * 获取订单列表
   */
  getOrderList: async function (params = {}) {
    const { status, page = 1, limit = 20 } = params
    const db = uniCloud.database()

    const where = { tenant_id: this.tenant_id }
    if (status !== undefined) {
      where.status = parseInt(status)
    }

    try {
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
        status: 0,
        data: listRes.data,
        total: countRes.total
      }
    } catch (e) {
      return { status: 500, message: e.message }
    }
  },

  /**
   * 获取订单详情
   */
  getOrderDetail: async function (orderId) {
    const db = uniCloud.database()

    try {
      const orderRes = await db.collection('wh_orders').doc(orderId).get()
      if (!orderRes.data || orderRes.data.length === 0) {
        return { status: 404, message: '订单不存在' }
      }

      const order = orderRes.data[0]
      if (order.tenant_id !== this.tenant_id) {
        return { status: 403, message: '无权查看此订单' }
      }

      return { status: 0, data: order }
    } catch (e) {
      return { status: 500, message: e.message }
    }
  },

  /**
   * 商家确认接单
   */
  confirmOrder: async function (orderId) {
    const db = uniCloud.database()
    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    if (
      !orderRes.data ||
      orderRes.data.length === 0 ||
      orderRes.data[0].tenant_id !== this.tenant_id
    ) {
      return { status: 403, message: '无权操作' }
    }

    await db.collection('wh_orders').doc(orderId).update({
      status: 1
    })

    return { status: 0, message: '已接单' }
  },

  /**
   * 商家发货
   */
  shipOrder: async function (orderId) {
    const db = uniCloud.database()
    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    if (
      !orderRes.data ||
      orderRes.data.length === 0 ||
      orderRes.data[0].tenant_id !== this.tenant_id
    ) {
      return { status: 403, message: '无权操作' }
    }

    const order = orderRes.data[0]
    if (order.status !== 1) {
      return { status: 400, message: '只有待发货的订单可以发货' }
    }

    await db.collection('wh_orders').doc(orderId).update({
      status: 2
    })

    return { status: 0, message: '已发货' }
  },

  /**
   * 商家确认送达并完成订单
   */
  /**
   * 商家确认送达并完成订单
   */
  completeOrder: async function (orderId) {
    const db = uniCloud.database()
    const dbCmd = db.command

    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    const order = orderRes.data[0]

    if (!order || order.tenant_id !== this.tenant_id) {
      return { status: 404, message: '订单不存在' }
    }

    if (order.status === 2) {
      return { status: 400, message: '订单已完成' }
    }

    let targetCustomer = null
    if (order.payment_method === 'credit') {
      const customerId = order.customer_id
      let customerRes = await db.collection('wh_customers').doc(customerId).get()
      if (customerRes.data && customerRes.data.length > 0) {
        targetCustomer = customerRes.data[0]
      } else {
        customerRes = await db
          .collection('wh_customers')
          .where({ user_uid: customerId, tenant_id: this.tenant_id })
          .get()
        if (customerRes.data && customerRes.data.length > 0) {
          targetCustomer = customerRes.data[0]
        }
      }
    }

    const transaction = await db.startTransaction()
    try {
      await transaction.collection('wh_orders').doc(orderId).update({
        status: 2,
        complete_time: Date.now()
      })

      if (order.payment_method === 'credit' && targetCustomer) {
        await transaction
          .collection('wh_customers')
          .doc(targetCustomer._id)
          .update({
            total_debt: dbCmd.inc(order.total_amount),
            last_trade_time: Date.now()
          })

        await transaction.collection('wh_debt_logs').add({
          tenant_id: this.tenant_id,
          customer_id: targetCustomer._id,
          amount: order.total_amount,
          type: 'order',
          source: orderId,
          remark: `订单欠款: ${order.order_no}`,
          create_time: Date.now()
        })
      }

      // 更新客户的消费统计
      if (targetCustomer && targetCustomer.user_uid) {
        try {
          const userCo = require('uni-cloud-router').importObject('wh-user-co')
          await userCo.updateSpendStats({
            tenant_id: this.tenant_id,
            order_amount: order.total_amount
          })
        } catch (e) {
          console.error('Update spend stats failed:', e)
        }
      }

      await transaction.commit()
      return { status: 0, message: '订单已完成' }
    } catch (e) {
      await transaction.rollback()
      return { status: 500, message: e.message }
    }
  }
}
