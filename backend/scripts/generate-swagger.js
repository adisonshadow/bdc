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
    components: {
      schemas: {
        DataStructure: {
          type: 'object',
          required: ['name', 'schema'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '数据结构ID',
            },
            name: {
              type: 'string',
              description: '数据结构名称',
              example: 'production_plan',
            },
            schema: {
              type: 'object',
              description: '数据结构定义（JSON Schema）',
              example: {
                type: 'object',
                properties: {
                  planId: { type: 'string' },
                  planName: { type: 'string' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  status: { type: 'string', enum: ['draft', 'active', 'completed'] },
                },
                required: ['planId', 'planName', 'startDate', 'endDate', 'status'],
              },
            },
            description: {
              type: 'string',
              description: '数据结构描述',
              example: '生产计划数据结构定义',
            },
            isActive: {
              type: 'boolean',
              description: '是否激活',
              default: true,
            },
            version: {
              type: 'integer',
              description: '版本号',
              minimum: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/swagger/schemas.ts'
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