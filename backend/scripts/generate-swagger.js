/**
 * 在构建时生成静态的 swagger.json 文件
 * 这个文件会被 yarn swagger:dev 命令执行
*/
const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const { version } = require('../package.json');

// Swagger 配置选项
const options = {
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

// 生成 Swagger 文档
function generateSwagger() {
  try {
    const swaggerSpec = swaggerJSDoc(options);
    const swaggerJson = JSON.stringify(swaggerSpec, null, 2);
    const outputPath = path.join(__dirname, '../swagger.json');
    
    fs.writeFileSync(outputPath, swaggerJson);
    console.log('✨ Swagger 文档已生成到:', outputPath);
  } catch (error) {
    console.error('❌ 生成 Swagger 文档失败:', error);
    process.exit(1);
  }
}

// 执行生成
generateSwagger(); 