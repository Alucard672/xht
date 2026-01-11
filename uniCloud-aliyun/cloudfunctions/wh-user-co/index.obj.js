// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/article/129
const uniIdCommon = require('uni-id-common')
const crypto = require('crypto')

/**
 * 密码加密工具
 * @param {String} password
 */
function encryptPassword(password) {
  // 简单使用 md5 + salt 或者是 HMAC-SHA256
  // 为了兼容性，这里使用 uni-id 默认的加密方式 (如果可能)，但因为我们没有 uni-id 库，我们使用自定义的 robust 方式
  // 生产环境建议使用 bcrypt，但在云函数中需注意环境
  // 这里使用 HMAC-SHA256，密钥可以是 config 中的 tokenSecret，或者固定一个 internal secret
  // 注意：这将与标准 uni-id 不兼容（除非 uni-id 配置了相同算法）
  // 为了演示和快速修复，我们使用简单的 HASH
  const hmac = crypto.createHmac('sha256', 'xht-super-secret-key')
  hmac.update(password)
  return hmac.digest('hex')
}

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })
  },

  /**
   * 商家登录
   * @param {Object} params
   * @param {String} params.username 手机号
   * @param {String} params.password 密码
   */
  async loginMerchant(params) {
    const { username, password } = params

    if (!username || !password) {
      throw new Error('用户名和密码不能为空')
    }

    const db = uniCloud.database()

    // 1. 查找用户
    const userRes = await db
      .collection('uni-id-users')
      .where({
        mobile: username
      })
      .get()

    if (userRes.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userRes.data[0]

    // 2. 校验密码
    // 注意：如果是老数据（uni-id 生成的），可能是不兼容的 hash。这里假设都是新系统生成。
    const safePassword = encryptPassword(password)
    if (user.password !== safePassword) {
      throw new Error('密码错误')
    }

    // 3. 生成 Token (使用 uni-id-common)
    const { token, tokenExpired } = await this.uniIdCommon.createToken({
      uid: user._id,
      role: user.role || []
    })

    // 获取租户信息
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
   * 注册商家并创建租户
   * @param {Object} params
   * @param {String} params.username 用户名/手机号 (实际存入 mobile)
   * @param {String} params.password 密码
   * @param {String} params.shopName 店铺名称
   */
  async registerMerchant(params) {
    const { username, password, shopName } = params

    if (!username || !password || !shopName) {
      throw new Error('参数不完整')
    }

    // 校验手机号格式 (简单)
    if (!/^1\d{10}$/.test(username)) {
      throw new Error('手机号格式不正确')
    }

    const db = uniCloud.database()
    const dbCmd = db.command

    // 1. 检查手机号是否已被注册
    const existUser = await db
      .collection('uni-id-users')
      .where({
        mobile: username
      })
      .get()

    if (existUser.data.length > 0) {
      throw new Error('该手机号已注册')
    }

    // 2. 注册用户
    const safePassword = encryptPassword(password)
    const now = Date.now()

    const userRes = await db.collection('uni-id-users').add({
      username: username, // 冗余存一份
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

    // 3. 创建租户
    const tenantRes = await db.collection('wh_tenants').add({
      name: shopName,
      owner_uid: uid,
      created_at: now,
      expired_at: now + 365 * 24 * 60 * 60 * 1000, // 默认一年
      settings: {
        allow_debt: true,
        min_delivery_price: 0
      }
    })

    if (!tenantRes.id) {
      // 简单回滚
      await db.collection('uni-id-users').doc(uid).remove()
      throw new Error('店铺创建失败')
    }

    // 4. 回写租户ID到用户表
    await db.collection('uni-id-users').doc(uid).update({
      tenant_id: tenantRes.id
    })

    // 5. 生成 Token
    const { token, tokenExpired } = await this.uniIdCommon.createToken({
      uid: uid,
      role: ['merchant']
    })

    return {
      code: 0,
      msg: '注册成功',
      token,
      tokenExpired,
      userInfo: {
        _id: uid,
        username,
        role: ['merchant'],
        tenant_id: tenantRes.id
      },
      tenantInfo: {
        _id: tenantRes.id,
        name: shopName
      }
    }
  }
}
