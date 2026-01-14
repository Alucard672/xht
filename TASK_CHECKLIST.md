# 乡货通 (Xianghuotong) 开发任务清单

> 最后更新: 2026-01-15
> 项目状态: 开发中

---

## 📊 项目概览

| 指标       | 数量 |
| ---------- | ---- |
| 总页面数   | 30+  |
| 已完成页面 | 18   |
| 待完成页面 | 12+  |
| 云对象     | 7    |
| 已完善     | 5    |
| 待完善     | 2    |

---

## ✅ 已完成任务 (18项)

### 客户端 (Client)

- [x] 订货页面 (shop.vue) - 2026-01-14
- [x] 结算页面 (checkout.vue) - 2026-01-13
- [x] 订单列表 (orders.vue) - 2026-01-13
- [x] 我的资产 (assets.vue) - 2026-01-15 ⭐ 新增

### 商家端 (Merchant)

- [x] 商家登录 (login.vue)
- [x] 商家入驻 (register.vue)
- [x] 工作台 (dashboard.vue)
- [x] 商品列表 (goods/list.vue)
- [x] 商品编辑 (goods/edit.vue)
- [x] 分类管理 (goods/category.vue)
- [x] 订单列表 (order/list.vue)
- [x] 客户列表 (customer/list.vue)
- [x] 客户编辑 (customer/edit.vue)
- [x] 客户详情 (customer/detail.vue)
- [x] 客户选择器 (customer/picker.vue)
- [x] 店铺设置 (setting/index.vue)

### 管理端 (Admin)

- [x] 商户管理列表 (merchant/list.vue) - 2026-01-15 完善

### 公共组件

- [x] PageContainer.vue
- [x] SectionCard.vue
- [x] PrimaryButtonBar.vue
- [x] FabButton.vue
- [x] StatusTag.vue
- [x] FormSection.vue
- [x] FieldRow.vue
- [x] FilterBar.vue
- [x] EmptyState.vue
- [x] GoodsCard.vue
- [x] CustomerCard.vue

---

## 📋 待完成任务

### 🔴 高优先级 (必须完成)

#### 1. 客户端-扫码进店功能

**状态**: ❌ 未开始
**文件**: `src/pages/client/scan.vue` (新建)
**描述**: 实现扫一扫功能，通过扫描商家店铺码进入对应店铺
**依赖**: 无
**验收标准**:

- [ ] 支持扫一扫调用摄像头
- [ ] 解析店铺码获取 tenant_id
- [ ] 自动跳转到 shop 页面并加载对应店铺商品
- [ ] 处理无效二维码情况

#### 2. 客户端-我的资产入口

**状态**: ❌ 未开始
**文件**: `src/pages/client/shop.vue` 修改
**描述**: 在店铺页面或个人中心添加"我的资产"入口按钮
**依赖**: assets.vue 已完成
**验收标准**:

- [ ] shop.vue 页面添加入口按钮
- [ ] 或在我的订单页面添加入口
- [ ] 按钮样式符合设计规范

#### 3. 客户还款云对象方法

**状态**: ⚠️ 部分完成
**文件**: `uniCloud-aliyun/cloudfunctions/wh-customer-co/index.obj.js`
**描述**: 完善 repay 方法，支持客户还款功能
**依赖**: wh_debt_logs 表
**验收标准**:

- [ ] 验证客户身份
- [ ] 记录还款到 wh_debt_logs
- [ ] 更新客户 total_debt
- [ ] 事务保证数据一致性

#### 4. 管理端-员工管理

**状态**: ❌ 未开始
**文件**: `src/pages/admin/employee/list.vue`
**描述**: 完善员工管理页面，支持员工账号管理
**依赖**: wh-admin-co 已有基础方法
**验收标准**:

- [ ] 员工列表分页展示
- [ ] 支持搜索员工
- [ ] 添加/编辑员工
- [ ] 设置员工角色(管理员/操作员)

#### 5. 管理端-数据统计

**状态**: ❌ 未开始
**文件**: `src/pages/admin/statistics/index.vue`
**描述**: 完善数据统计页面，展示平台核心指标
**依赖**: wh-admin-co.getPlatformStats()
**验收标准**:

- [ ] 平台总览数据(商户数、订单数、交易额)
- [ ] 趋势图表
- [ ] TOP 商户排行
- [ ] 导出报表功能

---

### 🟡 中优先级 (建议完成)

#### 6. 客户端-订单详情页

**状态**: ❌ 未开始
**文件**: `src/pages/client/order/detail.vue` (新建)
**描述**: 订单详情展示页面
**依赖**: orders.vue
**验收标准**:

- [ ] 订单商品列表
- [ ] 订单状态跟踪
- [ ] 订单金额明细
- [ ] 再次购买快捷入口

#### 7. 客户端-赊账申请

**状态**: ❌ 未开始
**文件**: `src/pages/client/credit-apply.vue` (新建)
**描述**: 客户申请增加赊账额度
**依赖**: wh_customers 表
**验收标准**:

- [ ] 填写申请金额
- [ ] 备注说明
- [ ] 提交到商家审核
- [ ] 申请记录查询

#### 8. 商家端-订单详情

**状态**: ❌ 未开始
**文件**: `src/pages/merchant/order/detail.vue` (新建)
**描述**: 商家查看订单详情
**依赖**: order/list.vue
**验收标准**:

- [ ] 订单商品列表
- [ ] 客户信息
- [ ] 接单/发货/送达操作
- [ ] 分享订单小票

#### 9. 商家端-手动记一笔

**状态**: ❌ 未开始
**文件**: `src/pages/merchant/customer/debt-add.vue` (新建)
**描述**: 商家手动给客户增加欠款(非订单)
**依赖**: wh_debt_logs 表
**验收标准**:

- [ ] 选择客户
- [ ] 输入金额
- [ ] 备注说明
- [ ] 提交后更新客户欠款

---

### 🟢 低优先级 (可选优化)

#### 10. 客户端-商品搜索优化

**状态**: ⚠️ 部分完成
**文件**: `src/pages/client/shop.vue`
**描述**: 完善商品搜索功能
**优化点**:

- [ ] 支持按名称/分类搜索
- [ ] 搜索历史记录
- [ ] 热门搜索推荐

#### 11. 商家端-库存预警

**状态**: ❌ 未开始
**文件**: 新建或集成到商品列表
**描述**: 库存低于阈值时提醒商家
**依赖**: wh_goods 表
**验收标准**:

- [ ] 设置库存预警阈值
- [ ] 低库存商品列表
- [ ] 一键补货提醒

#### 12. 消息通知功能

**状态**: ❌ 未开始
**文件**: 新增消息模块
**描述**: 订单状态变更、还款提醒等通知
**依赖**: uniPush 或其他推送服务
**验收标准**:

- [ ] 订单状态通知
- [ ] 还款提醒通知
- [ ] 系统公告
- [ ] 消息已读/未读状态

---

## 🎯 开发流程建议

### 建议执行顺序

```
第1阶段: 核心交易闭环
  1. 扫码进店 → 2. 订货 → 3. 结算 → 4. 订单处理 → 5. 还款

第2阶段: 管理后台完善
  6. 员工管理 → 7. 数据统计

第3阶段: 体验优化
  8. 订单详情 → 9. 赊账申请 → 10. 手动记一笔
```

### 每日开发节奏

1. **晨会**: 选取当日任务
2. **开发**: 按任务清单推进
3. **提交**: 每完成一个任务立即 git commit
4. **Review**: 自测 + 代码审查

---

## 📁 文件结构参考

```
xht2/
├── src/
│   ├── pages/
│   │   ├── client/
│   │   │   ├── scan.vue           # ⬅️ 新增
│   │   │   ├── assets.vue         # ✅ 已完成
│   │   │   ├── order/
│   │   │   │   └── detail.vue     # ⬅️ 新增
│   │   │   └── credit/
│   │   │       └── apply.vue      # ⬅️ 新增
│   │   ├── merchant/
│   │   │   ├── order/
│   │   │   │   └── detail.vue     # ⬅️ 新增
│   │   │   └── customer/
│   │   │       └── debt-add.vue   # ⬅️ 新增
│   │   └── admin/
│   │       └── employee/
│   │           └── list.vue       # ⬅️ 待完善
│   │
│   └── uniCloud-aliyun/
│       └── cloudfunctions/
│           └── wh-customer-co/
│               └── index.obj.js   # ⬅️ 需完善 repay 方法
```

---

## 🚀 启动命令

```bash
# 进入项目目录
cd xht2

# H5 开发模式
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 商家端开发
npm run dev:merchant

# 客户端开发
npm run dev:client

# 管理端开发
npm run dev:admin

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

---

## 📝 任务状态标记说明

| 标记        | 含义                 |
| ----------- | -------------------- |
| ✅ 已完成   | 代码已实现并测试通过 |
| ⚠️ 部分完成 | 有基础但需完善       |
| ❌ 未开始   | 尚未开始开发         |
| 🔴 高优先级 | 核心功能，必须完成   |
| 🟡 中优先级 | 重要功能，建议完成   |
| 🟢 低优先级 | 优化功能，可选完成   |
| ⬅️ 新增     | 本次清单新增的任务   |

---

> 建议每周更新此清单，保持任务状态同步
