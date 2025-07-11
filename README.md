# BDC (Business Data Constructor)

## 项目简介
BDC 是一个灵活的数据结构设计与查询平台，主要用于处理和管理动态变化的业务数据结构。系统集成了 AI 辅助功能，支持通过自然语言进行数据结构设计和查询语句生成。

## 技术栈
### 后端
- Node.js + TypeScript
- PostgreSQL + TypeORM
- GraphQL + Apollo Server
- Express

### 前端
- React + TypeScript
- Ant Design
- Apollo Client
- GraphQL

## 依赖
本项目依赖 UAC 作为 鉴权、用户管理、应用管理（ https://github.com/adisonshadow/fyIAMAdmin、 https://github.com/adisonshadow/fyUAC ）

## 核心功能
### 1. 数据结构设计
- 可视化数据结构设计界面
- AI 辅助数据结构设计
  - 支持自然语言描述生成数据结构
  - 智能推荐字段类型和关系
- 数据结构版本管理
- 数据结构变更追踪
- 数据结构验证和冲突检测

### 2. 数据查询
- 基于 Graph 的查询系统
- AI 辅助查询语句生成
  - 自然语言转查询语句
  - 查询语句优化建议
- 查询语句管理
  - 保存常用查询
  - 查询模板管理
- 查询结果可视化展示

### 3. 数据管理
- 数据导入导出
- 数据验证和清洗
- 数据关系管理
- 数据版本控制

## 已测试的 AI
- https://www.bigmodel.cn/dev/api/normal-model/glm-4 （glm-4-plus，其他的暂未测试）
- https://www.volcengine.com/ （deepseek-v3-250324，其他的暂未测试）
- https://aistudio.google.com/ （Gemini 已测，非常不好用）

## 项目结构
```
.
├── backend/           # 后端项目
│   ├── src/          # 源代码
│   ├── clis/         # 命令行工具
│   └── sqls/         # SQL 脚本
├── frontend/         # 前端项目
│   ├── src/          # 源代码
│   └── public/       # 静态资源
└── documents/        # 项目文档
```

## 开发环境设置

### 后端
1. 进入后端目录：
   ```bash
   cd backend
   ```
2. 安装依赖：
   ```bash
   yarn install
   ```
3. 配置环境变量：
   - 复制 `.env.example` 为 `.env.development`
   - 修改数据库连接信息
4. 初始化数据库：
   ```bash
   yarn init:schema:dev
   ```
5. 启动开发服务器：
   ```bash
   yarn dev
   ```

### 前端
1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   yarn install
   ```
3. 启动开发服务器：
   ```bash
   yarn dev
   ```

## 一键启动
```bash
# 启动所有服务
./scripts/dev.sh

# 重启后端
./scripts/restart-backend.sh

# 重启前端
./scripts/restart-frontend.sh
```

## 技术特点
- 支持动态数据结构
- 高度可扩展性
- 智能 AI 辅助
- 友好的用户界面
- 强大的查询能力

## 贡献指南
1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证
[MIT License](LICENSE) 