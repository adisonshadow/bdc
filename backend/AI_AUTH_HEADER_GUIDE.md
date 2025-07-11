# AI 认证头配置指南

## 概述

本系统现在支持为不同的AI服务配置不同的认证头，以适配各种AI API的认证方式。

## 支持的认证头类型

### 1. OpenAI / Azure OpenAI
- **认证头名称**: `Authorization`
- **认证头值**: `Bearer YOUR_API_KEY`
- **示例**: 
  ```
  Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxx
  ```

### 2. Google Gemini
- **认证头名称**: `X-goog-api-key`
- **认证头值**: `YOUR_API_KEY`
- **示例**:
  ```
  X-goog-api-key: AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxx
  ```

### 3. Anthropic Claude
- **认证头名称**: `x-api-key`
- **认证头值**: `YOUR_API_KEY`
- **示例**:
  ```
  x-api-key: sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
  ```

### 4. 其他自定义认证头
- 可以根据具体AI服务的要求配置自定义认证头
- 例如：`X-Custom-Auth`, `Api-Key` 等

## 配置方法

### 1. 通过前端界面配置

1. 打开AI配置管理界面
2. 创建或编辑AI配置
3. 在"认证头名称"字段中填入相应的认证头名称
4. 在"API密钥"字段中填入API密钥
5. 保存配置

### 2. 通过数据库直接配置

```sql
-- 示例：配置Gemini
UPDATE bdc.ai_configs 
SET auth_header = 'X-goog-api-key'
WHERE provider = 'Google' AND model = 'gemini-2.0-flash';

-- 示例：配置OpenAI
UPDATE bdc.ai_configs 
SET auth_header = 'Authorization'
WHERE provider = 'OpenAI' AND model = 'gpt-4';
```

## 默认行为

- 如果未配置认证头名称，系统默认使用 `Authorization` 头
- 对于 `Authorization` 头，系统会自动添加 `Bearer ` 前缀
- 对于其他认证头，系统直接使用API密钥作为值

## 常见配置示例

### OpenAI GPT-4
```json
{
  "provider": "OpenAI",
  "apiUrl": "https://api.openai.com/v1/chat/completions",
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "authHeader": "Authorization",
  "model": "gpt-4"
}
```

### Google Gemini
```json
{
  "provider": "Google",
  "apiUrl": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  "apiKey": "AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxx",
  "authHeader": "X-goog-api-key",
  "model": "gemini-2.0-flash"
}
```

### Anthropic Claude
```json
{
  "provider": "Anthropic",
  "apiUrl": "https://api.anthropic.com/v1/messages",
  "apiKey": "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx",
  "authHeader": "x-api-key",
  "model": "claude-3-sonnet-20240229"
}
```

## 注意事项

1. **安全性**: API密钥会以加密形式存储在数据库中
2. **兼容性**: 新字段为可选字段，不会影响现有配置
3. **迁移**: 现有配置会自动使用默认的 `Authorization` 头
4. **测试**: 建议在配置后使用"测试连接"功能验证配置是否正确

## 故障排除

### 认证失败
- 检查认证头名称是否正确
- 检查API密钥是否有效
- 确认API密钥格式是否正确

### 请求被拒绝
- 检查API地址是否正确
- 确认API密钥有足够的权限
- 检查请求频率是否超限

## 技术支持

如果遇到配置问题，请检查：
1. 网络连接是否正常
2. API服务是否可用
3. 配置参数是否正确
4. 认证信息是否有效 