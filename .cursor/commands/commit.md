# Commit and Push Changes

自动生成 commit message 并提交推送。

## Instructions

1. 并行执行以下 git 命令收集信息：
   - `git status` 查看所有变更文件
   - `git diff --staged` 查看已暂存的更改
   - `git diff` 查看未暂存的更改
   - `git log --oneline -5` 查看最近的 commit 风格

2. 分析变更内容，生成符合 Conventional Commits 规范的 commit message：
   - 格式: `<type>(<scope>): <subject>`
   - type: feat / fix / docs / style / refactor / perf / test / chore
   - scope: 可选，如 ui / api / db / auth 等
   - subject: 简洁描述，使用英文，祈使语气，首字母小写，不加句号
   - 整个 message 长度不超过 120 字符

3. 依次执行：
   - `git add -A` 暂存所有更改
   - `git commit -m "<generated_message>"` 提交
   - `git push` 推送到远程

4. 报告执行结果：成功则显示 commit hash 和推送状态，失败则说明原因。

## Notes

- 如果没有任何更改，告知用户无需提交
- 如果推送失败（如需要 pull），提示用户并询问是否执行 `git pull --rebase`
- 不要包含敏感文件（.env 等）
