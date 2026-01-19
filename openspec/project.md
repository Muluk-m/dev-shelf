# Project Context

## Purpose
DevHub 是一个现代化的开发工具管理和发现平台，基于 Cloudflare Workers 构建。核心目标是：
- 提供统一的内部工具开发和管理平台（工具直接在平台内使用）
- 管理外部工具的链接和多环境配置（支持开发/测试/生产环境）
- 通过智能搜索、命令面板和分类管理提升工具发现和使用效率
- 集成飞书 OAuth 提供用户认证和权限管理

## Tech Stack

### Frontend
- **React Router v7** - 现代 SPA 路由框架
- **shadcn/ui** - 基于 Radix UI 的精美组件库
- **Tailwind CSS v4** - 实用优先的样式框架
- **TypeScript 5.8** - 类型安全的开发体验
- **Vite 6** - 快速构建工具
- **TanStack Query** - 数据获取和状态管理
- **Zustand** - 轻量级状态管理

### Backend
- **Hono 4.8** - 轻量级 Web 框架
- **Cloudflare Workers** - 边缘计算平台
- **Cloudflare D1** - 边缘 SQLite 数据库
- **Wrangler 4** - Cloudflare 开发和部署工具

### Development Tools
- **Biome 2.2** - 快速的 linter 和 formatter
- **pnpm 10** - 高效的包管理器

## Project Conventions

### Code Style
- **Formatter**: Biome 默认配置，使用 tab 缩进和双引号
- **命名规范**:
  - React 组件: PascalCase (文件使用 kebab-case.tsx)
  - 函数和变量: camelCase
  - 常量: UPPER_SNAKE_CASE
  - Hook 函数: useXxx 前缀
  - 数据库字段: snake_case
  - API 字段: camelCase
- **字段映射**: 数据库 snake_case → 前端 camelCase 自动转换
- **代码组织**: 保持 exports 有明确类型，优先使用 ES modules
- **Commit 规范**: 遵循 Conventional Commits (feat/fix/docs/chore 等)
- **提交前检查**: 必须运行 `pnpm lint:fix` 和 `pnpm typecheck`

### Architecture Patterns

#### 三层架构
- `app/` - 前端层: React Router 路由、组件、客户端逻辑
- `workers/` - 后端 API 层: Hono 路由、中间件、业务逻辑
- `lib/` - 共享层: 数据库访问、类型定义、工具函数

#### 内部工具设计
- **路由策略**: 所有内部工具使用 `/tools/{tool-id}` 统一路由
- **关注点分离**: 工具功能实现与元信息（名称、描述、分类）分离
- **添加流程**:
  1. 在 `app/lib/internal-tools.ts` 注册工具 ID
  2. 在 `app/routes.ts` 添加路由
  3. 在 `app/routes/tools/` 创建功能组件
  4. 通过管理后台配置元信息

#### 数据流
- Frontend: React Router loader → API 请求 → UI 渲染
- Backend: Hono 路由 → 中间件 → 数据库操作 → 响应
- 使用 TanStack Query 管理客户端数据缓存和状态

### Testing Strategy
- **当前状态**: 无自动化测试（依赖手动 QA）
- **质量保障**: 
  - TypeScript 严格模式类型检查 (`pnpm typecheck`)
  - Biome lint 检查 (`pnpm lint`)
  - 本地开发环境测试 (`pnpm dev`)
- **未来规划**: 引入测试时，采用 `.test.ts(x)` 同位命名或 `__tests__` 目录

### Git Workflow
- **分支策略**: main 分支为主开发分支
- **Commit 规范**: Conventional Commits 格式
  - `feat(scope):` - 新功能
  - `fix(scope):` - Bug 修复
  - `docs:` - 文档更新
  - `chore:` - 构建/工具变更
  - Subject 使用祈使句，不超过 72 字符
- **PR 流程**:
  - 描述变更意图和影响范围
  - 列出手动测试清单
  - UI 变更需附带截图
  - 等待审核批准后合并

## Domain Context

### 工具类型
- **内部工具 (Internal Tools)**: 在平台内直接运行的功能工具
  - 示例: JSON 格式化器、Base64 转换器、二维码生成器
  - 特点: 无需跳转，统一体验，共享主题和布局
  
- **外部工具 (External Tools)**: 外部服务和应用的链接管理
  - 支持多环境配置（开发/测试/生产）
  - 提供详情页展示和智能跳转

### 核心功能模块
- **工具管理**: CRUD 操作、分类管理、标签系统
- **搜索系统**: 全文搜索（名称/描述/标签）、过滤（分类/状态/类型）
- **命令面板**: 快捷键 `Cmd/Ctrl+K`，模糊搜索，键盘导航
- **用户系统**: 飞书 OAuth 登录、权限控制、用户资料
- **管理后台**: 工具管理、分类管理、权限管理

### 数据库 Schema
- `tools` - 工具基本信息（name, description, icon, category_id, status）
- `tool_environments` - 工具环境配置（tool_id, env_name, url）
- `tool_tags` - 工具标签（tool_id, tag）
- `tool_categories` - 工具分类（name, description）

## Important Constraints

### 技术约束
- **边缘计算限制**: Cloudflare Workers 有 CPU 时间和内存限制
- **数据库约束**: D1 是 SQLite，需注意并发写入限制
- **构建目标**: 必须兼容 Cloudflare Workers 运行时
- **包管理**: 必须使用 pnpm 维护 `pnpm-lock.yaml`

### 业务约束
- **认证要求**: 必须通过飞书 OAuth 登录才能访问管理后台
- **工具 ID 唯一性**: 内部工具 ID 必须在 `INTERNAL_TOOL_IDS` 中注册
- **路由冲突**: 内部工具路由优先于外部工具详情页

### 开发约束
- **代码质量**: 提交前必须通过 lint 和 typecheck
- **响应式设计**: 所有界面必须适配移动端和桌面端
- **无障碍**: 遵循 WAI-ARIA 规范，支持键盘导航

## External Dependencies

### Cloudflare 服务
- **Workers**: 无服务器计算平台，全球边缘部署
- **D1**: 边缘 SQLite 数据库，存储工具和用户数据
- **R2** (计划中): 对象存储，用于工具图标和附件

### 第三方服务
- **飞书开放平台**: OAuth 2.0 登录、用户信息 API
- **Radix UI**: 无障碍 UI primitives 组件库
- **Lucide Icons**: 开源图标库

### 关键依赖包
- `hono` - Web 框架，轻量高性能
- `react-router` - 路由管理
- `@tanstack/react-query` - 数据获取和缓存
- `@qlj/common-utils` - 内部共享工具库
- `ua-parser-js` - User-Agent 解析（用于日志分析）
