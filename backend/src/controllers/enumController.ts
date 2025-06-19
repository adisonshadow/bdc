import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { Enum } from '../models/Enum';
import { ValidationError, NotFoundError, ValidationWarning } from '../errors/types';
import { Logger } from '../utils/logger';

// 创建枚举
export const createEnum = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { code, name, options, description } = req.body;
    
    // 基本字段验证
    if (!code || !name || !options || !Array.isArray(options)) {
      throw new ValidationError('代码、名称和选项列表是必填项');
    }

    // 验证选项格式
    if (!options.every((option: { value: string; label: string }) => option.value && option.label)) {
      throw new ValidationError('每个选项必须包含 value 和 label');
    }

    // 创建枚举实例
    const enumEntity = enumRepository.create({
      code,
      name,
      options,
      description,
      isActive: true
    });

    // 验证格式
    if (!enumEntity.validateCode()) {
      throw new ValidationError('枚举代码格式不正确（必须以小写字母开头，只能包含小写字母、数字、下划线和冒号）');
    }
    if (!enumEntity.validateName()) {
      throw new ValidationError('枚举名称不能为空');
    }
    if (!enumEntity.validateOptions()) {
      throw new ValidationError('枚举选项格式不正确');
    }

    // 验证代码唯一性
    const existing = await enumRepository.findOne({ where: { code } });
    if (existing) {
      throw new ValidationError('该代码的枚举已存在');
    }

    // 保存枚举
    await enumRepository.save(enumEntity);
    Logger.info({ message: '创建枚举', code });
    res.status(201).json(enumEntity);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '创建枚举失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 获取所有枚举
export const getAllEnums = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { isActive, code, name } = req.query;
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

    const enums = await enumRepository.find({
      where,
      order: {
        createdAt: 'DESC'
      }
    });
    res.json(enums);
  } catch (error) {
    Logger.error({ message: '获取枚举列表失败', error });
    console.error(error); // 不许删除
    res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
  }
};

// 根据ID获取枚举
export const getEnumById = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { id } = req.params;
    const enumEntity = await enumRepository.findOne({ where: { id } });
    if (!enumEntity) {
      throw new NotFoundError(`ID为 ${id} 的枚举不存在`);
    }
    res.json(enumEntity);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取枚举失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 根据代码获取枚举
export const getEnumByCode = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { code } = req.params;
    const enumEntity = await enumRepository.findOne({ where: { code } });
    if (!enumEntity) {
      throw new NotFoundError(`代码为 ${code} 的枚举不存在`);
    }
    res.json(enumEntity);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取枚举失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 更新枚举
export const updateEnum = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { id } = req.params;
    const { code, name, options, description, isActive } = req.body;
    
    // 查找现有枚举
    const existing = await enumRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`ID为 ${id} 的枚举不存在`);
    }

    // 验证选项格式（如果提供了新的选项）
    if (options && !options.every((option: { value: string; label: string }) => option.value && option.label)) {
      throw new ValidationError('每个选项必须包含 value 和 label');
    }

    // 更新字段
    const enumEntity = enumRepository.create({
      ...existing,
      code: code || existing.code,
      name: name || existing.name,
      options: options || existing.options,
      description: description !== undefined ? description : existing.description,
      isActive: isActive !== undefined ? isActive : existing.isActive
    });

    // 验证格式
    if (!enumEntity.validateCode()) {
      throw new ValidationError('枚举代码格式不正确（必须以小写字母开头，只能包含小写字母、数字、下划线和冒号）');
    }
    if (!enumEntity.validateName()) {
      throw new ValidationError('枚举名称不能为空');
    }
    if (!enumEntity.validateOptions()) {
      throw new ValidationError('枚举选项格式不正确');
    }

    // 验证代码唯一性
    if (code && code !== existing.code) {
      const codeExists = await enumRepository.findOne({ where: { code } });
      if (codeExists) {
        throw new ValidationError('该代码的枚举已存在');
      }
    }

    // 检查主键字段（改为警告）
    let warning = null;
    const hasPrimaryKey = options?.some((option: any) => option.isPrimaryKey);
    if (!hasPrimaryKey) {
      warning = new ValidationWarning('必须指定一个主键字段');
    }

    // 保存更新
    const updated = await enumRepository.save(enumEntity);
    Logger.info({ message: '更新枚举', code: updated.code });
    
    // 如果有警告，返回警告信息
    if (warning) {
      res.json({
        data: updated,
        warning: {
          message: warning.message,
          code: warning.code
        }
      });
    } else {
      res.json(updated);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '更新枚举失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 删除枚举
export const deleteEnum = async (req: Request, res: Response) => {
  try {
    const enumRepository = getDataSource().getRepository(Enum);
    const { id } = req.params;
    const enumEntity = await enumRepository.findOne({ where: { id } });
    if (!enumEntity) {
      throw new NotFoundError(`ID为 ${id} 的枚举不存在`);
    }

    // 删除枚举
    await enumRepository.remove(enumEntity);
    Logger.info({ message: '删除枚举', code: enumEntity.code });
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '删除枚举失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};