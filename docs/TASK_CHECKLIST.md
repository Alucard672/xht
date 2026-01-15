# 乡货通 (Xianghuotong) 开发任务清单

> **版本**: v1.1  
> **最后更新**: 2026-01-16  
> **项目状态**: 核心功能开发中

---

## 项目概览

| 指标         | 数量 | 说明                               |
| ------------ | ---- | ---------------------------------- |
| 总页面数     | 35+  | 含客户端、商家端、管理端           |
| 已完成页面   | 25   | ✅ 已实现并测试通过                |
| 待完成页面   | 8+   | 🔄 需继续开发                      |
| 云对象数     | 7    | 后端业务逻辑封装                   |
| 已完善云对象 | 5    | ✅ 功能完整                        |
| 待完善云对象 | 2    | ⚠️ 需补充关键方法                  |
| 数据库表     | 8    | 核心业务表已定义                   |
| 待创建表     | 2    | wh_shop_codes, wh_customer_tenants |

---

## 已完成功能 (25项)

### 客户端 (Client) ✅

- [x] 订货页面 (shop.vue)
- [x] 结算页面 (checkout.vue)
- [x] 订单列表 (orders.vue)
- [x] 我的资产 (assets.vue)
- [x] 订单详情页 (order/detail.vue)
- [x] 扫码进店 (scan.vue)
- [x] 赊账申请 (credit/apply.vue)
- [x] 商品搜索优化

### 商家端 (Merchant) ✅

- [x] 商家登录 (login.vue)
- [x] 商家入驻 (register.vue)
- [x] 工作台 (dashboard.vue)
- [x] 商品列表 (goods/list.vue)
- [x] 商品编辑 (goods/edit.vue)
- [x] 分类管理 (goods/category.vue)
- [x] 订单列表 (order/list.vue)
- [x] 订单详情页 (order/detail.vue)
- [x] 客户列表 (customer/list.vue)
- [x] 客户编辑 (customer/edit.vue)
- [x] 客户详情 (customer/detail.vue)
- [x] 客户选择器 (customer/picker.vue)
- [x] 手动记一笔 (customer/debt-add.vue)
- [x] 店铺设置 (setting/index.vue)
- [x] 库存预警
- [x] 消息通知 (notification/list.vue)

### 管理端 (Admin) ✅

- [x] 商户管理列表 (merchant/list.vue)
- [x] 员工管理列表 (employee/list.vue)
- [x] 数据统计页 (statistics/index.vue)

### 公共组件 ✅

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

### 云对象 ✅

- [x] wh-goods-co (商品 CRUD)
- [x] wh-customer-co (客户管理与还款)
- [x] wh-order-co (订单生命周期)
- [x] wh-merchant-co (商家入驻与工作台)
- [x] wh-category-co (分类管理)

### 数据库表 ✅

- [x] wh_tenants (商家租户表)
- [x] wh_goods (商品表)
- [x] wh_customers (客户表)
- [x] wh_orders (订单表)
- [x] wh_debt_logs (赊账记录表)
- [x] wh_categories (商品分类表)
- [x] uni-id-users (用户账号表)
- [x] uni-id-roles (角色定义表)

---

## 待完成任务

### P0 - 核心架构完善 🔴

#### IMP-001: 商家开单记录下单人 ✅ 完成

**问题**: 商家开单时需要记录是谁下的单，便于追溯

**方案**:

- 订单增加 `created_by` 字段，记录下单人 UID
- 商家开单时填入商家 UID
- 客户下单时填入客户 UID
- 无需区分代下单/自购状态，统一按普通订单处理

**涉及文件**:

- `uniCloud-aliyun/database/wh_orders.schema.json` - 确保 created_by 字段存在
- `uniCloud-aliyun/cloudfunctions/wh-order-co/` - 创建订单时记录 created_by
- `src/pages/client/checkout.vue` - 客户下单时传入 created_by
- `src/pages/merchant/order/create.vue` - **新建** 商家开单页面

**依赖**: 无  
**预计工时**: 1 天  
**状态**: ✅ 完成

---

#### IMP-002: 商家有效期管理

**问题**: 商家账号有效期管理流程不完整

**方案**:

- 服务商管理端增加"商家管理"页面
- 支持: 创建商家、设置有效期、审核状态、冻结/解冻
- 商家登录时检查有效期，过期则提示并限制功能

**涉及文件**:

- `src/pages/admin/merchant/list.vue` - 完善商家管理 (当前仅列表，需增加编辑)
- `src/pages/admin/merchant/edit.vue` - **新建** 编辑商家信息
- `uniCloud-aliyun/cloudfunctions/wh-admin-co/` - 商家 CRUD + 有效期检查
- `uniCloud-aliyun/cloudfunctions/wh-merchant-co/` - 登录时有效期校验

**依赖**: 无  
**预计工时**: 3 天  
**状态**: ✅ 完成

---

#### IMP-003: 客户全局关联表

**问题**: 客户数据模型不统一，无法跨商家统计

**方案**:

- 新建 `wh_customer_tenants` 表，记录客户与商家的关联
- 客户详情页显示跨商家统计
- "我的商家"列表从 `wh_customer_tenants` 获取

**涉及文件**:

- `uniCloud-aliyun/database/wh_customer_tenants.schema.json` - **新建表**
- `src/pages/client/my-shops.vue` - **新建** "我的商家"页面
- `src/pages/client/shop.vue` - 扫码时创建关联记录
- `uniCloud-aliyun/cloudfunctions/wh-user-co/` - 关联表 CRUD

**依赖**: 无  
**预计工时**: 2 天  
**状态**: ✅ 完成

---

#### IMP-004: 商家店铺二维码

**问题**: 扫码进店功能缺少二维码生成与管理

**方案**:

- 新建 `wh_shop_codes` 表
- 商家端支持生成店铺二维码
- 客户端扫码解析 tenant_id

**涉及文件**:

- `uniCloud-aliyun/database/wh_shop_codes.schema.json` - **新建表**
- `src/pages/merchant/setting/qrcode.vue` - **新建** 二维码管理页面
- `uniCloud-aliyun/cloudfunctions/wh-merchant-co/` - 二维码生成与查询
- `src/pages/client/scan.vue` - 扫码解析逻辑

**依赖**: IMP-003 (客户关联表)  
**预计工时**: 2 天  
**状态**: ✅ 完成

---

### P1 - 功能完善 🟡

#### IMP-005: 商家注册流程

**问题**: 商家自助注册缺少审核和有效期配置

**方案**:

- 注册页面增加"商家注册"入口
- 注册后状态为"待审核"
- 服务商审核后设置有效期
- 短信/微信通知审核结果

**涉及文件**:

- `src/pages/merchant/register.vue` - 增强注册流程
- `src/pages/admin/merchant/list.vue` - 增加审核操作
- `uniCloud-aliyun/cloudfunctions/wh-merchant-co/` - 增加审核方法

**依赖**: IMP-002  
**预计工时**: 3 天  
**状态**: ✅ 完成

---

#### IMP-006: 财务报表统计

**问题**: 无法按订单类型筛选统计数据

**方案**:

- 后端增加统计 API，支持按时间范围筛选
- 前端增加时间范围筛选器
- 图表展示销售趋势

**涉及文件**:

- `src/pages/merchant/statistics/index.vue` - **新建** 统计页面
- `uniCloud-aliyun/cloudfunctions/wh-admin-co/` - 增加统计 API
- `src/pages/merchant/order/list.vue` - 增加时间范围筛选

**依赖**: 无  
**预计工时**: 2 天  
**状态**: ✅ 完成

---

### P2 - 体验优化 🟢

#### IMP-007: 扫码确认提示

**问题**: 扫码进入店铺后无明确提示

**方案**:

- 进入店铺时显示 toast: "已进入 XXX 店铺"
- 或顶部显示店铺名称横幅

**涉及文件**:

- `src/pages/client/scan.vue` - 增加提示
- `src/pages/client/shop.vue` - 增加店铺名称横幅

**依赖**: IMP-004  
**预计工时**: 0.5 天  
**状态**: ✅ 完成

---

#### IMP-008: 客户主动解绑商家

**问题**: 客户无法主动取消关联商家

**方案**:

- "我的商家"页面增加"取消关联"按钮
- 确认后删除 `wh_customer_tenants` 记录

**涉及文件**:

- `src/pages/client/my-shops.vue` - 增加解绑功能
- `uniCloud-aliyun/cloudfunctions/wh-user-co/` - 增加解绑方法

**依赖**: IMP-003  
**预计工时**: 0.5 天  
**状态**: ✅ 完成

---

## 不做的功能

| 功能             | 说明                     | 原因                             |
| ---------------- | ------------------------ | -------------------------------- |
| 商家自购逻辑     | 商家在自己店铺下单的场景 | 按普通客户订单处理，无需特殊逻辑 |
| 订单类型区分     | 区分代下单/自购等状态    | 无此业务需求，统一按普通订单处理 |
| 数据导出功能     | 订单/客户/商品导出 Excel | 乡镇无深度数据分析需求           |
| 商家后台店铺入口 | 工作台增加"进入店铺"按钮 | 无此业务需求                     |

---

## 待新增页面清单

| 页面         | 路径                                      | 用途                       | 优先级 | 依赖    |
| ------------ | ----------------------------------------- | -------------------------- | ------ | ------- |
| 我的商家列表 | `src/pages/client/my-shops.vue`           | 客户查看已关联的商家       | P0     | IMP-003 |
| 商家编辑     | `src/pages/admin/merchant/edit.vue`       | 编辑商家信息、有效期、状态 | P0     | IMP-002 |
| 商家开单     | `src/pages/merchant/order/create.vue`     | 商家直接创建订单           | P0     | -       |
| 二维码管理   | `src/pages/merchant/setting/qrcode.vue`   | 生成和管理店铺二维码       | P0     | IMP-004 |
| 统计页面     | `src/pages/merchant/statistics/index.vue` | 销售统计、订单分析         | P1     | -       |

---

## 待新增数据库表

| 表名                  | 用途             | 优先级 | 依赖 |
| --------------------- | ---------------- | ------ | ---- |
| `wh_customer_tenants` | 客户与商家关联表 | P0     | -    |
| `wh_shop_codes`       | 商家店铺二维码表 | P0     | -    |

---

## 待新增云对象方法

| 云对象           | 方法               | 说明           | 优先级 |
| ---------------- | ------------------ | -------------- | ------ |
| `wh-merchant-co` | `checkExpire`      | 有效期检查方法 | P0     |
| `wh-merchant-co` | `auditMerchant`    | 商家审核方法   | P1     |
| `wh-merchant-co` | `generateQRCode`   | 生成店铺二维码 | P0     |
| `wh-merchant-co` | `getShopCode`      | 获取店铺二维码 | P0     |
| `wh-admin-co`    | `getStatistics`    | 统计 API       | P1     |
| `wh-user-co`     | `bindTenant`       | 客户关联商家   | P0     |
| `wh-user-co`     | `unbindTenant`     | 客户解绑商家   | P2     |
| `wh-order-co`    | `createByMerchant` | 商家开单方法   | P0     |

---

## 执行建议

### 推荐执行顺序

```
第 1 阶段: IMP-001 → IMP-003 → IMP-004 (核心闭环)
  ├── 商家开单记录下单人
  ├── 客户关联表
  └── 店铺二维码

第 2 阶段: IMP-002 → IMP-005 (商家管理闭环)
  ├── 商家有效期管理
  └── 商家注册流程

第 3 阶段: IMP-006 (数据统计)
  └── 财务报表统计

第 4 阶段: IMP-007 → IMP-008 (体验优化)
  └── 扫码提示 + 客户解绑
```

### 里程碑

| 里程碑       | 包含任务                  | 预计时间 |
| ------------ | ------------------------- | -------- |
| M1: 核心闭环 | IMP-001, IMP-003, IMP-004 | 5 天     |
| M2: 商家管理 | IMP-002, IMP-005          | 6 天     |
| M3: 数据统计 | IMP-006                   | 2 天     |
| M4: 体验优化 | IMP-007, IMP-008          | 1 天     |

---

## 变更记录

| 日期       | 版本 | 变更内容                                                                                                   | 变更人  |
| ---------- | ---- | ---------------------------------------------------------------------------------------------------------- | ------- |
| 2026-01-16 | v1.0 | 初始版本，基于 README 核心内容重新规划                                                                     | AI 助手 |
| 2026-01-16 | v1.1 | 1. 删除代下单/自购逻辑，统一按普通订单处理 2. 删除数据导出功能 3. 删除商家后台店铺入口 4. 简化商家开单逻辑 | AI 助手 |

---

> **建议**: 每周更新此清单，保持任务状态同步
