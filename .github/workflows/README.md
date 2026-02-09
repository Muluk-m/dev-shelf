# Deployment Workflows

本项目使用 [qlj-action-tools](https://github.com/qiliangjia/qlj-action-tools) 提供的可重用工作流进行部署。

## 工作流总览

现在只保留两条工作流：

1. `deploy-release.yml`
用于生产发布，支持手动触发审批、手动跳过审批直接部署，以及审批通过后的自动回调部署。

2. `deploy-preview.yml`
用于测试/预览环境部署，支持测试分支自动触发和手动触发。

## 生产发布流程（deploy-release.yml）

### 触发方式

- 手动触发（`workflow_dispatch`）
- 审批回调触发（`repository_dispatch`，事件类型 `cloudflare-deploy-approved`）

### 手动触发时

必填输入：
- `deploy_title`: 本次部署的一句话标题

可选输入：
- `skip_approval`: 是否跳过审批直接部署（默认 `false`）

### 执行路径

1. `skip_approval = false`
- 调用 `request-approval.yml` 发送审批消息
- 审批通过后由后端触发 `repository_dispatch`
- 同一个 `deploy-release.yml` 接收回调并调用 `deploy.yml` 完成部署

2. `skip_approval = true`
- 直接调用 `deploy.yml` 执行生产部署

### 核心固定参数

- `project_name`: `qlj-devhub-homepage`
- `mode`: `workers`
- `environment`: `production`
- `build_command`: `pnpm install && pnpm run build`
- `build_dir`: `build`

## 预览部署流程（deploy-preview.yml）

### 触发方式

- 推送到 `test/*` 或 `test-*` 分支
- 手动触发（可选择 `preview` / `staging`）

### 核心固定参数

- `project_name`: `qlj-devhub-homepage`
- `mode`: `workers`
- `environment`: `preview`（手动可选 `staging`）
- `build_command`: `pnpm install && pnpm run build`
- `build_dir`: `build`

## 必需配置

### Repository Variables

在 GitHub 仓库 `Settings > Secrets and variables > Actions > Variables` 中配置：

| 变量名 | 说明 | 示例 |
|---|---|---|
| `APPROVER_USER_IDS` | 审批人飞书 open_id 列表（JSON 数组） | `'["ou_abc123", "ou_def456"]'` |
| `FEISHU_CHAT_ID` | 飞书群聊 ID（接收审批和部署通知） | `"oc_xyz789"` |

### Repository Secrets

在 GitHub 仓库 `Settings > Secrets and variables > Actions > Secrets` 中配置：

| Secret 名 | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

## 使用方式

### 生产部署

1. 进入 Actions -> `Deploy Release`
2. 填写 `deploy_title`
3. 选择是否 `skip_approval`
4. 若不跳过审批，等待审批通过后自动部署

### 预览部署

1. 推送代码到 `test/*` / `test-*` 分支触发自动部署
2. 或在 Actions -> `Deploy Preview` 手动触发并选择环境

## 常见问题

### 审批通过后没有部署

1. 检查后端服务是否成功发出 `repository_dispatch`
2. 检查事件类型是否为 `cloudflare-deploy-approved`
3. 查看 `Deploy Release` workflow 历史记录

### 部署失败

1. 查看 workflow 日志中的构建/发布步骤
2. 检查 Cloudflare 相关 Secrets 配置
3. 检查构建命令与构建产物目录是否正确
