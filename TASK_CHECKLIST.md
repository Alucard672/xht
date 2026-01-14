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

> 建议每周更新此清单，保持任务状态同步
