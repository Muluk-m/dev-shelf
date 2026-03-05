## Context

当前自制 i18n：`useI18n()` → `translations[locale][key]`，语言存 Zustand + localStorage。
问题：约 500 个字符串未翻译，无复数，类型靠手动维护，切换语言后工具内容仍为中文。

目标：迁移到 `react-i18next`，全量翻译，API 改动最小（`t()` 调用签名不变）。

## Goals / Non-Goals

**Goals:**
- 用 react-i18next 替换自制方案，保留 `t("key")` API
- 全站所有可见 UI 字符串支持 zh-CN / en 双语
- 语言偏好持久化到 localStorage，刷新后保留
- 单文件语言包（zh-CN.json / en.json），放在 `locales/`

**Non-Goals:**
- SSR 语言检测（hydration 时用默认 zh-CN，客户端读 localStorage 后切换）
- 懒加载语言包（包体小，inline import 足够）
- 后端 API 响应的多语言
- 工具本身的功能内容（如 JSON 数据、用户输入）的翻译

## Decisions

### 1. react-i18next，不选 lingui / FormatJS

**选择**：`i18next` + `react-i18next`
**理由**：API 与当前 `t("key", vars)` 最接近，迁移成本最低；生态最大；支持 Vite inline JSON import；无编译步骤
**备选**：lingui（需编译）、FormatJS/react-intl（ICU 格式，改动大）

### 2. 单文件语言包（locales/zh-CN.json + locales/en.json）

**选择**：两个大 JSON 文件，不按 namespace 分
**理由**：用户明确选择方案 2；工具页面字符串数量虽多但结构扁平，单文件可管理；避免 namespace 配置复杂度
**Key 命名规范**：`<区域>.<组件/页面>.<描述>`，如 `tools.jsonFormatter.tabs.format`

### 3. i18next 初始化：inline import，客户端同步

**选择**：`app/lib/i18n.ts` 中 `import zhCN from "../../locales/zh-CN.json"` 直接 import JSON
**理由**：Vite 原生支持 JSON import；语言包不大（预估 < 50KB）；同步初始化避免 SSR 水合闪烁
**备选**：HTTP 懒加载（i18next-http-backend）—— 适合大型应用，此处过杀

### 4. 语言持久化：localStorage key `"locale"`（与现有 Zustand store 兼容）

**选择**：i18next-browser-languagedetector 检测 localStorage `"locale"` key，与现有 locale-store 保持同一 key
**理由**：现有用户切换语言后 localStorage 已有 `"locale"` key，迁移后无需重新选择

### 5. locale-store 保留，但只持久化，不驱动翻译

**选择**：locale-store 改为在 `setLocale` 里调用 `i18next.changeLanguage(locale)` 同步语言状态
**理由**：language-toggle.tsx 和其他消费 locale 状态的组件不需要改动

## Risks / Trade-offs

- **hydration lang 闪烁** → 默认 `zh-CN`，客户端读 localStorage 后若为 `en` 会有短暂切换。已有 `suppressHydrationWarning` 且通过 `useEffect` 设置 `document.documentElement.lang`，影响极小
- **翻译 key 手动维护** → i18next 不会自动检测未翻译的 key，需要靠 review。后续可加 eslint-plugin-i18next
- **工具页面翻译工作量大** → 约 500 个字符串，通过系统化提取（逐文件处理）可控
