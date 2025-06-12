# Schema 设计规范文档

## 字段基本属性

每个字段都具有以下基本属性：

1. **ID**
   - 用于系统内部标识字段的唯一标识符
   - 系统自动生成，确保全局唯一性

2. **字段名称 (name)**
   - 必填项（require）
   - 命名规则：
     - 必须以小写字母开头
     - 只能包含小写字母、数字和下划线
     - 正则表达式校验：`^[a-z][a-z0-9_]*$`

3. **字段描述 (commit)**
   - 可选项
   - 用于描述字段的用途和含义
   - 支持多行文本

## 字段类型 (fieldTypes)

系统支持以下字段类型：

1. **基础类型**
   - UUID
   - 自增长ID (auto-increment)
   - 字符串 (string, 类似 varchar)
   - 长文本 (text, 类似 text)
   - 数字 (number)
   - 布尔值 (boolean)
   - 日期 (date)
   - 枚举 (enum)：支持单选和多选模式，可绑定预定义的枚举项
   - 关联ID (relation)：引用其他业务表的主键，支持单选和多选
   - 媒体 (media)：支持文件、图片、视频等媒体资源
   - API数据源 (api)：动态调用API获取数据，支持参数绑定

2. **日期类型细分**
   - 年 (year)
   - 年月 (year-month)
   - 年月日 (date)
   - 年月日时间 (datetime)

## 字段扩展属性

根据不同的字段类型，字段可能具有以下扩展属性：

1. **主键属性 (isPrimaryKey)**
   - 适用类型：UUID、自增长ID
   - 用于标识该字段是否作为表的主键
   - 一个表只能有一个主键

2. **长度属性 (length)**
   - 适用类型：字符串(varchar)、数字
   - 对于 varchar：1-65535 之间的整数
   - 对于数字：根据具体数字类型定义

3. **日期格式 (dateType)**
   - 适用类型：日期
   - 可选值：
     - year：仅年份
     - year-month：年月
     - date：年月日
     - datetime：年月日时间
   - 可设置是否使用当前时间作为默认值

4. **枚举属性 (enumConfig)**
   - 适用类型：枚举 (enum)
   - 配置选项：
     - enumId: 关联的枚举定义ID
     - multiple: 是否允许多选（默认为 false，即单选）
     - defaultValues: 默认选中的枚举值
   - 枚举值存储：
     - 单选模式：存储单个枚举值
     - 多选模式：以数组形式存储多个枚举值

5. **媒体属性 (mediaConfig)**
   - 适用类型：媒体 (media)
   - 配置选项：
     - mediaType: 媒体类型
       - image: 图片
       - video: 视频
       - audio: 音频
       - document: 文档
       - file: 通用文件
     - formats: 允许的文件格式
       - 图片：jpg, jpeg, png, gif, webp 等
       - 视频：mp4, webm, avi 等
       - 音频：mp3, wav, ogg 等
       - 文档：pdf, doc, docx, xls, xlsx 等
     - maxSize: 最大文件大小限制（单位：MB）
     - multiple: 是否允许多个媒体（默认：false）
   - 存储结构：
     - 单个媒体：存储单个媒体ID
     - 多个媒体：以数组形式存储多个媒体ID

6. **关联属性 (relationConfig)**
   - 适用类型：关联ID (relation)
   - 配置选项：
     - targetSchema: 目标数据表的schema标识
     - targetField: 关联的目标字段（默认为主键）
     - multiple: 是否允许多选（默认：false）
     - cascadeDelete: 关联记录删除时的处理策略
       - restrict: 限制删除（默认）
       - cascade: 级联删除
       - setNull: 设置为空
     - displayFields: 选择关联数据时展示的字段列表
     - filterCondition: 可选的过滤条件
   - 存储结构：
     - 单选模式：存储单个关联ID
     - 多选模式：以数组形式存储多个关联ID

7. **API数据源属性 (apiConfig)**
   - 适用类型：API数据源 (api)
   - 配置选项：
     - endpoint: API接口地址
       - 支持相对路径和绝对路径
       - 支持环境变量替换
     - method: 请求方法（GET/POST/PUT/DELETE）
     - multiple: 是否获取多条数据（默认：false）
     - params: 请求参数配置
       - 静态参数：固定值
       - 动态参数：支持从当前记录其他字段获取值
       - 支持参数转换和格式化
     - headers: 请求头配置
     - resultMapping: 返回结果映射配置
       - path: 数据所在路径
       - fields: 字段映射关系
     - cache: 缓存配置
       - ttl: 缓存时间
       - key: 缓存键生成规则
     - errorHandler: 错误处理配置
   - 存储结构：
     - 单条数据：存储单个对象
     - 多条数据：存储数组

8. 新建和交互的规则
   - 当类型是：UUID、自增长ID，才出现 是否主键 的选项，不出现描述、是否必填、长度和默认值
   - 当类型是：长文本，不出现 长度
   - 当类型是：日期，才出现日期格式的值类型选择，才出现 “是否使用当前时间作为默认值”
   - 当类型是：枚举，才显示选中的枚举名和code 或 未设置，
        后面有个选择按钮，点击后打开modal后，显示所有枚举，支持过滤，可以选中应用选择。
   - 当类型是：媒体，才显示媒体设置，包括：单或多、媒体类型

## 示例

```typescript
// 字段定义示例
{
  name: "user_id",
  type: "uuid",
  isPrimaryKey: true,
  allowNull: false,
  comment: "用户唯一标识"
}

{
  name: "username",
  type: "string",
  stringType: "varchar",
  length: 50,
  allowNull: false,
  comment: "用户名"
}

{
  name: "created_at",
  type: "date",
  dateType: "datetime",
  useNowAsDefault: true,
  allowNull: false,
  comment: "创建时间"
}

// 单选枚举字段示例
{
  name: "status",
  type: "enum",
  enumId: "user_status",
  multiple: false,
  defaultValue: "active",
  allowNull: false,
  comment: "用户状态"
}

// 多选枚举字段示例
{
  name: "roles",
  type: "enum",
  enumId: "user_roles",
  multiple: true,
  defaultValues: ["user"],
  allowNull: false,
  comment: "用户角色"
}

// 单个图片字段示例
{
  name: "avatar",
  type: "media",
  mediaType: "image",
  formats: ["jpg", "jpeg", "png"],
  maxSize: 2,
  multiple: false,
  allowNull: true,
  comment: "用户头像"
}

// 多个文档字段示例
{
  name: "attachments",
  type: "media",
  mediaType: "document",
  formats: ["pdf", "doc", "docx"],
  maxSize: 10,
  multiple: true,
  allowNull: true,
  comment: "附件文档"
}

// 视频字段示例
{
  name: "promotional_video",
  type: "media",
  mediaType: "video",
  formats: ["mp4", "webm"],
  maxSize: 100,
  multiple: false,
  allowNull: true,
  comment: "宣传视频"
}

// 单选关联字段示例（部门）
{
  name: "department_id",
  type: "relation",
  targetSchema: "system:department",
  multiple: false,
  cascadeDelete: "restrict",
  displayFields: ["name", "code"],
  filterCondition: {
    status: true  // 只显示启用的部门
  },
  allowNull: false,
  comment: "所属部门"
}

// 多选关联字段示例（标签）
{
  name: "tag_ids",
  type: "relation",
  targetSchema: "content:tag",
  multiple: true,
  cascadeDelete: "setNull",
  displayFields: ["name", "category"],
  filterCondition: {
    status: true
  },
  allowNull: true,
  comment: "文章标签"
}

// 单选关联字段示例（上级领导）
{
  name: "supervisor_id",
  type: "relation",
  targetSchema: "system:user",
  multiple: false,
  cascadeDelete: "setNull",
  displayFields: ["name", "employee_code", "department.name"],
  filterCondition: {
    is_supervisor: true
  },
  allowNull: true,
  comment: "上级领导"
}

// 单条API数据示例（获取用户详情）
{
  name: "user_detail",
  type: "api",
  endpoint: "/api/users/${user_id}/detail",
  method: "GET",
  multiple: false,
  params: {
    user_id: {
      type: "field",
      field: "user_id"  // 从当前记录的user_id字段获取值
    }
  },
  resultMapping: {
    path: "data",
    fields: {
      name: "userName",
      age: "userAge",
      address: "userAddress"
    }
  },
  cache: {
    ttl: 300,  // 缓存5分钟
    key: "user_detail_${user_id}"
  },
  allowNull: true,
  comment: "用户详细信息"
}

// 多条API数据示例（获取订单列表）
{
  name: "recent_orders",
  type: "api",
  endpoint: "/api/orders",
  method: "POST",
  multiple: true,
  params: {
    customer_id: {
      type: "field",
      field: "id"  // 从当前客户记录的id字段获取值
    },
    status: {
      type: "static",
      value: "active"
    },
    start_date: {
      type: "field",
      field: "last_visit_date",
      transform: "date.startOf('month')"  // 转换为当月开始日期
    }
  },
  resultMapping: {
    path: "data.orders",
    fields: {
      order_id: "id",
      amount: "totalAmount",
      status: "orderStatus"
    }
  },
  cache: {
    ttl: 60,  // 缓存1分钟
    key: "recent_orders_${customer_id}"
  },
  allowNull: true,
  comment: "最近订单列表"
}

// 带参数转换的API数据示例（获取天气信息）
{
  name: "weather_info",
  type: "api",
  endpoint: "https://api.weather.com/forecast",
  method: "GET",
  multiple: false,
  params: {
    city: {
      type: "field",
      field: "address",
      transform: "extractCity"  // 从地址中提取城市名
    },
    date: {
      type: "field",
      field: "visit_date",
      transform: "date.format('YYYY-MM-DD')"  // 格式化日期
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
    ttl: 1800,  // 缓存30分钟
    key: "weather_${city}_${date}"
  },
  allowNull: true,
  comment: "天气信息"
}
```

## 枚举管理

1. **枚举定义**
   - 每个枚举类型都需要在系统中预先定义
   - 枚举定义包含：
     - enumId: 枚举类型的唯一标识
       - 支持使用 `:` 分隔符表示多级结构
       - 示例：`system:user:status`、`system:role:type`
       - 建议按照 `领域:实体:属性` 的方式组织
     - name: 枚举类型名称
     - description: 枚举类型描述
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

## 枚举命名规范

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

## 媒体系统集成

1. **媒体ID规范**
   - 媒体ID由媒体系统生成和管理
   - 格式建议：`media_{timestamp}_{random_string}`
   - 示例：`media_1648789234_a7b8c9d0`

2. **媒体信息获取**
   - 通过媒体ID可从媒体系统获取完整信息：
     - 文件名
     - 文件大小
     - 文件类型
     - 存储路径
     - 访问URL
     - 上传时间
     - 其他元数据

3. **媒体处理能力**
   - 图片处理：
     - 缩放
     - 裁剪
     - 水印
     - 格式转换
   - 视频处理：
     - 转码
     - 截图
     - 压缩
   - 文档处理：
     - 预览
     - 格式转换

## 关联数据管理

1. **关联数据选择器**
   - 支持按 displayFields 配置显示关联记录信息
   - 支持搜索和筛选功能
   - 支持分页加载
   - 支持预览关联记录详情
   - 支持快速创建关联记录

2. **关联数据完整性**
   - 删除关联记录时根据 cascadeDelete 策略处理
   - 支持检查循环引用
   - 支持检查关联记录是否存在
   - 支持关联数据的权限控制

3. **关联数据展示**
   - 列表页面：显示关联记录的关键信息
   - 详情页面：支持查看完整的关联记录信息
   - 支持关联数据的快速跳转
   - 支持关联数据的批量操作

4. **最佳实践**
   - 合理使用单选/多选模式
   - 谨慎使用级联删除
   - 选择合适的显示字段
   - 设置适当的过滤条件
   - 考虑关联数据的性能影响

## 注意事项

1. 字段名称必须符合命名规范，建议使用有意义的英文单词
2. 主键字段使用 UUID 或自增长 ID
3. 对于字符串类型的字段，应合理设置长度限制
4. 日期类型字段应根据业务需求选择合适的日期格式
5. 所有字段都应该添加适当的描述信息，便于其他开发者理解
6. 使用枚举类型时，应先确保相关的枚举定义已创建
7. 合理选择枚举的单选/多选模式，避免不必要的多选设置
8. 枚举值的修改和删除需要考虑已使用该枚举的字段的影响
9. 上传媒体文件时需要进行格式和大小的校验
10. 考虑媒体文件的存储成本和访问性能
11. 注意处理媒体文件的删除和更新场景
12. 设置关联字段时需考虑数据完整性和性能影响
13. 关联字段的多选模式要考虑数据量的限制
14. 合理设置关联数据的显示字段，避免过多字段影响性能
15. API数据源应设置合理的缓存策略
16. 注意处理API调用的异常情况
17. 合理控制API请求的频率和并发
18. 需要考虑API的鉴权和安全性 