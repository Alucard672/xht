# 乡货通 (Xianghuotong) 开发任务清单

> 最后更新: 2026-01-15
> 项目状态: 开发中

---

## 📊 项目概览

| 指标       | 数量 |
| ---------- | ---- |
| 总页面数   | 35+  |
| 已完成页面 | 25   |
| 待完成页面 | 10+  |
| 云对象     | 7    |
| 已完善     | 5    |
| 待完善     | 2    |

---

## ✅ 已完成任务 (25项)

### 客户端 (Client)

- [x] 订货页面 (shop.vue)
- [x] 结算页面 (checkout.vue)
- [x] 订单列表 (orders.vue)
- [x] 我的资产 (assets.vue) - 2026-01-15 ⭐
- [x] 订单详情页 (order/detail.vue) - 2026-01-15 ⭐
- [x] 扫码进店 (scan.vue) - 2026-01-15 ⭐
- [x] 赊账申请 (credit/apply.vue) - 2026-01-15 ⭐
- [x] 商品搜索优化 - 2026-01-15 ⭐ (搜索历史、热门搜索)

### 商家端 (Merchant)

- [x] 商家登录 (login.vue)
- [x] 商家入驻 (register.vue)
- [x] 工作台 (dashboard.vue)
- [x] 商品列表 (goods/list.vue)
- [x] 商品编辑 (goods/edit.vue)
- [x] 分类管理 (goods/category.vue)
- [x] 订单列表 (order/list.vue)
- [x] 订单详情页 (order/detail.vue) - 2026-01-15 ⭐
- [x] 客户列表 (customer/list.vue)
- [x] 客户编辑 (customer/edit.vue)
- [x] 客户详情 (customer/detail.vue)
- [x] 客户选择器 (customer/picker.vue)
- [x] 手动记一笔 (customer/debt-add.vue) - 2026-01-15 ⭐
- [x] 店铺设置 (setting/index.vue)
- [x] 库存预警 - 2026-01-15 ⭐
- [x] 消息通知 (notification/list.vue) - 2026-01-15 ⭐

### 管理端 (Admin)

- [x] 商户管理列表 (merchant/list.vue) - 2026-01-15 完善
- [x] 员工管理列表 (employee/list.vue) - 2026-01-15 完善
- [x] 数据统计页 (statistics/index.vue) - 2026-01-15 完善

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

### 🔴 高优先级

#### 1. 客户端-扫码进店功能

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/client/scan.vue`

---

### 🟡 中优先级

#### 6. 客户端-订单详情页

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/client/order/detail.vue`

#### 7. 客户端-赊账申请

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/client/credit/apply.vue`

#### 8. 商家端-订单详情

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/merchant/order/detail.vue`

#### 9. 商家端-手动记一笔

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/merchant/customer/debt-add.vue`

---

### 🟢 低优先级 (可选优化) - ✅ 全部完成

#### 10. 客户端-商品搜索优化

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/client/shop.vue`
**新增功能**:
- 搜索历史记录（本地存储，最多20条）
- 热门搜索关键词
- 一键清除历史

#### 11. 商家端-库存预警

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/merchant/goods/list.vue`
**新增功能**:
- 库存预警入口（≤10件时提醒）
- 低库存列表筛选
- 补货提醒弹窗

#### 12. 消息通知功能

**状态**: ✅ 已完成 - 2026-01-15
**文件**: `src/pages/merchant/notification/list.vue`
**新增功能**:
- 消息列表展示
- 未读标记
- 消息分类图标
- 全部标为已读

---

## 📝 任务状态标记说明

| 标记 | 含义 |
|------|------|
| ✅ 已完成 | 代码已实现并测试通过 |
| ⚠️ 部分完成 | 有基础但需完善 |
| ❌ 未开始 | 尚未开始开发 |
| 🔴 高优先级 | 核心功能，必须完成 |
| 🟡 中优先级 | 重要功能，建议完成 |
| 🟢 低优先级 | 优化功能，可选完成 |
| ⭐ 新增 | 本次更新新增 |

---

## 🚀 下一步改进计划 (Next Improvement Plan)

> 基于业务分析报告，以下是下一步需要完善的架构性问题

### 🔴 P0 - 架构修复 (必须完成)

#### IMP-001: 商家身份切换机制

**问题**: 商家自购与代下单数据混淆

**方案**:
- 下单前增加弹窗确认: "为客户下单" / "自己采购"
- 订单增加 `order_type` 字段: `customer` / `merchant_self` / `agent`
- 商家后台增加统计筛选: 排除/包含自购订单

**文件**:
- `src/pages/client/shop.vue` - 添加身份选择弹窗
- `src/pages/client/checkout.vue` - 确认下单模式
- `uniCloud-aliyun/cloudfunctions/wh-order-co/` - 订单类型处理

#### IMP-002: 商家有效期管理

**问题**: 商家账号有效期管理流程不完整

**方案**:
- 服务商管理端增加"商家管理"页面
- 支持: 创建商家、设置有效期、审核状态、冻结/解冻
- 商家登录时检查有效期，过期则提示并限制功能

**文件**:
- `src/pages/admin/merchant/list.vue` - 完善商家管理
- `uniCloud-aliyun/cloudfunctions/wh-admin-co/` - 商家CRUD + 有效期检查
- `pages.json` - 添加商家管理路由

#### IMP-003: 客户全局关联表

**问题**: 客户数据模型不统一

**方案**:
- 新建 `wh_customer_tenants` 表，记录客户与商家的关联
- 客户详情页显示跨商家统计
- "我的商家"列表从 `wh_customer_tenants` 获取

**文件**:
- `uniCloud-aliyun/database/wh_customer_tenants.schema.json` - 新建表
- `src/pages/client/shop.vue` - 商家选择器
- `src/pages/client/my-shops.vue` - 新建"我的商家"页面

### 🟡 P1 - 功能完善

#### IMP-004: 商家注册流程

**问题**: 商家自助注册缺少审核和有效期配置

**方案**:
- 注册页面增加"商家注册"入口
- 注册后状态为"待审核"
- 服务商审核后设置有效期
- 短信/微信通知审核结果

#### IMP-005: 财务报表增强

**问题**: 无法区分订单类型统计数据

**方案**:
- 后端增加统计 API，支持按 `order_type` 筛选
- 前端增加筛选器: 全部/客户订单/代下单/自购
- 图表展示区分展示

#### IMP-006: 商家数据导出

**问题**: 商家需要导出数据进行财务对账

**方案**:
- 订单导出: 按时间范围筛选，导出 Excel
- 客户导出: 导出客户列表及欠款信息
- 商品导出: 导出商品清单及库存

### 🟢 P2 - 体验优化

#### IMP-007: 商家后台"我的店铺"入口

**问题**: 商家无法从后台快速访问自己的店铺

**方案**:
- 工作台增加"进入店铺"按钮
- 或在右上角增加店铺预览入口

#### IMP-008: 扫码确认提示

**问题**: 扫码进入店铺后无明确提示

**方案**:
- 进入店铺时显示 toast: "已进入 XXX 店铺"
- 或顶部显示店铺名称横幅

#### IMP-009: 客户主动解绑商家

**问题**: 客户无法主动取消关联商家

**方案**:
- "我的商家"页面增加"取消关联"按钮
- 确认后删除 `wh_customer_tenants` 记录

---

### 📋 改进计划清单

| ID | 任务 | 优先级 | 预计工时 | 状态 |
|----|------|--------|----------|------|
| IMP-001 | 商家身份切换机制 | P0 | 2天 | ⏳ 待开始 |
| IMP-002 | 商家有效期管理 | P0 | 3天 | ⏳ 待开始 |
| IMP-003 | 客户全局关联表 | P0 | 2天 | ⏳ 待开始 |
| IMP-004 | 商家注册流程 | P1 | 3天 | ⏳ 待开始 |
| IMP-005 | 财务报表增强 | P1 | 2天 | ⏳ 待开始 |
| IMP-006 | 数据导出功能 | P1 | 2天 | ⏳ 待开始 |
| IMP-007 | 我的店铺入口 | P2 | 0.5天 | ⏳ 待开始 |
| IMP-008 | 扫码确认提示 | P2 | 0.5天 | ⏳ 待开始 |
| IMP-009 | 客户解绑商家 | P2 | 0.5天 | ⏳ 待开始 |

---

> 建议按 P0 → P1 → P2 顺序执行，P0 完成后系统架构趋于稳定

---

> 建议每周更新此清单，保持任务状态同步
