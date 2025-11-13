import db, { generateId } from '../db/database';
import type { ExecuteFlowRequest, ExecuteFlowResponse } from '../../../shared/types/index.js';
import { BlockFlowExecutor } from '../services/blockFlowExecutor.js';
import { CodeGenerator } from '../services/codeGenerator.js';
import { logger } from '../utils/logger.js';

export class ExecutionController {
  private executor: BlockFlowExecutor;
  private codeGenerator: CodeGenerator;

  constructor() {
    this.executor = new BlockFlowExecutor();
    this.codeGenerator = new CodeGenerator();
  }

  async executeFlow(
    request: ExecuteFlowRequest,
    userId: string
  ): Promise<ExecuteFlowResponse> {
    const startTime = Date.now();

    try {
      // Get diagram
      const diagram = db
        .prepare('SELECT * FROM diagrams WHERE id = ? AND user_id = ?')
        .get(request.diagramId, userId) as any;

      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const blocks = JSON.parse(diagram.blocks || '[]');
      const connections = JSON.parse(diagram.connections || '[]');
      const config = diagram.config ? JSON.parse(diagram.config) : null;

      // Generate code
      const generatedCode = this.codeGenerator.generateFromDiagram({
        id: diagram.id,
        name: diagram.name,
        description: diagram.description,
        userId: diagram.user_id,
        blocks,
        connections,
        config,
        createdAt: diagram.created_at,
        updatedAt: diagram.updated_at
      });

      // Execute the flow
      const executionResult = await this.executor.execute(
        blocks,
        connections,
        request.inputs
      );

      // Run test cases if provided
      let testResults;
      if (request.testCases && request.testCases.length > 0) {
        testResults = await this.executor.runTests(
          blocks,
          connections,
          request.testCases
        );
      }

      const executionTime = Date.now() - startTime;

      // Log execution
      const logStmt = db.prepare(`
        INSERT INTO execution_logs (id, diagram_id, user_id, status, inputs, outputs, error, execution_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      logStmt.run(
        generateId(),
        request.diagramId,
        userId,
        executionResult.success ? 'success' : 'error',
        JSON.stringify(request.inputs),
        executionResult.outputs ? JSON.stringify(executionResult.outputs) : null,
        executionResult.error || null,
        executionTime
      );

      // Store generated code
      const codeStmt = db.prepare(`
        INSERT INTO generated_code (id, diagram_id, language, code, orchestration_code)
        VALUES (?, ?, ?, ?, ?)
      `);
      codeStmt.run(
        generateId(),
        request.diagramId,
        'javascript',
        generatedCode.code,
        generatedCode.orchestrationCode || null
      );

      return {
        success: executionResult.success,
        outputs: executionResult.outputs,
        generatedCode: {
          diagramId: request.diagramId,
          language: 'javascript',
          code: generatedCode.code,
          orchestrationCode: generatedCode.orchestrationCode,
          timestamp: new Date().toISOString()
        },
        testResults,
        error: executionResult.error,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Flow execution failed', { error: errorMessage });

      // Log failed execution
      const logStmt = db.prepare(`
        INSERT INTO execution_logs (id, diagram_id, user_id, status, inputs, error, execution_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      logStmt.run(
        generateId(),
        request.diagramId,
        userId,
        'error',
        JSON.stringify(request.inputs),
        errorMessage,
        executionTime
      );

      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }

  async getExecutionLogs(diagramId: string, userId: string) {
    const logs = db
      .prepare(`
        SELECT * FROM execution_logs
        WHERE diagram_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .all(diagramId, userId) as any[];

    return logs.map(log => ({
      ...log,
      inputs: log.inputs ? JSON.parse(log.inputs) : null,
      outputs: log.outputs ? JSON.parse(log.outputs) : null
    }));
  }
}
