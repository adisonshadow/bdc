# AI 新建表功能

## 功能概述

AI 新建表功能允许用户通过自然语言描述业务需求，AI 自动生成完整的数据表模型。这个功能大大简化了数据表设计过程，特别适合快速原型开发和业务需求验证。

## 使用方法

1. 点击"AI新建表"按钮
2. 输入详细业务描述
3. AI 自动生成表名和完整表结构
4. 确认后创建数据表

## 特性

- 🎯 智能设计：根据业务描述自动生成表名和表结构
- 🔧 完整配置：自动设置字段类型、长度、约束
- ✨ 用户友好：两步式操作，实时预览
- 🛡️ 安全可靠：完整错误处理机制

## 注意事项

- 需要网络连接访问 AI 服务
- 业务描述会发送给 AI 服务
- 生成结果需要人工审核
- 复杂业务场景建议结合手动设计

## AI 提示词模板

系统使用以下模板向 AI 发送请求：

```
请根据以下业务需求自动生成一个数据表模型：

业务描述：{用户输入的详细描述}

请生成一个完整的数据表模型，包含：
1. 合适的表名和代码（根据业务描述自动生成，使用下划线命名，如：user_profile）
2. 详细的表描述
3. 完整的字段列表，包括：
   - 主键字段（UUID 或自增长ID）
   - 业务字段（根据描述合理设计）
   - 创建时间、更新时间等系统字段
   - 合适的字段类型、长度、是否必填等配置

要求：
- 根据业务描述自动生成合适的表名
- 字段名使用小写字母和下划线
- 包含主键字段
- 字段类型要合理（string、number、text、date、boolean等）
- 字符串字段要设置长度
- 日期字段要设置日期类型
- 根据业务需求设置合适的索引

请返回 JSON 格式的数据：
{
  "name": "表的中文名称（如：企业用户信息表）",
  "code": "表的完整代码（如：enterprise:user_profile，支持多级命名）",
  "description": "表的详细描述",
  "fields": [
    {
      "id": "uuid",
      "name": "字段名",
      "type": "字段类型",
      "description": "字段描述",
      "required": true/false,
      "length": 长度（字符串类型需要）
    }
  ]
}

只返回 JSON 格式的数据，不要包含其他说明文字。
```

## 使用示例

### 示例 1：用户信息表

**输入：**
- 描述：存储用户的基本信息，包含姓名、邮箱、手机号、性别、生日等字段，需要支持用户注册、登录、个人信息修改等功能，邮箱和手机号需要唯一性约束，需要记录创建时间和更新时间

**AI 生成：**
```json
{
  "name": "企业用户信息表",
  "code": "enterprise:user_profile",
  "description": "存储企业用户的基本信息，支持用户注册、登录、个人信息修改等功能",
  "fields": [
    {
      "id": "field_001",
      "name": "id",
      "type": "uuid",
      "description": "用户唯一标识",
      "required": true
    },
    {
      "id": "field_002",
      "name": "username",
      "type": "string",
      "description": "用户名",
      "required": true,
      "length": 50
    },
    {
      "id": "field_003",
      "name": "email",
      "type": "string",
      "description": "邮箱地址",
      "required": true,
      "length": 100
    },
    {
      "id": "field_004",
      "name": "phone",
      "type": "string",
      "description": "手机号码",
      "required": false,
      "length": 20
    },
    {
      "id": "field_005",
      "name": "gender",
      "type": "enum",
      "description": "性别",
      "required": false,
      "enumConfig": {
        "targetEnumCode": "system:gender",
        "multiple": false,
        "defaultValues": ["male"]
      }
    },
    {
      "id": "field_006",
      "name": "birthday",
      "type": "date",
      "description": "生日",
      "required": false,
      "dateType": "date"
    },
    {
      "id": "field_007",
      "name": "created_at",
      "type": "date",
      "description": "创建时间",
      "required": true,
      "dateType": "datetime"
    },
    {
      "id": "field_008",
      "name": "updated_at",
      "type": "date",
      "description": "更新时间",
      "required": true,
      "dateType": "datetime"
    }
  ]
}
```

### 示例 2：商品表

**输入：**
- 描述：存储商品信息，包含商品名称、价格、库存、分类、图片等，需要支持商品上架下架、库存管理、分类管理等功能

**AI 生成：**
```json
{
  "name": "企业商品表",
  "code": "enterprise:product",
  "description": "存储企业商品信息，支持商品上架下架、库存管理、分类管理等功能",
  "fields": [
    {
      "id": "field_001",
      "name": "id",
      "type": "uuid",
      "description": "商品唯一标识",
      "required": true
    },
    {
      "id": "field_002",
      "name": "name",
      "type": "string",
      "description": "商品名称",
      "required": true,
      "length": 200
    },
    {
      "id": "field_003",
      "name": "price",
      "type": "number",
      "description": "商品价格",
      "required": true
    },
    {
      "id": "field_004",
      "name": "stock",
      "type": "number",
      "description": "库存数量",
      "required": true
    },
    {
      "id": "field_005",
      "name": "category_id",
      "type": "relation",
      "description": "商品分类",
      "required": true,
      "relationConfig": {
        "targetSchemaCode": "enterprise:category",
        "targetField": "id",
        "multiple": false,
        "cascadeDelete": "restrict",
        "displayFields": ["name"]
      }
    },
    {
      "id": "field_006",
      "name": "image_url",
      "type": "string",
      "description": "商品图片URL",
      "required": false,
      "length": 500
    },
    {
      "id": "field_007",
      "name": "status",
      "type": "enum",
      "description": "商品状态（上架/下架）",
      "required": true,
      "enumConfig": {
        "targetEnumCode": "system:product_status",
        "multiple": false,
        "defaultValues": ["active"]
      }
    },
    {
      "id": "field_008",
      "name": "description",
      "type": "text",
      "description": "商品描述",
      "required": false
    },
    {
      "id": "field_009",
      "name": "created_at",
      "type": "date",
      "description": "创建时间",
      "required": true,
      "dateType": "datetime"
    },
    {
      "id": "field_010",
      "name": "updated_at",
      "type": "date",
      "description": "更新时间",
      "required": true,
      "dateType": "datetime"
    }
  ]
}
```

## 最佳实践

### 1. 描述要详细
- 说明表的主要用途
- 列出重要的业务字段
- 描述业务规则和约束
- 说明与其他表的关系

### 2. 使用业务术语
- 使用业务人员熟悉的术语
- 避免技术性词汇
- 重点描述业务场景

### 3. 检查生成结果
- 确认字段类型是否合适
- 检查字段长度是否合理
- 验证业务逻辑是否正确

### 4. 迭代优化
- 如果结果不满意，使用"重新生成"
- 可以调整描述来获得更好的结果
- 多次尝试找到最佳方案

## 故障排除

### 常见问题

1. **"AI 返回的数据格式不正确"**
   - AI 可能返回了非 JSON 格式的响应
   - 检查网络连接和 AI 服务状态
   - 尝试重新生成

2. **"生成模型失败"**
   - 检查网络连接
   - 查看浏览器控制台的详细错误信息
   - 确认 AI 服务配置正确

3. **生成的模型不符合预期**
   - 尝试重新生成
   - 调整业务描述
   - 手动修改生成的模型

### 调试方法

1. 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的 API 请求状态
4. 检查 AI 服务的响应内容

## 技术实现

### 组件结构
```
AICreateSchema/
├── index.tsx          # 主组件
└── README.md          # 使用说明
```

### 核心功能
- 表单输入和验证
- AI 服务调用
- JSON 解析和验证
- 模型预览和确认
- 错误处理和用户反馈

### 集成方式
- 在 SchemaManagement 页面集成
- 通过 props 传递回调函数
- 支持成功和失败处理

## 更新日志

- **v1.0.0**: 初始版本，支持基本的 AI 新建表功能
- 集成 AI 服务进行智能表设计
- 支持两步式操作流程
- 提供完整的错误处理机制
- 支持模型预览和重新生成 