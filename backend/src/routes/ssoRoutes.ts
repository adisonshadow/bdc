import { Router } from 'express';
import { SSOController } from '../sso/controller';

const router = Router();

/**
 * @swagger
 * /sso-callback:
 *   post:
 *     summary: SSO认证回调
 *     description: 处理第三方SSO服务器的认证回调
 *     tags: [SSO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - idp
 *               - access_token
 *               - refresh_token
 *               - token_type
 *               - expires_in
 *               - user_info
 *             properties:
 *               idp:
 *                 type: string
 *                 description: 身份提供者标识
 *               access_token:
 *                 type: string
 *                 description: 访问令牌
 *               refresh_token:
 *                 type: string
 *                 description: 刷新令牌
 *               token_type:
 *                 type: string
 *                 description: 令牌类型
 *               expires_in:
 *                 type: string
 *                 description: 过期时间
 *               state:
 *                 type: string
 *                 description: 状态参数
 *               user_info:
 *                 type: string
 *                 description: 用户信息
 *     responses:
 *       302:
 *         description: 重定向到前端页面
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/sso-callback', SSOController.handleCallback);

// router.post('/sso-callback', (req, res) => {
//   res.send('SSO Callback received: '+ JSON.stringify(req.body));
// });

/**
 * @swagger
 * /sso-callback:
 *   get:
 *     summary: SSO回调页面
 *     description: GET方法访问SSO回调页面时的友好提示
 *     tags: [SSO]
 *     responses:
 *       200:
 *         description: 提示信息
 */
router.get('/sso-callback', (_req, res) => {
  res.send('请通过POST方式提交SSO认证数据');
});

export default router;