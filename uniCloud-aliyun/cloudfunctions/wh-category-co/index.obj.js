// 云对象: 商品分类管理
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
   * 获取分类列表
   */
  async getCategoryList() {
    const db = uniCloud.database()
    const res = await db
      .collection('wh_categories')
      .where({ tenant_id: this.tenant_id })
      .orderBy('sort', 'asc')
      .get()

    return {
      code: 0,
      msg: '获取成功',
      data: res.data
    }
  },

  /**
   * 创建分类
   */
  async createCategory(data) {
    const { name, sort } = data

    if (!name || !name.trim()) {
      return { code: 4001, msg: '分类名称不能为空', data: null }
    }

    const db = uniCloud.database()
    const res = await db.collection('wh_categories').add({
      tenant_id: this.tenant_id,
      name: name.trim(),
      sort: parseInt(sort) || 0
    })

    return {
      code: 0,
      msg: '创建成功',
      data: { _id: res.id }
    }
  },

  /**
   * 更新分类
   */
  async updateCategory(category_id, data) {
    if (!category_id) {
      return { code: 4001, msg: '分类ID不能为空', data: null }
    }

    const { name, sort } = data

    if (!name || !name.trim()) {
      return { code: 4001, msg: '分类名称不能为空', data: null }
    }

    const db = uniCloud.database()

    // 验证分类是否存在
    const checkRes = await db
      .collection('wh_categories')
      .where({ _id: category_id, tenant_id: this.tenant_id })
      .count()

    if (checkRes.total === 0) {
      return { code: 4004, msg: '分类不存在或无权限', data: null }
    }

    await db
      .collection('wh_categories')
      .doc(category_id)
      .update({
        name: name.trim(),
        sort: parseInt(sort) || 0
      })

    return {
      code: 0,
      msg: '更新成功',
      data: null
    }
  },

  /**
   * 删除分类
   */
  async deleteCategory(category_id) {
    if (!category_id) {
      return { code: 4001, msg: '分类ID不能为空', data: null }
    }

    const db = uniCloud.database()

    // 检查是否有商品使用该分类
    const goodsRes = await db
      .collection('wh_goods')
      .where({ category_id, tenant_id: this.tenant_id })
      .count()

    if (goodsRes.total > 0) {
      return { code: 4003, msg: `该分类下有${goodsRes.total}个商品，无法删除`, data: null }
    }

    // 验证分类是否存在
    const checkRes = await db
      .collection('wh_categories')
      .where({ _id: category_id, tenant_id: this.tenant_id })
      .count()

    if (checkRes.total === 0) {
      return { code: 4004, msg: '分类不存在或无权限', data: null }
    }

    await db.collection('wh_categories').doc(category_id).remove()

    return {
      code: 0,
      msg: '删除成功',
      data: null
    }
  }
}
