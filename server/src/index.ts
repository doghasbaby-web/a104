import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import diagramRoutes from './routes/diagrams.js';
import executeRoutes from './routes/execute.js';
import testRoutes from './routes/tests.js';
import codeGenRoutes from './routes/codegen.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/diagrams', diagramRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/codegen', codeGenRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
