/**
 * OA系统云对象调用封装
 * 自动处理token传递
 */

const oaCo = uniCloud.importObject('wh-oa-co')

// 封装方法，自动带上token
export const oaAPI = {
  // 获取token
  getToken() {
    return uni.getStorageSync('oa_token')
  },
  
  // 获取当前用户信息
  getUser() {
    return uni.getStorageSync('oa_user')
  },
  
  // 判断是否是超级管理员
  isSuperAdmin() {
    const user = this.getUser()
    return user && user.role === 'super_admin'
  },
  
  // 登录
  async login(params) {
    return oaCo.login(params)
  },
  
  // 初始化管理员
  async initDefaultAdmin() {
    return oaCo.initDefaultAdmin()
  },
  
  // 获取员工列表
  async getEmployeeList(params = {}) {
    return oaCo.getEmployeeList({
      ...params,
      _token: this.getToken()
    })
  },
  
  // 添加员工
  async addEmployee(params) {
    return oaCo.addEmployee({
      ...params,
      _token: this.getToken()
    })
  },
  
  // 修改员工
  async updateEmployee(id, params) {
    return oaCo.updateEmployee(id, {
      ...params,
      _token: this.getToken()
    })
  },
  
  // 删除员工
  async deleteEmployee(id) {
    return oaCo.deleteEmployee(id, {
      _token: this.getToken()
    })
  },
  
  // 重置密码
  async resetEmployeePassword(id, params) {
    return oaCo.resetEmployeePassword(id, {
      ...params,
      _token: this.getToken()
    })
  },
  
  // 获取商家列表
  async getMerchantList(params = {}) {
    return oaCo.getMerchantList({
      ...params,
      _token: this.getToken()
    })
  },
  
  // 设置商家密码
  async setMerchantPassword(id, params) {
    return oaCo.setMerchantPassword(id, params)
  },
  
  // 设置商家有效期
  async setMerchantExpired(id, params) {
    return oaCo.setMerchantExpired(id, params)
  },
  
  // 获取商家详情
  async getMerchantDetail(id) {
    return oaCo.getMerchantDetail(id, {
      _token: this.getToken()
    })
  },

  //#region ========== 套餐管理API ==========

  // 获取套餐列表
  async getPackageList() {
    return oaCo.getPackageList()
  },

  // 添加套餐
  async addPackage(params) {
    return oaCo.addPackage(params)
  },

  // 修改套餐
  async updatePackage(id, params) {
    return oaCo.updatePackage(id, params)
  },

  // 删除套餐
  async deletePackage(id) {
    return oaCo.deletePackage(id)
  },

  // 套餐上架/下架
  async togglePackageStatus(id) {
    return oaCo.togglePackageStatus(id)
  },

  //#endregion

  //#region ========== 续费订单API ==========

  // 创建续费订单
  async createRenewalOrder(params) {
    return oaCo.createRenewalOrder(params)
  },

  // OA端赠送有效期
  async giftRenewal(params) {
    return oaCo.giftRenewal(params)
  },

  // 获取商家续费订单列表
  async getRenewalOrders(tenantId) {
    return oaCo.getRenewalOrders(tenantId)
  },

  // 支付回调
  async handlePaymentCallback(params) {
    return oaCo.handlePaymentCallback(params)
  }

  //#endregion
}

export default oaAPI
