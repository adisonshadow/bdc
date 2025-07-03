import { Router } from 'express';
import {
  createEnum,
  getAllEnums,
  getEnumById,
  getEnumByCode,
  updateEnum,
  deleteEnum
} from '../controllers/enumController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Enum Management
 *   description: 枚举管理相关接口
 */

/**
 * @swagger
 * /api/enums:
 *   post:
 *     summary: 创建枚举
 *     tags: [Enum Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Enum'
 *           example:
 *             code: "system:user:status"
 *             name: "用户状态"
 *             description: "系统用户状态枚举"
 *             options:
 *               - value: "active"
 *                 label: "正常"
 *               - value: "locked"
 *                 label: "锁定"
 *               - value: "disabled"
 *                 label: "禁用"
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enum'
 *       400:
 *         description: 请求参数错误
 *       409:
 *         description: 枚举代码已存在
 */
router.post('/', createEnum);

/**
 * @swagger
 * /api/enums:
 *   get:
 *     summary: 获取枚举列表
 *     tags: [Enum Management]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否只返回启用的枚举
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: 按枚举代码模糊搜索
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 按枚举名称模糊搜索
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enum'
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 code: "system:user:status"
 *                 name: "用户状态"
 */
router.get('/', getAllEnums);

/**
 * @swagger
 * /api/enums/{id}:
 *   get:
 *     summary: 根据ID获取枚举
 *     tags: [Enum Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 枚举ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enum'
 *       404:
 *         description: 枚举不存在
 */
router.get('/:id', getEnumById);

/**
 * @swagger
 * /api/enums/code/{code}:
 *   get:
 *     summary: 根据代码获取枚举
 *     tags: [Enum Management]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 枚举代码
 *         example: "system:user:status"
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enum'
 *       404:
 *         description: 枚举不存在
 */
router.get('/code/:code', getEnumByCode);

/**
 * @swagger
 * /api/enums/{id}:
 *   put:
 *     summary: 更新枚举
 *     tags: [Enum Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 枚举ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Enum'
 *           example:
 *             name: "用户状态"
 *             description: "系统用户状态枚举-已更新"
 *             options:
 *               - value: "active"
 *                 label: "正常"
 *               - value: "locked"
 *                 label: "锁定"
 *               - value: "disabled"
 *                 label: "已禁用"
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enum'
 *       404:
 *         description: 枚举不存在
 *       400:
 *         description: 请求参数错误
 */
router.put('/:id', updateEnum);

/**
 * @swagger
 * /api/enums/{id}:
 *   delete:
 *     summary: 删除枚举
 *     tags: [Enum Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 枚举ID
 *     responses:
 *       204:
 *         description: 删除成功
 *       404:
 *         description: 枚举不存在
 *       409:
 *         description: 枚举正在被使用，无法删除
 */
router.delete('/:id', deleteEnum);

export default router;