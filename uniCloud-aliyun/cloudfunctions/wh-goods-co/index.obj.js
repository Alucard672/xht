// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/article/129

const uniIdCommon = require('uni-id-common')

module.exports = {
  _before: async function () {
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.getClientInfo()
    })

    // 获取当前用户的 tenant_id
    // 尝试直接获取 token
    let token = this.getUniIdToken()
    let uid

    if (!token) {
      throw new Error('未登录 (Token为空)')
    }

    // 如果 token 是字符串（HBuilderX 本地调试常见），需要手动校验解析
    if (typeof token === 'string') {
      const checkRes = await this.uniIdCommon.checkToken(token)
      if (checkRes.code !== 0) {
        throw new Error(`登录失效: ${checkRes.msg}`)
      }
      uid = checkRes.uid
    } else if (token.uid) {
      // 如果已经是对象（某些环境下框架可能已解析）
      uid = token.uid
    } else {
      const tokenStr = JSON.stringify(token)
      throw new Error(`未登录 (Token格式无法识别). Value: ${tokenStr}`)
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
   * 获取商品列表
   * @param {Object} params
   * @param {String} params.category_id - 分类ID（可选）
   * @param {String} params.keyword - 搜索关键词（可选）
   * @param {Number} params.page - 页码（默认1）
   * @param {Number} params.limit - 每页数量（默认20）
   * @param {Boolean} params.on_sale_only - 仅查询上架商品（默认false）
   * @returns {Promise<{code: 0, data: {list: Array, total: Number}}>}
   */
  async getGoodsList(params = {}) {
    const { category_id, keyword, page = 1, limit = 20, on_sale_only = false } = params

    const db = uniCloud.database()
    const dbCmd = db.command

    // 构建查询条件
    const where = { tenant_id: this.tenant_id }

    if (category_id) {
      where.category_id = category_id
    }

    if (keyword) {
      where.name = new RegExp(keyword, 'i')
    }

    if (on_sale_only) {
      where.is_on_sale = true
    }

    // 查询总数
    const countRes = await db.collection('wh_goods').where(where).count()
    const total = countRes.total

    // 分页查询
    const skip = (page - 1) * limit
    const listRes = await db
      .collection('wh_goods')
      .where(where)
      .orderBy('_id', 'desc')
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
   * 获取商品详情
   * @param {String} goods_id - 商品ID
   * @returns {Promise<{code: 0, data: Object}>}
   */
  async getGoodsDetail(goods_id) {
    if (!goods_id) {
      return { code: 4001, msg: '商品ID不能为空', data: null }
    }

    const db = uniCloud.database()
    const res = await db
      .collection('wh_goods')
      .where({
        _id: goods_id,
        tenant_id: this.tenant_id
      })
      .get()

    if (!res.data || res.data.length === 0) {
      return { code: 4004, msg: '商品不存在', data: null }
    }

    return {
      code: 0,
      msg: '获取成功',
      data: res.data[0]
    }
  },

  /**
   * 新建商品
   * @param {Object} goodsData
   * @param {String} goodsData.name - 商品名称
   * @param {String} goodsData.category_id - 分类ID（可选）
   * @param {String} goodsData.img_url - 图片地址（可选）
   * @param {Boolean} goodsData.is_multi_unit - 是否多单位
   * @param {Object} goodsData.unit_small - 小单位配置 {name, price}
   * @param {Object} goodsData.unit_big - 大单位配置（可选）{name, price}
   * @param {Number} goodsData.rate - 换算率（默认1）
   * @param {Number} goodsData.stock - 库存（最小单位）
   * @returns {Promise<{code: 0, data: {_id: String}}>}
   */
  async createGoods(goodsData) {
    const { name, category_id, img_url, is_multi_unit, unit_small, unit_big, rate, stock } =
      goodsData

    // 参数校验
    if (!name || !name.trim()) {
      return { code: 4001, msg: '商品名称不能为空', data: null }
    }

    if (!unit_small || !unit_small.name || unit_small.price === undefined) {
      return { code: 4001, msg: '小单位配置不完整', data: null }
    }

    // 如果有 category_id，验证分类是否属于当前租户
    if (category_id) {
      const db = uniCloud.database()
      const catRes = await db
        .collection('wh_categories')
        .where({ _id: category_id, tenant_id: this.tenant_id })
        .count()

      if (catRes.total === 0) {
        return { code: 4003, msg: '分类不存在或无权限', data: null }
      }
    }

    // 构建商品数据
    const newGoods = {
      tenant_id: this.tenant_id,
      name: name.trim(),
      category_id: category_id || null,
      img_url: img_url || '',
      is_multi_unit: !!is_multi_unit,
      unit_small: {
        name: unit_small.name,
        price: parseInt(unit_small.price) || 0
      },
      rate: parseInt(rate) || 1,
      stock: parseInt(stock) || 0,
      is_on_sale: true
    }

    // 多单位配置
    if (is_multi_unit && unit_big && unit_big.name) {
      newGoods.unit_big = {
        name: unit_big.name,
        price: parseInt(unit_big.price) || 0
      }
    } else {
      newGoods.unit_big = { name: '', price: 0 }
    }

    const db = uniCloud.database()
    const res = await db.collection('wh_goods').add(newGoods)

    return {
      code: 0,
      msg: '创建成功',
      data: {
        _id: res.id
      }
    }
  },

  /**
   * 更新商品
   * @param {String} goods_id - 商品ID
   * @param {Object} goodsData - 商品数据（同 createGoods）
   * @returns {Promise<{code: 0, msg: String}>}
   */
  async updateGoods(goods_id, goodsData) {
    if (!goods_id) {
      return { code: 4001, msg: '商品ID不能为空', data: null }
    }

    const { name, category_id, img_url, is_multi_unit, unit_small, unit_big, rate, stock } =
      goodsData

    // 参数校验
    if (!name || !name.trim()) {
      return { code: 4001, msg: '商品名称不能为空', data: null }
    }

    if (!unit_small || !unit_small.name || unit_small.price === undefined) {
      return { code: 4001, msg: '小单位配置不完整', data: null }
    }

    // 验证商品是否存在且属于当前租户
    const db = uniCloud.database()
    const checkRes = await db
      .collection('wh_goods')
      .where({ _id: goods_id, tenant_id: this.tenant_id })
      .count()

    if (checkRes.total === 0) {
      return { code: 4004, msg: '商品不存在或无权限', data: null }
    }

    // 如果有 category_id，验证分类
    if (category_id) {
      const catRes = await db
        .collection('wh_categories')
        .where({ _id: category_id, tenant_id: this.tenant_id })
        .count()

      if (catRes.total === 0) {
        return { code: 4003, msg: '分类不存在或无权限', data: null }
      }
    }

    // 构建更新数据
    const updateData = {
      name: name.trim(),
      category_id: category_id || null,
      img_url: img_url || '',
      is_multi_unit: !!is_multi_unit,
      unit_small: {
        name: unit_small.name,
        price: parseInt(unit_small.price) || 0
      },
      rate: parseInt(rate) || 1,
      stock: parseInt(stock) || 0
    }

    // 多单位配置
    if (is_multi_unit && unit_big && unit_big.name) {
      updateData.unit_big = {
        name: unit_big.name,
        price: parseInt(unit_big.price) || 0
      }
    } else {
      updateData.unit_big = { name: '', price: 0 }
    }

    await db.collection('wh_goods').doc(goods_id).update(updateData)

    return {
      code: 0,
      msg: '更新成功',
      data: null
    }
  },

  /**
   * 上架/下架
   * @param {String} goods_id - 商品ID
   * @param {Boolean} is_on_sale - 是否上架
   * @returns {Promise<{code: 0, msg: String}>}
   */
  async toggleOnSale(goods_id, is_on_sale) {
    if (!goods_id) {
      return { code: 4001, msg: '商品ID不能为空', data: null }
    }

    const db = uniCloud.database()

    // 验证商品是否存在
    const checkRes = await db
      .collection('wh_goods')
      .where({ _id: goods_id, tenant_id: this.tenant_id })
      .count()

    if (checkRes.total === 0) {
      return { code: 4004, msg: '商品不存在或无权限', data: null }
    }

    await db.collection('wh_goods').doc(goods_id).update({
      is_on_sale: !!is_on_sale
    })

    return {
      code: 0,
      msg: is_on_sale ? '已上架' : '已下架',
      data: null
    }
  },

  /**
   * 删除商品
   * @param {String} goods_id - 商品ID
   * @returns {Promise<{code: 0, msg: String}>}
   */
  async deleteGoods(goods_id) {
    if (!goods_id) {
      return { code: 4001, msg: '商品ID不能为空', data: null }
    }

    const db = uniCloud.database()

    // 验证商品是否存在
    const checkRes = await db
      .collection('wh_goods')
      .where({ _id: goods_id, tenant_id: this.tenant_id })
      .count()

    if (checkRes.total === 0) {
      return { code: 4004, msg: '商品不存在或无权限', data: null }
    }

    // TODO: 检查是否有关联订单，如有则不允许删除

    await db.collection('wh_goods').doc(goods_id).remove()

    return {
      code: 0,
      msg: '删除成功',
      data: null
    }
  }
}
