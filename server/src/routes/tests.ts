import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TestController } from '../controllers/testController.js';

const router = express.Router();
const testController = new TestController();

router.use(authenticate);

// GET /api/tests/diagram/:diagramId - Get all tests for a diagram
router.get('/diagram/:diagramId', asyncHandler(async (req: AuthRequest, res) => {
  const tests = await testController.getTestsForDiagram(
    req.params.diagramId,
    req.userId!
  );
  res.json(tests);
}));

// POST /api/tests - Create test case
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const test = await testController.createTest(req.body, req.userId!);
  res.status(201).json(test);
}));

// PUT /api/tests/:id - Update test case
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const test = await testController.updateTest(
    req.params.id,
    req.body,
    req.userId!
  );
  res.json(test);
}));

// DELETE /api/tests/:id - Delete test case
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await testController.deleteTest(req.params.id, req.userId!);
  res.status(204).send();
}));

// POST /api/tests/:id/run - Run specific test
router.post('/:id/run', asyncHandler(async (req: AuthRequest, res) => {
  const result = await testController.runTest(req.params.id, req.userId!);
  res.json(result);
}));

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', asyncHandler(async (req: AuthRequest, res) => {
  const results = await testController.getTestResults(req.params.id, req.userId!);
  res.json(results);
}));

export default router;
