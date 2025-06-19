import { Router } from 'express';
import { DatabaseConnectionController } from '../controllers/databaseConnectionController';

const router = Router();
const controller = new DatabaseConnectionController();

/**
 * @swagger
 * tags:
 *   name: Database Connections
 *   description: 数据库连接管理相关接口
 */

/**
 * @swagger
 * /api/database-connections:
 *   post:
 *     tags: [Database Connections]
 *     summary: 创建数据库连接
 *     description: 创建新的数据库连接配置
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatabaseConnectionCreate'
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DatabaseConnection'
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', controller.create.bind(controller));

/**
 * @swagger
 * /api/database-connections:
 *   get:
 *     tags: [Database Connections]
 *     summary: 获取数据库连接列表
 *     description: 分页获取数据库连接列表，支持按类型、状态和是否激活进行筛选
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [POSTGRESQL, MYSQL, MONGODB, SQLSERVER, ORACLE]
 *         description: 数据库类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INACTIVE, ACTIVE, TESTING, FAILED]
 *         description: 连接状态
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否激活
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DatabaseConnection'
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: 服务器错误
 */
router.get('/', controller.list.bind(controller));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   get:
 *     tags: [Database Connections]
 *     summary: 获取单个数据库连接
 *     description: 根据ID获取数据库连接详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据库连接ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DatabaseConnection'
 *       404:
 *         description: 数据库连接不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', controller.get.bind(controller));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   put:
 *     tags: [Database Connections]
 *     summary: 更新数据库连接
 *     description: 更新指定ID的数据库连接配置
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据库连接ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatabaseConnectionUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DatabaseConnection'
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 数据库连接不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', controller.update.bind(controller));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   delete:
 *     tags: [Database Connections]
 *     summary: 删除数据库连接
 *     description: 删除指定ID的数据库连接
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据库连接ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 数据库连接已删除
 *       400:
 *         description: 无法删除正在使用的数据库连接
 *       404:
 *         description: 数据库连接不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', controller.delete.bind(controller));
 
/**
 * @swagger
 * /api/database-connections/{id}/test:
 *   post:
 *     tags: [Database Connections]
 *     summary: 测试数据库连接
 *     description: 测试指定ID的数据库连接是否可用
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据库连接ID
 *     responses:
 *       200:
 *         description: 测试成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 连接测试成功
 *                 data:
 *                   $ref: '#/components/schemas/DatabaseConnectionTestResult'
 *       404:
 *         description: 数据库连接不存在
 *       500:
 *         description: 服务器错误或连接测试失败
 */
router.post('/:id/test', controller.testConnection.bind(controller));

export default router; 