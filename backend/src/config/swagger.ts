import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import path from 'path';

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
        Enum: {
          type: 'object',
          required: ['code', 'name', 'options'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '枚举ID',
            },
            code: {
              type: 'string',
              pattern: '^[a-z][a-z0-9_:]*$',
              description: '枚举代码（使用:分隔的多级结构，如 system:user:status）',
              example: 'system:user:status',
            },
            name: {
              type: 'string',
              description: '枚举名称',
              example: '用户状态',
            },
            description: {
              type: 'string',
              description: '枚举描述',
              example: '用户账号状态定义',
            },
            options: {
              type: 'array',
              description: '枚举选项列表',
              items: {
                type: 'object',
                required: ['value', 'label'],
                properties: {
                  value: {
                    type: 'string',
                    description: '枚举值（存储值）',
                    example: 'active',
                  },
                  label: {
                    type: 'string',
                    description: '显示标签',
                    example: '活跃',
                  },
                  description: {
                    type: 'string',
                    description: '选项描述',
                    example: '正常使用的账号',
                  },
                  order: {
                    type: 'integer',
                    description: '排序号（可选）',
                    example: 1,
                  },
                },
              },
            },
            isActive: {
              type: 'boolean',
              description: '是否启用',
              default: true,
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
        Error: {
          type: 'object',
          required: ['message', 'code'],
          properties: {
            message: {
              type: 'string',
              description: '错误信息',
            },
            code: {
              type: 'string',
              description: '错误代码',
              enum: [
                'VALIDATION_ERROR',
                'NOT_FOUND_ERROR',
                'AUTHENTICATION_ERROR',
                'AUTHORIZATION_ERROR',
                'BUSINESS_ERROR',
                'DATABASE_ERROR',
                'EXTERNAL_SERVICE_ERROR',
                'INTERNAL_SERVER_ERROR',
              ],
            },
            details: {
              type: 'object',
              description: '错误详情',
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: '请求参数验证失败',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: '错误信息',
                  },
                  code: {
                    type: 'string',
                    description: '错误代码',
                    example: 'VALIDATION_ERROR',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: '错误信息',
                  },
                  code: {
                    type: 'string',
                    description: '错误代码',
                    example: 'NOT_FOUND',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: '错误信息',
                  },
                  code: {
                    type: 'string',
                    description: '错误代码',
                    example: 'INTERNAL_SERVER_ERROR',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
    path.join(__dirname, '../models/*.ts'),
    path.join(__dirname, '../swagger/schemas.ts')
  ]
};

// 生成 swagger 规范
const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec }; 