## Context

DevShelf 的工具列表完全由 Cloudflare D1 数据库驱动。内置工具（`app/routes/tools.*.tsx`，共 10 个）虽已在代码中实现，但需要手动通过 Admin UI 注册到数据库才能出现在列表中。这造成了"代码存在但列表里没有"的不一致状态，且每次新增内置工具都要做额外操作。

## Goals / Non-Goals

**Goals:**
- 内置工具的元数据与路由文件 co-locate（`export const toolMeta`）
- 提供幂等的 seed 脚本，一条命令将所有内置工具写入 D1
- 内置工具标记 `is_builtin = true`，以便将来区分管理
- 新增 `builtin` 分类（"内置工具"）

**Non-Goals:**
- 不自动检测新路由文件（手动维护 seed 脚本的导入列表）
- 不修改权限系统（内置工具默认无 `permissionId`，所有人可访问）
- 不改变前端列表渲染逻辑

## Decisions

### 1. toolMeta 在路由文件中导出（co-location）

**选择**：每个 `tools.*.tsx` 直接 `export const toolMeta`
**理由**：元数据紧靠实现，修改工具时不需要切换文件，减少信息散落
**备选**：独立的 catalog 文件（`app/lib/builtin-tools.ts`）—— 更适合纯 TS 环境，但割裂了 metadata 与实现的联系

### 2. Seed 脚本用 tsx 运行

**选择**：`scripts/seed-builtin-tools.ts` 通过 `tsx` 执行，直接 import 路由文件的 `toolMeta`
**理由**：项目已是 TypeScript 生态，`tsx` 能处理 `.tsx` 文件中的 JSX + TS；seed 脚本只读 `toolMeta` 常量，不会执行任何 React 代码
**备选**：生成 SQL 文件再 `wrangler d1 execute` —— 更通用但增加中间产物；纯 JS seed 脚本 —— 丢失类型安全

### 3. 数据库 migration 而非仅修改 database.sql

**选择**：新增 `db/migrations/0002_add_is_builtin.sql`
**理由**：`deploy` 命令已包含 `wrangler d1 migrations apply`，migration 方式对生产环境更安全

### 4. Seed 脚本使用 `INSERT OR REPLACE`

**选择**：幂等写入，重复执行不会报错也不会产生重复数据
**理由**：内置工具 id 固定（等于路由 slug），每次 seed 只是更新元数据

## Risks / Trade-offs

- **TSX 导入路由文件的副作用风险** → Mitigation：toolMeta 是模块顶层常量，无副作用；但若路由文件顶层有浏览器 API 调用则会报错（目前代码无此问题）
- **Seed 脚本需手动维护 import 列表** → Mitigation：10 个工具不多；文件名本身即 slug，一眼可见是否遗漏
- **wrangler 认证** → Mitigation：本地开发用 `--local`，CI/生产用 wrangler 登录态，与现有流程一致

## Migration Plan

1. 运行 `pnpm run db:migrate`（或 `wrangler d1 migrations apply DB --local`）应用 `is_builtin` 列
2. 运行 `pnpm run seed:builtin` 写入 10 个内置工具
3. 验证首页工具列表出现"内置工具"分类

回滚：删除 `is_builtin` 列对现有功能无影响；内置工具条目可通过 Admin UI 手动删除。
