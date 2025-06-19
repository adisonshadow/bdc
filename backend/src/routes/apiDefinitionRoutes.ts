import express from 'express';
import {
  createApiDefinition,
  getAllApiDefinitions,
  getApiDefinitionById,
  getApiDefinitionByCode,
  updateApiDefinition,
  deleteApiDefinition,
  validateApiDefinition
} from '../controllers/apiDefinitionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// API 定义路由
router.post('/', createApiDefinition);
router.get('/', getAllApiDefinitions);
router.get('/:id', getApiDefinitionById);
router.get('/code/:code', getApiDefinitionByCode);
router.put('/:id', updateApiDefinition);
router.delete('/:id', deleteApiDefinition);
router.post('/validate', validateApiDefinition);

export default router; 