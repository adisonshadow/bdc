import { Router } from 'express';
import {
  createSchema,
  getAllSchemas,
  getSchemaById,
  updateSchema,
  deleteSchema,
  validateSchema
} from '../controllers/schemaController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Schema Management
 *   description: 数据结构定义管理 API
 * 
 * /api/schemas:
 *   post:
 *     tags: [Schema Management]
 *     operationId: postSchemas
 *     summary: 创建新的数据结构定义（支持单个或批量创建）
 *     description: |
 *       支持两种请求格式：
 *       1. 单个对象：创建单个数据结构
 *       2. 对象数组：批量创建多个数据结构，一个失败不影响其他
 *       
 *       批量创建特性：
 *       - 使用数据库事务确保数据一致性
 *       - 每个表的创建失败不会影响其他表
 *       - 返回每个表的详细创建结果
 *       - 已存在的表会被标记为失败，但不会阻止其他表的创建
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - name
 *                   - code
 *                   - fields
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 数据结构名称
 *                   code:
 *                     type: string
 *                     pattern: ^[a-zA-Z][a-zA-Z0-9_:]*$
 *                     description: 数据结构代码
 *                   description:
 *                     type: string
 *                     description: 数据结构描述
 *                   fields:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/StringField'
 *                         - $ref: '#/components/schemas/TextField'
 *                         - $ref: '#/components/schemas/NumberField'
 *                         - $ref: '#/components/schemas/DateField'
 *                         - $ref: '#/components/schemas/EnumField'
 *                         - $ref: '#/components/schemas/RelationField'
 *                         - $ref: '#/components/schemas/MediaField'
 *                         - $ref: '#/components/schemas/ApiField'
 *                   keyIndexes:
 *                     $ref: '#/components/schemas/DataStructure/properties/keyIndexes'
 *               - type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - code
 *                     - fields
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 数据结构名称
 *                     code:
 *                       type: string
 *                       pattern: ^[a-zA-Z][a-zA-Z0-9_:]*$
 *                       description: 数据结构代码
 *                     description:
 *                       type: string
 *                       description: 数据结构描述
 *                     fields:
 *                       type: array
 *                       items:
 *                         oneOf:
 *                           - $ref: '#/components/schemas/StringField'
 *                           - $ref: '#/components/schemas/TextField'
 *                           - $ref: '#/components/schemas/NumberField'
 *                           - $ref: '#/components/schemas/DateField'
 *                           - $ref: '#/components/schemas/EnumField'
 *                           - $ref: '#/components/schemas/RelationField'
 *                           - $ref: '#/components/schemas/MediaField'
 *                           - $ref: '#/components/schemas/ApiField'
 *                     keyIndexes:
 *                       $ref: '#/components/schemas/DataStructure/properties/keyIndexes'
 *           examples:
 *             single:
 *               summary: 单个数据结构创建
 *               value:
 *                 name: "用户信息"
 *                 code: "user_info"
 *                 description: "系统用户基本信息表"
 *                 fields:
 *                   - name: "username"
 *                     type: "string"
 *                     description: "用户名"
 *                     isRequired: true
 *                     length: 50
 *                   - name: "status"
 *                     type: "enum"
 *                     description: "用户状态"
 *                     enumConfig:
 *                       targetEnumCode: "user:status"
 *                       multiple: false
 *                     isRequired: true
 *             batch:
 *               summary: 批量数据结构创建
 *               value:
 *                 - name: "用户信息"
 *                   code: "user_info"
 *                   description: "系统用户基本信息表"
 *                   fields:
 *                     - name: "username"
 *                       type: "string"
 *                       description: "用户名"
 *                       isRequired: true
 *                       length: 50
 *                 - name: "商品信息"
 *                   code: "product_info"
 *                   description: "商品基本信息表"
 *                   fields:
 *                     - name: "name"
 *                       type: "string"
 *                       description: "商品名称"
 *                       isRequired: true
 *                       length: 100
 *                     - name: "price"
 *                       type: "number"
 *                       description: "商品价格"
 *                       isRequired: true
 *                       numberType: "decimal"
 *                       precision: 10
 *                       scale: 2
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: 单个创建成功响应
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     fields:
 *                       type: array
 *                     warning:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         code:
 *                           type: string
 *                 - type: object
 *                   description: 批量创建响应
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 总请求数量
 *                     success:
 *                       type: integer
 *                       description: 成功创建数量
 *                     failed:
 *                       type: integer
 *                       description: 失败数量（包括已存在的表）
 *                     results:
 *                       type: array
 *                       description: 每个表的创建结果详情
 *                       items:
 *                         type: object
 *                         properties:
 *                           success:
 *                             type: boolean
 *                             description: 是否创建成功
 *                           index:
 *                             type: integer
 *                             description: 在请求数组中的索引位置
 *                           data:
 *                             type: object
 *                             description: 创建成功时的数据结构对象
 *                           error:
 *                             type: string
 *                             description: 创建失败时的错误信息
 *                           name:
 *                             type: string
 *                             description: 数据结构名称
 *                           code:
 *                             type: string
 *                             description: 数据结构代码
 *                           warning:
 *                             type: object
 *                             description: 警告信息（如缺少主键配置）
 *                             properties:
 *                               message:
 *                                 type: string
 *                               code:
 *                                 type: string
 *             examples:
 *               single_success:
 *                 summary: 单个创建成功响应
 *                 value:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "用户信息"
 *                   code: "user_info"
 *                   description: "系统用户基本信息表"
 *                   fields: []
 *                   version: 1
 *                   isActive: true
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   updatedAt: "2024-01-01T00:00:00.000Z"
 *               batch_success:
 *                 summary: 批量创建成功响应
 *                 value:
 *                   total: 3
 *                   success: 2
 *                   failed: 1
 *                   results:
 *                     - success: true
 *                       index: 0
 *                       name: "用户信息"
 *                       code: "user_info"
 *                       data:
 *                         id: "550e8400-e29b-41d4-a716-446655440000"
 *                         name: "用户信息"
 *                         code: "user_info"
 *                         description: "系统用户基本信息表"
 *                         fields: []
 *                         version: 1
 *                         isActive: true
 *                         createdAt: "2024-01-01T00:00:00.000Z"
 *                         updatedAt: "2024-01-01T00:00:00.000Z"
 *                     - success: true
 *                       index: 1
 *                       name: "商品信息"
 *                       code: "product_info"
 *                       data:
 *                         id: "550e8400-e29b-41d4-a716-446655440001"
 *                         name: "商品信息"
 *                         code: "product_info"
 *                         description: "商品基本信息表"
 *                         fields: []
 *                         version: 1
 *                         isActive: true
 *                         createdAt: "2024-01-01T00:00:00.000Z"
 *                         updatedAt: "2024-01-01T00:00:00.000Z"
 *                     - success: false
 *                       index: 2
 *                       name: "supplier"
 *                       code: "supplier"
 *                       error: "该名称的数据结构已存在"
 *       400:
 *         description: 请求参数错误或批量创建时全部失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 错误信息
 *                 code:
 *                   type: string
 *                   description: 错误代码
 *             examples:
 *               validation_error:
 *                 summary: 参数验证错误
 *                 value:
 *                   message: "名称和代码是必填项"
 *                   code: "VALIDATION_ERROR"
 *               batch_all_failed:
 *                 summary: 批量创建全部失败
 *                 value:
 *                   total: 2
 *                   success: 0
 *                   failed: 2
 *                   results:
 *                     - success: false
 *                       index: 0
 *                       name: "invalid_schema"
 *                       code: "invalid_code_with_space"
 *                       error: "代码格式不正确，必须以字母开头，只能包含字母、数字、下划线和冒号"
 *                     - success: false
 *                       index: 1
 *                       name: "supplier"
 *                       code: "supplier"
 *                       error: "该名称的数据结构已存在"
 *       409:
 *         description: 单个创建时数据结构已存在
 *   get:
 *     tags: [Schema Management]
 *     operationId: getSchemas
 *     summary: 获取所有数据结构定义
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: 按数据结构代码模糊搜索
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 按数据结构名称模糊搜索
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   description:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   fields:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/StringField'
 *                         - $ref: '#/components/schemas/TextField'
 *                         - $ref: '#/components/schemas/NumberField'
 *                         - $ref: '#/components/schemas/DateField'
 *                         - $ref: '#/components/schemas/EnumField'
 *                         - $ref: '#/components/schemas/RelationField'
 *                         - $ref: '#/components/schemas/MediaField'
 *                         - $ref: '#/components/schemas/ApiField'
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "用户信息"
 *                 code: "user_info"
 *                 description: "系统用户基本信息表"
 *                 createdAt: "2024-03-20T08:00:00.000Z"
 *                 updatedAt: "2024-03-20T08:00:00.000Z"
 *                 fields:
 *                   - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                     name: "username"
 *                     type: "string"
 *                     description: "用户名"
 *                     isRequired: true
 *                     length: 50
 *                   - id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                     name: "email"
 *                     type: "string"
 *                     description: "电子邮箱"
 *                     isRequired: true
 *                     length: 100
 *                   - id: "550e8400-e29b-41d4-a716-446655440001"
 *                     name: "status"
 *                     type: "enum"
 *                     description: "用户状态"
 *                     enumConfig:
 *                       targetEnumCode: "user:status"
 *                       multiple: false
 *                     isRequired: true
 *               - id: "550e8400-e29b-41d4-a716-446655440002"
 *                 name: "商品信息"
 *                 code: "product_info"
 *                 description: "商品基本信息表"
 *                 createdAt: "2024-03-20T09:00:00.000Z"
 *                 updatedAt: "2024-03-20T09:00:00.000Z"
 *                 fields:
 *                   - id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
 *                     name: "name"
 *                     type: "string"
 *                     description: "商品名称"
 *                     isRequired: true
 *                     length: 100
 *                   - id: "6ba7b810-9dad-11d1-80b4-00c04fd430c9"
 *                     name: "price"
 *                     type: "number"
 *                     description: "商品价格"
 *                     isRequired: true
 *                     numberType: "decimal"
 *                     precision: 10
 *                     scale: 2
 *                   - id: "6ba7b810-9dad-11d1-80b4-00c04fd430ca"
 *                     name: "description"
 *                     type: "text"
 *                     description: "商品描述"
 *                     maxLength: 1000
 *                   - id: "6ba7b810-9dad-11d1-80b4-00c04fd430cb"
 *                     name: "category"
 *                     type: "enum"
 *                     description: "商品分类"
 *                     enumConfig:
 *                       targetEnumCode: "product:category"
 *                       multiple: false
 *                     isRequired: true
 *                   - id: "6ba7b810-9dad-11d1-80b4-00c04fd430cc"
 *                     name: "images"
 *                     type: "media"
 *                     description: "商品图片"
 *                     mediaType: "image"
 *                     formats: ["jpg", "png", "webp"]
 *                     maxSize: 5
 *                     multiple: true
 * 
 * /api/schemas/{id}:
 *   get:
 *     tags: [Schema Management]
 *     operationId: getSchemasId
 *     summary: 获取指定数据结构定义
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据结构定义ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 code:
 *                   type: string
 *                 description:
 *                   type: string
 *                 fields:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/StringField'
 *                       - $ref: '#/components/schemas/TextField'
 *                       - $ref: '#/components/schemas/NumberField'
 *                       - $ref: '#/components/schemas/DateField'
 *                       - $ref: '#/components/schemas/EnumField'
 *                       - $ref: '#/components/schemas/RelationField'
 *                       - $ref: '#/components/schemas/MediaField'
 *                       - $ref: '#/components/schemas/ApiField'
 *       404:
 *         description: 数据结构定义不存在
 *   put:
 *     tags: [Schema Management]
 *     operationId: putSchemasId
 *     summary: 更新数据结构定义
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据结构定义ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/StringField'
 *                     - $ref: '#/components/schemas/TextField'
 *                     - $ref: '#/components/schemas/NumberField'
 *                     - $ref: '#/components/schemas/DateField'
 *                     - $ref: '#/components/schemas/EnumField'
 *                     - $ref: '#/components/schemas/RelationField'
 *                     - $ref: '#/components/schemas/MediaField'
 *                     - $ref: '#/components/schemas/ApiField'
 *               keyIndexes:
 *                 $ref: '#/components/schemas/DataStructure/properties/keyIndexes'
 *           example:
 *             name: "用户信息"
 *             description: "系统用户基本信息表-已更新"
 *             fields:
 *               - name: "username"
 *                 type: "string"
 *                 description: "用户名"
 *                 isRequired: true
 *                 length: 50
 *               - name: "email"
 *                 type: "string"
 *                 description: "电子邮箱"
 *                 isRequired: true
 *                 length: 100
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 数据结构定义不存在
 *   delete:
 *     tags: [Schema Management]
 *     operationId: deleteSchemasId
 *     summary: 删除数据结构定义
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据结构定义ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 数据结构定义不存在
 *       409:
 *         description: 数据结构定义正在被使用，无法删除
 * 
 * /api/schemas/{id}/validate:
 *   post:
 *     tags: [Schema Management]
 *     operationId: postSchemasIdValidate
 *     summary: 验证数据结构定义
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据结构定义ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             username: "john_doe"
 *             email: "john@example.com"
 *             status: "active"
 *     responses:
 *       200:
 *         description: 验证成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 数据结构定义不存在
 */

router.post('/', createSchema);
router.get('/', getAllSchemas);
router.get('/:id', getSchemaById);
router.put('/:id', updateSchema);
router.delete('/:id', deleteSchema);
router.post('/:id/validate', validateSchema);

export default router; 