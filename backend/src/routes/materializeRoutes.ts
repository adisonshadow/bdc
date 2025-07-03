import { Router } from 'express';
import { materializeTables, getMaterializeHistory } from '../controllers/materializeController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Materialize Tables
 *   description: 表物化管理 API
 * 
 * /api/materialize-tables:
 *   post:
 *     tags: [Materialize Tables]
 *     summary: 物化表结构到数据库
 *     description: 将选中的表结构物化到指定的数据库连接中
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectionId
 *               - schemaCodes
 *             properties:
 *               connectionId:
 *                 type: string
 *                 format: uuid
 *                 description: 数据库连接ID
 *               schemaCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 要物化的表结构代码列表
 *               config:
 *                 type: object
 *                 properties:
 *                   overwrite:
 *                     type: boolean
 *                     description: 是否覆盖已存在的表
 *                   includeIndexes:
 *                     type: boolean
 *                     description: 是否包含索引
 *                   includeConstraints:
 *                     type: boolean
 *                     description: 是否包含约束
 *                   targetSchema:
 *                     type: string
 *                     description: 目标Schema名称
 *                   tablePrefix:
 *                     type: string
 *                     description: 表名前缀
 *           example:
 *             connectionId: "550e8400-e29b-41d4-a716-446655440000"
 *             schemaCodes: ["production:plan", "production:product"]
 *             config:
 *               overwrite: false
 *               includeIndexes: true
 *               includeConstraints: true
 *               targetSchema: "public"
 *               tablePrefix: "bdc_"
 *     responses:
 *       200:
 *         description: 物化成功
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
 *                   example: "表物化成功"
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       schemaCode:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       message:
 *                         type: string
 *                       tableName:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 数据库连接或表结构不存在
 *       500:
 *         description: 服务器错误
 * 
 * /api/materialize-tables/history:
 *   get:
 *     tags: [Materialize Tables]
 *     summary: 获取物化历史记录
 *     description: 分页获取表物化的历史记录
 *     parameters:
 *       - in: query
 *         name: connectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 数据库连接ID（可选）
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           connectionId:
 *                             type: string
 *                             format: uuid
 *                           connectionName:
 *                             type: string
 *                           schemaCodes:
 *                             type: array
 *                             items:
 *                               type: string
 *                           config:
 *                             type: object
 *                           status:
 *                             type: string
 *                             enum: [success, failed, pending]
 *                           results:
 *                             type: array
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       500:
 *         description: 服务器错误
 */

// 物化表结构到数据库
router.post('/', materializeTables);

// 获取物化历史记录
router.get('/history', getMaterializeHistory);

export default router; 