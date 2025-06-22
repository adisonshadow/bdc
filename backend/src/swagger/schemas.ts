/**
 * @swagger
 * components:
 *   schemas:
 *     BaseField:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *         - required
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 字段唯一标识
 *         name:
 *           type: string
 *           pattern: ^[a-z][a-z0-9_]*$
 *           description: 字段名称
 *         type:
 *           type: string
 *           enum: [uuid, auto_increment, string, text, number, boolean, date, enum, relation, media, api]
 *           description: 字段类型
 *         description:
 *           type: string
 *           description: 字段描述
 *         required:
 *           type: boolean
 *           description: 是否必填
 *         isPrimaryKey:
 *           type: boolean
 *           description: 是否为主键
 *         length:
 *           type: integer
 *           description: 字段长度（适用于字符串类型）
 *         dateType:
 *           type: string
 *           enum: [year, year-month, date, datetime]
 *           description: 日期类型（适用于date类型）
 *
 *     UuidField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [uuid]
 *               description: UUID类型
 *
 *     AutoIncrementField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [auto_increment]
 *               description: 自增长ID字段类型
 *
 *     StringField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [string]
 *               description: 字符串类型（varchar）
 *
 *     TextField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [text]
 *               description: 文本类型（text）
 *
 *     NumberField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [number]
 *               description: 数字类型
 *
 *     BooleanField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [boolean]
 *               description: 布尔类型
 *
 *     DateField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [date]
 *               description: 日期类型
 *
 *     EnumField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [enum]
 *               description: 枚举类型
 *             enumConfig:
 *               type: object
 *               required:
 *                 - targetEnumCode
 *                 - multiple
 *               properties:
 *                 targetEnumCode:
 *                   type: string
 *                   description: 关联的枚举定义代码
 *                 multiple:
 *                   type: boolean
 *                   description: 是否允许多选
 *                 defaultValues:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 默认选中的枚举值
 *
 *     RelationField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [relation]
 *               description: 关联类型
 *             relationConfig:
 *               type: object
 *               required:
 *                 - targetSchemaCode
 *                 - multiple
 *                 - cascadeDelete
 *                 - displayFields
 *               properties:
 *                 targetSchemaCode:
 *                   type: string
 *                   description: 目标数据表的schema代码
 *                 targetField:
 *                   type: string
 *                   description: 关联的目标字段（默认为主键）
 *                 multiple:
 *                   type: boolean
 *                   description: 是否允许多选
 *                 cascadeDelete:
 *                   type: string
 *                   enum: [restrict, cascade, setNull]
 *                   description: 关联记录删除时的处理策略
 *                 displayFields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 选择关联数据时展示的字段列表
 *                 filterCondition:
 *                   type: object
 *                   description: 过滤条件
 *
 *     MediaField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [media]
 *               description: 媒体类型
 *             mediaConfig:
 *               type: object
 *               required:
 *                 - mediaType
 *                 - formats
 *                 - maxSize
 *                 - multiple
 *               properties:
 *                 mediaType:
 *                   type: string
 *                   enum: [image, video, audio, document, file]
 *                   description: 媒体类型
 *                 formats:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 允许的文件格式
 *                 maxSize:
 *                   type: number
 *                   description: 最大文件大小限制（MB）
 *                 multiple:
 *                   type: boolean
 *                   description: 是否允许多个媒体
 *
 *     ApiField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [api]
 *               description: API数据源类型
 *             apiConfig:
 *               type: object
 *               required:
 *                 - endpoint
 *                 - method
 *                 - multiple
 *                 - resultMapping
 *               properties:
 *                 endpoint:
 *                   type: string
 *                   description: API接口地址
 *                 method:
 *                   type: string
 *                   enum: [GET, POST, PUT, DELETE]
 *                   description: 请求方法
 *                 multiple:
 *                   type: boolean
 *                   description: 是否允许多选
 *                 params:
 *                   type: object
 *                   description: 请求参数配置
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [static, field]
 *                       value:
 *                         description: 静态值
 *                       field:
 *                         type: string
 *                         description: 字段名
 *                       transform:
 *                         type: string
 *                         description: 转换函数
 *                 headers:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                   description: 请求头配置
 *                 resultMapping:
 *                   type: object
 *                   required:
 *                     - path
 *                     - fields
 *                   properties:
 *                     path:
 *                       type: string
 *                       description: 结果路径
 *                     fields:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                       description: 字段映射
 *                 cache:
 *                   type: object
 *                   properties:
 *                     ttl:
 *                       type: integer
 *                       description: 缓存时间（秒）
 *                     key:
 *                       type: string
 *                       description: 缓存键
 *
 *     EnumOption:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: 选项键
 *         value:
 *           type: string
 *           description: 选项值
 *         description:
 *           type: string
 *           description: 选项描述
 *         sortOrder:
 *           type: integer
 *           description: 排序号
 *         isActive:
 *           type: boolean
 *           description: 是否启用
 *
 *     Enum:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - options
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 枚举ID
 *         code:
 *           type: string
 *           pattern: ^[a-z][a-z0-9_:]*$
 *           description: 枚举代码（使用:分隔的多级结构，如 system:user:status）
 *         name:
 *           type: string
 *           description: 枚举名称
 *         description:
 *           type: string
 *           maxLength: 100
 *           description: 枚举描述
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - value
 *               - label
 *             properties:
 *               value:
 *                 type: string
 *                 description: 枚举值（存储值）
 *               label:
 *                 type: string
 *                 description: 显示标签
 *               description:
 *                 type: string
 *                 description: 选项描述
 *               order:
 *                 type: integer
 *                 description: 排序号（可选）
 *         isActive:
 *           type: boolean
 *           description: 是否启用
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     DataStructure:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - fields
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 数据结构ID
 *         name:
 *           type: string
 *           pattern: ^[a-z][a-z0-9_]*$
 *           description: 数据结构名称
 *         code:
 *           type: string
 *           pattern: ^[a-zA-Z][a-zA-Z0-9_:]*$
 *           description: 数据结构代码
 *         fields:
 *           type: array
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/UuidField'
 *               - $ref: '#/components/schemas/AutoIncrementField'
 *               - $ref: '#/components/schemas/StringField'
 *               - $ref: '#/components/schemas/TextField'
 *               - $ref: '#/components/schemas/NumberField'
 *               - $ref: '#/components/schemas/BooleanField'
 *               - $ref: '#/components/schemas/DateField'
 *               - $ref: '#/components/schemas/EnumField'
 *               - $ref: '#/components/schemas/RelationField'
 *               - $ref: '#/components/schemas/MediaField'
 *               - $ref: '#/components/schemas/ApiField'
 *           description: 字段定义列表
 *         keyIndexes:
 *           type: object
 *           description: 主键和索引信息
 *           properties:
 *             primaryKey:
 *               type: string
 *               description: 主键字段名
 *             indexes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 索引名称
 *                   fields:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 索引字段列表
 *                   type:
 *                     type: string
 *                     enum: [unique, index]
 *                     description: 索引类型
 *         physicalStorage:
 *           type: object
 *           description: 物理存储信息
 *           properties:
 *             database:
 *               type: string
 *               description: 数据库名称
 *             table:
 *               type: string
 *               description: 表名
 *             lastMaterializedAt:
 *               type: string
 *               format: date-time
 *               description: 上次物化时间
 *             materializedVersion:
 *               type: integer
 *               description: 物化版本号
 *         validationErrors:
 *           type: array
 *           description: 验证错误信息
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: 错误代码
 *               message:
 *                 type: string
 *                 description: 错误消息
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: 错误发生时间
 *               details:
 *                 type: object
 *                 description: 错误详细信息
 *         description:
 *           type: string
 *           maxLength: 100
 *           description: 数据结构描述
 *         isActive:
 *           type: boolean
 *           description: 是否启用
 *           default: true
 *         version:
 *           type: integer
 *           description: 版本号
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     DatabaseConnection:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - host
 *         - port
 *         - database
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 数据库连接ID
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 连接名称
 *         description:
 *           type: string
 *           maxLength: 100
 *           description: 连接描述
 *         type:
 *           type: string
 *           enum: [postgresql, mysql, mongodb, sqlserver, oracle]
 *           description: 数据库类型
 *         host:
 *           type: string
 *           maxLength: 255
 *           description: 主机地址
 *         port:
 *           type: integer
 *           minimum: 1
 *           maximum: 65535
 *           description: 端口号
 *         database:
 *           type: string
 *           maxLength: 100
 *           description: 数据库名称
 *         username:
 *           type: string
 *           maxLength: 100
 *           description: 用户名
 *         password:
 *           type: string
 *           maxLength: 255
 *           description: 密码（加密存储）
 *         schema:
 *           type: string
 *           maxLength: 100
 *           description: Schema名称
 *         sslConfig:
 *           type: object
 *           description: SSL配置
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: 是否启用SSL
 *             verifyServerCert:
 *               type: boolean
 *               description: 是否验证服务器证书
 *             caCert:
 *               type: string
 *               description: CA证书内容
 *             clientCert:
 *               type: string
 *               description: 客户端证书内容
 *             clientKey:
 *               type: string
 *               description: 客户端密钥内容
 *         poolConfig:
 *           type: object
 *           description: 连接池配置
 *           properties:
 *             min:
 *               type: integer
 *               description: 最小连接数
 *             max:
 *               type: integer
 *               description: 最大连接数
 *             idleTimeoutMillis:
 *               type: integer
 *               description: 空闲超时时间（毫秒）
 *             connectionTimeoutMillis:
 *               type: integer
 *               description: 连接超时时间（毫秒）
 *         monitorConfig:
 *           type: object
 *           description: 监控配置
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: 是否启用监控
 *             checkInterval:
 *               type: integer
 *               description: 检查间隔（秒）
 *             metrics:
 *               type: array
 *               items:
 *                 type: string
 *               description: 监控指标列表
 *             alertThresholds:
 *               type: object
 *               description: 告警阈值
 *               properties:
 *                 maxConnections:
 *                   type: integer
 *                   description: 最大连接数
 *                 maxQueryTime:
 *                   type: integer
 *                   description: 最大查询时间
 *                 maxErrorRate:
 *                   type: number
 *                   description: 最大错误率
 *         status:
 *           type: string
 *           enum: [active, inactive, testing, failed, maintenance]
 *           description: 连接状态
 *         allowRemote:
 *           type: boolean
 *           description: 是否支持远程连接
 *         allowedIps:
 *           type: string
 *           maxLength: 255
 *           description: 允许的IP地址列表，多个用逗号分隔
 *         lastTestAt:
 *           type: string
 *           format: date-time
 *           description: 最后测试连接时间
 *         lastTestSuccess:
 *           type: boolean
 *           description: 最后测试是否成功
 *         lastTestError:
 *           type: string
 *           maxLength: 500
 *           description: 最后测试错误信息
 *         stats:
 *           type: object
 *           description: 连接统计信息
 *           properties:
 *             totalConnections:
 *               type: integer
 *               description: 总连接数
 *             activeConnections:
 *               type: integer
 *               description: 活跃连接数
 *             failedConnections:
 *               type: integer
 *               description: 失败连接数
 *             lastErrorAt:
 *               type: string
 *               format: date-time
 *               description: 最后错误时间
 *             lastError:
 *               type: string
 *               description: 最后错误信息
 *             avgQueryTime:
 *               type: number
 *               description: 平均查询时间
 *             maxQueryTime:
 *               type: number
 *               description: 最大查询时间
 *         isActive:
 *           type: boolean
 *           description: 是否启用
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     DatabaseConnectionCreate:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - host
 *         - port
 *         - database
 *         - username
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 连接名称
 *         description:
 *           type: string
 *           maxLength: 100
 *           description: 连接描述
 *         type:
 *           type: string
 *           enum: [postgresql, mysql, mongodb, sqlserver, oracle]
 *           description: 数据库类型
 *         host:
 *           type: string
 *           maxLength: 255
 *           description: 主机地址
 *         port:
 *           type: integer
 *           minimum: 1
 *           maximum: 65535
 *           description: 端口号
 *         database:
 *           type: string
 *           maxLength: 100
 *           description: 数据库名称
 *         username:
 *           type: string
 *           maxLength: 100
 *           description: 用户名
 *         password:
 *           type: string
 *           maxLength: 255
 *           description: 密码
 *         schema:
 *           type: string
 *           maxLength: 100
 *           description: Schema名称
 *         sslConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/sslConfig'
 *         poolConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/poolConfig'
 *         monitorConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/monitorConfig'
 *         allowRemote:
 *           type: boolean
 *           description: 是否支持远程连接
 *         allowedIps:
 *           type: string
 *           maxLength: 255
 *           description: 允许的IP地址列表，多个用逗号分隔
 *
 *     DatabaseConnectionUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 连接名称
 *         description:
 *           type: string
 *           maxLength: 100
 *           description: 连接描述
 *         host:
 *           type: string
 *           maxLength: 255
 *           description: 主机地址
 *         port:
 *           type: integer
 *           minimum: 1
 *           maximum: 65535
 *           description: 端口号
 *         database:
 *           type: string
 *           maxLength: 100
 *           description: 数据库名称
 *         username:
 *           type: string
 *           maxLength: 100
 *           description: 用户名
 *         password:
 *           type: string
 *           maxLength: 255
 *           description: 密码
 *         schema:
 *           type: string
 *           maxLength: 100
 *           description: Schema名称
 *         sslConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/sslConfig'
 *         poolConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/poolConfig'
 *         monitorConfig:
 *           $ref: '#/components/schemas/DatabaseConnection/properties/monitorConfig'
 *         allowRemote:
 *           type: boolean
 *           description: 是否支持远程连接
 *         allowedIps:
 *           type: string
 *           maxLength: 255
 *           description: 允许的IP地址列表，多个用逗号分隔
 *         isActive:
 *           type: boolean
 *           description: 是否启用
 *
 *     DatabaseConnectionTest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 数据库连接ID
 *
 *     DatabaseConnectionTestResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 测试是否成功
 *         message:
 *           type: string
 *           description: 测试结果消息
 *         connectionInfo:
 *           type: object
 *           description: 连接信息
 *           properties:
 *             version:
 *               type: string
 *               description: 数据库版本
 *             serverTime:
 *               type: string
 *               format: date-time
 *               description: 服务器时间
 *             maxConnections:
 *               type: integer
 *               description: 最大连接数
 *             currentConnections:
 *               type: integer
 *               description: 当前连接数
 *
 *     DatabaseTable:
 *       type: object
 *       required:
 *         - tableName
 *         - schema
 *         - columns
 *       properties:
 *         tableName:
 *           type: string
 *           description: 表名
 *         schema:
 *           type: string
 *           description: Schema名称
 *         description:
 *           type: string
 *           description: 表描述
 *         tableType:
 *           type: string
 *           description: 表类型
 *         rowCount:
 *           type: integer
 *           description: 行数
 *         size:
 *           type: integer
 *           description: 表大小（字节）
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后修改时间
 *         columns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DatabaseColumn'
 *           description: 字段列表
 *         indexes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DatabaseIndex'
 *           description: 索引列表
 *         foreignKeys:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DatabaseForeignKey'
 *           description: 外键列表
 *
 *     DatabaseColumn:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - nullable
 *         - primaryKey
 *       properties:
 *         name:
 *           type: string
 *           description: 字段名
 *         type:
 *           type: string
 *           description: 数据类型
 *         nullable:
 *           type: boolean
 *           description: 是否为空
 *         primaryKey:
 *           type: boolean
 *           description: 是否为主键
 *         defaultValue:
 *           type: string
 *           description: 默认值
 *         description:
 *           type: string
 *           description: 字段描述
 *         length:
 *           type: integer
 *           description: 字段长度
 *         precision:
 *           type: integer
 *           description: 精度（用于decimal类型）
 *         scale:
 *           type: integer
 *           description: 小数位数（用于decimal类型）
 *         autoIncrement:
 *           type: boolean
 *           description: 是否自增
 *         ordinalPosition:
 *           type: integer
 *           description: 字段位置
 *         characterSet:
 *           type: string
 *           description: 字符集
 *         collation:
 *           type: string
 *           description: 排序规则
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后修改时间
 *
 *     DatabaseIndex:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - columns
 *       properties:
 *         name:
 *           type: string
 *           description: 索引名
 *         type:
 *           type: string
 *           enum: [PRIMARY, UNIQUE, INDEX]
 *           description: 索引类型
 *         columns:
 *           type: array
 *           items:
 *             type: string
 *           description: 索引字段列表
 *         description:
 *           type: string
 *           description: 索引描述
 *
 *     DatabaseForeignKey:
 *       type: object
 *       required:
 *         - name
 *         - columnName
 *         - referencedTableName
 *         - referencedColumnName
 *       properties:
 *         name:
 *           type: string
 *           description: 外键名
 *         columnName:
 *           type: string
 *           description: 当前表字段
 *         referencedTableName:
 *           type: string
 *           description: 引用表名
 *         referencedTableSchema:
 *           type: string
 *           description: 引用表Schema
 *         referencedColumnName:
 *           type: string
 *           description: 引用字段名
 *         updateRule:
 *           type: string
 *           description: 更新规则
 *         deleteRule:
 *           type: string
 *           description: 删除规则
 */

export {}; 