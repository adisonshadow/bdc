import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { ApiDefinition } from '../models/ApiDefinition';
import { ValidationError, NotFoundError } from '../errors/types';
import { Logger } from '../utils/logger';
import { DatabaseConnection } from '../models/DatabaseConnection';

// 创建 API 定义
export const createApiDefinition = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  const databaseConnectionRepository = getDataSource().getRepository(DatabaseConnection);
  try {
    const {
      code,
      name,
      description,
      method,
      path,
      queryParams,
      requestBody,
      responseSchema,
      dataSourceId,
      sqlQuery,
      sqlParams
    } = req.body;

    // 基本字段验证
    if (!code || !name || !method || !path || !dataSourceId || !sqlQuery) {
      throw new ValidationError('代码、名称、方法、路径、数据源ID和SQL查询是必填项');
    }

    // 验证数据源是否存在
    const dataSource = await databaseConnectionRepository.findOne({ where: { id: dataSourceId } });
    if (!dataSource) {
      throw new ValidationError('指定的数据源不存在');
    }

    // 创建 API 定义实例
    const apiDefinition = apiDefinitionRepository.create({
      code,
      name,
      description,
      method,
      path,
      queryParams,
      requestBody,
      responseSchema,
      dataSourceId,
      sqlQuery,
      sqlParams,
      isActive: true,
      createdBy: req.user?.username
    });

    // 验证格式
    if (!apiDefinition.validate()) {
      throw new ValidationError('API 定义格式不正确');
    }

    // 验证代码唯一性
    const existing = await apiDefinitionRepository.findOne({ where: { code } });
    if (existing) {
      throw new ValidationError('该代码的 API 定义已存在');
    }

    // 保存 API 定义
    await apiDefinitionRepository.save(apiDefinition);
    Logger.info({ message: '创建 API 定义', code });
    res.status(201).json(apiDefinition);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '创建 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 获取所有 API 定义
export const getAllApiDefinitions = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  try {
    const { isActive, code, name, method, dataSourceId } = req.query;
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (code) {
      where.code = code;
    }
    if (name) {
      where.name = name;
    }
    if (method) {
      where.method = method;
    }
    if (dataSourceId) {
      where.dataSourceId = dataSourceId;
    }

    const apiDefinitions = await apiDefinitionRepository.find({
      where,
      relations: ['dataSource'],
      order: {
        createdAt: 'DESC'
      }
    });
    res.json(apiDefinitions);
  } catch (error) {
    Logger.error({ message: '获取 API 定义列表失败', error });
    res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
  }
};

// 根据 ID 获取 API 定义
export const getApiDefinitionById = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  try {
    const { id } = req.params;
    const apiDefinition = await apiDefinitionRepository.findOne({
      where: { id },
      relations: ['dataSource']
    });
    if (!apiDefinition) {
      throw new NotFoundError(`ID为 ${id} 的 API 定义不存在`);
    }
    res.json(apiDefinition);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 根据代码获取 API 定义
export const getApiDefinitionByCode = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  try {
    const { code } = req.params;
    const apiDefinition = await apiDefinitionRepository.findOne({
      where: { code },
      relations: ['dataSource']
    });
    if (!apiDefinition) {
      throw new NotFoundError(`代码为 ${code} 的 API 定义不存在`);
    }
    res.json(apiDefinition);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 更新 API 定义
export const updateApiDefinition = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  const databaseConnectionRepository = getDataSource().getRepository(DatabaseConnection);
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      method,
      path,
      queryParams,
      requestBody,
      responseSchema,
      dataSourceId,
      sqlQuery,
      sqlParams,
      isActive
    } = req.body;

    // 查找现有 API 定义
    const existing = await apiDefinitionRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`ID为 ${id} 的 API 定义不存在`);
    }

    // 如果更新数据源，验证数据源是否存在
    if (dataSourceId && dataSourceId !== existing.dataSourceId) {
      const dataSource = await databaseConnectionRepository.findOne({ where: { id: dataSourceId } });
      if (!dataSource) {
        throw new ValidationError('指定的数据源不存在');
      }
    }

    // 更新字段
    const apiDefinition = apiDefinitionRepository.create({
      ...existing,
      code: code || existing.code,
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      method: method || existing.method,
      path: path || existing.path,
      queryParams: queryParams || existing.queryParams,
      requestBody: requestBody || existing.requestBody,
      responseSchema: responseSchema || existing.responseSchema,
      dataSourceId: dataSourceId || existing.dataSourceId,
      sqlQuery: sqlQuery || existing.sqlQuery,
      sqlParams: sqlParams || existing.sqlParams,
      isActive: isActive !== undefined ? isActive : existing.isActive,
      updatedBy: req.user?.username
    });

    // 验证格式
    if (!apiDefinition.validate()) {
      throw new ValidationError('API 定义格式不正确');
    }

    // 验证代码唯一性
    if (code && code !== existing.code) {
      const codeExists = await apiDefinitionRepository.findOne({ where: { code } });
      if (codeExists) {
        throw new ValidationError('该代码的 API 定义已存在');
      }
    }

    // 保存更新
    const updated = await apiDefinitionRepository.save(apiDefinition);
    Logger.info({ message: '更新 API 定义', code: updated.code });
    res.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '更新 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 删除 API 定义
export const deleteApiDefinition = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  try {
    const { id } = req.params;
    const apiDefinition = await apiDefinitionRepository.findOne({ where: { id } });
    if (!apiDefinition) {
      throw new NotFoundError(`ID为 ${id} 的 API 定义不存在`);
    }

    // 删除 API 定义
    await apiDefinitionRepository.remove(apiDefinition);
    Logger.info({ message: '删除 API 定义', code: apiDefinition.code });
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '删除 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 验证 API 定义
export const validateApiDefinition = async (req: Request, res: Response) => {
  const apiDefinitionRepository = getDataSource().getRepository(ApiDefinition);
  try {
    const {
      code,
      name,
      method,
      path,
      queryParams,
      requestBody,
      responseSchema,
      sqlParams
    } = req.body;

    // 创建临时实例进行验证
    const apiDefinition = apiDefinitionRepository.create({
      code,
      name,
      method,
      path,
      queryParams,
      requestBody,
      responseSchema,
      sqlParams
    });

    // 验证格式
    if (!apiDefinition.validate()) {
      throw new ValidationError('API 定义格式不正确');
    }

    res.json({ valid: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '验证 API 定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
}; 