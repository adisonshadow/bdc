/**
 * @swagger
 * components:
 *   schemas:
 *     BaseField:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 字段ID（系统自动生成）
 *         name:
 *           type: string
 *           pattern: ^[a-z][a-z0-9_]*$
 *           description: 字段名称（必须以小写字母开头，只能包含小写字母、数字和下划线）
 *         type:
 *           type: string
 *           enum: [uuid, auto-increment, string, text, number, boolean, date, enum, relation, media, api]
 *           description: 字段类型
 *         description:
 *           type: string
 *           description: 字段描述（支持多行文本）
 *         isRequired:
 *           type: boolean
 *           description: 是否必填
 *         defaultValue:
 *           type: string
 *           description: 默认值
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
 *             length:
 *               type: integer
 *               minimum: 1
 *               maximum: 255
 *               description: 字符串长度限制
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
 *             maxLength:
 *               type: integer
 *               minimum: 1
 *               maximum: 65535
 *               description: 最大文本长度
 *
 *     NumberField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [number]
 *             numberType:
 *               type: string
 *               enum: [integer, float, decimal]
 *               description: 数字类型
 *             precision:
 *               type: integer
 *               description: 精度
 *             scale:
 *               type: integer
 *               description: 小数位数
 *
 *     DateField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [date]
 *             dateType:
 *               type: string
 *               enum: [year, year-month, date, datetime]
 *               description: 日期类型
 *             useNowAsDefault:
 *               type: boolean
 *               description: 是否使用当前时间作为默认值
 *
 *     EnumField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [enum]
 *             enumId:
 *               type: string
 *               format: uuid
 *               description: 关联的枚举定义ID
 *             multiple:
 *               type: boolean
 *               description: 是否允许多选
 *             defaultValues:
 *               type: array
 *               items:
 *                 type: string
 *               description: 默认选中的枚举值
 *
 *     RelationField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [relation]
 *             targetSchema:
 *               type: string
 *               description: 目标数据表的schema标识
 *             targetField:
 *               type: string
 *               description: 关联的目标字段（默认为主键）
 *             multiple:
 *               type: boolean
 *               description: 是否允许多选
 *             cascadeDelete:
 *               type: string
 *               enum: [restrict, cascade, setNull]
 *               description: 关联记录删除时的处理策略
 *             displayFields:
 *               type: array
 *               items:
 *                 type: string
 *               description: 选择关联数据时展示的字段列表
 *
 *     MediaField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [media]
 *             mediaType:
 *               type: string
 *               enum: [image, video, audio, document, file]
 *               description: 媒体类型
 *             formats:
 *               type: array
 *               items:
 *                 type: string
 *               description: 允许的文件格式
 *             maxSize:
 *               type: number
 *               description: 最大文件大小限制（MB）
 *             multiple:
 *               type: boolean
 *               description: 是否允许多个媒体
 *
 *     ApiField:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseField'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [api]
 *             endpoint:
 *               type: string
 *               description: API接口地址
 *             method:
 *               type: string
 *               enum: [GET, POST, PUT, DELETE]
 *               description: 请求方法
 *             params:
 *               type: object
 *               description: 请求参数配置
 *             headers:
 *               type: object
 *               description: 请求头配置
 *             resultMapping:
 *               type: object
 *               description: 返回结果映射配置
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
 *             $ref: '#/components/schemas/BaseField'
 *           description: 字段定义列表
 *         description:
 *           type: string
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
 */

export {}; 