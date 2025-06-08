# Cursor 需知

## 项目概述
这是一个基于 Node.js、TypeScript、PostgreSQL 的灵活数据结构设计与查询平台。项目使用 Cursor IDE 进行开发，需要特别注意以下几点：

## 开发环境
- 操作系统：macOS
- IDE：Cursor
- 包管理器：Yarn
- 版本控制：Git

## 环境配置
### Yarn 全局配置
为了避免频繁使用 sudo，请执行以下配置：

1. 设置 yarn 全局安装目录：
```bash
mkdir -p ~/.yarn-global
yarn config set prefix ~/.yarn-global
```

2. 将以下行添加到 ~/.zshrc 或 ~/.bashrc：
```bash
export PATH="$PATH:$HOME/.yarn-global/bin"
```

3. 重新加载配置：
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

### 项目权限
项目目录已配置为当前用户所有，无需使用 sudo 进行项目相关操作。

## 项目结构
项目采用前后端分离架构，主要包含以下部分：
- 后端服务（Node.js + TypeScript）
- 前端应用（React + Ant Design）
- 数据库（PostgreSQL）

## 开发注意事项

### 1. 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 保持代码注释的完整性

### 2. 数据库操作
- 使用 TypeORM 进行数据库操作
- 所有数据库变更需要通过迁移文件进行
- 注意数据版本控制

### 3. API 开发
- RESTful API 设计规范
- GraphQL 查询优化
- 错误处理标准化
- 接口文档及时更新

### 4. 前端开发
- 组件化开发
- 状态管理规范
- 样式管理方案
- 性能优化考虑

## 常用命令
```bash
# 安装依赖
sudo yarn install

# 开发环境运行
yarn dev

# 构建
yarn build

# 测试
yarn test
```

## 调试技巧
- 使用 Cursor 的调试功能
- 日志记录规范
- 错误追踪方法
- 性能分析工具

## 版本控制
- 遵循 Git Flow 工作流
- 提交信息规范
- 分支管理策略
- 代码审查流程

## 文档维护
- 及时更新文档
- 保持文档的准确性
- 记录重要决策
- 维护变更日志

## 注意事项
- 定期备份代码
- 注意代码安全性
- 遵循最佳实践
- 保持代码整洁 