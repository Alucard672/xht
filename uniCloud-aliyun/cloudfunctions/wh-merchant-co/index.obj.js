const uniID = require('uni-id-common')

// 微信小程序码配置
const WECHAT_CONFIG = {
  appid: 'wxde883e8400916323', // TODO: 替换为实际 AppID
  secret: 'd31858c1a0039ef58beaac90f449a557' // TODO: 替换为实际 AppSecret
}

module.exports = {
  _before: function () {
    const clientInfo = this.getClientInfo() || {}
    this.uniID = uniID.createInstance({
      clientInfo
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

    // 2. 商家角色检查有效期
    const isMerchant = userInfo.role && userInfo.role.includes('merchant')
    if (isMerchant && userInfo.tenant_id) {
      const tenantRes = await db.collection('wh_tenants').doc(userInfo.tenant_id).get()
      const tenant = tenantRes.data[0]

      if (tenant) {
        // 检查状态
        if (tenant.status === 0) {
          return {
            code: 403,
            msg: '您的店铺正在审核中，请联系管理员'
          }
        }
        if (tenant.status === 2) {
          return {
            code: 403,
            msg: '您的店铺已被冻结，请联系管理员'
          }
        }
        if (tenant.status === 4) {
          return {
            code: 403,
            msg: '您的店铺已被拒绝，请重新申请'
          }
        }
        // 检查有效期
        if (tenant.expired_at && new Date(tenant.expired_at) < new Date()) {
          // 标记为过期状态
          await db.collection('wh_tenants').doc(userInfo.tenant_id).update({
            status: 3 // 已过期
          })
          return {
            code: 403,
            msg: '您的店铺已过期，请联系管理员续费',
            expired: true,
            expired_at: tenant.expired_at
          }
        }
      }
    }

    // 3. 生成 Token
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

    // 检查是否过期
    let expired = false
    let expired_at = null
    if (tenantInfo.expired_at && new Date(tenantInfo.expired_at) < new Date()) {
      expired = true
      expired_at = tenantInfo.expired_at
    } else {
      expired_at = tenantInfo.expired_at
    }

    return {
      code: 0,
      data: {
        stats,
        pendingOrders: pendingOrders.data,
        stockAlerts: stockAlerts.data,
        tenantName: tenantInfo.name || '我的店铺',
        expired,
        expired_at
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
    
    // 计算有效到期时间（OA设置的优先）
    const expiredAt = data.oa_expired_at || data.expired_at
    
    return {
      code: 0,
      data: {
        _id: data._id,
        name: data.name,
        phone: data.phone,
        status: data.status,
        expired_at: expiredAt,
        oa_expired_at: data.oa_expired_at,
        settings: data.settings
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
    if (data.phone) allowedData.phone = data.phone

    await db.collection('wh_tenants').doc(tenant_id).update(allowedData)

    return {
      code: 0,
      msg: '更新成功'
    }
  },

  /**
   * 生成店铺小程序码
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

    // 获取 access_token 的辅助函数
    const getWechatAccessToken = async () => {
      const cacheRes = await db.collection('wh_wechat_token').where({ type: 'access_token' }).get()
      const now = Date.now()

      if (cacheRes.data.length > 0) {
        const cache = cacheRes.data[0]
        if (cache.expires_at && now < cache.expires_at - 300) {
          return cache.token
        }
      }

      const res = await uniCloud.httpclient.request(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appid}&secret=${WECHAT_CONFIG.secret}`,
        { dataType: 'json' }
      )

      if (res.data.access_token) {
        if (cacheRes.data.length > 0) {
          await db
            .collection('wh_wechat_token')
            .doc(cacheRes.data[0]._id)
            .update({
              token: res.data.access_token,
              expires_at: now + res.data.expires_in * 1000,
              updated_at: now
            })
        } else {
          await db.collection('wh_wechat_token').add({
            type: 'access_token',
            token: res.data.access_token,
            expires_at: now + res.data.expires_in * 1000,
            created_at: now
          })
        }
        return res.data.access_token
      }
    }

    // 检查是否已有有效的小程序码
    const existRes = await db
      .collection('wh_shop_codes')
      .where({ tenant_id, is_active: true })
      .get()

    if (existRes.data.length > 0) {
      const existingCode = existRes.data[0]
      if (existingCode.created_at && Date.now() - existingCode.created_at < 7 * 24 * 3600 * 1000) {
        let qr_url = existingCode.qr_url

        if (qr_url && qr_url.startsWith('cloud://')) {
          const tempUrlRes = await uniCloud.getTempFileURL({
            fileList: [qr_url]
          })
          if (tempUrlRes.fileList && tempUrlRes.fileList[0] && tempUrlRes.fileList[0].tempFileURL) {
            qr_url = tempUrlRes.fileList[0].tempFileURL
            await db.collection('wh_shop_codes').doc(existingCode._id).update({ qr_url })
          }
        }

        if (qr_url && qr_url.startsWith('https://')) {
          return {
            code: 0,
            data: {
              code: existingCode.code,
              qr_url,
              scan_count: existingCode.scan_count || 0
            }
          }
        }

        if (qr_url && qr_url.startsWith('/api/')) {
          await db.collection('wh_shop_codes').doc(existingCode._id).remove()
        }
      }
    }

    try {
      const accessToken = await getWechatAccessToken()

      const wechatRes = await uniCloud.httpclient.request(
        `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
        {
          method: 'POST',
          data: JSON.stringify({
            scene: `t=${tenant_id}`,
            page: 'pages/client/shop',
            width: 430,
            check_path: true,
            env_version: 'trial'
          }),
          dataType: 'buffer'
        }
      )

      // 检查微信API响应
      if (!wechatRes.data || wechatRes.data.length === 0) {
        throw new Error('微信API返回空数据')
      }

      // 检查是否为JSON错误响应（微信失败时返回JSON）
      try {
        const textContent = wechatRes.data.toString('utf8')
        const jsonData = JSON.parse(textContent)

        // 如果能解析为JSON，说明是错误信息
        if (jsonData.errcode && jsonData.errcode !== 0) {
          console.error('微信API错误:', jsonData)
          throw new Error(
            `微信API错误: ${jsonData.errmsg || '未知错误'} (code: ${jsonData.errcode})`
          )
        }
      } catch (parseErr) {
        // 解析失败，说明是图片数据，继续处理
      }

      // 检查是否为有效的图片数据（PNG文件头是 89 50 4E 47）
      const dataBuffer = wechatRes.data
      if (dataBuffer.length < 8 || dataBuffer[0] !== 0x89 || dataBuffer[1] !== 0x50) {
        console.error('无效的图片数据:', dataBuffer.slice(0, 20).toString('hex'))
        throw new Error('生成二维码失败：返回数据不是有效的图片格式')
      }

      // 保存图片到云存储
      const cloudRes = await uniCloud.uploadFile({
        cloudPath: `shop-codes/${tenant_id}-${Date.now()}.png`,
        fileContent: dataBuffer
      })

      const fileID = cloudRes.fileID

      const tempUrlRes = await uniCloud.getTempFileURL({
        fileList: [fileID]
      })
      const qr_url = tempUrlRes.fileList[0].tempFileURL || fileID

      await db.collection('wh_shop_codes').add({
        tenant_id,
        code: tenant_id,
        qr_url: fileID,
        is_active: true,
        scan_count: 0,
        created_at: Date.now()
      })

      return {
        code: 0,
        data: {
          code: tenant_id,
          qr_url,
          scan_count: 0
        }
      }
    } catch (e) {
      console.error('生成小程序码错误:', e)
      let errorMsg = '生成二维码失败'
      if (e.message) {
        errorMsg = e.message
      }
      return { code: 500, msg: errorMsg }
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
  },

  /**
   * 获取店铺会员信息（包含过期状态）
   */
  async getMembershipInfo() {
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

    const now = new Date()
    const expiredDate = tenant.expired_at ? new Date(tenant.expired_at) : null
    const isExpired = expiredDate && expiredDate < now
    const daysLeft = expiredDate
      ? Math.max(0, Math.ceil((expiredDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : null

    return {
      code: 0,
      data: {
        status: tenant.status,
        statusText: tenant.status === 1 ? '正常' : tenant.status === 0 ? '待审核' : '异常',
        expired_at: tenant.expired_at,
        isExpired,
        daysLeft
      }
    }
  }
}
