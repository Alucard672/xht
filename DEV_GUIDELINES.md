# 乡货通 (Xianghuotong) AI 协作开发规范

## 0. 项目宪法 (Project Constitution) 🔒

> **不可违背的铁律，所有开发必须严格遵守。**

1. **命令行操作自动化**: 除 `rm -rf` 等删除操作外，所有 npm、git 等命令**无需用户确认，AI 直接执行**。
2. **分支策略**: 当前在 `master` 分支，为全新项目，**无需考虑向后兼容性**。后续切换到 `develop` 分支开发时，再与用户确认兼容策略。
3. **强制 Git 提交**: 每完成一个任务（对应 task.md 中的一个顶级项），**必须提交到 git**，commit message 需清晰说明本次修改内容（使用中文，格式：`feat/fix/chore: 简要描述`）。

---

## 1. 核心原则 (The Golden Rules)

1.  **SaaS 隔离红线：** 任何涉及数据的增删改查，第一反应必须是“当前的 `tenant_id` 是什么？”。严禁写出跨租户查询的代码。
2.  **金额整数化：** 数据库里禁止出现小数。1元存为 `100`。前端展示时再除以 100。
3.  **小单位库存：** 库存永远以“瓶/包/个”为单位存储。箱只是展示单位。

## 2. 目录结构规范

```text
├── common/                  # 公用工具
│   ├── utils.js             # 基础工具
│   ├── config.js            # 环境配置 (Dev/Prod)
│   └── price-helper.js      # 专门处理金额转换的工具
├── components/              # 全局组件
├── pages/
│   ├── merchant/            # 商家端页面 (B端)
│   ├── client/              # 客户端页面 (C端)
│   └── login/               # 登录注册页
├── uni_modules/             # 插件 (uView-plus, uni-id等)
├── uniCloud-aliyun/
│   ├── database/            # 数据库 Schema (*.schema.json)
│   └── cloudfunctions/      # 云函数/云对象

## 3. 协作流程约定 (Collaboration Process)
> **原则：** 先思考，再编码。杜绝返工。

1.  **Plan (计划)**: 复杂功能（涉及资金、多表联动）必须先由 AI 输出 `implementation_plan.md`，人工确认无误后方可执行。
2.  **Schema (数据)**: 优先定义 `DB Schema`。数据结构不对，写再多代码都是错。
3.  **Backend (后端)**: 编写云对象/云函数，并进行单元测试（或简单的云端运行测试）。
4.  **Frontend (前端)**: 最后一步才是画页面和调接口。

## 4. 功能模块化与命名规范 (Modularity & Naming)
*   **组件 (Components)**:
    *   **通用UI组件**: 放入 `/components/`，前缀 `wh-` (e.g., `wh-price-input.vue`)。
    *   **业务组件**: 放入页面的子目录中 (e.g., `/pages/merchant/goods/components/`).
*   **逻辑复用 (Composables)**:
    *   复杂业务逻辑必须提取为 Hook，放入 `/composables/` (需新建)。
    *   例如：`useCart.ts` (购物车逻辑), `useAuth.ts` (登录逻辑).
*   **命名**:
    *   `.vue` 文件: PascalCase (大驼峰), 如 `GoodsEdit.vue`
    *   `.ts/.js` 文件: camelCase (小驼峰), 如 `formatPrice.ts`

## 5. 前端开发最佳时机 (When to Code Frontend)
*   **Schema 稳定后**: 数据库字段确定不再频繁变更。
*   **接口协议确定后**: 云对象的方法名、入参、出参已定义清楚（即使 Mock 数据也要先定结构）。
*   **切忌**: 一上来就写 Vue 页面代码，最后发现数据结构不支持，导致推倒重来。
```
