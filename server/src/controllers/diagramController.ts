import db, { generateId } from '../db/database';
import type { Diagram, CreateDiagramRequest, UpdateDiagramRequest } from '../../../shared/types/index.js';

export class DiagramController {
  async getUserDiagrams(userId: string): Promise<Diagram[]> {
    const diagrams = db
      .prepare('SELECT * FROM diagrams WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId) as any[];

    return diagrams.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      userId: d.user_id,
      blocks: JSON.parse(d.blocks || '[]'),
      connections: JSON.parse(d.connections || '[]'),
      config: d.config ? JSON.parse(d.config) : null,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  async getDiagram(id: string, userId: string): Promise<Diagram> {
    const data = db
      .prepare('SELECT * FROM diagrams WHERE id = ? AND user_id = ?')
      .get(id, userId) as any;

    if (!data) throw new Error('Diagram not found');

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: JSON.parse(data.blocks || '[]'),
      connections: JSON.parse(data.connections || '[]'),
      config: data.config ? JSON.parse(data.config) : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async createDiagram(diagram: CreateDiagramRequest, userId: string): Promise<Diagram> {
    const id = generateId();

    const stmt = db.prepare(`
      INSERT INTO diagrams (id, user_id, name, description, blocks, connections, config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      diagram.name,
      diagram.description || null,
      JSON.stringify(diagram.blocks || []),
      JSON.stringify(diagram.connections || []),
      diagram.config ? JSON.stringify(diagram.config) : null
    );

    const data = db
      .prepare('SELECT * FROM diagrams WHERE id = ?')
      .get(id) as any;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: JSON.parse(data.blocks || '[]'),
      connections: JSON.parse(data.connections || '[]'),
      config: data.config ? JSON.parse(data.config) : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateDiagram(
    id: string,
    updates: UpdateDiagramRequest,
    userId: string
  ): Promise<Diagram> {
    // First check if diagram exists and belongs to user
    const existing = db
      .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!existing) throw new Error('Diagram not found');

    const stmt = db.prepare(`
      UPDATE diagrams
      SET name = ?, description = ?, blocks = ?, connections = ?, config = ?
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(
      updates.name,
      updates.description || null,
      JSON.stringify(updates.blocks || []),
      JSON.stringify(updates.connections || []),
      updates.config ? JSON.stringify(updates.config) : null,
      id,
      userId
    );

    const data = db
      .prepare('SELECT * FROM diagrams WHERE id = ?')
      .get(id) as any;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: JSON.parse(data.blocks || '[]'),
      connections: JSON.parse(data.connections || '[]'),
      config: data.config ? JSON.parse(data.config) : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async deleteDiagram(id: string, userId: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM diagrams WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      throw new Error('Diagram not found');
    }
  }
}
