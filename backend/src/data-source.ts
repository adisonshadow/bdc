import { DataSource } from 'typeorm';
import { DatabaseConnection } from './models/DatabaseConnection';
import { DataStructure } from './models/DataStructure';
import { ApiDefinition } from './models/ApiDefinition';
import { Enum } from './models/Enum';
import { MaterializeHistory } from './models/MaterializeHistory';
import { AiConfig } from './models/AiConfig';

let AppDataSource: DataSource;

export const createDataSource = (): DataSource => {
  if (!AppDataSource) {
    AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '15432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'bdc',
      schema: process.env.DB_SCHEMA || 'bdc',
      synchronize: false, // 暂时禁用，因为表已经存在
      logging: process.env.NODE_ENV !== 'production',
      entities: [DatabaseConnection, DataStructure, ApiDefinition, Enum, MaterializeHistory, AiConfig],
      // migrations: ['src/migrations/*.ts'], // 完全禁用迁移功能
      subscribers: ['src/subscribers/*.ts'],
      extra: {
        search_path: 'bdc',
        options: '-c search_path=bdc'
      }
    });
  }
  return AppDataSource;
};

export const getDataSource = (): DataSource => {
  if (!AppDataSource) {
    throw new Error('DataSource not initialized. Call createDataSource() first.');
  }
  return AppDataSource;
}; 