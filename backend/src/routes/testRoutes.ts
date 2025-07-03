import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 公开API - 无需认证
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: '这是公开API，无需认证',
    data: {
      timestamp: new Date().toISOString(),
      headers: req.headers,
    }
  });
});

// 需要认证的API
router.get('/auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '这是需要认证的API',
    data: {
      timestamp: new Date().toISOString(),
      user: req.user,
      headers: req.headers,
    }
  });
});

// 返回401错误的API
router.get('/unauthorized', (_req, res) => {
  res.status(401).json({
    success: false,
    message: '未授权访问',
    code: 'UNAUTHORIZED'
  });
});

// 返回业务错误的API
router.get('/error', (_req, res) => {
  res.json({
    success: false,
    message: '业务错误',
    code: 'BUSINESS_ERROR',
    showType: 2 // ERROR_MESSAGE
  });
});

// 测试token管理API
router.get('/token-stats', authenticateToken, (req, res) => {
  const { TokenManager } = require('../middlewares/auth');
  const tokenManager = TokenManager.getInstance();
  
  res.json({
    success: true,
    message: 'Token管理测试成功',
    data: {
      tokenCount: tokenManager.getTokenCount(),
      currentUser: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

export default router; 