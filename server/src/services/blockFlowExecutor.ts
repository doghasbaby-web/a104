import type { Block, Connection, TestCase, TestResult } from '../../../shared/types/index.js';
import { logger } from '../utils/logger.js';

export class BlockFlowExecutor {
  async execute(
    blocks: Block[],
    connections: Connection[],
    inputs: Record<string, any>
  ): Promise<{
    success: boolean;
    outputs?: Record<string, any>;
    error?: string;
  }> {
    try {
      logger.info('Starting flow execution', { blockCount: blocks.length, connectionCount: connections.length });

      // Build execution graph
      const graph = this.buildExecutionGraph(connections);
      const results: Record<string, any> = {};

      // Find starting blocks (no incoming connections)
      const startingBlocks = this.findStartingBlocks(blocks, connections);

      if (startingBlocks.length === 0) {
        throw new Error('No starting blocks found in flow');
      }

      // Execute starting blocks
      for (const block of startingBlocks) {
        await this.executeBlock(block, inputs, results);
      }

      // Execute remaining blocks in order
      const executed = new Set(startingBlocks.map(b => b.id));
      const queue = [...startingBlocks];

      while (queue.length > 0) {
        const currentBlock = queue.shift()!;
        const outgoingConnections = connections.filter(c => c.source === currentBlock.id);

        for (const conn of outgoingConnections) {
          const targetBlock = blocks.find(b => b.id === conn.target);
          if (!targetBlock || executed.has(targetBlock.id)) continue;

          // Check if all dependencies are satisfied
          const incomingConnections = connections.filter(c => c.target === targetBlock.id);
          const allDependenciesMet = incomingConnections.every(ic => executed.has(ic.source));

          if (!allDependenciesMet) continue;

          // Execute based on connection type
          await this.executeConnection(conn, blocks, results);

          executed.add(targetBlock.id);
          queue.push(targetBlock);
        }
      }

      logger.info('Flow execution completed successfully', { resultsCount: Object.keys(results).length });

      return {
        success: true,
        outputs: results
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Flow execution failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async runTests(
    blocks: Block[],
    connections: Connection[],
    testCases: TestCase[]
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();

      try {
        const executionResult = await this.execute(blocks, connections, testCase.inputs);

        const passed = this.compareOutputs(
          executionResult.outputs || {},
          testCase.expectedOutputs
        );

        results.push({
          testCaseId: testCase.id,
          passed,
          actualOutputs: executionResult.outputs,
          error: executionResult.error,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  private async executeBlock(
    block: Block,
    inputs: Record<string, any>,
    results: Record<string, any>
  ): Promise<void> {
    logger.info(`Executing block: ${block.name}`, { blockId: block.id });

    // Simulate block execution
    // In a real implementation, this would:
    // 1. Load the actual implementation from block.internal
    // 2. Validate inputs against block.inputs schema
    // 3. Execute the code
    // 4. Validate outputs against block.outputs schema
    // 5. Handle errors according to block.errors

    // For now, create mock outputs based on the block's output schema
    const mockOutputs: Record<string, any> = {};

    for (const [key, type] of Object.entries(block.outputs)) {
      mockOutputs[key] = this.getMockValue(type, inputs);
    }

    results[block.id] = mockOutputs;
    logger.info(`Block executed: ${block.name}`, { outputs: mockOutputs });
  }

  private async executeConnection(
    connection: Connection,
    blocks: Block[],
    results: Record<string, any>
  ): Promise<void> {
    const sourceResult = results[connection.source];
    const targetBlock = blocks.find(b => b.id === connection.target);

    if (!targetBlock) {
      throw new Error(`Target block not found: ${connection.target}`);
    }

    let inputs = sourceResult;

    // Apply data mapping if specified
    if (connection.mapping) {
      inputs = this.mapData(sourceResult, connection.mapping);
    }

    // Apply transforms if specified
    if (connection.transform) {
      inputs = this.applyTransforms(inputs, connection.transform);
    }

    // Execute based on connection type
    switch (connection.type) {
      case 'sequential':
        await this.executeBlock(targetBlock, inputs, results);
        break;

      case 'conditional':
        if (this.evaluateCondition(connection.condition, sourceResult)) {
          await this.executeBlock(targetBlock, inputs, results);
        }
        break;

      case 'parallel':
        // Execute in background (simulate with immediate execution for now)
        await this.executeBlock(targetBlock, inputs, results);
        break;

      case 'fork':
        // Send same output to multiple targets
        await this.executeBlock(targetBlock, inputs, results);
        break;

      case 'merge':
        // Combine multiple inputs (handled by waiting for all dependencies)
        await this.executeBlock(targetBlock, inputs, results);
        break;

      case 'loop':
        // Implement loop logic
        let continueLoop = true;
        while (continueLoop) {
          await this.executeBlock(targetBlock, inputs, results);
          continueLoop = this.evaluateCondition(connection.condition, results[targetBlock.id]);

          // Prevent infinite loops in simulation
          if (continueLoop) {
            continueLoop = false; // Only run once in simulation
          }
        }
        break;
    }
  }

  private mapData(source: any, mapping: Record<string, string>): any {
    const result: any = {};

    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      const keys = sourcePath.replace(/^[^.]+\./, '').split('.');
      let value = source;

      for (const key of keys) {
        value = value?.[key];
      }

      result[targetKey] = value;
    }

    return result;
  }

  private applyTransforms(data: any, transforms: Record<string, string>): any {
    // Simple transform evaluation (in production, use a safe expression evaluator)
    const result = { ...data };

    for (const [key, expression] of Object.entries(transforms)) {
      try {
        // Very basic expression evaluation
        // In production, use a proper expression parser
        result[key] = eval(expression.replace(/input\./g, 'data.'));
      } catch (error) {
        logger.warn(`Transform failed for key ${key}:`, error);
        result[key] = data[key];
      }
    }

    return result;
  }

  private evaluateCondition(condition: string | undefined, data: any): boolean {
    if (!condition) return true;

    try {
      // Simple condition evaluation
      // In production, use a safe expression evaluator
      return eval(condition.replace(/output\./g, 'data.'));
    } catch (error) {
      logger.warn('Condition evaluation failed:', error);
      return false;
    }
  }

  private buildExecutionGraph(connections: Connection[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const conn of connections) {
      if (!graph.has(conn.source)) {
        graph.set(conn.source, []);
      }
      graph.get(conn.source)!.push(conn.target);
    }

    return graph;
  }

  private findStartingBlocks(blocks: Block[], connections: Connection[]): Block[] {
    const targetsSet = new Set(connections.map(c => c.target));
    return blocks.filter(b => !targetsSet.has(b.id));
  }

  private compareOutputs(actual: any, expected: any): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  private getMockValue(type: string, inputs?: any): any {
    // Generate mock values based on type
    const mockValues: Record<string, any> = {
      string: 'mock_string_value',
      integer: 42,
      float: 3.14,
      boolean: true,
      array: [],
      object: {},
      email: 'mock@example.com',
      timestamp: new Date().toISOString(),
      uuid: crypto.randomUUID()
    };

    return mockValues[type] || null;
  }
}
