# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Xianghuotong (乡货通)** is a SaaS platform for rural wholesale merchants, built with UniApp (Vue3) and UniCloud (Aliyun). The system supports multiple user roles and features strict multi-tenant data isolation.

### Architecture Type

- **Frontend**: UniApp with Vue3 Composition API (`<script setup lang="ts">`)
- **UI Library**: uView-Plus (Vue3 compatible)
- **Backend**: UniCloud Serverless (Aliyun)
- **Database**: UniCloud JSON DB (NoSQL)
- **Query Language**: JQL via `uni-clientDB` or `db.collection()`

## Development Commands

### Primary Development Modes

```bash
# Merchant backend (商家管理端)
npm run dev:mp-weixin:merchant   # WeChat Mini Program
npm run dev:merchant              # H5 Web

# Client app (客户端-小卖部老板)
npm run dev:mp-weixin:client      # WeChat Mini Program
npm run dev:client                # H5 Web

# Build for production
npm run build:mp-weixin:merchant
npm run build:mp-weixin:client
```

### Quality Tools

```bash
npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting
npm run type-check    # Vue TypeScript compiler
```

## Project Structure

```
src/
├── pages/
│   ├── merchant/           # Merchant backend (B-end)
│   │   ├── login/          # Merchant authentication
│   │   ├── dashboard/      # Dashboard with statistics
│   │   ├── goods/          # Goods management
│   │   ├── customer/       # Customer/debtor management
│   │   ├── order/          # Order processing
│   │   ├── setting/        # Shop settings
│   │   └── renewal/        # Subscription renewal
│   └── client/             # Client app (C-end)
│       ├── shop/           # Browse goods
│       ├── checkout/       # Checkout process
│       ├── orders/         # Order history
│       ├── assets/         # Customer debts/assets
│       └── credit/         # Credit applications
├── utils/
│   └── cloud.ts            # Cloud object wrapper with logging
└── pages.json              # Page routing configuration

uniCloud-aliyun/
├── cloudfunctions/
│   ├── wh-merchant-co/     # Merchant operations
│   ├── wh-goods-co/        # Goods management
│   ├── wh-customer-co/     # Customer management
│   ├── wh-order-co/        # Order processing
│   └── wh-user-co/         # User management
├── database/
│   └── *.schema.json       # Database schemas with validation
└── cloudfunctions/common/
    ├── uni-id-common/      # User authentication
    └── uni-config-center/  # Configuration
```

## Critical Business Rules

### 1. Multi-Tenant Isolation (CRITICAL)

All business tables are scoped to a specific tenant (merchant). **Every** database query MUST include `tenant_id` filtering:

```javascript
// ✅ CORRECT
const tenant_id = uni.getStorageSync('tenant_id')
db.collection('wh_goods').where(`tenant_id == '${tenant_id}'`).get()

// ❌ WRONG - Never query without tenant context
db.collection('wh_goods').get()
```

**Tables with tenant isolation**: `wh_goods`, `wh_customers`, `wh_orders`, `wh_debt_logs`, `wh_shop_codes`
**Global tables (no tenant_id)**: `uni-id-users`, `wh_tenants`, `wh_credit_apps`

### 2. Currency Handling

All monetary values are stored as **integers** in the database (unit: fen/分). Display by dividing by 100:

```javascript
// Database: Store as 1050 (represents 10.50 yuan)
price: 1050

// Display: Convert to yuan
displayPrice: (price / 100).toFixed(2)
```

### 3. Multi-Unit Inventory System

Stock is stored in the **smallest unit**. The cart supports simultaneous selection of big and small units:

```javascript
// Example: 2 boxes + 5 bottles (1 box = 24 bottles)
// Formula: Total Price = (big_qty * rate + small_qty) * small_unit_price
totalPrice = (2 * 24 + 5) * 100 = 5300 (53.00 yuan)
```

### 4. Order Types

- **customer**: Customer places order via WeChat Mini Program
- **agent**: Merchant places order on behalf of customer (代下单)

Both types are counted toward merchant sales statistics.

### 5. User Roles

- **Merchant**: Shop owners with paid subscriptions (expiry-controlled)
- **Customer**: End customers (free, WeChat-authenticated)
- A single user can be both a merchant and a customer

### 6. Merchant Subscription Status

```javascript
status: 0 // Pending review
status: 1 // Active
status: 2 // Frozen
status: 3 // Expired
```

## Database Schema Key Fields

### wh_tenants (Merchant shops)

- `status`: Merchant account status
- `expired_at`: Subscription expiry timestamp
- `owner_uid`: Associated user uni-id

### wh_goods (Products)

- `is_multi_unit`: Enable multi-unit (box/bottle)
- `unit_big`: `{ name: "箱", price: 2400 }`
- `unit_small`: `{ name: "瓶", price: 100 }`
- `rate`: Conversion rate (e.g., 24 bottles = 1 box)
- `stock`: Total stock in smallest unit

### wh_customers (Customer ledger)

- `total_debt`: Current debt in cents (positive = owes money)
- `credit_limit`: Credit limit in cents (default: 5000)
- `user_uid`: Links to `uni-id-users`

### wh_orders (Orders)

- `order_type`: `customer` or `agent`
- `payment_method`: `credit` (赊账) or `wechat` (在线支付)
- `status`: 0 (pending), 1 (completed), -1 (cancelled)

### wh_debt_logs (Credit transactions)

- `type`: `borrow` (赊账) or `repay` (还款)
- `amount`: Amount in cents (positive for borrow, negative for repay)
- `source`: `order` or `manual`

## Cloud Object Pattern

Each business domain has its own Cloud Object in `uniCloud-aliyun/cloudfunctions/`. All cloud object calls should use the wrapper in `src/utils/cloud.ts` for automatic request/response logging:

```javascript
import { importObject } from '@/utils/cloud'

const merchantCO = importObject('wh-merchant-co')
const result = await merchantCO.getDashboardData()
```

## UI/UX Constraints

### Mini Program Environment

- **DO NOT** use `window` or `document` objects
- **DO NOT** use `axios` (use `uni.request` or cloud object calls)
- Use `uni.showToast({ icon: 'none' })` for error messages

### Design for Rural Users

- Large buttons (min-height: 44px)
- High contrast colors
- Simple, clear language
- Red text for debts (immediate visual cue)

## Workflow Protocol

1. **Schema First**: Before implementing features, verify the database schema exists in `uniCloud-aliyun/database/*.schema.json`
2. **Cloud First**: For complex logic, create Cloud Object methods first
3. **UI Last**: Connect Vue pages to Cloud Objects or JQL queries

## Entry Points

- **Merchant Login**: `/pages/merchant/login`
- **Client Entry**: Via WeChat QR code scan (URL parameter: `tenant_id`)

## Important Constraints

1. **No admin code**: Admin panel is a separate project. This codebase only contains Merchant and Client code.
2. **No merchant self-purchase**: All users are treated as customers in their own shops
3. **Strict tenant isolation**: Never expose data from one tenant to another
4. **Currency as integers**: Always store prices as cents, convert only for display
