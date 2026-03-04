## ADDED Requirements

### Requirement: 内置工具路由导出 toolMeta
每个内置工具路由文件（`app/routes/tools.*.tsx`）SHALL 导出一个名为 `toolMeta` 的常量，类型为 `BuiltinToolMeta`，包含该工具在工具列表中显示所需的全部元数据。

`BuiltinToolMeta` 包含以下字段：
- `id`（string）：等于路由 slug，如 `"json-formatter"`
- `name`（string）：工具显示名称
- `description`（string）：工具简短描述
- `icon`（string）：Lucide 图标名称
- `category`（string）：固定为 `"builtin"`
- `tags`（string[]）：标签列表

#### Scenario: 路由文件包含 toolMeta 导出
- **WHEN** 查看任意 `app/routes/tools.*.tsx` 文件
- **THEN** 该文件顶层 MUST 包含 `export const toolMeta: BuiltinToolMeta = { ... }`

#### Scenario: toolMeta 字段完整
- **WHEN** 读取任意内置工具路由的 `toolMeta`
- **THEN** `id`、`name`、`description`、`icon`、`category`、`tags` 字段均不为空
- **THEN** `category` 值 MUST 为 `"builtin"`
- **THEN** `id` 值 MUST 与该路由的 URL slug 一致
