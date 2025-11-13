import db, { generateId } from '../db/database';
import type { TestCase, TestResult } from '../../../shared/types/index.js';
import { BlockFlowExecutor } from '../services/blockFlowExecutor.js';

export class TestController {
  private executor: BlockFlowExecutor;

  constructor() {
    this.executor = new BlockFlowExecutor();
  }

  async getTestsForDiagram(diagramId: string, userId: string): Promise<TestCase[]> {
    // Verify user owns the diagram
    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(diagramId, userId);

    if (!diagram) throw new Error('Diagram not found');

    const data = db
      .prepare('SELECT * FROM test_cases WHERE diagram_id = ?')
      .all(diagramId) as any[];

    return data.map(t => ({
      id: t.id,
      name: t.name,
      diagramId: t.diagram_id,
      blockId: t.block_id,
      inputs: JSON.parse(t.inputs),
      expectedOutputs: JSON.parse(t.expected_outputs),
      description: t.description
    }));
  }

  async createTest(testCase: Omit<TestCase, 'id'>, userId: string): Promise<TestCase> {
    // Verify user owns the diagram
    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(testCase.diagramId, userId);

    if (!diagram) throw new Error('Diagram not found');

    const id = generateId();

    const stmt = db.prepare(`
      INSERT INTO test_cases (id, diagram_id, block_id, name, description, inputs, expected_outputs)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      testCase.diagramId,
      testCase.blockId || null,
      testCase.name,
      testCase.description || null,
      JSON.stringify(testCase.inputs),
      JSON.stringify(testCase.expectedOutputs)
    );

    const data = db
      .prepare('SELECT * FROM test_cases WHERE id = ?')
      .get(id) as any;

    return {
      id: data.id,
      name: data.name,
      diagramId: data.diagram_id,
      blockId: data.block_id,
      inputs: JSON.parse(data.inputs),
      expectedOutputs: JSON.parse(data.expected_outputs),
      description: data.description
    };
  }

  async updateTest(
    id: string,
    updates: Partial<TestCase>,
    userId: string
  ): Promise<TestCase> {
    // Verify ownership through diagram
    const existing = db
      .prepare('SELECT diagram_id FROM test_cases WHERE id = ?')
      .get(id) as any;

    if (!existing) throw new Error('Test case not found');

    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(existing.diagram_id, userId);

    if (!diagram) throw new Error('Unauthorized');

    const stmt = db.prepare(`
      UPDATE test_cases
      SET name = ?, description = ?, block_id = ?, inputs = ?, expected_outputs = ?
      WHERE id = ?
    `);

    stmt.run(
      updates.name,
      updates.description || null,
      updates.blockId || null,
      updates.inputs ? JSON.stringify(updates.inputs) : null,
      updates.expectedOutputs ? JSON.stringify(updates.expectedOutputs) : null,
      id
    );

    const data = db
      .prepare('SELECT * FROM test_cases WHERE id = ?')
      .get(id) as any;

    return {
      id: data.id,
      name: data.name,
      diagramId: data.diagram_id,
      blockId: data.block_id,
      inputs: JSON.parse(data.inputs),
      expectedOutputs: JSON.parse(data.expected_outputs),
      description: data.description
    };
  }

  async deleteTest(id: string, userId: string): Promise<void> {
    // Verify ownership through diagram
    const existing = db
      .prepare('SELECT diagram_id FROM test_cases WHERE id = ?')
      .get(id) as any;

    if (!existing) throw new Error('Test case not found');

    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(existing.diagram_id, userId);

    if (!diagram) throw new Error('Unauthorized');

    const stmt = db.prepare('DELETE FROM test_cases WHERE id = ?');
    stmt.run(id);
  }

  async runTest(id: string, userId: string): Promise<TestResult> {
    const startTime = Date.now();

    // Get test case with diagram (join)
    const testCase = db
      .prepare(`
        SELECT tc.*, d.blocks, d.connections, d.user_id
        FROM test_cases tc
        JOIN diagrams d ON tc.diagram_id = d.id
        WHERE tc.id = ?
      `)
      .get(id) as any;

    if (!testCase) throw new Error('Test case not found');

    // Verify ownership
    if (testCase.user_id !== userId) throw new Error('Unauthorized');

    try {
      const blocks = JSON.parse(testCase.blocks || '[]');
      const connections = JSON.parse(testCase.connections || '[]');
      const inputs = JSON.parse(testCase.inputs);
      const expectedOutputs = JSON.parse(testCase.expected_outputs);

      // Execute the flow with test inputs
      const result = await this.executor.execute(
        blocks,
        connections,
        inputs
      );

      const executionTime = Date.now() - startTime;

      // Compare outputs
      const passed = this.compareOutputs(result.outputs, expectedOutputs);

      const testResult: TestResult = {
        testCaseId: id,
        passed,
        actualOutputs: result.outputs,
        error: result.error,
        executionTime,
        timestamp: new Date().toISOString()
      };

      // Store result
      const stmt = db.prepare(`
        INSERT INTO test_results (id, test_case_id, passed, actual_outputs, error, execution_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        generateId(),
        id,
        passed ? 1 : 0,
        result.outputs ? JSON.stringify(result.outputs) : null,
        result.error || null,
        executionTime
      );

      return testResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const testResult: TestResult = {
        testCaseId: id,
        passed: false,
        error: errorMessage,
        executionTime,
        timestamp: new Date().toISOString()
      };

      const stmt = db.prepare(`
        INSERT INTO test_results (id, test_case_id, passed, error, execution_time)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        generateId(),
        id,
        0,
        errorMessage,
        executionTime
      );

      return testResult;
    }
  }

  async getTestResults(id: string, userId: string) {
    // Verify ownership
    const testCase = db
      .prepare('SELECT diagram_id FROM test_cases WHERE id = ?')
      .get(id) as any;

    if (!testCase) throw new Error('Test case not found');

    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(testCase.diagram_id, userId);

    if (!diagram) throw new Error('Unauthorized');

    const data = db
      .prepare(`
        SELECT * FROM test_results
        WHERE test_case_id = ?
        ORDER BY created_at DESC
        LIMIT 20
      `)
      .all(id) as any[];

    return data.map(r => ({
      ...r,
      passed: r.passed === 1,
      actual_outputs: r.actual_outputs ? JSON.parse(r.actual_outputs) : null
    }));
  }

  private compareOutputs(actual: any, expected: any): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}
