import db, { generateId } from '../db/database';
import type { GeneratedCode } from '../../../shared/types/index.js';
import { CodeGenerator } from '../services/codeGenerator.js';

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
    const diagram = db
      .prepare('SELECT * FROM diagrams WHERE id = ? AND user_id = ?')
      .get(diagramId, userId) as any;

    if (!diagram) {
      throw new Error('Diagram not found');
    }

    const blocks = JSON.parse(diagram.blocks || '[]');
    const connections = JSON.parse(diagram.connections || '[]');
    const config = diagram.config ? JSON.parse(diagram.config) : null;

    // Generate code
    const result = this.codeGenerator.generateFromDiagram({
      id: diagram.id,
      name: diagram.name,
      description: diagram.description,
      userId: diagram.user_id,
      blocks,
      connections,
      config,
      createdAt: diagram.created_at,
      updatedAt: diagram.updated_at
    }, language);

    // Store generated code
    const stmt = db.prepare(`
      INSERT INTO generated_code (id, diagram_id, language, code, orchestration_code)
      VALUES (?, ?, ?, ?, ?)
    `);

    const id = generateId();
    stmt.run(
      id,
      diagramId,
      language,
      result.code,
      result.orchestrationCode || null
    );

    const stored = db
      .prepare('SELECT created_at FROM generated_code WHERE id = ?')
      .get(id) as any;

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
    const diagram = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(diagramId, userId);

    if (!diagram) throw new Error('Diagram not found');

    const data = db
      .prepare(`
        SELECT * FROM generated_code
        WHERE diagram_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(diagramId) as any;

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
