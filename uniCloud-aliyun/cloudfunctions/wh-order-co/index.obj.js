const uniID = require('uni-id-common')

module.exports = {
  _before: function () {
    this.uniID = uniID.createInstance({
      clientInfo: this.getClientInfo()
    })
  },

  /**
   * 商家确认接单
   * @param {String} orderId 订单ID
   */
  async confirmOrder(orderId) {
    // 暂时注释掉登录校验，方便页面展示调试
    /*
    const auth = await this.uniID.checkToken(this.getUniIdToken())
    if (auth.code !== 0) return auth
    */

    const db = uniCloud.database()
    const dbCmd = db.command

    // 更新订单状态为 待发货 (1)
    const res = await db.collection('wh_orders').doc(orderId).update({
      status: 1
    })

    return {
      code: 0,
      msg: '已接单'
    }
  },

  /**
   * 商家确认送达并完成订单
   * @param {String} orderId 订单ID
   */
  async completeOrder(orderId) {
    // 暂时注释掉登录校验，方便页面展示调试
    /*
    const auth = await this.uniID.checkToken(this.getUniIdToken())
    if (auth.code !== 0) return auth
    */

    const db = uniCloud.database()
    const dbCmd = db.command

    // 1. 获取订单详情
    const orderRes = await db.collection('wh_orders').doc(orderId).get()
    const order = orderRes.data[0]
    if (!order || order.status === 2) {
      return { code: 400, msg: '订单异常或已完成' }
    }

    // 2. 事务操作：更新状态、更新欠款、记录流水
    const transaction = await db.startTransaction()
    try {
      // A. 更新订单状态为 已完成 (2)
      await transaction.collection('wh_orders').doc(orderId).update({
        status: 2
      })

      // B. 如果是赊账支付，更新客户欠款并记录日志
      if (order.payment_method === 'credit') {
        // 更新客户总欠款
        await transaction
          .collection('wh_customers')
          .doc(order.customer_id)
          .update({
            total_debt: dbCmd.inc(order.total_fee),
            last_trade_time: Date.now()
          })

        // 记录欠款流水
        await transaction.collection('wh_debt_logs').add({
          tenant_id: order.tenant_id,
          customer_id: order.customer_id,
          amount: order.total_fee,
          type: 'order',
          source: orderId,
          remark: `订单欠款: ${order.order_no}`,
          create_time: Date.now()
        })
      }

      await transaction.commit()
      return {
        code: 0,
        msg: '订单已完成'
      }
    } catch (e) {
      await transaction.rollback()
      return {
        code: 500,
        msg: '系统错误: ' + e.message
      }
    }
  }
}
