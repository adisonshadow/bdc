import { DatabaseExecutor } from './databaseExecutor';
import { DatabaseConnection } from '../models/DatabaseConnection';
import { Enum } from '../models/Enum';
import { getDataSource } from '../data-source';
import { In } from 'typeorm';

export interface EnumMaterializeResult {
  success: boolean;
  message: string;
  enumCode?: string;
  error?: string;
}

export class EnumMaterializeService {
  private databaseExecutor: DatabaseExecutor;

  constructor() {
    this.databaseExecutor = new DatabaseExecutor();
  }

  /**
   * 检查目标数据库中是否存在枚举表，如果不存在则创建
   */
  async ensureEnumTableExists(connection: DatabaseConnection, targetSchema: string): Promise<boolean> {
    try {
      const connectResult = await this.databaseExecutor.connect(connection);
      if (!connectResult.success) {
        throw new Error(`数据库连接失败: ${connectResult.error}`);
      }

      // 检查枚举表是否存在
      const checkTableSQL = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = '${targetSchema}' 
          AND table_name = 'enums'
        ) as table_exists;
      `;

      const checkResult = await this.databaseExecutor.executeSQL(checkTableSQL);
      if (!checkResult.success) {
        throw new Error(`检查枚举表失败: ${checkResult.error}`);
      }

      const tableExists = checkResult.data?.rows?.[0]?.table_exists;
      
      if (!tableExists) {
        // 创建枚举表
        const createTableSQL = this.generateEnumTableSQL(targetSchema, connection.type);
        const createResult = await this.databaseExecutor.executeSQL(createTableSQL);
        
        if (!createResult.success) {
          throw new Error(`创建枚举表失败: ${createResult.error}`);
        }
        
        console.log(`在 schema ${targetSchema} 中创建了枚举表`);
        return true;
      }

      return true;
    } catch (error) {
      console.error('确保枚举表存在失败:', error);
      throw error;
    }
  }

  /**
   * 生成枚举表创建SQL
   */
  private generateEnumTableSQL(schema: string, databaseType: string): string {
    switch (databaseType.toLowerCase()) {
      case 'postgresql':
        return `
          CREATE TABLE IF NOT EXISTS ${schema}.enums (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(100),
            options JSONB NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_enums_code ON ${schema}.enums(code);
          CREATE INDEX IF NOT EXISTS idx_enums_name ON ${schema}.enums(name);
          CREATE INDEX IF NOT EXISTS idx_enums_is_active ON ${schema}.enums(is_active);
          
          COMMENT ON TABLE ${schema}.enums IS '枚举定义表';
          COMMENT ON COLUMN ${schema}.enums.id IS '枚举ID（系统自动生成）';
          COMMENT ON COLUMN ${schema}.enums.code IS '枚举代码（唯一标识）';
          COMMENT ON COLUMN ${schema}.enums.name IS '枚举名称';
          COMMENT ON COLUMN ${schema}.enums.description IS '枚举描述';
          COMMENT ON COLUMN ${schema}.enums.options IS '枚举选项列表（JSON格式）';
          COMMENT ON COLUMN ${schema}.enums.is_active IS '是否激活';
          COMMENT ON COLUMN ${schema}.enums.created_at IS '创建时间';
          COMMENT ON COLUMN ${schema}.enums.updated_at IS '更新时间';
        `;
        
      case 'mysql':
        return `
          CREATE TABLE IF NOT EXISTS ${schema}.enums (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            code VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(100),
            options JSON NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_enums_code (code),
            INDEX idx_enums_name (name),
            INDEX idx_enums_is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
      case 'oracle':
        return `
          CREATE TABLE ${schema}.enums (
            id RAW(16) PRIMARY KEY DEFAULT SYS_GUID(),
            code VARCHAR2(100) NOT NULL UNIQUE,
            name VARCHAR2(100) NOT NULL,
            description VARCHAR2(100),
            options CLOB NOT NULL,
            is_active NUMBER(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX idx_enums_code ON ${schema}.enums(code);
          CREATE INDEX idx_enums_name ON ${schema}.enums(name);
          CREATE INDEX idx_enums_is_active ON ${schema}.enums(is_active);
        `;
        
      case 'sqlserver':
        return `
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='enums' AND xtype='U')
          CREATE TABLE ${schema}.enums (
            id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            code NVARCHAR(100) NOT NULL UNIQUE,
            name NVARCHAR(100) NOT NULL,
            description NVARCHAR(100),
            options NVARCHAR(MAX) NOT NULL,
            is_active BIT NOT NULL DEFAULT 1,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
          );
          
          IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_enums_code')
            CREATE INDEX idx_enums_code ON ${schema}.enums(code);
          IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_enums_name')
            CREATE INDEX idx_enums_name ON ${schema}.enums(name);
          IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_enums_is_active')
            CREATE INDEX idx_enums_is_active ON ${schema}.enums(is_active);
        `;
        
      default:
        // 默认使用 PostgreSQL 语法
        return `
          CREATE TABLE IF NOT EXISTS ${schema}.enums (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(100),
            options JSONB NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_enums_code ON ${schema}.enums(code);
          CREATE INDEX IF NOT EXISTS idx_enums_name ON ${schema}.enums(name);
          CREATE INDEX IF NOT EXISTS idx_enums_is_active ON ${schema}.enums(is_active);
        `;
    }
  }

  /**
   * 检查枚举是否已存在于目标数据库中
   */
  async checkEnumExists(connection: DatabaseConnection, targetSchema: string, enumCode: string): Promise<boolean> {
    try {
      const checkSQL = `
        SELECT COUNT(*) as count 
        FROM ${targetSchema}.enums 
        WHERE code = '${enumCode}'
      `;

      const result = await this.databaseExecutor.executeSQL(checkSQL);
      if (!result.success) {
        throw new Error(`检查枚举存在失败: ${result.error}`);
      }

      return result.data?.rows?.[0]?.count > 0;
    } catch (error) {
      console.error('检查枚举存在失败:', error);
      return false;
    }
  }

  /**
   * 插入枚举到目标数据库
   */
  async insertEnum(connection: DatabaseConnection, targetSchema: string, enumData: Enum): Promise<EnumMaterializeResult> {
    try {
      // 检查枚举是否已存在
      const exists = await this.checkEnumExists(connection, targetSchema, enumData.code);
      if (exists) {
        return {
          success: true,
          message: `枚举 ${enumData.code} 已存在，跳过插入`,
          enumCode: enumData.code
        };
      }

      // 准备插入数据
      const insertData = {
        code: enumData.code,
        name: enumData.name,
        description: enumData.description || null,
        options: JSON.stringify(enumData.options),
        is_active: enumData.isActive
      };

      // 生成插入SQL
      const insertSQL = this.generateInsertEnumSQL(targetSchema, insertData, connection.type);
      
      const result = await this.databaseExecutor.executeSQL(insertSQL);
      if (!result.success) {
        throw new Error(`插入枚举失败: ${result.error}`);
      }

      return {
        success: true,
        message: `枚举 ${enumData.code} 插入成功`,
        enumCode: enumData.code
      };
    } catch (error) {
      console.error('插入枚举失败:', error);
      return {
        success: false,
        message: `插入枚举 ${enumData.code} 失败`,
        enumCode: enumData.code,
        error: error.message
      };
    }
  }

  /**
   * 生成插入枚举的SQL
   */
  private generateInsertEnumSQL(schema: string, data: any, databaseType: string): string {
    switch (databaseType.toLowerCase()) {
      case 'postgresql':
        return `
          INSERT INTO ${schema}.enums (code, name, description, options, is_active)
          VALUES (
            '${data.code}',
            '${data.name}',
            ${data.description ? `'${data.description}'` : 'NULL'},
            '${data.options}'::jsonb,
            ${data.is_active}
          );
        `;
        
      case 'mysql':
        return `
          INSERT INTO ${schema}.enums (code, name, description, options, is_active)
          VALUES (
            '${data.code}',
            '${data.name}',
            ${data.description ? `'${data.description}'` : 'NULL'},
            '${data.options}',
            ${data.is_active ? 1 : 0}
          );
        `;
        
      case 'oracle':
        return `
          INSERT INTO ${schema}.enums (code, name, description, options, is_active)
          VALUES (
            '${data.code}',
            '${data.name}',
            ${data.description ? `'${data.description}'` : 'NULL'},
            '${data.options}',
            ${data.is_active ? 1 : 0}
          );
        `;
        
      case 'sqlserver':
        return `
          INSERT INTO ${schema}.enums (code, name, description, options, is_active)
          VALUES (
            '${data.code}',
            '${data.name}',
            ${data.description ? `'${data.description}'` : 'NULL'},
            '${data.options}',
            ${data.is_active ? 1 : 0}
          );
        `;
        
      default:
        // 默认使用 PostgreSQL 语法
        return `
          INSERT INTO ${schema}.enums (code, name, description, options, is_active)
          VALUES (
            '${data.code}',
            '${data.name}',
            ${data.description ? `'${data.description}'` : 'NULL'},
            '${data.options}'::jsonb,
            ${data.is_active}
          );
        `;
    }
  }

  /**
   * 获取字段中引用的枚举
   */
  async getReferencedEnums(schemaCodes: string[]): Promise<Enum[]> {
    try {
      const dataSource = getDataSource();
      const dataStructureRepository = dataSource.getRepository('DataStructure');
      const enumRepository = dataSource.getRepository(Enum);

      // 获取数据结构
      const dataStructures = await dataStructureRepository.find({
        where: { code: In(schemaCodes) }
      });

      const enumCodes = new Set<string>();

      // 从字段中提取枚举代码
      dataStructures.forEach(structure => {
        if (structure.fields) {
          structure.fields.forEach((field: any) => {
            if (field.type === 'enum' && field.enumCode) {
              enumCodes.add(field.enumCode);
            }
          });
        }
      });

      // 获取枚举数据
      if (enumCodes.size > 0) {
        const enums = await enumRepository.find({
          where: { code: In(Array.from(enumCodes)) }
        });
        return enums;
      }

      return [];
    } catch (error) {
      console.error('获取引用枚举失败:', error);
      return [];
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    await this.databaseExecutor.disconnect();
  }
} 