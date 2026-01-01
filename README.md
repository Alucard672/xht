# 📑 项目开发规格书：乡货通 (Xianghuotong)

> **版本：** 1.0.0
> **类型：** 乡镇批发 SaaS (UniApp + UniCloud)
> **核心理念：** 一码两面（商家高效管账 / 客户极简订货）

---

## 1. 项目概况 (Project Overview)

* **项目名称：** 乡货通 (Xianghuotong)
* **商业模式：** B2B2C 垂直 SaaS。
* **目标用户：**
    * **B端 (商家)：** 乡镇一级批发部（粮油、副食、酒水）。痛点是手写单据乱、赊账难记、多单位换算麻烦。
    * **C端 (客户)：** 村镇小卖部/超市。痛点是进货打电话说不清、不知道欠多少钱。
* **核心功能：** 商品管理（多单位）、双端交易、自动记账、赊账管理。

---

## 2. 技术架构 (Tech Stack)

| 模块 | 选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | **UniApp (Vue3)** | 使用 Composition API (`<script setup>`) |
| **UI 组件库** | **uView-Plus** | 必须兼容 Vue3，适合移动端快速开发 |
| **后端服务** | **UniCloud (阿里云版)** | Serverless 架构，无运维成本 |
| **数据库** | **UniCloud JSON DB** | NoSQL 文档型数据库 |
| **查询语言** | **JQL** | 前端直接通过 `clientDB` 安全查库 |
| **用户体系** | **uni-id** | `uni-id-pages` + `uni-id-co` (微信一键登录) |
| **开发环境** | **HBuilderX** + **Cursor** | HBuilderX 负责编译部署，Cursor 负责写代码 |

---

## 3. 核心数据库设计 (Database Schema)

> ⚠️ **SaaS 核心规则：** 所有业务表必须包含 `tenant_id` (商家/租户ID) 字段，并建立索引。

### 3.1 租户表 (`wh_tenants`)
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `_id` | String | 租户唯一ID |
| `name` | String | 店铺名称 (如：老王批发部) |
| `owner_uid` | String | 关联的老板 `uni-id` |
| `expired_at` | Timestamp | 会员到期时间 |
| `settings` | Object | 店铺配置 (是否允许赊账、最低起送等) |

### 3.2 商品表 (`wh_goods`) - **核心难点**
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `tenant_id` | String | **[索引]** 所属商家 |
| `name` | String | 商品名称 |
| `category_id` | String | 分类ID |
| `img_url` | String | 图片地址 |
| `is_multi_unit` | Boolean | 是否开启多单位 (箱/瓶) |
| `unit_big` | Object | `{ name: "箱", price: 2400 }` (价格单位: 分) |
| `unit_small` | Object | `{ name: "瓶", price: 100 }` |
| `rate` | Int | 换算率 (如 24，即 1箱=24瓶) |
| `stock` | Int | **总库存 (以最小单位存储)**。如存 240 代表 10箱 |
| `is_on_sale` | Boolean | 上架状态 |

### 3.3 客户/账本表 (`wh_customers`)
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `tenant_id` | String | **[索引]** 所属商家 |
| `user_uid` | String | 关联的小卖部老板 UID |
| `alias` | String | 商家备注名 (如：村口李大爷) |
| `phone` | String | 手机号 |
| `total_debt` | Int | **当前欠款总额** (单位: 分)。正数=欠商家钱 |
| `last_trade_time` | Timestamp | 最后交易时间 |

### 3.4 订单表 (`wh_orders`)
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `tenant_id` | String | **[索引]** |
| `customer_id` | String | 下单客户ID |
| `order_no` | String | 订单号 (时间戳+随机数) |
| `status` | Int | 0:待接单, 1:待发货, 2:已完成, -1:已取消 |
| `payment_method` | String | `credit` (赊账/记账), `wechat` (在线支付) |
| `items` | Array | 商品快照数组 (存当时的名称、价格、数量) |
| `total_fee` | Int | 订单总金额 (分) |

---

## 4. 功能模块详情 (Functional Specs)

### 📱 客户端 (小卖部老板)
1.  **扫码进店：**
    * 必须通过扫商家的“店铺码”进入，自动绑定 `tenant_id`。
2.  **商品列表：**
    * 左侧分类导航，右侧商品流。
    * **多单位展示：** 显示 "￥24/箱"，点击 `+` 号弹出选规格面板。
3.  **购物车 (Cart)：**
    * 支持复杂数量编辑：`[ 2 ] 箱 [ 5 ] 瓶`。
    * 实时计算总价。
4.  **下单结算：**
    * 确认收货地址（支持简单的文本输入或选择）。
    * 选择支付方式（默认勾选“记账”）。
5.  **我的资产：**
    * **红色大字**显示当前欠款。
    * 查看历史采购订单。

### 💻 商家端 (批发部老板)
1.  **工作台：**
    * 今日数据：订单数、销售额。
    * 常用功能入口：开单、商品、客户、店铺码。
2.  **商品管理：**
    * 新增商品：支持上传图片（自动压缩）、设置多单位换算率。
    * 库存管理：支持直接修改库存数字。
3.  **订单处理：**
    * 接单 -> 发货 -> 确认送达。
    * **分享单据：** 生成类似小票的长图片（包含商品明细、总价、收款码），方便发微信。
4.  **赊账管理 (核心)：**
    * 客户列表按欠款金额排序。
    * **记一笔：** 手动录入一笔欠款（非系统订单）。
    * **还一笔：** 录入还款金额，自动扣减欠款。

---

## 5. AI 开发指令规则 (Rules for Cursor)

**请将以下英文内容复制到 Cursor 的 `.cursorrules` 文件中，以确保 AI 理解 SaaS 逻辑：**

```markdown
# Role Definition
You are an expert full-stack developer specialized in UniApp (Vue3 + Vite) and UniCloud (Aliyun). You are building "Xianghuotong", a SaaS for wholesale merchants.

# Technical Constraints
- **Framework:** Vue 3 with `<script setup>`.
- **UI Library:** `uView-Plus`. Use standard components (u-button, u-cell, u-input).
- **Database:** UniCloud JSON DB.
- **Language:** JavaScript (ES6+).

# Critical Business Rules (SaaS Logic)
1. **Tenant Isolation:**
   - Every database query (JQL) MUST strictly filter by `tenant_id`.
   - Example: `db.collection('wh_goods').where('tenant_id == "..."').get()`
   - Never query data without a tenant context.

2. **Price & Stock Logic:**
   - **Currency:** All prices are stored as **Integers (Unit: Fen/Cent)**. Divide by 100 only for display.
   - **Stock:** Stock is always stored in the **Smallest Unit**.
   - **Conversion:**
     - Display Stock = `Math.floor(total_stock / rate)` (Big Unit) + `total_stock % rate` (Small Unit).
     - Total Price = `(count_big * rate + count_small) * price_small`.

3. **Offline-Friendly UI:**
   - Buttons must be large (min-height: 44px).
   - Text colors must have high contrast.
   - Use simple language suitable for rural users.

# Coding Workflow
1. When asked to implement a feature, FIRST check if the `database schema` (*.schema.json) supports it. If not, generate the schema code first.
2. THEN generate the Cloud Object (Backend logic) if complex calculation is needed.
3. FINALLY generate the Vue Page code.