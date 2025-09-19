# DevHub - 开发工具管理平台

一个现代化的开发工具管理和发现平台，基于 Cloudflare Workers 构建，提供快速、响应式的工具管理体验。

![DevHub Screenshot](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/24c5a7dd-e1e3-43a9-b912-d78d9a4293bc/public)

## ✨ 功能特性

- 🔍 **智能工具搜索** - 支持名称、描述、标签的全文搜索
- ⌨️ **命令面板** - 快捷键 `Cmd/Ctrl+K` 快速访问所有功能
- 🏷️ **标签系统** - 灵活的标签分类和过滤
- 🌍 **多环境支持** - 管理工具的不同部署环境（开发、测试、生产）
- 🎨 **现代 UI** - 基于 shadcn/ui 的精美界面，支持明暗主题
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **边缘部署** - 基于 Cloudflare Workers 的全球加速
- 🔐 **管理后台** - 完整的 CRUD 操作支持

## 🛠️ 技术栈

### Frontend
- **React Router v7** - 现代化的 SPA 路由
- **shadcn/ui + Tailwind CSS** - 精美的组件库和样式系统
- **TypeScript** - 类型安全的开发体验
- **Vite** - 快速的构建工具

### Backend
- **Hono** - 轻量级的 Web 框架
- **Cloudflare D1** - 边缘 SQLite 数据库
- **Cloudflare Workers** - 无服务器计算平台

### 数据库设计
- `tools` - 工具基本信息
- `tool_environments` - 工具部署环境
- `tool_tags` - 工具标签
- `tool_categories` - 工具分类

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐包管理器)
- Cloudflare 账户

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd qlj-devhub-homepage

# 安装依赖
pnpm install

# 初始化数据库
pnpm run db:setup

# 启动开发服务器
pnpm run dev
```

### 数据库管理

```bash
# 创建数据库表
npx wrangler d1 execute devhub-database --local --file=database.sql

# 重置数据库
npx wrangler d1 execute devhub-database --local --command="DROP TABLE IF EXISTS tool_tags; DROP TABLE IF EXISTS tool_environments; DROP TABLE IF EXISTS tools; DROP TABLE IF EXISTS tool_categories;"
```

### 构建和部署

```bash
# 类型检查
pnpm run typecheck

# 代码质量检查
pnpm run lint

# 构建生产版本
pnpm run build

# 部署到 Cloudflare Workers
pnpm run deploy
```

## 📁 项目结构

```
├── app/                    # 前端应用
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 组件
│   │   ├── layout/        # 布局组件
│   │   ├── admin/         # 管理后台组件
│   │   └── command-panel/ # 命令面板
│   ├── routes/            # 页面路由
│   ├── lib/               # 工具函数
│   └── types/             # TypeScript 类型定义
├── workers/               # 后端 API
│   ├── routes/           # API 路由
│   └── app.ts            # Hono 应用入口
├── lib/                  # 共享库
│   └── database/         # 数据库操作
├── database.sql          # 数据库 Schema
└── wrangler.jsonc        # Cloudflare 配置
```

## 🎯 核心功能

### 工具管理
- 添加、编辑、删除开发工具
- 支持多个部署环境
- 灵活的标签系统
- 批量操作支持

### 搜索和过滤
- 实时搜索工具名称和描述
- 标签过滤
- 环境类型过滤

### 命令面板
- 全局快捷键访问
- 键盘和鼠标导航
- 快速工具跳转

### 管理后台
- 直观的工具管理界面
- 表单验证和错误处理
- 批量导入/导出功能

## 🔧 开发命令

```bash
# 开发
pnpm run dev              # 启动开发服务器
pnpm run typecheck        # TypeScript 类型检查

# 构建
pnpm run build           # 生产构建
pnpm run preview         # 本地预览构建结果

# 代码质量
pnpm run lint            # 检查代码质量
pnpm run lint:fix        # 自动修复代码问题

# 部署
pnpm run deploy          # 部署到 Cloudflare Workers
pnpm run cf-typegen      # 生成 Cloudflare D1 类型
```

## 🌐 API 端点

```
GET    /api/tools              # 获取工具列表
POST   /api/tools              # 创建工具
GET    /api/tools/:id          # 获取工具详情
PUT    /api/tools/:id          # 更新工具
DELETE /api/tools/:id          # 删除工具
GET    /api/categories         # 获取分类列表
```

## 📋 开发规范

- 使用 TypeScript 严格模式
- 遵循 Biome 代码格式规范
- API 端点返回标准 HTTP 状态码
- 数据库操作使用事务确保一致性
- 前后端字段映射：数据库使用 snake_case，前端使用 camelCase

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架](https://hono.dev/)
- [React Router](https://reactrouter.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)