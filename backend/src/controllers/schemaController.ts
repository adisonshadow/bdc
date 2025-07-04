import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { DataStructure, Field } from '../models/DataStructure';
import { ValidationError, NotFoundError, ValidationWarning } from '../errors/types';
import { Logger } from '../utils/logger';
import { FieldValidator } from '../utils/fieldValidator';
import { v4 as uuidv4 } from 'uuid';

// 创建数据结构
export const createSchema = async (req: Request, res: Response) => {
  const dataStructureRepository = getDataSource().getRepository(DataStructure);
  try {
    const { name, code, fields = [], description, keyIndexes } = req.body;
    
    // 验证基本参数
    if (!name || !code) {
      throw new ValidationError('名称和代码是必填项');
    }

    // 验证格式
    if (!code.match(/^[a-zA-Z][a-zA-Z0-9_:]*$/)) {
      throw new ValidationError('代码格式不正确，必须以字母开头，只能包含字母、数字、下划线和冒号');
    }

    if (!name.match(/^[a-z][a-z0-9_]*$/)) {
      throw new ValidationError('名称格式不正确，必须以小写字母开头，只能包含小写字母、数字和下划线');
    }

    // 检查名称和代码是否已存在
    const existingByName = await dataStructureRepository.findOne({ where: { name } });
    if (existingByName) {
      throw new ValidationError('该名称的数据结构已存在');
    }

    const existingByCode = await dataStructureRepository.findOne({ where: { code } });
    if (existingByCode) {
      throw new ValidationError('该代码的数据结构已存在');
    }

    // 为每个字段生成 ID
    const fieldsWithIds = fields.map((field: Partial<Field>) => ({
      ...field,
      id: field.id || uuidv4()
    }));

    // 验证字段定义
    FieldValidator.validateFields(fieldsWithIds);

    // 检查主键配置
    let warning = null;
    const hasPrimaryKey = keyIndexes?.primaryKey && keyIndexes.primaryKey.length > 0;
    if (!hasPrimaryKey) {
      warning = new ValidationWarning('建议在keyIndexes中配置主键字段');
    }

    // 创建数据结构
    const dataStructure = dataStructureRepository.create({
      name,
      code,
      fields: fieldsWithIds,
      description,
      keyIndexes,
      version: 1,
      isActive: true
    });

    await dataStructureRepository.save(dataStructure);
    Logger.info({ message: '创建数据结构', name, code });

    // 如果有警告，返回警告信息
    if (warning) {
      res.status(201).json({
        data: dataStructure,
        warning: {
          message: warning.message,
          code: warning.code
        }
      });
    } else {
      res.status(201).json(dataStructure);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '创建数据结构失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 获取所有数据结构
export const getAllSchemas = async (req: Request, res: Response) => {
  const dataStructureRepository = getDataSource().getRepository(DataStructure);
  try {
    const { isActive } = req.query;
    console.log('查询参数:', { isActive });
    
    // 使用简单的 find 方法
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    console.log('查询条件:', where);
    
    console.log('开始查询数据库...');
    const schemas = await dataStructureRepository.find({
      where,
      select: ['id', 'code', 'name', 'fields', 'description', 'isActive', 'version', 'createdAt', 'updatedAt', 'keyIndexes'],
      order: { createdAt: 'DESC' }
    });
    console.log('查询结果数量:', schemas.length);
    
    res.json(schemas);
  } catch (error) {
    console.error('获取数据结构列表详细错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : '未知错误');
    Logger.error({ message: '获取数据结构列表失败', error });
    res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
  }
};

// 根据ID获取数据结构
export const getSchemaById = async (req: Request, res: Response) => {
  const dataStructureRepository = getDataSource().getRepository(DataStructure);
  try {
    const { id } = req.params;
    const schema = await dataStructureRepository.findOne({ where: { id } });
    if (!schema) {
      throw new NotFoundError(`ID为 ${id} 的数据结构不存在`);
    }
    res.json(schema);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取数据结构失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 更新数据结构
export const updateSchema = async (req: Request, res: Response) => {
  const dataStructureRepository = getDataSource().getRepository(DataStructure);
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      fields, 
      description, 
      isActive,
      keyIndexes,
      physicalStorage,
      validationErrors 
    } = req.body;

    // 查找现有数据结构
    const schema = await dataStructureRepository.findOne({ where: { id } });
    if (!schema) {
      throw new NotFoundError(`ID为 ${id} 的数据结构不存在`);
    }

    // 验证格式
    if (code && !code.match(/^[a-zA-Z][a-zA-Z0-9_:]*$/)) {
      throw new ValidationError('代码格式不正确，必须以字母开头，只能包含字母、数字、下划线和冒号');
    }

    if (name && !name.match(/^[a-z][a-z0-9_]*$/)) {
      throw new ValidationError('名称格式不正确，必须以小写字母开头，只能包含小写字母、数字和下划线');
    }

    // 如果更新名称，检查是否与其他数据结构重名
    if (name && name !== schema.name) {
      const existing = await dataStructureRepository.findOne({ where: { name } });
      if (existing) {
        throw new ValidationError('该名称的数据结构已存在');
      }
    }

    // 如果更新代码，检查是否与其他数据结构重复
    if (code && code !== schema.code) {
      const existing = await dataStructureRepository.findOne({ where: { code } });
      if (existing) {
        throw new ValidationError('该代码的数据结构已存在');
      }
    }

    // 如果更新字段定义，验证字段
    let warning = null;
    let updatedKeyIndexes = keyIndexes || schema.keyIndexes;
    
    if (fields) {
      // 为每个字段生成 ID
      const fieldsWithIds = fields.map((field: Partial<Field>) => ({
        ...field,
        id: field.id || uuidv4()
      }));

      // 验证字段定义
      FieldValidator.validateFields(fieldsWithIds);
    }

    // 检查主键配置
    const hasPrimaryKey = updatedKeyIndexes?.primaryKey && updatedKeyIndexes.primaryKey.length > 0;
    if (!hasPrimaryKey) {
      warning = new ValidationWarning('建议在keyIndexes中配置主键字段');
    }

    // 更新数据结构
    const updateData: Partial<DataStructure> = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (fields !== undefined) updateData.fields = fields;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (updatedKeyIndexes !== undefined) updateData.keyIndexes = updatedKeyIndexes;
    if (physicalStorage !== undefined) updateData.physicalStorage = physicalStorage;
    if (validationErrors !== undefined) updateData.validationErrors = validationErrors;

    // 如果有字段更新，增加版本号
    if (fields !== undefined) {
      updateData.version = (schema.version || 1) + 1;
    }

    await dataStructureRepository.update(id, updateData);
    const updatedSchema = await dataStructureRepository.findOne({ where: { id } });

    // 如果有警告，返回警告信息
    if (warning) {
      res.json({
        data: updatedSchema,
        warning: {
          message: warning.message,
          code: warning.code
        }
      });
    } else {
      res.json(updatedSchema);
    }
  } catch (error) {
    Logger.error(`更新数据结构失败: ${error.message}`);
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: '更新数据结构失败' });
    }
  }
};

// 删除数据结构
export const deleteSchema = async (req: Request, res: Response) => {
  const dataStructureRepository = getDataSource().getRepository(DataStructure);
  try {
    const { id } = req.params;
    const schema = await dataStructureRepository.findOne({ where: { id } });
    if (!schema) {
      throw new NotFoundError(`ID为 ${id} 的数据结构不存在`);
    }
    await dataStructureRepository.remove(schema);
    Logger.info({ message: '删除数据结构', name: schema.name });
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '删除数据结构失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 验证数据结构
export const validateSchema = async (req: Request, res: Response) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      throw new ValidationError('字段定义是必填项');
    }

    // 为字段生成临时 ID
    const fieldsWithIds = fields.map((field: Partial<Field>) => ({
      ...field,
      id: field.id || uuidv4()
    }));

    // 验证字段定义
    FieldValidator.validateFields(fieldsWithIds);
    res.json({ valid: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '验证字段定义失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

/**
 * @swagger
 * components:
 *   responses:
 *     ServerError:
 *       description: 服务器内部错误
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: 服务器内部错误
 *               code:
 *                 type: string
 *                 example: INTERNAL_SERVER_ERROR
 */ 