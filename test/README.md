# 乡货通（Xianghuotong）测试指南

## 目录

- [测试环境搭建](#测试环境搭建)
- [测试目录结构](#测试目录结构)
- [如何运行测试](#如何运行测试)
- [如何编写测试](#如何编写测试)
- [Mock数据使用指南](#mock数据使用指南)
- [常见问题排查](#常见问题排查)

---

## 测试环境搭建

项目使用 **Vitest** 作为测试框架，配合 **@vue/test-utils** 进行 Vue 组件测试。

### 已安装的依赖

```bash
# 测试框架
vitest                           # 测试运行器
@vitest/ui                       # 测试 UI 界面
@vitest/coverage-v8              # 代码覆盖率工具

# Vue 组件测试
@vue/test-utils                  # Vue 组件测试工具
happy-dom                        # 轻量级 DOM 实现

# 测试辅助
@testing-library/jest-dom        # Jest DOM 匹配器
jsdom                            # 完整 DOM 实现（用于 jsdom 环境）
```

### 配置文件

- **`vitest.config.ts`** - Vitest 核心配置
- **`test/setup.ts`** - 全局测试设置，Uni API Mock
- **`test/utils/render.ts`** - Vue 组件渲染辅助函数

---

## 测试目录结构

```
test/
├── setup.ts                              # 全局测试设置
├── utils/
│   └── render.ts                         # Vue 组件渲染辅助
├── mocks/
│   └── data/
│       ├── index.ts                      # 统一 Mock 数据导出
│       ├── goods.ts                      # 商品测试数据
│       ├── customers.ts                  # 客户测试数据
│       └── orders.ts                     # 订单测试数据
├── unit/                                 # 单元测试
│   ├── helpers/
│   │   ├── price-helper.test.ts          # 金额工具测试
│   │   ├── stock-helper.test.ts          # 库存工具测试
│   │   └── cloud.test.ts                 # 云对象封装测试
│   └── stores/
│       └── useUserStore.test.ts          # 用户状态管理测试
└── integration/                          # 集成测试
    └── cloud-objects/
        ├── wh-order-co.test.ts           # 订单云对象测试
        ├── wh-goods-co.test.ts           # 商品云对象测试
        ├── wh-customer-co.test.ts        # 客户云对象测试
        └── wh-merchant-co.test.ts        # 商家云对象测试

src/
└── pages/
    └── merchant/
        └── login.vue.test.ts             # 登录组件测试
```

---

## 如何运行测试

### 运行所有测试

```bash
npm run test
```

### 运行测试并监听变化

```bash
npm run test
# 测试将自动监听文件变化并重新运行
```

### 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告将生成在 `coverage/` 目录中。

### 运行测试 UI 界面

```bash
npm run test:ui
```

在浏览器中打开 `http://localhost:51204/__vitest__/` 查看测试 UI。

### 运行测试（一次性）

```bash
npm run test:run
```

适合在 CI/CD 环境中使用。

---

## 如何编写测试

### 单元测试示例

#### 测试工具函数

```typescript
// test/unit/helpers/price-helper.test.ts
import { describe, it, expect } from 'vitest'
import { priceHelper } from '@/common/price-helper'

describe('priceHelper', () => {
  describe('format', () => {
    it('应该正确将分转换为元', () => {
      expect(priceHelper.format(100)).toBe('1.00')
      expect(priceHelper.format(1050)).toBe('10.50')
    })

    it('应该处理边界情况', () => {
      expect(priceHelper.format(0)).toBe('0.00')
      expect(priceHelper.format(null as any)).toBe('0.00')
    })
  })
})
```

#### 测试 Store

```typescript
// test/unit/stores/useUserStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该正确设置登录状态', () => {
    const store = useUserStore()
    store.login({
      token: 'test_token',
      userInfo: { _id: 'user_001' },
      tenantInfo: { _id: 'tenant_001' }
    })

    expect(store.token).toBe('test_token')
    expect(store.hasLogin).toBe(true)
  })
})
```

### 集成测试示例

#### 测试云对象

```typescript
// test/integration/cloud-objects/wh-order-co.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('wh-order-co', () => {
  let mockCollection: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock 数据库集合
    mockCollection = {
      where: vi.fn(() => mockCollection),
      add: vi.fn(async data => ({ id: 'order_001', ...data })),
      get: vi.fn(async () => ({ data: [] }))
    }

    global.uniCloud = {
      database: vi.fn(() => ({
        collection: vi.fn(() => mockCollection)
      }))
    } as any
  })

  it('应该成功创建订单', async () => {
    const orderData = {
      customer_id: 'customer_001',
      items: [{ goods_id: 'goods_001', count: 10 }],
      payment_method: 'credit'
    }

    mockCollection.add.mockResolvedValueOnce({
      id: 'order_001',
      total_amount: 3000
    })

    expect(orderData.items).toHaveLength(1)
  })
})
```

### 组件测试示例

#### 测试 Vue 组件

```typescript
// src/pages/merchant/login.vue.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import login from './login.vue'

describe('login.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该正确渲染登录表单', () => {
    const wrapper = mount(login, {
      global: {
        stubs: {
          view: true,
          text: true,
          input: true,
          button: true
        }
      }
    })

    expect(wrapper.find('.login-container').exists()).toBe(true)
  })
})
```

---

## Mock 数据使用指南

### 使用预定义的 Mock 数据

```typescript
import {
  mockGoodsList,
  mockCustomersList,
  mockOrdersList,
  getMockOnSaleGoods,
  getMockCustomerById
} from '@/test/mocks/data'

describe('测试示例', () => {
  it('应该使用 Mock 商品数据', () => {
    const goods = getMockOnSaleGoods()
    expect(goods.length).toBeGreaterThan(0)
  })

  it('应该查找 Mock 客户', () => {
    const customer = getMockCustomerById('customer_001')
    expect(customer).toBeDefined()
  })
})
```

### 创建自定义 Mock 数据

```typescript
// test/mocks/data/custom-test-data.ts
export const customTestData = {
  testGoods: {
    _id: 'goods_test_001',
    name: '测试商品',
    price: 1000
  }
}

// 在测试中使用
import { customTestData } from '@/test/mocks/data/custom-test-data'

it('应该使用自定义测试数据', () => {
  expect(customTestData.testGoods.name).toBe('测试商品')
})
```

### Mock Uni API

```typescript
// test/setup.ts 中已全局配置
global.uni = {
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(() => true),
  showToast: vi.fn(),
  navigateTo: vi.fn(),
  reLaunch: vi.fn()
} as any

// 在测试中使用
it('应该调用 Uni API', () => {
  uni.showToast({ title: '测试提示' })
  expect(global.uni.showToast).toHaveBeenCalledWith({ title: '测试提示' })
})
```

---

## 常见问题排查

### 1. 测试运行失败

**问题**：测试运行时报错 "Cannot find module"

**解决方案**：

```bash
# 重新安装依赖
npm install

# 清理缓存
rm -rf node_modules/.vite
npm run test
```

### 2. Uni API 未定义

**问题**：运行测试时出现 "uni is not defined"

**解决方案**：
确保 `test/setup.ts` 中正确配置了 Uni API Mock：

```typescript
global.uni = {
  getStorageSync: vi.fn(() => null)
  // ... 其他 API
} as any
```

### 3. Pinia Store 测试失败

**问题**：Store 测试时报错 "getActivePinia was called with no active Pinia"

**解决方案**：
在每个测试前创建新的 Pinia 实例：

```typescript
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

### 4. Vue 组件测试时 DOM 元素找不到

**问题**：`wrapper.find()` 找不到元素

**解决方案**：
使用 `stubs` 来 stub 掉 UniApp 组件：

```typescript
const wrapper = mount(Component, {
  global: {
    stubs: {
      view: true,
      text: true,
      button: true
    }
  }
})
```

### 5. 异步测试超时

**问题**：异步测试超时或未等待完成

**解决方案**：
使用 `async/await` 并正确处理 Promise：

```typescript
it('应该等待异步操作', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### 6. 覆盖率报告不准确

**问题**：覆盖率报告显示覆盖率过低

**解决方案**：

1. 检查 `vitest.config.ts` 中的 `coverage.exclude` 配置
2. 确保测试文件包含实际测试逻辑
3. 运行 `npm run test:coverage` 生成详细报告

```bash
npm run test:coverage
open coverage/index.html
```

---

## 测试最佳实践

### AAA 模式

```typescript
it('应该正确计算订单金额', () => {
  // Arrange: 准备测试数据
  const items = [{ price: 100, count: 5 }]

  // Act: 执行被测试函数
  const total = calcTotalAmount(items)

  // Assert: 断言结果
  expect(total).toBe(500)
})
```

### 测试命名规范

- 测试文件：`*.test.ts` 或 `*.spec.ts`
- Mock 数据：`mock + 类型`（如 `mockGoods`）
- 测试名称：`应该 + 预期行为 + 当 + 条件`

```typescript
it('应该正确将分转换为元', () => {})
it('应该在库存为0时显示缺货提示', () => {})
it('应该拒绝无效的手机号格式', () => {})
```

### 保持测试独立性

每个测试应该独立运行，不依赖其他测试的状态：

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  // 重置状态
})
```

### 使用描述性的断言

```typescript
// 好的做法
expect(user.name).toBe('张三')
expect(user.age).toBeGreaterThan(18)

// 避免
expect(user.name).toBeTruthy()
expect(user.age).not.toBeUndefined()
```

---

## 相关文档

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 官方文档](https://test-utils.vuejs.org/)
- [项目 CLAUDE.md](../CLAUDE.md)

---

## 贡献指南

### 添加新测试

1. 确定测试类型（单元测试/集成测试/组件测试）
2. 在相应的目录下创建测试文件
3. 遵循测试命名规范和 AAA 模式
4. 运行测试确保通过
5. 提交前运行 `npm run test:coverage` 确保覆盖率

### 测试覆盖率目标

- **工具函数**：90%+
- **Store**：85%+
- **Cloud Objects**：75%+
- **关键组件**：70%+
- **全局代码**：70%+

---

## 联系方式

如有问题，请通过以下方式联系：

- 提交 Issue
- 查看项目文档
- 查看代码注释
