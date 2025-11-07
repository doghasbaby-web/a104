import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { CodeGenController } from '../controllers/codeGenController.js';

const router = express.Router();
const codeGenController = new CodeGenController();

router.use(authenticate);

// POST /api/codegen/generate - Generate code from diagram
router.post('/generate', asyncHandler(async (req: AuthRequest, res) => {
  const code = await codeGenController.generateCode(
    req.body.diagramId,
    req.body.language || 'javascript',
    req.userId!
  );
  res.json(code);
}));

// GET /api/codegen/:diagramId - Get generated code for diagram
router.get('/:diagramId', asyncHandler(async (req: AuthRequest, res) => {
  const code = await codeGenController.getGeneratedCode(
    req.params.diagramId,
    req.userId!
  );
  res.json(code);
}));

export default router;
