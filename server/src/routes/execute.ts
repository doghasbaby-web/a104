import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ExecutionController } from '../controllers/executionController.js';

const router = express.Router();
const executionController = new ExecutionController();

router.use(authenticate);

// POST /api/execute - Execute a diagram flow
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const result = await executionController.executeFlow(
    req.body,
    req.userId!
  );
  res.json(result);
}));

// GET /api/execute/logs/:diagramId - Get execution logs
router.get('/logs/:diagramId', asyncHandler(async (req: AuthRequest, res) => {
  const logs = await executionController.getExecutionLogs(
    req.params.diagramId,
    req.userId!
  );
  res.json(logs);
}));

export default router;
