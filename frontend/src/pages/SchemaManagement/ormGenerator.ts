import { message } from 'antd';

// 定义与主文件兼容的类型
type Field = API.UuidField | API.AutoIncrementField | API.StringField | API.TextField | API.NumberField | API.BooleanField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

interface SchemaListItem {
  id?: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  fields: Field[];
}

// ORM 生成器配置
interface ORMConfig {
  framework: 'prisma' | 'typeorm' | 'sequelize' | 'mongoose';
  language: 'typescript' | 'javascript';
  includeRelations: boolean;
  includeValidations: boolean;
  includeComments: boolean;
}

// 字段类型映射
const fieldTypeMapping = {
  prisma: {
    uuid: 'String @id @default(uuid())',
    auto_increment: 'Int @id @default(autoincrement())',
    string: 'String',
    text: 'String',
    number: 'Int',
    boolean: 'Boolean',
    date: 'DateTime',
    enum: 'String',
    relation: 'String',
    media: 'String',
    api: 'String'
  },
  typeorm: {
    uuid: 'string',
    auto_increment: 'number',
    string: 'string',
    text: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    enum: 'string',
    relation: 'string',
    media: 'string',
    api: 'string'
  },
  sequelize: {
    uuid: 'UUID',
    auto_increment: 'INTEGER',
    string: 'STRING',
    text: 'TEXT',
    number: 'INTEGER',
    boolean: 'BOOLEAN',
    date: 'DATE',
    enum: 'STRING',
    relation: 'STRING',
    media: 'STRING',
    api: 'STRING'
  },
  mongoose: {
    uuid: 'String',
    auto_increment: 'Number',
    string: 'String',
    text: 'String',
    number: 'Number',
    boolean: 'Boolean',
    date: 'Date',
    enum: 'String',
    relation: 'String',
    media: 'String',
    api: 'String'
  }
} as const;

// 生成 Prisma 模型
const generatePrismaModel = (schema: SchemaListItem, config: ORMConfig): string => {
  let model = `model ${schema.name} {\n`;
  
  // 添加字段
  schema.fields.forEach(field => {
    let fieldDef = `  ${field.name}`;
    
    // 字段类型
    const fieldType = field.type as keyof typeof fieldTypeMapping.prisma;
    if (field.type === 'uuid' || field.type === 'auto_increment') {
      fieldDef += ` ${fieldTypeMapping.prisma[fieldType]}`;
    } else if (field.type === 'enum' && 'enumConfig' in field && field.enumConfig) {
      // 枚举类型：使用枚举名称
      const enumName = field.enumConfig.targetEnumCode?.split(':').pop() || 'String';
      fieldDef += ` ${enumName}`;
      
      // 添加可选标记
      if ('required' in field && !field.required) {
        fieldDef += `?`;
      }
    } else {
      // 获取基础类型（不包含修饰符）
      let baseType = fieldTypeMapping.prisma[fieldType];
      
      // 对于 string 类型，先移除可能的修饰符
      if (field.type === 'string') {
        baseType = 'String';
      }
      
      fieldDef += ` ${baseType}`;
      
      // 添加可选标记（在类型之后，修饰符之前）
      if ('required' in field && !field.required) {
        fieldDef += `?`;
      }
      
      // 添加修饰符（在可选标记之后）
      if (field.type === 'string' && 'length' in field && field.length) {
        fieldDef += ` @db.VarChar(${field.length})`;
      } else if (field.type === 'text') {
        fieldDef += ` @db.Text`;
      }
    }
    
    // 添加注释
    if (config.includeComments && 'description' in field && field.description) {
      fieldDef += ` // ${field.description}`;
    }
    
    model += fieldDef + '\n';
  });
  
  // 添加关联关系
  if (config.includeRelations) {
    schema.fields.forEach(field => {
      if (field.type === 'relation' && 'relationConfig' in field && field.relationConfig) {
        const relationField = field.relationConfig.targetField || 'id';
        const targetSchemaCode = field.relationConfig.targetSchemaCode;
        const targetSchema = targetSchemaCode?.split(':').pop() || '';
        
        if (field.relationConfig.multiple) {
          // 一对多或多对多关系
          model += `  ${field.name} ${targetSchema}[]\n`;
        } else {
          // 一对一或多对一关系
          model += `  ${field.name} ${targetSchema}? @relation(fields: [${field.name}Id], references: [${relationField}])\n`;
          model += `  ${field.name}Id String?\n`;
        }
      }
    });
  }
  
  model += '}\n\n';
  return model;
};

// 生成 TypeORM 实体
const generateTypeORMEntity = (schema: SchemaListItem, config: ORMConfig): string => {
  let entity = `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';\n\n`;
  entity += `@Entity('${schema.code.replace(/:/g, '_')}')\n`;
  entity += `export class ${schema.name} {\n`;
  
  // 添加字段
  schema.fields.forEach(field => {
    let fieldDef = '';
    const fieldType = field.type as keyof typeof fieldTypeMapping.typeorm;
    
    // 主键装饰器
    if ('isPrimaryKey' in field && field.isPrimaryKey) {
      if (field.type === 'uuid') {
        fieldDef += `  @PrimaryGeneratedColumn('uuid')\n`;
      } else if (field.type === 'auto_increment') {
        fieldDef += `  @PrimaryGeneratedColumn()\n`;
      }
    }
    
    // 字段装饰器
    if (!('isPrimaryKey' in field && field.isPrimaryKey)) {
      fieldDef += `  @Column({\n`;
      fieldDef += `    type: '${fieldTypeMapping.typeorm[fieldType]}',\n`;
      
      if (field.type === 'string' && 'length' in field && field.length) {
        fieldDef += `    length: ${field.length},\n`;
      }
      
      if ('required' in field && field.required) {
        fieldDef += `    nullable: false,\n`;
      } else {
        fieldDef += `    nullable: true,\n`;
      }
      
      fieldDef += `  })\n`;
    }
    
    // 字段定义
    fieldDef += `  ${field.name}: ${fieldTypeMapping.typeorm[fieldType]}`;
    
    // 添加可选标记（TypeScript 中可选字段需要添加 ?）
    if ('required' in field && !field.required) {
      fieldDef += `?`;
    }
    
    // 添加注释
    if (config.includeComments && 'description' in field && field.description) {
      fieldDef += `; // ${field.description}`;
    } else {
      fieldDef += `;`;
    }
    
    entity += fieldDef + '\n\n';
  });
  
  entity += '}\n\n';
  return entity;
};

// 生成 Sequelize 模型
const generateSequelizeModel = (schema: SchemaListItem, config: ORMConfig): string => {
  let model = `const { DataTypes } = require('sequelize');\n\n`;
  model += `module.exports = (sequelize) => {\n`;
  model += `  const ${schema.name} = sequelize.define('${schema.name}', {\n`;
  
  // 添加字段
  schema.fields.forEach(field => {
    let fieldDef = `    ${field.name}: {\n`;
    const fieldType = field.type as keyof typeof fieldTypeMapping.sequelize;
    fieldDef += `      type: DataTypes.${fieldTypeMapping.sequelize[fieldType]},\n`;
    
    if ('isPrimaryKey' in field && field.isPrimaryKey) {
      fieldDef += `      primaryKey: true,\n`;
    }
    
    if (field.type === 'uuid') {
      fieldDef += `      defaultValue: DataTypes.UUIDV4,\n`;
    } else if (field.type === 'auto_increment') {
      fieldDef += `      autoIncrement: true,\n`;
    }
    
    if (field.type === 'string' && 'length' in field && field.length) {
      fieldDef += `      length: ${field.length},\n`;
    }
    
    if ('required' in field && field.required) {
      fieldDef += `      allowNull: false,\n`;
    } else {
      fieldDef += `      allowNull: true,\n`;
    }
    
    // 添加注释
    if (config.includeComments && 'description' in field && field.description) {
      fieldDef += `      comment: '${field.description}',\n`;
    }
    
    fieldDef += `    }`;
    
    model += fieldDef + ',\n';
  });
  
  model += `  }, {\n`;
  model += `    tableName: '${schema.code.replace(/:/g, '_')}',\n`;
  model += `    timestamps: true,\n`;
  model += `  });\n\n`;
  
  // 添加关联关系
  if (config.includeRelations) {
    model += `  // 关联关系定义\n`;
    schema.fields.forEach(field => {
      if (field.type === 'relation' && 'relationConfig' in field && field.relationConfig) {
        const targetSchema = field.relationConfig.targetSchemaCode?.split(':').pop() || '';
        if (field.relationConfig.multiple) {
          model += `  ${schema.name}.hasMany(${targetSchema});\n`;
        } else {
          model += `  ${schema.name}.belongsTo(${targetSchema});\n`;
        }
      }
    });
  }
  
  model += `\n  return ${schema.name};\n`;
  model += `};\n\n`;
  return model;
};

// 生成 Mongoose Schema
const generateMongooseSchema = (schema: SchemaListItem, config: ORMConfig): string => {
  let schemaDef = `const mongoose = require('mongoose');\n\n`;
  schemaDef += `const ${schema.name}Schema = new mongoose.Schema({\n`;
  
  // 添加字段
  schema.fields.forEach(field => {
    let fieldDef = `  ${field.name}: {\n`;
    const fieldType = field.type as keyof typeof fieldTypeMapping.mongoose;
    fieldDef += `    type: ${fieldTypeMapping.mongoose[fieldType]},\n`;
    
    if ('isPrimaryKey' in field && field.isPrimaryKey) {
      fieldDef += `    _id: true,\n`;
    }
    
    if (field.type === 'string' && 'length' in field && field.length) {
      fieldDef += `    maxlength: ${field.length},\n`;
    }
    
    if ('required' in field && field.required) {
      fieldDef += `    required: true,\n`;
    }
    
    // 添加注释
    if (config.includeComments && 'description' in field && field.description) {
      fieldDef += `    description: '${field.description}',\n`;
    }
    
    fieldDef += `  }`;
    
    schemaDef += fieldDef + ',\n';
  });
  
  schemaDef += `}, {\n`;
  schemaDef += `  collection: '${schema.code.replace(/:/g, '_')}',\n`;
  schemaDef += `  timestamps: true,\n`;
  schemaDef += `});\n\n`;
  
  schemaDef += `module.exports = mongoose.model('${schema.name}', ${schema.name}Schema);\n\n`;
  return schemaDef;
};

// 生成完整的 ORM 文件
const generateORMFile = (schemas: SchemaListItem[], config: ORMConfig): string => {
  let content = '';
  
  // 添加文件头注释
  content += `// Generated ORM file for ${config.framework}\n`;
  content += `// Generated at: ${new Date().toISOString()}\n`;
  content += `// Total schemas: ${schemas.length}\n\n`;
  
  // 根据框架生成不同的内容
  switch (config.framework) {
    case 'prisma':
      content += `// Prisma schema file\n\n`;
      content += `generator client {\n`;
      content += `  provider = "prisma-client-js"\n`;
      content += `}\n\n`;
      content += `datasource db {\n`;
      content += `  provider = "postgresql"\n`;
      content += `  url      = env("DATABASE_URL")\n`;
      content += `}\n\n`;
      
      // 收集所有枚举类型
      const enumTypes = new Set<string>();
      schemas.forEach(schema => {
        schema.fields.forEach(field => {
          if (field.type === 'enum' && 'enumConfig' in field && field.enumConfig?.targetEnumCode) {
            const enumName = field.enumConfig.targetEnumCode.split(':').pop() || '';
            if (enumName) {
              enumTypes.add(enumName);
            }
          }
        });
      });
      
      // 生成枚举定义（这里需要从外部传入枚举数据，暂时使用占位符）
      if (enumTypes.size > 0) {
        content += `// 枚举定义\n`;
        enumTypes.forEach(enumName => {
          content += `enum ${enumName} {\n`;
          content += `  // TODO: 添加枚举值，需要从枚举管理模块获取\n`;
          content += `  // 示例: VALUE1\n`;
          content += `  // 示例: VALUE2\n`;
          content += `}\n\n`;
        });
      }
      
      // 生成模型
      schemas.forEach(schema => {
        content += generatePrismaModel(schema, config);
      });
      break;
      
    case 'typeorm':
      content += `// TypeORM entities\n\n`;
      schemas.forEach(schema => {
        content += generateTypeORMEntity(schema, config);
      });
      break;
      
    case 'sequelize':
      content += `// Sequelize models\n\n`;
      schemas.forEach(schema => {
        content += generateSequelizeModel(schema, config);
      });
      break;
      
    case 'mongoose':
      content += `// Mongoose schemas\n\n`;
      schemas.forEach(schema => {
        content += generateMongooseSchema(schema, config);
      });
      break;
  }
  
  return content;
};

// 下载文件
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 主函数：处理 ORM 文件下载
export const handleDownloadORM = async (
  selectedSchemas: SchemaListItem[],
  allSchemas: SchemaListItem[],
  enums?: API.Enum[]
): Promise<void> => {
  try {
    if (selectedSchemas.length === 0) {
      message.warning('请选择要导出的数据表');
      return;
    }

    // 默认配置
    const config: ORMConfig = {
      framework: 'prisma',
      language: 'typescript',
      includeRelations: true,
      includeValidations: true,
      includeComments: true
    };

    // 生成文件内容
    const content = generateORMFileWithEnums(selectedSchemas, config, enums);
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `orm_models_${timestamp}.${config.framework === 'prisma' ? 'prisma' : 'ts'}`;
    
    // 下载文件
    downloadFile(content, filename);
    
    message.success(`成功导出 ${selectedSchemas.length} 个数据表的 ORM 文件`);
    
  } catch (error) {
    console.error('导出 ORM 文件失败:', error);
    message.error('导出失败，请重试');
  }
};

// 生成包含枚举定义的完整 ORM 文件
const generateORMFileWithEnums = (schemas: SchemaListItem[], config: ORMConfig, enums?: API.Enum[]): string => {
  let content = '';
  
  // 添加文件头注释
  content += `// Generated ORM file for ${config.framework}\n`;
  content += `// Generated at: ${new Date().toISOString()}\n`;
  content += `// Total schemas: ${schemas.length}\n\n`;
  
  // 根据框架生成不同的内容
  switch (config.framework) {
    case 'prisma':
      content += `// Prisma schema file\n\n`;
      content += `generator client {\n`;
      content += `  provider = "prisma-client-js"\n`;
      content += `}\n\n`;
      content += `datasource db {\n`;
      content += `  provider = "postgresql"\n`;
      content += `  url      = env("DATABASE_URL")\n`;
      content += `}\n\n`;
      
      // 收集所有枚举类型
      const enumTypes = new Set<string>();
      schemas.forEach(schema => {
        schema.fields.forEach(field => {
          if (field.type === 'enum' && 'enumConfig' in field && field.enumConfig?.targetEnumCode) {
            const enumName = field.enumConfig.targetEnumCode.split(':').pop() || '';
            if (enumName) {
              enumTypes.add(enumName);
            }
          }
        });
      });
      
      // 生成枚举定义
      if (enumTypes.size > 0 && enums) {
        content += `// 枚举定义\n`;
        enumTypes.forEach(enumName => {
          const enumData = enums.find(e => e.code.split(':').pop() === enumName);
          if (enumData && enumData.options) {
            content += `enum ${enumName} {\n`;
            enumData.options.forEach(option => {
              content += `  ${option.value}\n`;
            });
            content += `}\n\n`;
          } else {
            content += `enum ${enumName} {\n`;
            content += `  // TODO: 添加枚举值，未找到对应的枚举数据\n`;
            content += `}\n\n`;
          }
        });
      }
      
      // 生成模型
      schemas.forEach(schema => {
        content += generatePrismaModel(schema, config);
      });
      break;
      
    case 'typeorm':
      content += `// TypeORM entities\n\n`;
      schemas.forEach(schema => {
        content += generateTypeORMEntity(schema, config);
      });
      break;
      
    case 'sequelize':
      content += `// Sequelize models\n\n`;
      schemas.forEach(schema => {
        content += generateSequelizeModel(schema, config);
      });
      break;
      
    case 'mongoose':
      content += `// Mongoose schemas\n\n`;
      schemas.forEach(schema => {
        content += generateMongooseSchema(schema, config);
      });
      break;
  }
  
  return content;
};

// 导出配置接口，供外部使用
export type { ORMConfig };

// 测试函数：验证生成的 Prisma 语法
export const testPrismaGeneration = () => {
  const testSchema: SchemaListItem = {
    id: '1',
    name: 'ProductionPlan',
    code: 'system:production_plan',
    description: '生产计划表',
    fields: [
      {
        id: '1',
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        required: true
      } as API.UuidField,
      {
        id: '2',
        name: 'name',
        type: 'string',
        length: 100,
        required: true,
        description: '计划名称'
      } as API.StringField,
      {
        id: '3',
        name: 'remark',
        type: 'text',
        required: false,
        description: '备注'
      } as API.TextField,
      {
        id: '4',
        name: 'device_type',
        type: 'enum',
        required: true,
        description: '设备类型',
        enumConfig: {
          targetEnumCode: 'system:device_type',
          multiple: false
        }
      } as API.EnumField,
      {
        id: '5',
        name: 'product',
        type: 'relation',
        required: true,
        description: '关联产品',
        relationConfig: {
          targetSchemaCode: 'system:product',
          targetField: 'id',
          multiple: false,
          cascadeDelete: 'restrict'
        }
      } as API.RelationField
    ]
  };

  const testEnums: API.Enum[] = [
    {
      id: '1',
      name: '设备类型',
      code: 'system:device_type',
      description: '设备类型枚举',
      options: [
        { value: 'MACHINE', label: '机器设备' },
        { value: 'TOOL', label: '工具设备' },
        { value: 'INSTRUMENT', label: '仪器设备' }
      ]
    }
  ];

  const config: ORMConfig = {
    framework: 'prisma',
    language: 'typescript',
    includeRelations: true,
    includeValidations: true,
    includeComments: true
  };

  const result = generateORMFileWithEnums([testSchema], config, testEnums);
  console.log('Generated Prisma model:');
  console.log(result);
  
  return result;
}; 