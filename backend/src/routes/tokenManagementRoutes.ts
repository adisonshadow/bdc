import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { TokenManager } from '../middlewares/auth';

const router = Router();

// 获取当前存储的token数量（需要认证）
router.get('/count', authenticateToken, (_req, res) => {
  try {
    const tokenManager = TokenManager.getInstance();
    const count = tokenManager.getTokenCount();
    
    res.json({
      success: true,
      data: {
        tokenCount: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get token count:', error);
    res.status(500).json({
      success: false,
      message: '获取token数量失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 清理过期的token（需要认证）
router.post('/cleanup', authenticateToken, (_req, res) => {
  try {
    const tokenManager = TokenManager.getInstance();
    const cleanedCount = tokenManager['cleanupExpiredTokens']();
    
    res.json({
      success: true,
      data: {
        cleanedCount,
        message: `清理了 ${cleanedCount} 个过期token`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
    res.status(500).json({
      success: false,
      message: '清理过期token失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取token统计信息（需要认证）
router.get('/stats', authenticateToken, (_req, res) => {
  try {
    const tokenManager = TokenManager.getInstance();
    const count = tokenManager.getTokenCount();
    
    res.json({
      success: true,
      data: {
        tokenCount: count,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get token stats:', error);
    res.status(500).json({
      success: false,
      message: '获取token统计信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 健康检查（无需认证）
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

export default router; 