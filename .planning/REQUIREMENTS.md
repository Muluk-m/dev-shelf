# Requirements: DevHub Open Source Edition

**Defined:** 2026-03-01
**Core Value:** 任何人都能通过 Cloudflare Deploy Button 一键部署一个功能完整的开发工具管理平台

## v1 Requirements

Requirements for initial open-source release. Each maps to roadmap phases.

### Codebase Cleanup

- [x] **CLEAN-01**: 去除飞书 OAuth 认证流程（登录、回调、token 管理）
- [x] **CLEAN-02**: 去除 DeepClick 快捷登录模块
- [x] **CLEAN-03**: 去除 R2 日志存储依赖（CF_ALL_LOG binding）
- [x] **CLEAN-04**: 去除 `@qlj/common-utils` 私有 NPM 包依赖，内联必要代码
- [x] **CLEAN-05**: 清理 wrangler.jsonc 中的硬编码 secrets（数据库 ID、KV namespace ID）
- [x] **CLEAN-06**: 清理代码库中所有内部 URL（qiliangjia.org、deepclick.com 等 27+ 文件）
- [x] **CLEAN-07**: 清理业务相关环境变量（FEISHU_CLIENT_ID、OAUTH_BASE_URL 等）
- [x] **CLEAN-08**: 去除业务特定的工具路由（quick-login、roibest-analyzer、ClickHouse 查询等）

### Authentication

- [x] **AUTH-01**: 用户可以通过用户名和密码注册账户
- [x] **AUTH-02**: 用户可以通过用户名和密码登录
- [x] **AUTH-03**: 用户登录后 session 通过 JWT HTTP-only cookie 持久化
- [x] **AUTH-04**: 用户密码使用 Web Crypto API PBKDF2 安全哈希存储
- [x] **AUTH-05**: 用户可以从任意页面登出
- [x] **AUTH-06**: 用户可以在个人设置中修改密码
- [x] **AUTH-07**: 用户可以在个人设置中修改个人信息（显示名称等）

### User Management

- [x] **USER-01**: 系统区分 admin 和 user 两种角色
- [x] **USER-02**: 只有 admin 可以创建、编辑、删除工具
- [x] **USER-03**: 普通 user 可以查看工具、使用收藏和偏好功能
- [x] **USER-04**: Admin 可以重置其他用户的密码
- [x] **USER-05**: 首次部署访问时自动引导创建 admin 账户（First-Run Setup Wizard）
- [x] **USER-06**: D1 数据库用户表（username、password_hash、role、created_at）

### Deployment

- [x] **DEPLOY-01**: 项目支持 Cloudflare Deploy Button 一键部署
- [x] **DEPLOY-02**: deploy.json 配置自动创建 D1 数据库和 KV namespace
- [x] **DEPLOY-03**: 部署后数据库 schema 自动初始化（D1 migrations）
- [x] **DEPLOY-04**: 提供 `.dev.vars.example` 文件说明所需 secrets
- [x] **DEPLOY-05**: 新仓库独立发布到 GitHub（公开仓库）

### Data Portability

- [x] **DATA-01**: Admin 可以导出所有工具数据为 JSON 格式
- [x] **DATA-02**: 导出包含工具、分类、环境、标签完整数据

### Documentation

- [ ] **DOC-01**: README 包含 Deploy Button 和部署说明
- [ ] **DOC-02**: README 包含手动部署步骤（wrangler deploy）
- [ ] **DOC-03**: README 包含本地开发环境搭建说明
- [ ] **DOC-04**: README 包含环境变量说明和配置指南

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Auth

- **AUTH-V2-01**: 支持 OAuth 第三方登录（GitHub/Google）
- **AUTH-V2-02**: 用户邮箱验证

### Import & Integration

- **DATA-V2-01**: 支持 JSON/CSV 批量导入工具数据
- **DATA-V2-02**: 提供 API Token 用于程序化访问
- **DATA-V2-03**: Webhook 通知（工具变更时通知外部系统）

### Admin Enhancement

- **ADMIN-V2-01**: Admin 可以查看工具使用分析
- **ADMIN-V2-02**: Admin 可以管理用户列表（禁用/删除）

### UI Enhancement

- **UI-V2-01**: Grid/List 视图切换
- **UI-V2-02**: 自定义主题颜色

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| OAuth 第三方登录 | 增加部署复杂度，用户名密码对自部署场景足够 |
| 实时协作 | 工具管理不需要实时同步，乐观更新足够 |
| 邮件通知 | 需要额外 SMTP 服务，增加配置负担 |
| 多租户 | 增加数据库隔离复杂度，一个部署一个团队更简单 |
| 插件系统 | API 稳定性负担大，fork 友好的代码库更适合开源 |
| LDAP/AD 集成 | 复杂协议，自部署场景不常见 |
| 审计日志 | 数据库增长和查询性能影响，工具链接管理不需要 |
| 移动端 APP | Web 优先，响应式设计已覆盖移动端 |
| 多语言 i18n | 初始版本保持现有语言 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | Phase 1 | Complete |
| CLEAN-02 | Phase 1 | Complete |
| CLEAN-03 | Phase 1 | Complete |
| CLEAN-04 | Phase 1 | Complete |
| CLEAN-05 | Phase 1 | Complete |
| CLEAN-06 | Phase 1 | Complete |
| CLEAN-07 | Phase 1 | Complete |
| CLEAN-08 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| USER-01 | Phase 3 | Complete |
| USER-02 | Phase 3 | Complete |
| USER-03 | Phase 3 | Complete |
| USER-04 | Phase 3 | Complete |
| USER-05 | Phase 3 | Complete |
| USER-06 | Phase 3 | Complete |
| DEPLOY-01 | Phase 4 | Complete |
| DEPLOY-02 | Phase 4 | Complete |
| DEPLOY-03 | Phase 4 | Complete |
| DEPLOY-04 | Phase 4 | Complete |
| DEPLOY-05 | Phase 4 | Complete |
| DOC-01 | Phase 5 | Pending |
| DOC-02 | Phase 5 | Pending |
| DOC-03 | Phase 5 | Pending |
| DOC-04 | Phase 5 | Pending |
| DATA-01 | Phase 6 | Complete |
| DATA-02 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
