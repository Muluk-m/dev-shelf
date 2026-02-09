# Deployment Workflows

本项目使用 [qlj-action-tools](https://github.com/qiliangjia/qlj-action-tools) 提供的可重用工作流进行部署。

## 🔄 审批部署完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 在 Actions 页面手动触发生产发布                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: deploy-production.yml 触发                             │
│  ├─ 调用 request-approval.yml                                   │
│  ├─ 构建 callback context (base64)                              │
│  └─ 发送审批请求到飞书（带 callback URL）                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 审批人在飞书点击"通过"                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: fe-toolkit-server 后端服务                              │
│  ├─ 验证审批人是否在白名单 (APPROVER_USER_IDS)                  │
│  ├─ 解码 callback context                                       │
│  └─ 调用 GitHub API: repository_dispatch                        │
│      POST /repos/{owner}/{repo}/dispatches                      │
│      {                                                           │
│        "event_type": "cloudflare-deploy-approved",              │
│        "client_payload": { deployment params }                  │
│      }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: deploy-callback.yml 被自动触发                         │
│  ├─ 监听 repository_dispatch 事件                               │
│  ├─ 提取 client_payload 中的部署参数                            │
│  └─ 调用 deploy.yml 工作流                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: deploy.yml 执行完整部署                                │
│  ├─ 发送构建开始通知                                            │
│  ├─ 执行构建 (pnpm install && pnpm run build)                  │
│  ├─ 部署到 Cloudflare Workers                                   │
│  └─ 发送部署成功/失败通知                                       │
└─────────────────────────────────────────────────────────────────┘
```

**关键点：**
- ✅ 审批和部署完全自动化，无需手动触发第二步
- ✅ 通过 callback URL + base64 context 传递所有部署参数
- ✅ 后端服务验证审批人权限后自动触发部署
- ✅ GitHub repository_dispatch 事件连接审批和部署

## 工作流说明

### 🚀 deploy-production.yml

**用途：** 生产环境部署（需要审批）- 第一步：请求审批

**触发条件：**
- 手动触发（`workflow_dispatch`）

**流程：**
1. 在手动触发表单填写 `deploy_title`（本次部署一句话说明）
2. 可选择 `skip_approval=true` 直接部署，或保持默认走审批
3. 走审批时：发送审批请求到飞书群聊（包含 callback URL）
4. 审批通过后，后端服务自动触发 `deploy-callback.yml`
5. 执行完整的构建和部署流程并发送结果通知

**配置项：**
- `deploy_config`: `{"project_name":"qlj-devhub-homepage","mode":"workers"}`
- `environment`: production
- `deploy_title`: 手动触发时必填
- `skip_approval`: 是否跳过审批直接部署（默认 `false`）
- `build_command`: pnpm install && pnpm run build
- `build_dir`: build

### 🔄 deploy-callback.yml

**用途：** 生产环境部署（需要审批）- 第二步：接收审批回调并执行部署

**触发条件：**
- 后端服务在审批通过后通过 `repository_dispatch` 事件触发
- 事件类型：`cloudflare-deploy-approved`

**流程：**
1. 接收来自后端服务的回调
2. 从 `client_payload` 中提取所有部署参数
3. 调用 `deploy.yml` 执行完整部署流程
4. 发送构建开始通知
5. 执行构建
6. 部署到 Cloudflare
7. 发送部署结果通知

**注意：** 这个工作流不需要手动触发，完全由审批系统自动调用。

### 🧪 deploy-test.yml

**用途：** 测试/预览环境部署（无需审批）

**触发条件：**
- 推送到 `test/*` 或 `test-*` 分支
- 手动触发

**流程：**
1. 自动构建
2. 自动部署到预览环境
3. 发送部署结果通知

**配置项：**
- `project_name`: qlj-devhub-homepage
- `mode`: workers
- `environment`: preview（或手动选择 staging）
- `build_command`: pnpm install && pnpm run build
- `build_dir`: build

## 必需配置

### Repository Variables

在 GitHub 仓库的 `Settings > Secrets and variables > Actions > Variables` 中配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `APPROVER_USER_IDS` | 审批人飞书 open_id 列表（JSON 数组） | `'["ou_abc123", "ou_def456"]'` |
| `FEISHU_CHAT_ID` | 飞书群聊 ID（接收审批和通知） | `"oc_xyz789"` |

### Repository Secrets

在 GitHub 仓库的 `Settings > Secrets and variables > Actions > Secrets` 中配置：

| Secret 名 | 说明 |
|-----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

## 快速开始

### 1. 配置变量和密钥

按照上述要求在 GitHub 仓库中配置所需的 Variables 和 Secrets。

### 2. 测试部署流程

#### 测试环境部署（推荐先测试）

```bash
# 创建测试分支
git checkout -b test/my-feature

# 推送触发部署
git push origin test/my-feature
```

部署将自动开始，无需审批。

#### 生产环境部署

1. 进入 Actions → `Deploy to Production (with Approval)` → Run workflow
2. 填写 `deploy_title`
3. 选择是否 `skip_approval`
4. 若不跳过审批：检查飞书群聊并审批
5. 部署完成后接收结果通知

## 通知示例

### 构建开始通知

```
📦 开始构建
项目：qlj-devhub-homepage
环境：production
分支：main
触发者：@username
查看日志：[点击查看]
```

### 部署成功通知

```
✅ 部署成功
项目：qlj-devhub-homepage
环境：production
部署地址：https://qlj-devhub-homepage.workers.dev
耗时：2m 15s
```

### 部署失败通知

```
❌ 部署失败
项目：qlj-devhub-homepage
环境：production
错误信息：Build failed
查看日志：[点击查看]
```

## 故障排查

### 审批请求未收到

1. 检查 `FEISHU_CHAT_ID` 是否正确配置
2. 检查飞书 app (ticket) 是否已添加到该群聊
3. 查看 workflow 运行日志

### 审批后未自动部署

1. 检查审批人是否在 `APPROVER_USER_IDS` 列表中
2. 查看 fe-toolkit-server 日志
3. 检查 GitHub webhook 是否正常

### 部署失败

1. 查看 workflow 运行日志
2. 检查 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 是否正确
3. 验证构建命令和构建目录配置

## 更多文档

- [完整文档](https://github.com/qiliangjia/qlj-action-tools/tree/main/docs/workflows)
- [迁移指南](./MIGRATION.md)
- [request-approval 详细说明](https://github.com/qiliangjia/qlj-action-tools/blob/main/docs/workflows/request-approval.md)
- [deploy 详细说明](https://github.com/qiliangjia/qlj-action-tools/blob/main/docs/workflows/deploy.md)
