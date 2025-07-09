# 批量创建数据结构功能

## 概述

`POST /api/schemas` 接口现在支持批量创建数据结构，同时保持对单个创建的向后兼容性。

## 功能特性

1. **向后兼容**：原有的单个对象请求格式完全保持不变
2. **批量创建**：支持数组格式的请求，一次提交多个数据结构
3. **错误隔离**：批量创建中，一个模型的创建失败不会影响其他模型的创建
4. **详细反馈**：批量创建会返回每个模型的创建结果和错误信息

## 请求格式

### 单个创建（原有格式）

```json
{
  "name": "user_info",
  "code": "user_info",
  "description": "用户信息表",
  "fields": [
    {
      "name": "username",
      "type": "string",
      "description": "用户名",
      "isRequired": true,
      "length": 50
    }
  ]
}
```

### 批量创建（新格式）

```json
[
  {
    "name": "user_info",
    "code": "user_info",
    "description": "用户信息表",
    "fields": [
      {
        "name": "username",
        "type": "string",
        "description": "用户名",
        "isRequired": true,
        "length": 50
      }
    ]
  },
  {
    "name": "product_info",
    "code": "product_info",
    "description": "商品信息表",
    "fields": [
      {
        "name": "name",
        "type": "string",
        "description": "商品名称",
        "isRequired": true,
        "length": 100
      }
    ]
  }
]
```

## 响应格式

### 单个创建响应

成功时返回 201 状态码：

```json
{
  "id": "uuid",
  "name": "user_info",
  "code": "user_info",
  "description": "用户信息表",
  "fields": [...],
  "version": 1,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

如果有警告信息：

```json
{
  "data": {
    "id": "uuid",
    "name": "user_info",
    "code": "user_info",
    ...
  },
  "warning": {
    "message": "建议在keyIndexes中配置主键字段",
    "code": "WARNING_NO_PRIMARY_KEY"
  }
}
```

### 批量创建响应

返回 201 状态码（如果有成功创建的）或 400 状态码（如果全部失败）：

```json
{
  "total": 3,
  "success": 2,
  "failed": 1,
  "results": [
    {
      "success": true,
      "index": 0,
      "data": {
        "id": "uuid1",
        "name": "user_info",
        "code": "user_info",
        ...
      }
    },
    {
      "success": true,
      "index": 1,
      "data": {
        "id": "uuid2",
        "name": "product_info",
        "code": "product_info",
        ...
      }
    },
    {
      "success": false,
      "index": 2,
      "name": "invalid_schema",
      "code": "invalid_code_with_space",
      "error": "代码格式不正确，必须以字母开头，只能包含字母、数字、下划线和冒号"
    }
  ]
}
```

## 错误处理

### 单个创建错误

- **400 Bad Request**：参数验证失败
- **500 Internal Server Error**：服务器内部错误

### 批量创建错误

- **201 Created**：至少有一个模型创建成功
- **400 Bad Request**：所有模型都创建失败

## 使用示例

### cURL 示例

```bash
# 单个创建
curl -X POST "http://localhost:3000/api/schemas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "name": "user_info",
    "code": "user_info",
    "description": "用户信息表",
    "fields": [
      {
        "name": "username",
        "type": "string",
        "description": "用户名",
        "isRequired": true,
        "length": 50
      }
    ]
  }'

# 批量创建
curl -X POST "http://localhost:3000/api/schemas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '[
    {
      "name": "user_info",
      "code": "user_info",
      "description": "用户信息表",
      "fields": [
        {
          "name": "username",
          "type": "string",
          "description": "用户名",
          "isRequired": true,
          "length": 50
        }
      ]
    },
    {
      "name": "product_info",
      "code": "product_info",
      "description": "商品信息表",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "description": "商品名称",
          "isRequired": true,
          "length": 100
        }
      ]
    }
  ]'
```

## 注意事项

1. 批量创建中的每个模型都会进行独立的验证
2. 数据库操作是串行执行的，确保数据一致性
3. 如果某个模型创建失败，会记录错误信息但继续处理其他模型
4. 建议在批量创建时合理控制数量，避免请求过大 