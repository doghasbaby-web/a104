import { createClient } from '@supabase/supabase-js';
import type { ExecuteFlowRequest, ExecuteFlowResponse } from '../../../shared/types/index.js';
import { BlockFlowExecutor } from '../services/blockFlowExecutor.js';
import { CodeGenerator } from '../services/codeGenerator.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      const { data: diagram, error: diagramError } = await supabase
        .from('diagrams')
        .select('*')
        .eq('id', request.diagramId)
        .eq('user_id', userId)
        .single();

      if (diagramError || !diagram) {
        throw new Error('Diagram not found');
      }

      // Generate code
      const generatedCode = this.codeGenerator.generateFromDiagram({
        id: diagram.id,
        name: diagram.name,
        description: diagram.description,
        userId: diagram.user_id,
        blocks: diagram.blocks || [],
        connections: diagram.connections || [],
        config: diagram.config,
        createdAt: diagram.created_at,
        updatedAt: diagram.updated_at
      });

      // Execute the flow
      const executionResult = await this.executor.execute(
        diagram.blocks,
        diagram.connections,
        request.inputs
      );

      // Run test cases if provided
      let testResults;
      if (request.testCases && request.testCases.length > 0) {
        testResults = await this.executor.runTests(
          diagram.blocks,
          diagram.connections,
          request.testCases
        );
      }

      const executionTime = Date.now() - startTime;

      // Log execution
      await supabase.from('execution_logs').insert({
        diagram_id: request.diagramId,
        user_id: userId,
        status: executionResult.success ? 'success' : 'error',
        inputs: request.inputs,
        outputs: executionResult.outputs,
        error: executionResult.error,
        execution_time: executionTime
      });

      // Store generated code
      await supabase.from('generated_code').insert({
        diagram_id: request.diagramId,
        language: 'javascript',
        code: generatedCode.code,
        orchestration_code: generatedCode.orchestrationCode
      });

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
      await supabase.from('execution_logs').insert({
        diagram_id: request.diagramId,
        user_id: userId,
        status: 'error',
        inputs: request.inputs,
        error: errorMessage,
        execution_time: executionTime
      });

      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }

  async getExecutionLogs(diagramId: string, userId: string) {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('diagram_id', diagramId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }
}
