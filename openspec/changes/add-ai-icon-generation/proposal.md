# Change: AI 生成工具图标

## Why
在创建新工具时，用户经常需要为工具找到合适的图标，这个过程耗时且体验不佳：
- 需要去外部网站寻找合适的图标
- 需要上传或获取图标 URL
- 无法快速生成符合工具主题的个性化图标

通过集成 AI 图标生成功能，可以让用户直接根据工具名称和描述自动生成图标，大幅提升创建工具的效率和体验。

## What Changes
- 在工具表单的图标输入区域添加"AI 生成"按钮
- 集成 Dify API (https://api-ai.qiliangjia.org/v1) 调用图标生成服务
- 用户可以基于工具名称和描述一键生成图标
- 生成的图标自动填充到图标 URL 字段
- 提供加载状态和错误处理

## Impact

### 受影响的规范
- `tool-management` - 新增工具创建流程中的 AI 图标生成能力

### 受影响的代码
- `app/components/admin/tool-form.tsx` - 添加 AI 生成按钮和逻辑
- `workers/routes/uploads.ts` (可能新增) - 处理图标上传和存储
- `app/lib/api.ts` - 添加 AI 图标生成 API 调用函数

### 技术依赖
- Dify API: `https://api-ai.qiliangjia.org/v1`
- API Key: `app-w3ySSC6PLTlrjldSPErTwE6x`
- 可能需要 Cloudflare R2 存储生成的图标（后续优化）

### 用户体验改进
- 减少工具创建时间，提高管理效率
- 提供个性化图标生成体验
- 降低寻找图标的门槛
