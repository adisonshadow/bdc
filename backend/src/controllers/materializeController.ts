import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { DatabaseConnection } from '../models/DatabaseConnection';
import { DataStructure } from '../models/DataStructure';
import { MaterializeHistory } from '../models/MaterializeHistory';
import { generateCreateTableSQL } from '../services/sqlGenerator';
import { DatabaseExecutor } from '../services/databaseExecutor';
import { In } from 'typeorm';

export const materializeTables = async (req: Request, res: Response): Promise<void> => {
  console.log('=== 开始物化表结构 ===');
  
  const databaseExecutor = new DatabaseExecutor();
  
  try {
    const { connectionId, schemaCodes, config } = req.body;
    
    console.log('请求参数:', { connectionId, schemaCodes, config });
    
    // 验证请求参数
    if (!connectionId || !schemaCodes || !Array.isArray(schemaCodes)) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数：connectionId 和 schemaCodes'
      });
      return;
    }

    const dataSource = getDataSource();
    const connectionRepository = dataSource.getRepository(DatabaseConnection);
    const dataStructureRepository = dataSource.getRepository(DataStructure);
    const materializeHistoryRepository = dataSource.getRepository(MaterializeHistory);

    // 获取数据库连接
    const connection = await connectionRepository.findOne({
      where: { id: connectionId }
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        message: '数据库连接不存在'
      });
      return;
    }

    // 获取表结构定义
    const dataStructures = await dataStructureRepository.find({
      where: { code: In(schemaCodes) }
    });

    if (dataStructures.length === 0) {
      res.status(404).json({
        success: false,
        message: '未找到指定的表结构定义'
      });
      return;
    }

    // 创建物化历史记录
    const materializeHistory = materializeHistoryRepository.create({
      connectionId,
      connectionName: connection.name,
      schemaCodes,
      config: config || {},
      status: 'pending',
      results: []
    });

    await materializeHistoryRepository.save(materializeHistory);

    const results = [];

    try {
      // 连接到目标数据库
      const connectResult = await databaseExecutor.connect(connection);
      if (!connectResult.success) {
        throw new Error(`数据库连接失败: ${connectResult.error}`);
      }

      // 为每个表结构生成SQL并执行
      for (const dataStructure of dataStructures) {
        try {
          const tableName = `${config?.tablePrefix || ''}${dataStructure.name}`;
          const targetSchema = config?.targetSchema || connection.schema || 'public';
          
          console.log('表结构信息:', {
            schemaCode: dataStructure.code,
            tableName: tableName,
            targetSchema: targetSchema,
            dataStructureName: dataStructure.name,
            tablePrefix: config?.tablePrefix,
            keyIndexes: dataStructure.keyIndexes,
            fields: dataStructure.fields?.map(f => ({ name: f.name, type: f.type }))
          });
          
          // 如果需要覆盖表，先删除已存在的表
          if (config?.overwrite) {
                      // 检查表是否存在（检查所有模式）
          const checkTableSQL = `SELECT 
            table_schema,
            table_name,
            EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = '${targetSchema}' 
              AND table_name = '${tableName}'
            ) as exists_in_target_schema,
            EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = '${tableName}'
            ) as exists_anywhere
          FROM information_schema.tables 
          WHERE table_name = '${tableName}'
          LIMIT 1;`;
            
            console.log('检查表是否存在SQL:', checkTableSQL);
            const checkResult = await databaseExecutor.executeSQL(checkTableSQL);
            console.log('检查表存在结果:', checkResult);
            
            if (checkResult.success && checkResult.data?.rows?.length > 0) {
              const tableInfo = checkResult.data.rows[0];
              console.log('表存在信息:', tableInfo);
              
              if (tableInfo.exists_anywhere) {
                console.log(`表 ${tableName} 存在于模式 ${tableInfo.table_schema}，准备删除`);
                
                // 删除表（不指定模式，让数据库自动找到）
                const dropTableSQL = `DROP TABLE IF EXISTS ${tableInfo.table_schema}.${tableName} CASCADE;`;
                console.log('执行删除表SQL:', dropTableSQL);
                const dropResult = await databaseExecutor.executeSQL(dropTableSQL);
                console.log('删除表结果:', dropResult);
                
                if (!dropResult.success) {
                  console.warn('删除表失败，但继续执行:', dropResult.error);
                } else {
                  console.log(`表 ${tableInfo.table_schema}.${tableName} 删除成功`);
                }
              } else {
                console.log(`表 ${tableName} 不存在，跳过删除`);
              }
            } else {
              console.log(`表 ${tableName} 不存在，跳过删除`);
            }
          }
          
          // 生成创建表的SQL
          const createTableSQL = generateCreateTableSQL(
            dataStructure,
            tableName,
            targetSchema,
            {
              ...config,
              databaseType: connection.type
            }
          );
          
          console.log('执行创建表SQL:', createTableSQL);
          // 执行SQL到目标数据库
          const executeResult = await databaseExecutor.executeSQL(createTableSQL);
          
          if (executeResult.success) {
            results.push({
              schemaCode: dataStructure.code,
              success: true,
              message: `表 ${tableName} 创建成功`,
              tableName: `${targetSchema}.${tableName}`
            });
          } else {
            results.push({
              schemaCode: dataStructure.code,
              success: false,
              message: `表创建失败: ${executeResult.error}`,
              error: executeResult.error
            });
          }

        } catch (error) {
          results.push({
            schemaCode: dataStructure.code,
            success: false,
            message: `表创建失败: ${error.message}`,
            error: error.message
          });
        }
      }

      // 更新物化历史记录
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      materializeHistory.status = failCount === 0 ? 'success' : 'failed';
      materializeHistory.results = results;
      materializeHistory.completedAt = new Date();
      
      await materializeHistoryRepository.save(materializeHistory);

      res.json({
        success: true,
        message: `成功物化 ${successCount} 个表${failCount > 0 ? `，失败 ${failCount} 个表` : ''}`,
        results
      });

    } catch (error) {
      // 更新物化历史记录为失败状态
      materializeHistory.status = 'failed';
      materializeHistory.results = [{
        schemaCode: 'general',
        success: false,
        message: `物化过程失败: ${error.message}`,
        error: error.message
      }];
      materializeHistory.completedAt = new Date();
      
      await materializeHistoryRepository.save(materializeHistory);

      throw error;
    } finally {
      // 确保断开数据库连接
      await databaseExecutor.disconnect();
    }

  } catch (error) {
    console.error('表物化失败:', error);
    res.status(500).json({
      success: false,
      message: `表物化失败: ${error.message}`
    });
  }
};

export const getMaterializeHistory = async (req: Request, res: Response) => {
  try {
    const { connectionId, page = 1, limit = 10 } = req.query;
    const dataSource = getDataSource();
    const materializeHistoryRepository = dataSource.getRepository(MaterializeHistory);

    const queryBuilder = materializeHistoryRepository.createQueryBuilder('history');

    if (connectionId) {
      queryBuilder.where('history.connectionId = :connectionId', { connectionId });
    }

    const [items, total] = await queryBuilder
      .orderBy('history.createdAt', 'DESC')
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error('获取物化历史失败:', error);
    res.status(500).json({
      success: false,
      message: `获取物化历史失败: ${error.message}`
    });
  }
}; 