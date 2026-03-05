## 1. 安装依赖

- [x] 1.1 安装 `i18next`、`react-i18next`、`i18next-browser-languagedetector`

## 2. 创建 i18next 初始化模块

- [x] 2.1 新建 `app/lib/i18n.ts`：inline import zh-CN.json / en.json，配置 i18next-browser-languagedetector 读取 localStorage `"locale"` key，调用 `i18next.use(...).init(...)`
- [x] 2.2 在 `app/root.tsx` 中 import `app/lib/i18n.ts`（side-effect import，确保在 React 树之前初始化）
- [x] 2.3 将 `app/stores/locale-store.ts` 的 `setLocale` 改为调用 `i18next.changeLanguage(locale)` 再更新 Zustand state

## 3. 创建语言包骨架

- [x] 3.1 新建 `locales/zh-CN.json`，填入现有 `app/i18n/translations.ts` 中的所有 zh-CN 字符串（nav、header、admin、tools 通用部分）
- [x] 3.2 新建 `locales/en.json`，填入对应英文翻译

## 4. 替换 useI18n → useTranslation（通用组件 & 布局）

- [x] 4.1 `app/components/layout/header.tsx` — 替换 `useI18n` 为 `useTranslation`，key 迁移
- [x] 4.2 `app/components/layout/admin-layout.tsx` — 替换 `useI18n` 为 `useTranslation`，key 迁移
- [x] 4.3 `app/components/auth/login-form.tsx` — 替换，添加 en 翻译 key
- [x] 4.4 `app/components/auth/register-form.tsx` — 替换，添加 en 翻译 key
- [x] 4.5 `app/components/language-toggle.tsx` — 若使用 `useI18n` 则替换

## 5. 翻译路由页面（认证 & 管理）

- [x] 5.1 `app/routes/login.tsx` — 提取硬编码中文，写入语言包，替换为 `t()` 调用
- [x] 5.2 `app/routes/register.tsx` — 同上
- [x] 5.3 `app/routes/setup.tsx` — 同上
- [x] 5.4 `app/routes/settings.tsx` — 同上
- [x] 5.5 `app/routes/admin.tsx` — 同上
- [x] 5.6 `app/routes/admin_.users.tsx` — 同上
- [x] 5.7 `app/routes/admin_.permissions.tsx` — 同上
- [x] 5.8 `app/routes/_index.tsx` — 同上

## 6. 翻译内置工具页面

- [x] 6.1 `app/routes/tools.json-formatter.tsx` — 提取所有 UI 字符串，写入语言包，替换为 `t()` 调用
- [x] 6.2 `app/routes/tools.json-diff.tsx` — 同上
- [x] 6.3 `app/routes/tools.jwt-decoder.tsx` — 同上
- [x] 6.4 `app/routes/tools.base64-converter.tsx` — 同上
- [x] 6.5 `app/routes/tools.url-encoder.tsx` — 同上
- [x] 6.6 `app/routes/tools.url-parser.tsx` — 同上
- [x] 6.7 `app/routes/tools.time-formatter.tsx` — 同上
- [x] 6.8 `app/routes/tools.ua-parser.tsx` — 同上
- [x] 6.9 `app/routes/tools.qr-generator.tsx` — 同上
- [x] 6.10 `app/routes/tools.file-uploader.tsx` — 同上
- [x] 6.11 `app/routes/tools_.$id.tsx` — 同上（动态工具页）

## 7. 清理旧 i18n

- [x] 7.1 删除 `app/hooks/use-i18n.ts`
- [x] 7.2 删除 `app/i18n/translations.ts`（及 `app/i18n/` 目录若已空）
- [x] 7.3 确认无文件仍 import `use-i18n` 或 `translations`

## 8. 验证

- [x] 8.1 `pnpm run typecheck` 无新增 TypeScript 错误
- [ ] 8.2 启动开发服务器，切换语言后所有工具页 UI 字符串正确切换
- [ ] 8.3 刷新页面后语言偏好保留（localStorage 持久化验证）
