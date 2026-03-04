## Why

内置工具（已作为 React Router 路由文件存在于代码库中）目前必须通过 Admin UI 手动注册到 D1 数据库后才能出现在工具列表中，增加了不必要的维护负担。需要一种机制让这些工具"随代码一起存在"。

## What Changes

- 每个内置工具路由文件（`app/routes/tools.*.tsx`，共 10 个）导出一个 `toolMeta` 常量，包含工具的元数据
- `tools` 表新增 `is_builtin` 布尔列，标识内置工具
- D1 数据库新增 `builtin` 工具分类（"内置工具"）
- 新增 `scripts/seed-builtin-tools.ts` 脚本，读取各路由的 `toolMeta` 并 INSERT 到 D1
- `package.json` 新增 `seed:builtin` 脚本命令

## Capabilities

### New Capabilities

- `builtin-tool-meta`: 每个内置工具路由文件导出结构化元数据，作为工具在列表中显示的 source of truth
- `builtin-tools-seed`: seed 脚本将所有内置工具元数据写入 D1 数据库，支持幂等重复执行

### Modified Capabilities

（无）

## Impact

- **路由文件**：`app/routes/tools.base64-converter.tsx`、`tools.file-uploader.tsx`、`tools.json-diff.tsx`、`tools.json-formatter.tsx`、`tools.jwt-decoder.tsx`、`tools.qr-generator.tsx`、`tools.time-formatter.tsx`、`tools.ua-parser.tsx`、`tools.url-encoder.tsx`、`tools.url-parser.tsx`（各加一段 export）
- **数据库**：`db/database.sql` 新增分类，`db/migrations/` 新增 `is_builtin` 列 migration
- **新文件**：`scripts/seed-builtin-tools.ts`
- **依赖**：seed 脚本用 `tsx` 运行（已在项目中或需新增为 devDependency）
