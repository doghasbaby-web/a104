import { createClient } from '@supabase/supabase-js';
import type { TestCase, TestResult } from '../../../shared/types/index.js';
import { BlockFlowExecutor } from '../services/blockFlowExecutor.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class TestController {
  private executor: BlockFlowExecutor;

  constructor() {
    this.executor = new BlockFlowExecutor();
  }

  async getTestsForDiagram(diagramId: string, userId: string): Promise<TestCase[]> {
    // Verify user owns the diagram
    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', diagramId)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Diagram not found');

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('diagram_id', diagramId);

    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      name: t.name,
      diagramId: t.diagram_id,
      blockId: t.block_id,
      inputs: t.inputs,
      expectedOutputs: t.expected_outputs,
      description: t.description
    }));
  }

  async createTest(testCase: Omit<TestCase, 'id'>, userId: string): Promise<TestCase> {
    // Verify user owns the diagram
    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', testCase.diagramId)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Diagram not found');

    const { data, error } = await supabase
      .from('test_cases')
      .insert({
        diagram_id: testCase.diagramId,
        block_id: testCase.blockId,
        name: testCase.name,
        description: testCase.description,
        inputs: testCase.inputs,
        expected_outputs: testCase.expectedOutputs
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      diagramId: data.diagram_id,
      blockId: data.block_id,
      inputs: data.inputs,
      expectedOutputs: data.expected_outputs,
      description: data.description
    };
  }

  async updateTest(
    id: string,
    updates: Partial<TestCase>,
    userId: string
  ): Promise<TestCase> {
    // Verify ownership through diagram
    const { data: existing } = await supabase
      .from('test_cases')
      .select('diagram_id')
      .eq('id', id)
      .single();

    if (!existing) throw new Error('Test case not found');

    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', existing.diagram_id)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('test_cases')
      .update({
        name: updates.name,
        description: updates.description,
        block_id: updates.blockId,
        inputs: updates.inputs,
        expected_outputs: updates.expectedOutputs
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      diagramId: data.diagram_id,
      blockId: data.block_id,
      inputs: data.inputs,
      expectedOutputs: data.expected_outputs,
      description: data.description
    };
  }

  async deleteTest(id: string, userId: string): Promise<void> {
    // Verify ownership through diagram
    const { data: existing } = await supabase
      .from('test_cases')
      .select('diagram_id')
      .eq('id', id)
      .single();

    if (!existing) throw new Error('Test case not found');

    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', existing.diagram_id)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async runTest(id: string, userId: string): Promise<TestResult> {
    const startTime = Date.now();

    // Get test case
    const { data: testCase } = await supabase
      .from('test_cases')
      .select('*, diagrams(*)')
      .eq('id', id)
      .single();

    if (!testCase) throw new Error('Test case not found');

    // Verify ownership
    const diagram = testCase.diagrams;
    if (diagram.user_id !== userId) throw new Error('Unauthorized');

    try {
      // Execute the flow with test inputs
      const result = await this.executor.execute(
        diagram.blocks,
        diagram.connections,
        testCase.inputs
      );

      const executionTime = Date.now() - startTime;

      // Compare outputs
      const passed = this.compareOutputs(result.outputs, testCase.expected_outputs);

      const testResult: TestResult = {
        testCaseId: id,
        passed,
        actualOutputs: result.outputs,
        error: result.error,
        executionTime,
        timestamp: new Date().toISOString()
      };

      // Store result
      await supabase.from('test_results').insert({
        test_case_id: id,
        passed,
        actual_outputs: result.outputs,
        error: result.error,
        execution_time: executionTime
      });

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

      await supabase.from('test_results').insert({
        test_case_id: id,
        passed: false,
        error: errorMessage,
        execution_time: executionTime
      });

      return testResult;
    }
  }

  async getTestResults(id: string, userId: string) {
    // Verify ownership
    const { data: testCase } = await supabase
      .from('test_cases')
      .select('diagram_id')
      .eq('id', id)
      .single();

    if (!testCase) throw new Error('Test case not found');

    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', testCase.diagram_id)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_case_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }

  private compareOutputs(actual: any, expected: any): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}
