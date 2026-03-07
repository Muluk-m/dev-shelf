<div align="center">

<img src="public/logo.svg" alt="DevShelf" width="80" height="80" />

# DevShelf

**团队的开发工具书架 —— 有序整理，随手可取。**

[English](README.md) | [简体中文](README.zh-CN.md)

集中管理团队的开发工具、内部链接和环境地址。部署在 Cloudflare Workers 上，30 秒即可上线。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Muluk-m/dev-shelf)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)

</div>

---

![DevShelf 截图](docs/screenshot.png)

## 为什么选择 DevShelf？

每个团队都维护着越来越多的内部工具、仪表盘、API 和服务，散落在浏览器书签、Wiki 和 Slack 消息中。DevShelf 给它们一个统一的家。

- **工具集中管理** —— 再也不用在 Slack 里问 "测试环境的链接在哪？"
- **多环境地址** —— 每个工具可配置 开发 / 测试 / 生产 地址，一键直达
- **零基础设施成本** —— 运行在 Cloudflare 免费套餐上（Workers + D1 + KV）
- **30 秒部署** —— 点击按钮即可获得运行实例，无需 Docker、虚拟机或配置文件
- **数据自主可控** —— 自托管，随时导出为 JSON，无厂商锁定

## 功能特性

<table>
<tr>
<td width="50%">

### 工具管理
完整的增删改查，支持分类、标签和环境链接。轻松管理数百个工具。

### 命令面板
按下 `Cmd/Ctrl + K` 即可搜索并跳转到任意工具，键盘优先的工作流。

### 角色权限
管理员和普通用户两种角色。管理员管理工具；用户浏览和收藏。首次运行向导自动创建管理员账户。

</td>
<td width="50%">

### 多环境地址
每个工具可配置开发、测试和生产环境的 URL，一键打开对应环境。

### 内置实用工具
JSON 格式化、Base64 编解码、URL 解析等常用工具，触手可及。

### 数据导出
管理员可将所有工具、分类和标签导出为 JSON 文件，用于备份或迁移。

</td>
</tr>
</table>

### 更多特性

- 亮色 / 暗色主题（跟随系统偏好）
- 响应式设计（桌面端和移动端）
- 通过 Cloudflare Workers 全球边缘部署
- D1 数据库（边缘 SQLite，零冷启动）
- 用户收藏和最近使用的工具

## 快速开始

### 一键部署

最快上手方式。自动创建 Workers 应用、D1 数据库和 KV 命名空间。

<div align="center">

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Muluk-m/dev-shelf)

</div>

部署完成后：

1. 设置 JWT 密钥：`wrangler secret put JWT_SECRET`（用 `openssl rand -hex 32` 生成）
2. 访问部署后的 URL
3. 完成初始化向导，创建管理员账户
4. 开始添加你团队的工具

### 手动部署

<details>
<summary>点击展开详细步骤</summary>

#### 前置条件

- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)（免费套餐即可）
- [Node.js](https://nodejs.org/)（LTS 版本）
- [pnpm](https://pnpm.io/installation)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)：`npm install -g wrangler`

#### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Muluk-m/dev-shelf.git
cd dev-shelf

# 2. 安装依赖
pnpm install

# 3. 登录 Cloudflare
wrangler login

# 4. 创建 D1 数据库
wrangler d1 create devhub-database
# 复制输出中的 database_id，更新 wrangler.jsonc 中的对应字段

# 5. 执行数据库迁移
wrangler d1 migrations apply DB --remote

# 6. 设置 JWT 密钥
wrangler secret put JWT_SECRET
# 输入一个强随机字符串（可用 openssl rand -hex 32 生成）

# 7. 部署
pnpm run deploy
```

访问部署后的 URL，完成初始化向导。

</details>

## 本地开发

```bash
# 克隆并安装
git clone https://github.com/Muluk-m/dev-shelf.git
cd dev-shelf
pnpm install

# 配置环境变量
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars，设置 JWT_SECRET=any-local-dev-secret

# 初始化本地数据库
pnpm run db:migrate:local

# 启动开发服务器
pnpm run dev
# 打开 http://localhost:5173
```

<details>
<summary>所有可用命令</summary>

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 启动开发服务器（热更新） |
| `pnpm run build` | 构建生产版本 |
| `pnpm run preview` | 本地预览生产构建 |
| `pnpm run deploy` | 构建、迁移并部署到 Cloudflare |
| `pnpm run typecheck` | 运行 TypeScript 类型检查 |
| `pnpm run lint` | 使用 Biome 检查代码质量 |
| `pnpm run lint:fix` | 自动修复代码问题 |
| `pnpm run cf-typegen` | 生成 Cloudflare 绑定类型 |
| `pnpm run db:migrate` | 将迁移应用到远程 D1 |
| `pnpm run db:migrate:local` | 将迁移应用到本地 D1 |

</details>

## 环境变量

| 变量 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `JWT_SECRET` | Secret | 是 | 用于签发认证令牌的密钥。生成方式：`openssl rand -hex 32` |
| `API_BASE_URL` | Var | 否 | 应用公网 URL（留空则自动检测） |
| `DB` | D1 绑定 | 自动 | 应用数据库 |
| `CACHE_KV` | KV 绑定 | 自动 | 响应缓存 |

Secret 通过 `wrangler secret put` 设置。Var 在 `wrangler.jsonc` 中配置。绑定由 Deploy Button 自动创建。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, React Router 7, Tailwind CSS 4, shadcn/ui |
| 后端 | Hono on Cloudflare Workers |
| 数据库 | Cloudflare D1（边缘 SQLite） |
| 缓存 | Cloudflare KV |
| 语言 | TypeScript 5.8 |
| 工具链 | pnpm, Biome, Vite |

## 项目结构

```
dev-shelf/
├── app/                    # 前端（React Router v7）
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 hooks
│   ├── lib/                # 工具函数和 API 客户端
│   ├── routes/             # 页面路由
│   └── stores/             # Zustand 状态管理
├── workers/                # 后端 API（Hono）
│   ├── middleware/          # 认证和权限中间件
│   └── routes/             # API 路由处理
├── lib/                    # 共享代码
│   └── database/           # D1 数据库操作
├── migrations/             # D1 数据库迁移
├── wrangler.jsonc          # Cloudflare 配置
└── .dev.vars.example       # 环境变量模板
```

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

[MIT](LICENSE)
