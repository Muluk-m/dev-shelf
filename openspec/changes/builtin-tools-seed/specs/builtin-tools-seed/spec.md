## ADDED Requirements

### Requirement: 支持 builtin 工具分类
数据库 SHALL 包含 id 为 `"builtin"` 的工具分类，名称为"内置工具"。

#### Scenario: builtin 分类存在于数据库
- **WHEN** 查询 `tool_categories` 表
- **THEN** 存在 `id = 'builtin'` 的记录
- **THEN** 该记录的 `name` 为 `"内置工具"`

### Requirement: tools 表包含 is_builtin 列
`tools` 表 SHALL 包含 `is_builtin` 布尔列，默认值为 `FALSE`。

#### Scenario: 数据库 migration 成功
- **WHEN** 执行 `db/migrations/0002_add_is_builtin.sql`
- **THEN** `tools` 表包含 `is_builtin BOOLEAN DEFAULT FALSE` 列

### Requirement: seed 脚本幂等写入内置工具
`scripts/seed-builtin-tools.ts` SHALL 读取所有内置工具路由的 `toolMeta` 并将其以 `INSERT OR REPLACE` 方式写入 D1，标记 `is_builtin = 1`。

#### Scenario: 首次执行 seed 脚本
- **WHEN** 运行 `pnpm run seed:builtin`（本地 D1）
- **THEN** 10 个内置工具记录被插入 `tools` 表
- **THEN** 每条记录的 `is_builtin = 1`、`category = 'builtin'`

#### Scenario: 重复执行 seed 脚本
- **WHEN** 运行 `pnpm run seed:builtin` 两次及以上
- **THEN** 不产生重复记录，已有记录被更新（幂等）

#### Scenario: seed 后工具出现在列表
- **WHEN** 访问 DevShelf 首页
- **THEN** 10 个内置工具出现在工具列表中，分类为"内置工具"

### Requirement: package.json 提供 seed:builtin 命令
`package.json` SHALL 包含 `"seed:builtin"` script，用于在本地 D1 执行 seed。

#### Scenario: 命令可执行
- **WHEN** 运行 `pnpm run seed:builtin`
- **THEN** 脚本无报错退出，并输出成功信息
