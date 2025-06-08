import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { AppDataSource } from './config/database';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import dotenv from 'dotenv';
import path from 'path';

// 根据NODE_ENV加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);
console.log('加载环境变量文件:', envPath);
dotenv.config({ path: envPath });

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log('环境变量 PORT:', process.env.PORT);
console.log('实际监听端口:', PORT);

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 初始化数据库连接
AppDataSource.initialize()
  .then(async () => {
    console.log('数据库连接成功');

    // 设置 Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    server.applyMiddleware({ app });

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`GraphQL 端点: http://localhost:${PORT}${server.graphqlPath}`);
    });
  })
  .catch((error) => {
    console.error('数据库连接失败:', error);
  }); 