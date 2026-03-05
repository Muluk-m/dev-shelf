## Why

现有的自制 i18n 系统（`useI18n` hook + 单文件 `translations.ts`）只覆盖了导航、标题等"外壳"文字，10 个内置工具页面内的数百个 UI 字符串（标签、按钮、占位符、错误信息）全部硬编码为中文。切换语言后工具内容不变，多语言形同虚设。同时自制方案缺少复数形式支持、namespace 分割、懒加载等能力，随着 key 增多维护成本高。

## What Changes

- **移除**自制 i18n：`app/hooks/use-i18n.ts`、`app/i18n/translations.ts`（及其 `TranslationKey` 类型）
- **安装** `i18next` + `react-i18next`
- **新增** `locales/zh-CN.json` 和 `locales/en.json`，收录全站所有 UI 字符串（全量，单文件方案）
- **新增** `app/lib/i18n.ts`：i18next 初始化配置（语言包 inline import，不做懒加载）
- **替换** `useI18n()` 为 `useTranslation()` ——所有调用处 API 相同，改动最小
- **替换** `app/stores/locale-store.ts` 中的 `setLocale` 为 `i18next.changeLanguage()`，语言切换仍持久化到 localStorage
- **全量翻译** 10 个工具页、首页、认证页、管理页中的所有硬编码中文字符串

## Capabilities

### New Capabilities

- `i18n-setup`: react-i18next 初始化，语言包注册，与 locale store 联动
- `full-translation`: 全站所有 UI 字符串提取并翻译为 en/zh-CN 双语

### Modified Capabilities

（无 spec 级别行为变化）

## Impact

- **移除**：`app/hooks/use-i18n.ts`、`app/i18n/translations.ts`
- **新增**：`app/lib/i18n.ts`、`locales/zh-CN.json`、`locales/en.json`
- **修改**：`app/stores/locale-store.ts`、`app/components/language-toggle.tsx`、`app/root.tsx`
- **修改**：所有含硬编码中文的路由文件（~15 个）
- **依赖新增**：`i18next`、`react-i18next`
