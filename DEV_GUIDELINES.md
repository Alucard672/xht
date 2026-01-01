# 乡货通 (Xianghuotong) AI 协作开发规范

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