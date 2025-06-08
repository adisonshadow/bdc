import { DataSource } from 'typeorm';
import { DataStructure } from '../models/DataStructure';
import dotenv from 'dotenv';
import path from 'path';

// 根据NODE_ENV加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  username: process.env.DB_USER || 'yoyo',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'fyMOM',
  schema: process.env.DB_SCHEMA || 'bdc',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [DataStructure],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
}); 