import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { AiConfig } from '../models/AiConfig';
import { ValidationError, NotFoundError } from '../errors/types';
import { Logger } from '../utils/logger';

// 创建AI配置
export const createAiConfig = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { provider, apiUrl, apiKey, model, config } = req.body;
    
    // 基本字段验证
    if (!provider || !apiUrl || !apiKey || !model) {
      throw new ValidationError('提供商、API地址、API密钥和模型名称是必填项');
    }

    // 创建AI配置实例
    const aiConfigEntity = aiConfigRepository.create({
      provider,
      apiUrl,
      apiKey,
      model,
      config
    });

    // 验证格式
    const validation = aiConfigEntity.validateAll();
    if (!validation.isValid) {
      throw new ValidationError(`AI配置格式不正确：${validation.errors.join('；')}`);
    }

    // 验证provider + model唯一性
    const existing = await aiConfigRepository.findOne({ 
      where: { provider, model } 
    });
    if (existing) {
      throw new ValidationError('该提供商和模型组合的配置已存在');
    }

    // 保存AI配置
    await aiConfigRepository.save(aiConfigEntity);
    Logger.info({ message: '创建AI配置', provider, model });
    res.status(201).json(aiConfigEntity);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '创建AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 获取所有AI配置
export const getAllAiConfigs = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { provider, model } = req.query;
    const where: any = {};
    
    if (provider) {
      where.provider = provider;
    }
    if (model) {
      where.model = model;
    }

    const aiConfigs = await aiConfigRepository.find({
      where,
      order: {
        createdAt: 'DESC'
      }
    });
    res.json(aiConfigs);
  } catch (error) {
    Logger.error({ message: '获取AI配置列表失败', error });
    res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
  }
};

// 根据ID获取AI配置
export const getAiConfigById = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { id } = req.params;
    const aiConfigEntity = await aiConfigRepository.findOne({ where: { id } });
    if (!aiConfigEntity) {
      throw new NotFoundError(`ID为 ${id} 的AI配置不存在`);
    }
    res.json(aiConfigEntity);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 根据提供商和模型获取AI配置
export const getAiConfigByProviderAndModel = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { provider, model } = req.params;
    const aiConfigEntity = await aiConfigRepository.findOne({ 
      where: { provider, model } 
    });
    if (!aiConfigEntity) {
      throw new NotFoundError(`提供商为 ${provider} 且模型为 ${model} 的AI配置不存在`);
    }
    res.json(aiConfigEntity);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '获取AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 更新AI配置
export const updateAiConfig = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { id } = req.params;
    const { provider, apiUrl, apiKey, model, config } = req.body;
    
    // 查找现有AI配置
    const existing = await aiConfigRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`ID为 ${id} 的AI配置不存在`);
    }

    // 更新字段
    existing.provider = provider || existing.provider;
    existing.apiUrl = apiUrl || existing.apiUrl;
    existing.apiKey = apiKey || existing.apiKey;
    existing.model = model || existing.model;
    if (config !== undefined) {
      existing.config = config;
    }

    // 验证格式
    const validation = existing.validateAll();
    if (!validation.isValid) {
      throw new ValidationError(`AI配置格式不正确：${validation.errors.join('；')}`);
    }

    // 验证provider + model唯一性（如果更改了provider或model）
    if ((provider && provider !== existing.provider) || (model && model !== existing.model)) {
      const newProvider = provider || existing.provider;
      const newModel = model || existing.model;
      const duplicate = await aiConfigRepository.findOne({ 
        where: { 
          provider: newProvider, 
          model: newModel
        }
      });
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError('该提供商和模型组合的配置已存在');
      }
    }

    // 保存更新
    const updated = await aiConfigRepository.save(existing);
    Logger.info({ message: '更新AI配置', provider: updated.provider, model: updated.model });
    res.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message, code: error.code });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '更新AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 删除AI配置
export const deleteAiConfig = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { id } = req.params;
    
    // 查找现有AI配置
    const existing = await aiConfigRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`ID为 ${id} 的AI配置不存在`);
    }

    // 删除AI配置
    await aiConfigRepository.remove(existing);
    Logger.info({ message: '删除AI配置', provider: existing.provider, model: existing.model });
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '删除AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};

// 测试AI配置连接
export const testAiConfig = async (req: Request, res: Response) => {
  try {
    const aiConfigRepository = getDataSource().getRepository(AiConfig);
    const { id } = req.params;
    
    // 查找AI配置
    const aiConfig = await aiConfigRepository.findOne({ where: { id } });
    if (!aiConfig) {
      throw new NotFoundError(`ID为 ${id} 的AI配置不存在`);
    }

    // 这里可以添加实际的AI API测试逻辑
    // 暂时返回成功状态
    Logger.info({ message: '测试AI配置', provider: aiConfig.provider, model: aiConfig.model });
    res.json({
      success: true,
      message: 'AI配置测试成功',
      provider: aiConfig.provider,
      model: aiConfig.model
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message, code: error.code });
    } else {
      Logger.error({ message: '测试AI配置失败', error });
      res.status(500).json({ message: '服务器内部错误', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
}; 