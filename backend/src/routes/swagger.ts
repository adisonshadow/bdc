import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

const router = express.Router();

// 读取 swagger.json 文件
let swaggerSpec;
try {
  swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../../swagger.json'), 'utf8'));
  Logger.info({ message: 'Swagger 文档加载成功' });
} catch (error) {
  Logger.error({ message: 'Swagger 文档加载失败', error: error.message });
  process.exit(1);
}

// 配置 Swagger UI
router.use('/', (swaggerUi.serve as unknown) as express.RequestHandler[]);
router.get('/', (swaggerUi.setup(swaggerSpec) as unknown) as express.RequestHandler);

// 提供 swagger.json 端点
router.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router; 