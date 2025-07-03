# Token 管理功能说明

## 概述

本系统实现了基于内存的临时token存储机制，用于管理SSO认证后的用户token。在生产环境中，建议使用Redis来替代内存存储。

## 功能特性

### 1. 内存Token存储
- 使用单例模式的TokenManager管理token
- 自动过期机制（24小时）
- 定期清理过期token（每5分钟）
- 线程安全的Map存储

### 2. Token处理流程
1. SSO回调成功后生成JWT token
2. 将用户信息和token存储到内存中
3. 前端请求时自动验证token并获取用户信息
4. 支持token的增删改查操作

### 3. 管理API
- `/api/token-management/count` - 获取当前token数量
- `/api/token-management/cleanup` - 手动清理过期token
- `/api/token-management/stats` - 获取token统计信息
- `/api/token-management/health` - 健康检查

## 使用方式

### 认证中间件
```typescript
import { authenticateToken } from '../middlewares/auth';

// 在路由中使用
router.get('/protected', authenticateToken, (req, res) => {
  // req.user 包含用户信息
  res.json({ user: req.user });
});
```

### Token管理
```typescript
import { TokenManager } from '../middlewares/auth';

const tokenManager = TokenManager.getInstance();

// 获取token数量
const count = tokenManager.getTokenCount();

// 删除token
tokenManager.removeToken(token);

// 清理过期token
tokenManager.cleanupExpiredTokens();
```

## 测试

### 前端测试页面
访问 `http://localhost:8000/test-auth` 进行以下测试：
- 测试需要认证的API
- 测试公开API
- 测试401错误
- 测试业务错误
- 测试Token管理
- 测试Token管理API
- 测试无token情况

### API测试
```bash
# 获取token统计信息
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3300/api/token-management/stats

# 清理过期token
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3300/api/token-management/cleanup

# 健康检查
curl http://localhost:3300/api/token-management/health
```

## Redis实现（生产环境推荐）

### 安装依赖
```bash
npm install redis @types/redis
```

### 环境变量
```env
REDIS_URL=redis://localhost:6379
```

### 主要优势
1. 支持分布式部署时的token共享
2. 使用Redis的TTL功能自动过期token
3. 更好的性能和可扩展性
4. 支持集群模式

### 实现步骤
1. 安装redis依赖
2. 创建Redis连接池
3. 使用Redis的TTL功能自动过期token
4. 支持分布式部署时的token共享
5. 添加错误处理和重连机制

参考实现：`src/middlewares/redisTokenManager.ts`

## 部署注意事项

### 内存存储（开发环境）
- 适合单机部署
- 服务器重启后token会丢失
- 内存使用量会随着用户数量增长

### Redis存储（生产环境）
1. 确保Redis服务器已安装并运行
2. 配置Redis连接URL环境变量
3. 在生产环境中使用Redis集群或哨兵模式
4. 监控Redis连接状态和性能
5. 定期备份Redis数据

## 监控和日志

### 日志输出
- Token存储和删除操作
- 过期token清理
- 认证失败信息
- 内存使用情况

### 监控指标
- 当前token数量
- 内存使用量
- 服务器运行时间
- Redis连接状态（如果使用）

## 安全考虑

1. **Token过期**：设置合理的过期时间（24小时）
2. **定期清理**：自动清理过期token
3. **HTTPS**：生产环境使用HTTPS传输
4. **JWT密钥**：使用强密钥并定期轮换
5. **访问控制**：管理API需要认证

## 故障排除

### 常见问题
1. **Token验证失败**：检查JWT密钥配置
2. **内存泄漏**：检查token清理机制
3. **Redis连接失败**：检查Redis服务状态
4. **认证中间件错误**：检查token格式

### 调试方法
1. 查看控制台日志
2. 使用测试页面验证功能
3. 检查API响应状态
4. 监控内存使用情况 