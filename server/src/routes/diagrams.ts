import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { DiagramController } from '../controllers/diagramController.js';

const router = express.Router();
const diagramController = new DiagramController();

// All routes require authentication
router.use(authenticate);

// GET /api/diagrams - Get all diagrams for user
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const diagrams = await diagramController.getUserDiagrams(req.userId!);
  res.json(diagrams);
}));

// GET /api/diagrams/:id - Get specific diagram
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const diagram = await diagramController.getDiagram(req.params.id, req.userId!);
  res.json(diagram);
}));

// POST /api/diagrams - Create new diagram
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const diagram = await diagramController.createDiagram(req.body, req.userId!);
  res.status(201).json(diagram);
}));

// PUT /api/diagrams/:id - Update diagram
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const diagram = await diagramController.updateDiagram(
    req.params.id,
    req.body,
    req.userId!
  );
  res.json(diagram);
}));

// DELETE /api/diagrams/:id - Delete diagram
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await diagramController.deleteDiagram(req.params.id, req.userId!);
  res.status(204).send();
}));

export default router;
