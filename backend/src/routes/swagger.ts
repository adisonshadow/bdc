import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

const router = express.Router();

// 读取 swagger.json 文件的函数
function loadSwaggerSpec() {
  try {
    const swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../../swagger.json'), 'utf8'));
    return swaggerSpec;
  } catch (error) {
    Logger.error({ message: 'Swagger 文档加载失败', error: error.message });
    throw error;
  }
}

// 配置 Swagger UI - 每次请求时重新读取文件
router.use('/', (swaggerUi.serve as unknown) as express.RequestHandler[]);
router.get('/', (_req, res) => {
  try {
    const swaggerSpec = loadSwaggerSpec();
    const swaggerHtml = swaggerUi.generateHTML(swaggerSpec);
    res.send(swaggerHtml);
  } catch (error) {
    res.status(500).send('Swagger 文档加载失败');
  }
});

// 提供 swagger.json 端点 - 每次请求时重新读取文件
router.get('/swagger.json', (_req, res) => {
  try {
    const swaggerSpec = loadSwaggerSpec();
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  } catch (error) {
    res.status(500).json({ error: 'Swagger 文档加载失败' });
  }
});

export default router; 