import { Router } from 'express';
import {
  createAiConfig,
  getAllAiConfigs,
  getAiConfigById,
  getAiConfigByProviderAndModel,
  updateAiConfig,
  deleteAiConfig,
  testAiConfig
} from '../controllers/aiConfigController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: AI Config Management
 *   description: AI配置管理相关接口
 */

/**
 * @swagger
 * /api/ai-configs:
 *   post:
 *     summary: 创建AI配置
 *     tags: [AI Config Management]
 *     operationId: postAiConfigs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - apiUrl
 *               - apiKey
 *               - model
 *             properties:
 *               provider:
 *                 type: string
 *                 description: AI服务提供商
 *                 example: "openai"
 *               apiUrl:
 *                 type: string
 *                 description: API地址
 *                 example: "https://api.openai.com/v1"
 *               apiKey:
 *                 type: string
 *                 description: API密钥
 *                 example: "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
 *               model:
 *                 type: string
 *                 description: AI模型名称
 *                 example: "gpt-4"
 *               config:
 *                 type: object
 *                 description: 额外配置参数
 *                 example:
 *                   temperature: 0.7
 *                   max_tokens: 1000
 *           example:
 *             provider: "openai"
 *             apiUrl: "https://api.openai.com/v1"
 *             apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
 *             model: "gpt-4"
 *             config:
 *               temperature: 0.7
 *               max_tokens: 1000
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 provider:
 *                   type: string
 *                 apiUrl:
 *                   type: string
 *                 model:
 *                   type: string
 *                 config:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 请求参数错误
 *       409:
 *         description: 该提供商和模型组合的配置已存在
 */
router.post('/', createAiConfig);

/**
 * @swagger
 * /api/ai-configs:
 *   get:
 *     summary: 获取AI配置列表
 *     tags: [AI Config Management]
 *     operationId: getAiConfigs
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: 按提供商筛选
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: 按模型名称筛选
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
 *                   provider:
 *                     type: string
 *                   apiUrl:
 *                     type: string
 *                   model:
 *                     type: string
 *                   config:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 provider: "openai"
 *                 apiUrl: "https://api.openai.com/v1"
 *                 model: "gpt-4"
 *                 config:
 *                   temperature: 0.7
 *                 createdAt: "2024-01-01T00:00:00Z"
 *                 updatedAt: "2024-01-01T00:00:00Z"
 */
router.get('/', getAllAiConfigs);

/**
 * @swagger
 * /api/ai-configs/{id}:
 *   get:
 *     summary: 根据ID获取AI配置
 *     tags: [AI Config Management]
 *     operationId: getAiConfigsId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AI配置ID
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
 *                 provider:
 *                   type: string
 *                 apiUrl:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *                 model:
 *                   type: string
 *                 config:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: AI配置不存在
 */
router.get('/:id', getAiConfigById);

/**
 * @swagger
 * /api/ai-configs/provider/{provider}/model/{model}:
 *   get:
 *     summary: 根据提供商和模型获取AI配置
 *     tags: [AI Config Management]
 *     operationId: getAiConfigsProviderProviderModelModel
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: AI服务提供商
 *         example: "openai"
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *         description: AI模型名称
 *         example: "gpt-4"
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
 *                 provider:
 *                   type: string
 *                 apiUrl:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *                 model:
 *                   type: string
 *                 config:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: AI配置不存在
 */
router.get('/provider/:provider/model/:model', getAiConfigByProviderAndModel);

/**
 * @swagger
 * /api/ai-configs/{id}:
 *   put:
 *     summary: 更新AI配置
 *     tags: [AI Config Management]
 *     operationId: putAiConfigsId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AI配置ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 description: AI服务提供商
 *               apiUrl:
 *                 type: string
 *                 description: API地址
 *               apiKey:
 *                 type: string
 *                 description: API密钥
 *               model:
 *                 type: string
 *                 description: AI模型名称
 *               config:
 *                 type: object
 *                 description: 额外配置参数
 *           example:
 *             provider: "openai"
 *             apiUrl: "https://api.openai.com/v1"
 *             apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
 *             model: "gpt-4-turbo"
 *             config:
 *               temperature: 0.8
 *               max_tokens: 2000
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 provider:
 *                   type: string
 *                 apiUrl:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *                 model:
 *                   type: string
 *                 config:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: AI配置不存在
 *       400:
 *         description: 请求参数错误
 */
router.put('/:id', updateAiConfig);

/**
 * @swagger
 * /api/ai-configs/{id}:
 *   delete:
 *     summary: 删除AI配置
 *     tags: [AI Config Management]
 *     operationId: deleteAiConfigsId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AI配置ID
 *     responses:
 *       204:
 *         description: 删除成功
 *       404:
 *         description: AI配置不存在
 */
router.delete('/:id', deleteAiConfig);

/**
 * @swagger
 * /api/ai-configs/{id}/test:
 *   post:
 *     summary: 测试AI配置连接
 *     tags: [AI Config Management]
 *     operationId: postAiConfigsIdTest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AI配置ID
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
 *                 message:
 *                   type: string
 *                 provider:
 *                   type: string
 *                 model:
 *                   type: string
 *             example:
 *               success: true
 *               message: "AI配置测试成功"
 *               provider: "openai"
 *               model: "gpt-4"
 *       404:
 *         description: AI配置不存在
 */
router.post('/:id/test', testAiConfig);

export default router; 