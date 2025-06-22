import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Logger } from './utils/logger';
import apiDefinitionRouter from './routes/apiDefinitionRoutes';

// 在最开始就加载环境变量
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

// 检查环境变量文件是否存在
if (!fs.existsSync(envPath)) {
  console.error(`环境变量文件不存在: ${envPath}`);
  process.exit(1);
}

// 加载环境变量
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('加载环境变量失败:', result.error);
  process.exit(1);
}

console.log('========== 环境变量信息 ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_SCHEMA:', process.env.DB_SCHEMA);
console.log('================================');

// 验证必要的环境变量
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SCHEMA'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('缺少必要的环境变量:', missingEnvVars.join(', '));
  process.exit(1);
}

// 现在可以导入依赖环境变量的模块
import { initializeDatabase } from './config/database';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import swaggerRouter from './routes/swagger';
import expressPlayground from 'graphql-playground-middleware-express';
import schemaRouter from './routes/schemaRoutes';
import enumRouter from './routes/enumRoutes';
import databaseConnectionRouter from './routes/databaseConnectionRoutes';
import materializeRouter from './routes/materializeRoutes';

Logger.info({ 
  message: '环境变量加载完成', 
  env: NODE_ENV,
  config: {
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    dbSchema: process.env.DB_SCHEMA,
    port: process.env.PORT
  }
});

const app = express();
const PORT = process.env.PORT || 3300;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/schemas', schemaRouter);
app.use('/api/enums', enumRouter);
app.use('/api/database-connections', databaseConnectionRouter);
app.use('/api/api-definitions', apiDefinitionRouter);
app.use('/api/materialize-tables', materializeRouter);

// Swagger UI
app.use('/api-docs', swaggerRouter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 添加 GraphQL Playground
app.get('/playground', expressPlayground({ 
  endpoint: '/graphql',
  settings: {
    'editor.theme': 'dark',
    'editor.reuseHeaders': true,
    'tracing.hideTracingResponse': true,
    'editor.fontSize': 14,
    'editor.fontFamily': "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
    'editor.cursorShape': 'line',
    'request.credentials': 'include',
  }
}));

// 初始化数据库并启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    await initializeDatabase();

    // 创建 Apollo Server 实例
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        };
      },
    });

    // 启动 Apollo Server
    await server.start();
    
    // GraphQL 路由
    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }) => {
        // 这里可以添加认证逻辑
        return {
          req,
          // 可以添加数据库连接等上下文
        };
      },
    }));

    // 启动服务器
    app.listen(PORT, () => {
      const baseUrl = `http://localhost:${PORT}`;
      Logger.info({ message: '服务器启动成功', url: baseUrl });
      console.log('\n========== 服务器启动成功 ==========');
      console.log('🍺 服务器地址:', baseUrl);
      console.log('🐰 GraphQL Playground:', `${baseUrl}/graphql`);
      console.log('🎉 API 文档:', `${baseUrl}/api-docs`);
      console.log('🔮 API JSON:', `${baseUrl}/api-docs/swagger.json`);
      console.log('====================================\n');
    });
  } catch (err) {
    Logger.error({ message: '服务器启动失败', error: err });
    process.exit(1);
  }
};

startServer(); 