## 1. 数据库准备

- [x] 1.1 在 `db/database.sql` 的 `tool_categories` INSERT 中新增 `builtin` 分类（id: "builtin", name: "内置工具", icon: "Puzzle", color: "#6366f1"）
- [x] 1.2 新建 `db/migrations/0002_add_is_builtin.sql`，为 `tools` 表添加 `is_builtin BOOLEAN DEFAULT FALSE` 列

## 2. 类型定义

- [x] 2.1 在 `lib/types/tool.ts` 中新增 `BuiltinToolMeta` 接口（字段：id, name, description, icon, category, tags）

## 3. 为每个内置工具路由添加 toolMeta

- [x] 3.1 `app/routes/tools.base64-converter.tsx` — 添加 `export const toolMeta`
- [x] 3.2 `app/routes/tools.file-uploader.tsx` — 添加 `export const toolMeta`
- [x] 3.3 `app/routes/tools.json-diff.tsx` — 添加 `export const toolMeta`
- [x] 3.4 `app/routes/tools.json-formatter.tsx` — 添加 `export const toolMeta`
- [x] 3.5 `app/routes/tools.jwt-decoder.tsx` — 添加 `export const toolMeta`
- [x] 3.6 `app/routes/tools.qr-generator.tsx` — 添加 `export const toolMeta`
- [x] 3.7 `app/routes/tools.time-formatter.tsx` — 添加 `export const toolMeta`
- [x] 3.8 `app/routes/tools.ua-parser.tsx` — 添加 `export const toolMeta`
- [x] 3.9 `app/routes/tools.url-encoder.tsx` — 添加 `export const toolMeta`
- [x] 3.10 `app/routes/tools.url-parser.tsx` — 添加 `export const toolMeta`

## 4. Seed 脚本

- [x] 4.1 新建 `scripts/seed-builtin-tools.ts`，导入所有路由的 `toolMeta`，生成 D1 INSERT SQL 并通过 wrangler 执行
- [x] 4.2 在 `package.json` 的 `scripts` 中添加 `"seed:builtin": "tsx scripts/seed-builtin-tools.ts"`
- [x] 4.3 确认 `tsx` 已在 devDependencies 中（如缺失则 `pnpm add -D tsx`）

## 5. 验证

- [x] 5.1 本地执行 `pnpm run seed:builtin`，确认无报错且输出成功信息
- [x] 5.2 启动开发服务器，验证首页工具列表出现"内置工具"分类和 10 个工具
- [x] 5.3 重复执行 seed 脚本，确认无重复数据（幂等验证）
