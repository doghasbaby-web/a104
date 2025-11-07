import { createClient } from '@supabase/supabase-js';
import type { GeneratedCode } from '../../../shared/types/index.js';
import { CodeGenerator } from '../services/codeGenerator.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class CodeGenController {
  private codeGenerator: CodeGenerator;

  constructor() {
    this.codeGenerator = new CodeGenerator();
  }

  async generateCode(
    diagramId: string,
    language: string,
    userId: string
  ): Promise<GeneratedCode> {
    // Get diagram
    const { data: diagram, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('id', diagramId)
      .eq('user_id', userId)
      .single();

    if (error || !diagram) {
      throw new Error('Diagram not found');
    }

    // Generate code
    const result = this.codeGenerator.generateFromDiagram({
      id: diagram.id,
      name: diagram.name,
      description: diagram.description,
      userId: diagram.user_id,
      blocks: diagram.blocks || [],
      connections: diagram.connections || [],
      config: diagram.config,
      createdAt: diagram.created_at,
      updatedAt: diagram.updated_at
    }, language);

    // Store generated code
    const { data: stored } = await supabase
      .from('generated_code')
      .insert({
        diagram_id: diagramId,
        language,
        code: result.code,
        orchestration_code: result.orchestrationCode
      })
      .select()
      .single();

    return {
      diagramId,
      language,
      code: result.code,
      orchestrationCode: result.orchestrationCode,
      timestamp: stored?.created_at || new Date().toISOString()
    };
  }

  async getGeneratedCode(diagramId: string, userId: string) {
    // Verify ownership
    const { data: diagram } = await supabase
      .from('diagrams')
      .select('id')
      .eq('id', diagramId)
      .eq('user_id', userId)
      .single();

    if (!diagram) throw new Error('Diagram not found');

    const { data, error } = await supabase
      .from('generated_code')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return null;
    }

    return {
      diagramId: data.diagram_id,
      language: data.language,
      code: data.code,
      orchestrationCode: data.orchestration_code,
      timestamp: data.created_at
    };
  }
}
