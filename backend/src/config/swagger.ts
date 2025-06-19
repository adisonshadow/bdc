/**
 * 在运行时提供 Swagger UI 的配置
 * 为开发提供类型检查和 TypeScript 支持
 * 在应用运行时使用（比如通过 swagger-ui-express 提供 API 文档界面）
*/
import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BDC API Documentation',
      version,
      description: 'BDC (Business Data Constructor) API 文档',
      contact: {
        name: 'BDC Team',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3300',
        description: process.env.NODE_ENV === 'production' ? '生产服务器' : '开发服务器',
      },
    ],
    tags: [
      {
        name: 'Schema Management',
        description: '数据结构定义管理 API',
      },
      {
        name: 'Enum Management',
        description: '枚举定义管理 API',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/swagger/schemas.ts'  // 从这里读取 schemas 定义
  ],
};

export default options; 