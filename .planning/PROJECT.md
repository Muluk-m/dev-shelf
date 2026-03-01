# DevHub — Open Source Edition

## What This Is

DevHub 开源版是一个自部署的开发工具管理平台，基于 Cloudflare Workers 全栈架构。团队和个人开发者可以用它管理和导航内部/外部开发工具链接，支持分类、搜索、命令面板等功能。从现有的内部版本 fork 而来，去除飞书登录等业务绑定，改为内置用户认证系统，支持 Cloudflare Deploy Button 一键部署。

## Core Value

任何人都能通过 Cloudflare Deploy Button 一键部署一个功能完整的开发工具管理平台，零配置即可使用。

## Requirements

### Validated

<!-- 从现有代码库推断的已验证能力 -->

- ✓ 工具列表展示（网格/列表视图，分类筛选） — existing
- ✓ 工具 CRUD 管理（创建、编辑、删除） — existing
- ✓ 工具分类系统 — existing
- ✓ 工具多环境支持（生产、测试等链接） — existing
- ✓ 工具标签系统 — existing
- ✓ 命令面板（Cmd/Ctrl+K 快速搜索启动） — existing
- ✓ 主题切换（亮色/暗色） — existing
- ✓ 响应式设计（移动端适配） — existing
- ✓ D1 数据库集成（事务操作） — existing
- ✓ 多层缓存（KV + Cache API + localStorage） — existing
- ✓ 用户偏好存储（收藏、最近使用） — existing

### Active

<!-- 开源化改造的新需求 -->

- [ ] 去除飞书 OAuth 登录，替换为内置用户名+密码认证
- [ ] 内置用户注册与登录系统（D1 存储）
- [ ] 用户角色权限（admin/user）
- [ ] 个人设置（修改密码、个人信息）
- [ ] 首次部署自动创建 admin 账户
- [ ] 去除 DeepClick 快捷登录模块
- [ ] 去除 R2 日志存储依赖（CF_ALL_LOG）
- [ ] 去除 `@qlj/common-utils` 内部依赖，内联必要代码
- [ ] 清理 wrangler.jsonc 中的业务环境变量（FEISHU_CLIENT_ID, OAUTH_BASE_URL 等）
- [ ] 简化 Admin 后台（保留工具 CRUD，去除业务功能）
- [ ] Cloudflare Deploy Button 一键部署
- [ ] 部署文档（README 说明一键部署流程）
- [ ] 新仓库独立发布（从原仓库 fork）

### Out of Scope

- OAuth 第三方登录（GitHub/Google） — 开源版先用内置认证，后续可扩展
- 实时聊天/协作功能 — 不在工具管理范畴内
- 移动端 APP — Web 优先
- 多语言 i18n — 当前界面语言保持不变
- 付费/订阅功能 — 纯开源免费

## Context

**来源项目：** qlj-devhub-homepage（内部工具管理平台）
**技术栈：** React Router v7 + Hono + Cloudflare Workers + D1 + Zustand + shadcn/ui
**现有架构：** 全栈 SPA，前端 `app/`，后端 `workers/`，数据库层 `lib/database/`
**数据库：** Cloudflare D1 (SQLite)，现有表：tools, tool_categories, tool_environments, tool_tags, tool_usage_events
**关键模式：** 数据库 snake_case ↔ 前端 camelCase 字段映射在 `lib/database/tools.ts`

**需要移除的业务绑定：**
- 飞书 OAuth 认证流程（`workers/routes/` 中的 auth 相关路由）
- DeepClick 环境快捷登录
- R2 日志存储（CF_ALL_LOG binding）
- `@qlj/common-utils` 内部 NPM 包
- wrangler.jsonc 中的业务域名和环境变量

**需要新增的能力：**
- 用户表（D1）：username, password_hash, role, created_at
- JWT 认证中间件（替换现有飞书 token 验证）
- 注册/登录 API 端点
- 初始 admin 创建（首次部署 setup）
- deploy.json（Cloudflare Deploy Button 配置）

## Constraints

- **Platform**: Cloudflare Workers + D1 only — 不引入其他云服务
- **Auth**: 密码使用 Web Crypto API 哈希（Workers 环境无 bcrypt）
- **Package**: 去除 `@qlj/common-utils` 私有包依赖
- **Deploy**: 必须支持 Cloudflare Deploy Button 标准流程
- **Compatibility**: 保持现有前端组件库（shadcn/ui）和构建工具链不变

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 新仓库 fork（非 worktree） | 独立发展，避免内部版和开源版互相干扰 | — Pending |
| 用户名+密码认证（非 OAuth） | 降低部署门槛，无需第三方服务 | — Pending |
| D1 存储用户数据 | 复用现有数据库基础设施，零额外成本 | — Pending |
| Web Crypto API 做密码哈希 | Workers 环境兼容，无需额外依赖 | — Pending |
| Cloudflare Deploy Button | 最低部署门槛，一键完成 | — Pending |

---
*Last updated: 2026-03-01 after initialization*
