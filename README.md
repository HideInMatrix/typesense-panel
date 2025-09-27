# Typesense Panel

一个现代化的 Typesense 管理面板，支持多种数据库连接和数据类型管理。

## 功能特性

### 🗄️ 数据库支持

- **PostgreSQL** - 完整支持，包括表结构查询和数据导入
- **MySQL** - 支持表结构查询和数据操作（计划中）
- **MariaDB** - 兼容 MySQL 协议（计划中）
- **SQLite** - 轻量级文件数据库支持（计划中）
- **MongoDB** - NoSQL 数据库支持（计划中）
- **Redis** - 键值存储支持（计划中）

### 🔍 Typesense 功能

- 集合管理（创建、删除、查看）
- 数据导入（JSONL 文件上传、数据库直接导入）
- 搜索功能（支持自定义查询参数）
- 连接配置管理

### 🎨 界面特性

- 现代化 UI 设计（Element Plus + UnoCSS）
- 响应式布局
- 实时进度反馈
- 拖拽上传支持

## 技术栈

- **前端**: Nuxt 4 + Vue 3 + TypeScript
- **UI 库**: Element Plus + UnoCSS
- **后端**: Nitro (Nuxt Server)
- **数据库**: 支持多种数据库类型
- **搜索引擎**: Typesense

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

## 数据库配置

### 支持的数据库类型

```typescript
enum DatabaseType {
  POSTGRESQL = "postgresql",
  MYSQL = "mysql",
  MARIADB = "mariadb",
  SQLITE = "sqlite",
  MONGODB = "mongodb",
  REDIS = "redis",
}
```

### 配置示例

#### PostgreSQL

```typescript
{
  id: 'postgres-1',
  name: 'Production PostgreSQL',
  type: DatabaseType.POSTGRESQL,
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'password',
  ssl: true,
  schema: 'public'
}
```

## API 接口

### 数据库配置管理

- `GET /api/database/configs` - 获取所有数据库配置
- `POST /api/database/configs` - 创建新的数据库配置
- `PUT /api/database/configs/[id]` - 更新数据库配置
- `DELETE /api/database/configs/[id]` - 删除数据库配置
- `POST /api/database/configs/[id]/test` - 测试数据库连接

### 数据库操作

- `GET /api/database/configs/[id]/tables` - 获取数据库表列表
- `GET /api/database/configs/[id]/tables/[table]` - 获取表结构
- `POST /api/database/configs/[id]/query` - 执行查询
- `POST /api/database/configs/[id]/execute` - 执行更新操作
- `POST /api/database/configs/[id]/import-to-typesense` - 导入数据到 Typesense

### Typesense 操作

- `GET /api/collections/all` - 获取所有集合
- `POST /api/collections/create` - 创建集合
- `DELETE /api/collections/[name]` - 删除集合
- `POST /api/collections/[name]/import` - 导入 JSONL 文件
- `POST /api/collections/[name]/import-from-db` - 从数据库导入
- `GET /api/collections/[name]/search` - 搜索集合

## 项目结构

```
typesense-panel/
├── app/
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   └── middleware/       # 中间件
├── lib/
│   ├── typesense.ts      # Typesense 客户端管理
│   └── database-manager.ts # 数据库管理器
├── server/
│   └── api/              # API 接口
├── types/
│   └── database.d.ts     # 数据库类型定义
└── public/               # 静态资源
```

## 开发指南

### 添加新的数据库类型

1. 在 `types/database.d.ts` 中定义新的配置接口
2. 在 `lib/database-manager.ts` 中实现对应的操作类
3. 更新 `DatabaseManager.createOperations()` 方法

### 自定义 UI 组件

项目使用 Element Plus 作为 UI 库，配合 UnoCSS 进行样式定制。所有组件都遵循现代设计原则。

## 许可证

Apache License V2
