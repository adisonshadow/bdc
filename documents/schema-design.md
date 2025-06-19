# Schema 设计规范文档
## 数据表 DataStructure

数据表定义用于管理系统中的所有业务数据表结构，支持动态创建和管理数据表。

### 1. 数据表属性

1. **基本信息**
   - `id`: UUID，系统自动生成的主键
   - `code`: 字符串，数据表的唯一标识符
     - 支持多级结构，使用 `:` 分隔
     - 示例：`system:user`、`business:order`、`report:sales`
     - 命名规则：`^[a-zA-Z][a-zA-Z0-9_]*(:[a-zA-Z][a-zA-Z0-9_]*)*$`
   - `name`: 字符串，数据表名称
     - 命名规则：`^[a-z][a-z0-9_]*$`
   - `fields`: JSONB，字段定义列表
     - 详细定义请参考 [字段定义](#字段定义) 章节
   - `key_indexes`: JSONB，主键和索引信息
     - 包含主键、唯一索引、普通索引等配置
   - `physical_storage`: JSONB，物理存储信息
     - 包含存储引擎、字符集、排序规则等配置
   - `validation_errors`: JSONB，验证错误信息
     - 记录表结构验证过程中的错误信息
   - `description`: 字符串，数据表描述
   - `is_active`: 布尔值，是否激活
   - `version`: 整数，版本号
   - `created_at`: 时间戳，创建时间
   - `updated_at`: 时间戳，更新时间

2. **数据库约束**
   - 主键约束：`id` 字段作为主键
   - 唯一约束：
     - `code` 字段唯一
     - `name` 字段唯一
   - 非空约束：
     - `code` 字段非空
     - `name` 字段非空
     - `fields` 字段非空
     - `version` 字段非空
     - `is_active` 字段非空
     - `created_at` 字段非空
     - `updated_at` 字段非空
   - 检查约束：
     - `code` 格式检查：`^[a-zA-Z][a-zA-Z0-9_]*(:[a-zA-Z][a-zA-Z0-9_]*)*$`
     - `name` 格式检查：`^[a-z][a-z0-9_]*$`

3. **索引定义**
   - `idx_data_structures_code`: 对 `code` 字段创建索引
   - `idx_data_structures_name`: 对 `name` 字段创建索引
   - `idx_data_structures_is_active`: 对 `is_active` 字段创建索引

4. **触发器**
   - `update_data_structures_updated_at`: 自动更新 `updated_at` 字段

### 2. 命名规范

1. **表名（code）**
   - 使用多级结构，用 `:` 分隔
   - 建议格式：`模块:实体`
   - 示例：
     - `system:user` - 用户表
     - `system:role` - 角色表
     - `business:order` - 订单表
     - `business:product` - 产品表
     - `report:sales` - 销售报表

2. **字段名（name）**
   - 使用小写字母
   - 单词间用下划线连接
   - 示例：
     - `user_id` - 用户ID
     - `created_at` - 创建时间
     - `order_status` - 订单状态
     - `product_name` - 产品名称

### 3. 最佳实践

1. **表设计原则**
   - 遵循数据库范式
   - 合理使用主键
   - 适当使用索引
   - 考虑扩展性
   - 注意性能影响

2. **索引设计**
   - 主键索引
   - 唯一索引
   - 普通索引
   - 复合索引
   - 考虑查询性能

3. **关联设计**
   - 合理使用外键
   - 设置级联规则
   - 注意循环引用
   - 考虑查询效率
   - 维护数据完整性

### 4. 示例

```typescript
// 用户表定义示例
{
  code: "system:user",
  name: "user",
  description: "系统用户表",
  version: 1,
  fields: [
    {
      name: "id",
      type: "uuid",
      isPrimaryKey: true,
      allowNull: false,
      comment: "用户ID"
    },
    {
      name: "username",
      type: "string",
      length: 50,
      allowNull: false,
      comment: "用户名"
    },
    {
      name: "email",
      type: "string",
      length: 100,
      allowNull: false,
      comment: "电子邮箱"
    },
    {
      name: "password",
      type: "string",
      length: 100,
      allowNull: false,
      comment: "密码（加密存储）"
    },
    {
      name: "status",
      type: "enum",
      enumId: "system:user:status",
      allowNull: false,
      defaultValue: "active",
      comment: "用户状态"
    },
    {
      name: "role_ids",
      type: "relation",
      targetSchema: "system:role",
      multiple: true,
      cascadeDelete: "restrict",
      displayFields: ["name", "code"],
      comment: "用户角色"
    },
    {
      name: "avatar",
      type: "media",
      mediaType: "image",
      formats: ["jpg", "jpeg", "png"],
      maxSize: 2,
      allowNull: true,
      comment: "用户头像"
    },
    {
      name: "department_id",
      type: "relation",
      targetSchema: "system:department",
      multiple: false,
      cascadeDelete: "setNull",
      displayFields: ["name", "code"],
      comment: "所属部门"
    },
    {
      name: "created_at",
      type: "date",
      dateType: "datetime",
      useNowAsDefault: true,
      allowNull: false,
      comment: "创建时间"
    }
  ],
  key_indexes: [
    {
      type: "primary",
      fields: ["id"]
    },
    {
      type: "unique",
      fields: ["username"],
      name: "uk_user_username"
    },
    {
      type: "unique",
      fields: ["email"],
      name: "uk_user_email"
    },
    {
      type: "index",
      fields: ["status"],
      name: "idx_user_status"
    },
    {
      type: "index",
      fields: ["department_id"],
      name: "idx_user_department"
    }
  ],
  physical_storage: {
    engine: "InnoDB",
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci"
  }
}
```

## 字段定义

### 1. 字段属性

每个字段都具有以下基本属性：

1. **基本信息**
   - `name`: 字符串，字段名称
     - 命名规则：`^[a-z][a-z0-9_]*$`
   - `type`: 字段类型
     - 详细类型说明请参考 [字段类型](#字段类型) 章节
   - `isPrimaryKey`: 布尔值，是否主键
   - `allowNull`: 布尔值，是否允许为空
   - `length`: 数字，字段长度（适用于字符串类型）
   - `comment`: 字符串，字段描述
   - `defaultValue`: 任意类型，默认值

2. **扩展属性**
   - 日期类型扩展：
     - `dateType`: 日期格式（year/year-month/date/datetime）
     - `useNowAsDefault`: 布尔值，是否使用当前时间作为默认值
   - 枚举类型扩展：
     - `enumId`: 字符串，关联的枚举定义ID
     - `multiple`: 布尔值，是否允许多选
     - `defaultValues`: 数组，默认选中的枚举值
   - 媒体类型扩展：
     - `mediaType`: 媒体类型（image/video/audio/document/file）
     - `formats`: 数组，允许的文件格式
     - `maxSize`: 数字，最大文件大小（MB）
     - `multiple`: 布尔值，是否允许多个文件
   - 关联类型扩展：
     - `targetSchema`: 字符串，目标数据表的schema标识
     - `targetField`: 字符串，关联的目标字段
     - `multiple`: 布尔值，是否允许多选
     - `cascadeDelete`: 字符串，级联删除策略
     - `displayFields`: 数组，显示字段列表
     - `filterCondition`: 对象，过滤条件
   - API数据源扩展：
     - `endpoint`: 字符串，API接口地址
     - `method`: 字符串，请求方法
     - `params`: 对象，请求参数配置
     - `resultMapping`: 对象，返回结果映射
     - `cache`: 对象，缓存配置

### 2. 字段类型

1. **基础类型**
   - `uuid`: UUID 类型
     - 用于系统内部标识
     - 自动生成，全局唯一
   - `auto-increment`: 自增长 ID
     - 用于业务主键
     - 自动递增
   - `string`: 字符串类型
     - 支持设置长度限制
     - 适用于短文本
   - `text`: 长文本类型
     - 无长度限制
     - 适用于大段文本
   - `number`: 数字类型
     - 支持整数和小数
     - 可设置精度
   - `boolean`: 布尔类型
     - true/false 值
   - `date`: 日期类型
     - 支持多种日期格式
     - 可设置默认值

2. **扩展类型**
   - `enum`: 枚举类型
     - 关联预定义的枚举定义
     - 支持单选和多选
     - 可设置默认值
   - `relation`: 关联类型
     - 关联其他数据表
     - 支持单选和多选
     - 可设置级联规则
   - `media`: 媒体类型
     - 支持多种媒体格式
     - 可设置大小限制
     - 支持单文件和多文件
   - `api`: API 数据源
     - 动态获取数据
     - 支持参数配置
     - 支持缓存策略

### 3. 最佳实践

1. **字段设计原则**
   - 选择合适的字段类型
   - 设置合理的长度限制
   - 添加必要的约束
   - 提供清晰的描述
   - 考虑默认值

2. **类型选择**
   - 主键使用 UUID 或自增长 ID
   - 短文本使用 string 类型
   - 长文本使用 text 类型
   - 金额使用 number 类型
   - 状态使用 enum 类型
   - 关联使用 relation 类型
   - 文件使用 media 类型
   - 动态数据使用 api 类型

3. **约束使用**
   - 合理使用非空约束
   - 适当使用唯一约束
   - 设置合适的默认值
   - 添加必要的检查约束
   - 注意外键约束

4. **性能考虑**
   - 控制字段长度
   - 避免过大的文本字段
   - 合理使用索引
   - 注意关联查询
   - 考虑存储空间

### 4. 字段示例

1. **基础字段**
```typescript
// UUID 主键
{
  name: "id",
  type: "uuid",
  isPrimaryKey: true,
  allowNull: false,
  comment: "唯一标识"
}

// 字符串字段
{
  name: "username",
  type: "string",
  length: 50,
  allowNull: false,
  comment: "用户名"
}

// 日期字段
{
  name: "created_at",
  type: "date",
  dateType: "datetime",
  useNowAsDefault: true,
  allowNull: false,
  comment: "创建时间"
}
```

2. **扩展字段**
```typescript
// 枚举字段
{
  name: "status",
  type: "enum",
  enumId: "system:user:status",
  multiple: false,
  defaultValue: "active",
  allowNull: false,
  comment: "状态"
}

// 关联字段
{
  name: "department_id",
  type: "relation",
  targetSchema: "system:department",
  multiple: false,
  cascadeDelete: "setNull",
  displayFields: ["name", "code"],
  comment: "所属部门"
}

// 媒体字段
{
  name: "avatar",
  type: "media",
  mediaType: "image",
  formats: ["jpg", "jpeg", "png"],
  maxSize: 2,
  allowNull: true,
  comment: "头像"
}

// API数据源字段
{
  name: "weather_info",
  type: "api",
  endpoint: "https://api.weather.com/forecast",
  method: "GET",
  params: {
    city: {
      type: "field",
      field: "address",
      transform: "extractCity"
    }
  },
  resultMapping: {
    path: "data.weather",
    fields: {
      temperature: "temp",
      humidity: "hum",
      description: "desc"
    }
  },
  cache: {
    ttl: 1800,
    key: "weather_${city}"
  },
  allowNull: true,
  comment: "天气信息"
}
```

## 枚举管理 Enum

1. **枚举定义**
   - 每个枚举类型都需要在系统中预先定义
   - 枚举定义包含：
     - enumId: 枚举类型的唯一标识
       - 支持使用 `:` 分隔符表示多级结构
       - 示例：`system:user:status`、`system:role:type`
       - 建议按照 `领域:实体:属性` 的方式组织
     - name: 枚举类型名称
     - description: 枚举类型描述（最大长度100字符）
     - values: 枚举值列表

2. **枚举值定义**
   - 每个枚举值包含：
     - value: 枚举值（存储值）
     - label: 显示标签
     - description: 描述信息（可选）
     - order: 排序号（可选）

3. **枚举使用示例**
```typescript
// 枚举类型定义示例 - 用户状态
{
  enumId: "system:user:status",
  name: "用户状态",
  description: "用户账号状态",
  values: [
    {
      value: "active",
      label: "活跃",
      description: "正常使用的账号",
      order: 1
    },
    {
      value: "inactive",
      label: "未激活",
      description: "待激活的账号",
      order: 2
    },
    {
      value: "blocked",
      label: "已封禁",
      description: "被封禁的账号",
      order: 3
    }
  ]
}

// 枚举类型定义示例 - 角色类型
{
  enumId: "system:role:type",
  name: "角色类型",
  description: "系统角色分类",
  values: [
    {
      value: "admin",
      label: "管理员",
      description: "系统管理员",
      order: 1
    },
    {
      value: "user",
      label: "普通用户",
      description: "普通用户角色",
      order: 2
    }
  ]
}

// 字段使用多级枚举示例
{
  name: "user_type",
  type: "enum",
  enumId: "system:user:type",
  multiple: false,
  defaultValue: "normal",
  allowNull: false,
  comment: "用户类型"
}
```

### 枚举命名规范

1. **多级结构规则**
   - 使用 `:` 作为分隔符
   - 建议使用小写字母和数字
   - 层级示例：
     - 两级：`domain:type`
     - 三级：`domain:entity:attribute`
     - 四级：`domain:module:entity:attribute`

2. **命名建议**
   - 第一级：表示业务领域（如 system、business、order）
   - 第二级：表示实体（如 user、role、product）
   - 第三级：表示属性（如 status、type、level）
   - 示例：
     - `system:user:status`
     - `system:role:type`
     - `business:order:status`
     - `product:category:level`

3. **最佳实践**
   - 保持命名的一致性和可读性
   - 避免过深的层级结构（建议不超过4级）
   - 使用有意义的词汇，避免缩写
   - 相关的枚举类型应使用相同的前缀，便于管理和查找
   

## API定义 ApiDefinition

API 定义用于管理系统中所有自定义 API 接口，支持基于 SQL 查询构建 RESTful API。

### 1. API 定义属性

1. **基本信息**
   - `id`: UUID，系统自动生成的主键
   - `code`: 字符串，API 的唯一标识符
     - 支持多级结构，使用 `:` 分隔
     - 示例：`user:list`、`order:create`、`report:sales:daily`
     - 命名规则：`^[a-zA-Z][a-zA-Z0-9_]*(:[a-zA-Z][a-zA-Z0-9_]*)*$`
   - `name`: 字符串，API 名称
     - 命名规则：`^[a-z][a-z0-9_]*$`
   - `description`: 文本，API 描述
   - `method`: HTTP 方法
     - 支持：GET、POST、PUT、DELETE
   - `path`: API 路径
     - 必须以 `/` 开头
     - 只能包含字母、数字、下划线、斜杠和连字符
     - 示例：`/api/users`、`/api/orders/{id}`
   - `is_active`: 布尔值，是否激活

2. **数据源配置**
   - `data_source_id`: UUID，关联的数据源 ID
   - `sql_query`: 文本，SQL 查询语句
   - `sql_params`: JSON，SQL 参数定义
     ```typescript
     interface SqlParam {
       name: string;      // 参数名称
       type: string;      // 参数类型
       required: boolean; // 是否必填
       description?: string;    // 参数描述
       defaultValue?: any;      // 默认值
     }
     ```

3. **接口定义**
   - `query_params`: JSON，查询参数定义
     ```typescript
     interface QueryParam {
       name: string;      // 参数名称
       type: string;      // 参数类型
       required: boolean; // 是否必填
       description?: string;    // 参数描述
       defaultValue?: any;      // 默认值
     }
     ```
   - `request_body`: JSON，请求体定义
     ```typescript
     interface RequestBodyField {
       name: string;      // 字段名称
       type: string;      // 字段类型
       required: boolean; // 是否必填
       description?: string;    // 字段描述
       defaultValue?: any;      // 默认值
     }
     ```
   - `response_schema`: JSON，响应模式定义
     ```typescript
     interface ResponseSchema {
       type: string;                    // 响应类型（object/array）
       properties: Record<string, any>; // 属性定义
       required?: string[];             // 必填字段列表
     }
     ```

4. **审计信息**
   - `created_at`: 时间戳，创建时间
   - `updated_at`: 时间戳，更新时间
   - `created_by`: 字符串，创建人
   - `updated_by`: 字符串，更新人

### 2. 命名规范

1. **API 代码（code）**
   - 使用多级结构，用 `:` 分隔
   - 建议格式：`模块:子模块:操作`
   - 示例：
     - `user:list` - 用户列表
     - `user:create` - 创建用户
     - `user:update` - 更新用户
     - `order:list` - 订单列表
     - `order:detail` - 订单详情
     - `report:sales:daily` - 每日销售报表

2. **API 路径（path）**
   - 使用 RESTful 风格
   - 使用小写字母和连字符
   - 示例：
     - `/api/users` - 用户管理
     - `/api/users/{id}` - 用户详情
     - `/api/orders` - 订单管理
     - `/api/reports/sales/daily` - 每日销售报表

### 3. 最佳实践

1. **API 设计原则**
   - 遵循 RESTful 设计规范
   - 使用合适的 HTTP 方法
   - 保持 URL 结构清晰和一致
   - 合理使用查询参数和路径参数
   - 提供清晰的 API 文档

2. **参数设计**
   - 查询参数用于过滤和分页
   - 路径参数用于标识资源
   - 请求体用于复杂数据
   - 所有参数都应该有类型定义
   - 必填参数要明确标注

3. **SQL 查询**
   - 使用参数化查询防止 SQL 注入
   - 合理使用索引提高性能
   - 避免复杂的联表查询
   - 注意数据安全性
   - 考虑查询性能优化

4. **响应设计**
   - 统一的响应格式
   - 清晰的错误处理
   - 合理的数据分页
   - 适当的缓存策略
   - 考虑数据量大小

### 4. 示例

```typescript
// 用户列表 API 定义示例
{
  code: "user:list",
  name: "user_list",
  description: "获取用户列表",
  method: "GET",
  path: "/api/users",
  query_params: [
    {
      name: "page",
      type: "number",
      required: false,
      description: "页码",
      defaultValue: 1
    },
    {
      name: "pageSize",
      type: "number",
      required: false,
      description: "每页数量",
      defaultValue: 20
    },
    {
      name: "status",
      type: "string",
      required: false,
      description: "用户状态"
    }
  ],
  response_schema: {
    type: "object",
    properties: {
      total: { type: "number" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            status: { type: "string" }
          }
        }
      }
    },
    required: ["total", "items"]
  },
  data_source_id: "xxx",
  sql_query: `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.status
    FROM users u
    WHERE 
      (:status IS NULL OR u.status = :status)
    ORDER BY u.created_at DESC
    LIMIT :limit OFFSET :offset
  `,
  sql_params: [
    {
      name: "status",
      type: "string",
      required: false
    },
    {
      name: "limit",
      type: "number",
      required: true
    },
    {
      name: "offset",
      type: "number",
      required: true
    }
  ]
}

// 创建订单 API 定义示例
{
  code: "order:create",
  name: "order_create",
  description: "创建新订单",
  method: "POST",
  path: "/api/orders",
  request_body: [
    {
      name: "customerId",
      type: "string",
      required: true,
      description: "客户ID"
    },
    {
      name: "items",
      type: "array",
      required: true,
      description: "订单项列表",
      items: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number" },
          price: { type: "number" }
        }
      }
    },
    {
      name: "remark",
      type: "string",
      required: false,
      description: "订单备注"
    }
  ],
  response_schema: {
    type: "object",
    properties: {
      id: { type: "string" },
      orderNo: { type: "string" },
      status: { type: "string" },
      totalAmount: { type: "number" },
      createdAt: { type: "string" }
    },
    required: ["id", "orderNo", "status", "totalAmount", "createdAt"]
  },
  data_source_id: "xxx",
  sql_query: `
    WITH new_order AS (
      INSERT INTO orders (
        customer_id,
        order_no,
        status,
        total_amount,
        remark,
        created_at
      )
      VALUES (
        :customerId,
        :orderNo,
        'pending',
        :totalAmount,
        :remark,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    )
    SELECT 
      o.id,
      o.order_no as "orderNo",
      o.status,
      o.total_amount as "totalAmount",
      o.created_at as "createdAt"
    FROM new_order o
  `,
  sql_params: [
    {
      name: "customerId",
      type: "string",
      required: true
    },
    {
      name: "orderNo",
      type: "string",
      required: true
    },
    {
      name: "totalAmount",
      type: "number",
      required: true
    },
    {
      name: "remark",
      type: "string",
      required: false
    }
  ]
}
```