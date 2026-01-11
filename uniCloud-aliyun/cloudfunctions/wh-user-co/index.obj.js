// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/article/129
const uniIdCommon = require('uni-id-common')

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })
  },

  /**
   * 注册商家并创建租户
   * @param {Object} params
   * @param {String} params.username 用户名/手机号
   * @param {String} params.password 密码
   * @param {String} params.shopName 店铺名称
   */
  async registerMerchant(params) {
    const { username, password, shopName } = params

    if (!username || !password || !shopName) {
      throw new Error('参数不完整')
    }

    // 1. 注册 uni-id 用户
    // 这里简化处理，直接用 username 注册，实际生产中可能需要验证码
    // 注意：需要在 uni-id-config 中开启 允许 username 注册 (本示例假定已配置或使用 mobile)
    // 如果 username 是手机号，使用 registerUser 可能需要验证码，这里为了演示使用 username/password 方式
    // 实际项目中建议使用 registerWithMobile (需验证码) 或 addAccount

    // 我们尝试直接创建用户，同时设置 role 为 merchant
    // 注意：uni-id-common 的 register 方法通常需要验证码，如果是纯密码注册，可以使用 addAccount (仅限管理员) 或配置允许
    // 简单起见，我们假设 username 是手机号，密码注册 (需 uni-id 配置支持)
    // 或者使用 addUser (管理员API)，但在 C 端调用会报错。
    // 为了Demo顺利，我们先以此逻辑：

    const db = uniCloud.database()
    const dbCmd = db.command

    // 检查手机号是否已被注册
    const existUser = await db
      .collection('uni-id-users')
      .where({
        mobile: username
      })
      .get()

    if (existUser.data.length > 0) {
      throw new Error('该手机号已注册')
    }

    // 2. 事务处理：创建用户 + 创建租户
    // uni-id 内部没有暴露部分事务能力给外部方便混合，所以我们手动步骤
    // 先注册用户

    const { uid, token, tokenExpired } = await this.uniIdCommon.register({
      username,
      password,
      role: ['merchant']
    })

    if (!uid) {
      throw new Error('注册失败')
    }

    // 更新用户手机号 (register 默认为 username，需同步 mobile)
    await db.collection('uni-id-users').doc(uid).update({
      mobile: username
    })

    // 3. 创建租户
    const tenantRes = await db.collection('wh_tenants').add({
      name: shopName,
      owner_uid: uid,
      created_at: Date.now(),
      expired_at: Date.now() + 365 * 24 * 60 * 60 * 1000, // 默认一年
      settings: {
        allow_debt: true,
        min_delivery_price: 0
      }
    })

    if (!tenantRes.id) {
      // 回滚：删除用户 (简单补偿)
      // await db.collection('uni-id-users').doc(uid).remove()
      throw new Error('店铺创建失败')
    }

    // 4. 回写租户ID到用户表 (方便后续查询)
    await db.collection('uni-id-users').doc(uid).update({
      tenant_id: tenantRes.id
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
