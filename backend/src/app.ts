import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { initializeDatabase } from './config/database';
import apiDefinitionRoutes from './routes/apiDefinitionRoutes';
import authCallbackRoutes from './routes/authCallbackRoutes';
import databaseConnectionRoutes from './routes/databaseConnectionRoutes';
import schemaRoutes from './routes/schemaRoutes';
import enumRoutes from './routes/enumRoutes';
import materializeRoutes from './routes/materializeRoutes';

const app = express();

// 中间件配置
app.use(cors());
app.use(json());

// 注册路由
app.use('/api', apiDefinitionRoutes);
app.use('/api', authCallbackRoutes);
app.use('/api', databaseConnectionRoutes);
app.use('/api', schemaRoutes);
app.use('/api', enumRoutes);
app.use('/api/materialize-tables', materializeRoutes);

// 错误处理中间件
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库连接
initializeDatabase().catch(error => {
  console.error('数据库初始化失败:', error);
  process.exit(1);
});

export default app; 