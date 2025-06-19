import { Router } from 'express';
import { AuthCallbackController } from '../controllers/authCallbackController';
import express from 'express';

const router = Router();

// 添加 urlencoded 中间件支持
router.use(express.urlencoded({ extended: true }));

// SSO 回调处理路由
router.post('/auth/callback', AuthCallbackController.handleCallback);

export default router; 