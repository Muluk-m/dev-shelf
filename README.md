# DevHub - 开发工具管理平台

一个现代化的开发工具管理和发现平台，基于 Cloudflare Workers 构建。支持内部工具开发和外部工具管理，提供快速、响应式的工具使用体验。

![DevHub Screenshot](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/24c5a7dd-e1e3-43a9-b912-d78d9a4293bc/public)

## ✨ 核心特性

### 🔧 双重工具管理
- **内部工具** - 在平台内开发和部署的功能工具
- **外部工具** - 管理外部服务和应用的链接和信息

### 🎯 用户体验
- 🔍 **智能搜索** - 支持工具名称、描述、标签的全文搜索
- ⌨️ **命令面板** - 快捷键 `Cmd/Ctrl+K` 快速访问所有功能
- 🏷️ **分类管理** - 灵活的分类系统和标签过滤
- 🌍 **多环境支持** - 管理工具的不同部署环境
- 🎨 **现代 UI** - 基于 shadcn/ui 的精美界面，支持明暗主题
- 📱 **响应式设计** - 完美适配桌面和移动设备

### ⚡ 技术优势
- **边缘部署** - 基于 Cloudflare Workers 的全球加速
- **实时加载** - 骨架屏和加载状态提升用户体验
- **用户认证** - 集成飞书 OAuth 登录系统
- **权限管理** - 完整的管理后台和权限控制

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

## 📁 项目架构

### 整体结构
```
├── app/                    # 前端应用
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 基础组件
│   │   ├── layout/        # 页面布局组件
│   │   ├── admin/         # 管理后台组件
│   │   ├── command-panel/ # 命令面板功能
│   │   └── search/        # 搜索相关组件
│   ├── routes/            # 页面路由
│   │   ├── tools/         # 内部工具目录
│   │   │   ├── _layout.tsx        # 内部工具布局
│   │   │   └── json-formatter.tsx # JSON 格式化工具
│   │   ├── home.tsx       # 首页
│   │   ├── admin.tsx      # 管理后台
│   │   └── tools.$id.tsx  # 外部工具详情页
│   ├── lib/               # 工具函数和配置
│   │   ├── api.ts         # API 接口
│   │   └── internal-tools.ts # 内部工具注册表
│   └── types/             # TypeScript 类型定义
├── workers/               # 后端 API (Hono)
│   ├── routes/           # API 路由处理
│   │   ├── tools.ts      # 工具 CRUD API
│   │   ├── categories.ts # 分类管理 API
│   │   └── auth.ts       # 用户认证 API
│   ├── middleware/       # 中间件
│   └── app.ts            # Hono 应用入口
├── lib/                  # 共享库
│   ├── database/         # 数据库操作层
│   └── types/            # 共享类型定义
├── database.sql          # 数据库 Schema
└── wrangler.jsonc        # Cloudflare 配置
```

### 🔧 内部工具架构

#### 设计理念
- **关注点分离**：工具开发者只需关注功能实现，元信息通过管理后台配置
- **统一路由**：所有内部工具使用 `/tools/{tool-id}` 的统一路由格式
- **简化开发**：新增工具只需三步：注册ID、添加路由、实现功能

#### 路由策略
```
/tools/json-formatter    # 内部工具 - 直接展示功能页面
/tools/base64-converter  # 内部工具 - 直接展示功能页面
/tools/external-tool-id  # 外部工具 - 展示详情页和跳转链接
```

#### 添加新内部工具
1. **注册工具ID**
   ```typescript
   // app/lib/internal-tools.ts
   export const INTERNAL_TOOL_IDS = [
     "json-formatter",
     "base64-converter",
     "your-new-tool", // 添加新工具ID
   ] as const;
   ```

2. **添加路由**
   ```typescript
   // app/routes.ts
   route("tools", "routes/tools/_layout.tsx", [
     route("json-formatter", "routes/tools/json-formatter.tsx"),
     route("your-new-tool", "routes/tools/your-new-tool.tsx"), // 新路由
   ]),
   ```

3. **实现工具功能**
   ```typescript
   // app/routes/tools/your-new-tool.tsx
   export default function YourNewToolPage() {
     return (
       <div className="space-y-6">
         <h1 className="text-3xl font-bold">你的工具名称</h1>
         {/* 工具功能实现 */}
       </div>
     );
   }
   ```

4. **配置元信息**
   - 通过管理后台 `/admin` 添加工具
   - 设置名称、描述、分类、标签等信息
   - 系统自动识别内部工具并正确路由

## 🎯 核心功能

### 🔧 工具管理

#### 内部工具
- **即开即用** - 直接在平台内使用，无需跳转
- **统一体验** - 共享布局和主题，保持一致的用户体验
- **快速开发** - 基于 React 组件，快速构建功能工具
- **示例工具**：
  - JSON 格式化器 - 格式化、压缩、验证 JSON 数据
  - Base64 转换器 - 编码解码文本和文件
  - 二维码生成器 - 生成各种类型的二维码

#### 外部工具
- **链接管理** - 管理外部服务和应用的访问链接
- **多环境支持** - 支持开发、测试、生产等多个环境
- **详情展示** - 丰富的工具介绍和使用说明
- **智能跳转** - 根据环境配置自动处理内部路由或外部链接

### 🎨 用户界面

#### 首页展示
- **工具卡片** - 美观的卡片式工具展示
- **智能徽章** - 自动识别内部/外部工具类型
- **环境选择** - 针对外部工具提供环境切换
- **快捷操作** - 一键打开工具或查看详情

#### 管理后台
- **统一管理** - 内部工具和外部工具的统一管理界面
- **分类展示** - 按照内部工具/外部工具分类展示
- **批量操作** - 支持批量编辑和删除
- **实时预览** - 修改后实时查看效果

### 🔍 搜索和过滤
- **全文搜索** - 搜索工具名称、描述、标签内容
- **分类过滤** - 按工具分类快速筛选
- **状态过滤** - 按工具状态（正常/维护中/已废弃）筛选
- **类型过滤** - 按内部工具/外部工具类型筛选

### ⌨️ 命令面板
- **全局访问** - 快捷键 `Cmd/Ctrl+K` 快速呼出
- **智能搜索** - 模糊匹配工具名称和描述
- **键盘导航** - 支持方向键和回车键操作
- **快速跳转** - 直接跳转到工具页面或详情页

### 👥 用户系统
- **飞书集成** - 使用飞书账户登录
- **用户资料** - 显示用户头像和基本信息
- **权限控制** - 管理后台访问权限控制

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

### 工具管理
```
GET    /api/tools              # 获取工具列表
POST   /api/tools              # 创建工具
GET    /api/tools/:id          # 获取工具详情
PUT    /api/tools/:id          # 更新工具
DELETE /api/tools/:id          # 删除工具
```

### 分类管理
```
GET    /api/categories         # 获取分类列表
```

### 用户认证
```
GET    /auth/me                # 获取当前用户信息
GET    /auth/login             # 跳转到飞书登录
GET    /auth/callback          # 处理登录回调
```

## 🎨 内置工具示例

### JSON 格式化器 (`/tools/json-formatter`)
- ✨ **功能**：JSON 格式化、压缩、验证
- 🔧 **特性**：语法高亮、错误检测、文件上传/下载
- 📱 **界面**：双面板设计，支持复制和导出

### 计划中的内部工具
- **Base64 转换器** - 文本和文件的 Base64 编码/解码
- **二维码生成器** - 支持文本、链接、WiFi 等多种类型
- **URL 编码器** - URL 编码和解码工具
- **哈希生成器** - MD5、SHA1、SHA256 等哈希计算
- **时间戳转换** - Unix 时间戳与日期时间相互转换

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