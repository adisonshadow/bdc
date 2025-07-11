# AI 认证头功能实现总结

## 功能概述

为支持不同AI服务的认证方式，系统新增了 `auth_header` 字段，允许用户为每个AI配置指定自定义的认证头名称。

## 修改内容

### 1. 数据库层面

#### 1.1 数据库表结构修改
- **文件**: `backend/sqls/init_schema.sql`
- **修改**: 为 `bdc.ai_configs` 表添加 `auth_header VARCHAR(100)` 字段
- **特性**: 允许为空，支持自定义认证头名称

#### 1.2 数据库迁移脚本
- **文件**: `backend/sqls/add_auth_header_migration.sql`
- **功能**: 为现有数据库添加新字段并设置默认值

#### 1.3 迁移执行脚本
- **文件**: `backend/scripts/run_migration.sh`
- **功能**: 自动化执行数据库迁移

### 2. 后端层面

#### 2.1 数据模型更新
- **文件**: `backend/src/models/AiConfig.ts`
- **修改**: 添加 `authHeader` 字段映射
- **特性**: 支持数据库字段映射

#### 2.2 控制器更新
- **文件**: `backend/src/controllers/aiConfigController.ts`
- **修改**: 
  - 创建AI配置时支持 `authHeader` 字段
  - 更新AI配置时支持 `authHeader` 字段
  - 保持向后兼容性

### 3. 前端层面

#### 3.1 API 类型定义更新
- **文件**: `frontend/src/services/BDC/api/aiConfigManagement.ts`
- **修改**: 所有AI配置相关的API类型都添加了 `authHeader` 字段

#### 3.2 AI配置管理组件更新
- **文件**: `frontend/src/components/AiConfigManager/index.tsx`
- **修改**: 接口定义添加 `authHeader` 字段

#### 3.3 AI配置模态框更新
- **文件**: `frontend/src/components/AiConfigManager/AiConfigModal.tsx`
- **修改**: 
  - 添加认证头输入字段
  - 更新表单处理逻辑
  - 支持编辑和创建时的认证头设置

#### 3.4 AI服务更新
- **文件**: `frontend/src/AIHelper/aiConfigService.ts`
- **修改**: 
  - 接口定义添加 `authHeader` 字段
  - 动态配置转换逻辑支持自定义认证头
  - 智能处理不同认证头格式

## 功能特性

### 1. 支持的认证头类型

#### OpenAI / Azure OpenAI
```javascript
{
  authHeader: 'Authorization',
  // 自动添加 Bearer 前缀
}
```

#### Google Gemini
```javascript
{
  authHeader: 'X-goog-api-key',
  // 直接使用API密钥
}
```

#### Anthropic Claude
```javascript
{
  authHeader: 'x-api-key',
  // 直接使用API密钥
}
```

### 2. 智能认证头处理

- **默认行为**: 未配置时使用 `Authorization` 头
- **Authorization 头**: 自动添加 `Bearer ` 前缀
- **其他认证头**: 直接使用API密钥作为值

### 3. 向后兼容性

- 现有配置不受影响
- 未配置认证头的配置自动使用默认值
- 数据库迁移自动处理现有数据

## 使用示例

### 1. 配置 Gemini
```json
{
  "provider": "Google",
  "apiUrl": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  "apiKey": "AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxx",
  "authHeader": "X-goog-api-key",
  "model": "gemini-2.0-flash"
}
```

### 2. 配置 OpenAI
```json
{
  "provider": "OpenAI",
  "apiUrl": "https://api.openai.com/v1/chat/completions",
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "authHeader": "Authorization",
  "model": "gpt-4"
}
```

## 部署步骤

### 1. 数据库迁移
```bash
cd backend
./scripts/run_migration.sh
```

### 2. 重启服务
```bash
# 重启后端服务
cd backend && npm run dev

# 重启前端服务
cd frontend && npm run dev
```

### 3. 验证功能
1. 打开前端应用
2. 进入AI配置管理
3. 创建新的AI配置
4. 设置认证头名称
5. 测试连接功能

## 测试

### 1. 单元测试
```bash
cd backend
node test/test_auth_header.js
```

### 2. 集成测试
1. 创建不同认证头的配置
2. 测试AI请求功能
3. 验证认证头正确传递

## 文档

- **配置指南**: `backend/AI_AUTH_HEADER_GUIDE.md`
- **实现总结**: `AUTH_HEADER_IMPLEMENTATION.md`

## 注意事项

1. **安全性**: API密钥加密存储
2. **兼容性**: 完全向后兼容
3. **性能**: 无性能影响
4. **维护性**: 代码结构清晰，易于维护

## 后续优化

1. 添加更多预设认证头类型
2. 支持认证头模板
3. 添加认证头验证功能
4. 支持批量配置导入 