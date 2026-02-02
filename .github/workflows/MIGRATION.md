# Workflow Migration Guide

## 迁移日期：2026-01-30

本项目已迁移到新的部署工作流架构。

## 变更概述

### 旧架构（已弃用）
- `prebuild.yml` - 构建 + 上传 + 请求审批
- `publish.yml` - 下载 + 部署 + 通知

### 新架构（当前）
- `deploy-production.yml` - 生产环境部署（带审批）
- `deploy-test.yml` - 测试环境部署（无审批）

## 主要改进

1. ✅ **清晰的职责分离**
   - 审批工作流不再执行构建（节省 CI 时间）
   - 部署工作流包含完整的构建-部署-通知生命周期

2. ✅ **自动化回调触发**
   - 审批通过后自动触发部署，无需手动 workflow_dispatch

3. ✅ **改进的通知机制**
   - 构建开始通知（新增）
   - 部署成功/失败通知（保留）

4. ✅ **工业标准工具**
   - 使用 cloudflare/wrangler-action@v3 替代手动 CLI

## 配置要求

### 必需的 Repository Variables

在 GitHub 仓库设置中添加以下变量：

- `APPROVER_USER_IDS` - 审批人飞书 user_id JSON 数组
  - 格式：`'["ou_xxx", "ou_yyy"]'`
  - 用途：控制谁可以批准生产部署

- `FEISHU_CHAT_ID` - 飞书群聊 ID
  - 格式：`"oc_zzz"`
  - 用途：接收审批消息和部署通知

### 必需的 Repository Secrets

保留现有的 secrets（无需修改）：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 使用方式

### 生产环境部署

**触发方式：**
- 推送到 `main` 分支
- 手动触发 `Deploy to Production (with Approval)` workflow

**流程：**
1. 自动发送审批请求到飞书群
2. 审批人点击"通过"按钮
3. 自动触发构建和部署
4. 发送部署结果通知

### 测试环境部署

**触发方式：**
- 推送到 `test/*` 或 `test-*` 分支
- 手动触发 `Deploy to Test Environment` workflow

**流程：**
1. 自动构建
2. 自动部署到 preview 环境
3. 发送部署结果通知

## 迁移清单

- [x] 创建新的 workflow 文件
- [x] 归档旧的 workflow 文件
- [ ] 配置 `APPROVER_USER_IDS` 变量
- [ ] 测试生产部署流程
- [ ] 测试测试环境部署流程
- [ ] 验证通知功能

## 回滚方案

如需回滚到旧架构：

```bash
# 恢复旧 workflow
mv .github/workflows/prebuild.yml.deprecated .github/workflows/prebuild.yml
mv .github/workflows/publish.yml.deprecated .github/workflows/publish.yml

# 删除新 workflow
rm .github/workflows/deploy-production.yml
rm .github/workflows/deploy-test.yml
```

## 相关文档

- [新架构文档](https://github.com/qiliangjia/qlj-action-tools/tree/main/docs/workflows)
- [request-approval 使用指南](https://github.com/qiliangjia/qlj-action-tools/blob/main/docs/workflows/request-approval.md)
- [deploy 使用指南](https://github.com/qiliangjia/qlj-action-tools/blob/main/docs/workflows/deploy.md)
