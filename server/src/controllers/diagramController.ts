import { createClient } from '@supabase/supabase-js';
import type { Diagram, CreateDiagramRequest, UpdateDiagramRequest } from '../../../shared/types/index.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class DiagramController {
  async getUserDiagrams(userId: string): Promise<Diagram[]> {
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      userId: d.user_id,
      blocks: d.blocks || [],
      connections: d.connections || [],
      config: d.config,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  async getDiagram(id: string, userId: string): Promise<Diagram> {
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Diagram not found');

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: data.blocks || [],
      connections: data.connections || [],
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async createDiagram(diagram: CreateDiagramRequest, userId: string): Promise<Diagram> {
    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        user_id: userId,
        name: diagram.name,
        description: diagram.description,
        blocks: diagram.blocks || [],
        connections: diagram.connections || [],
        config: diagram.config
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: data.blocks || [],
      connections: data.connections || [],
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateDiagram(
    id: string,
    updates: UpdateDiagramRequest,
    userId: string
  ): Promise<Diagram> {
    const { data, error } = await supabase
      .from('diagrams')
      .update({
        name: updates.name,
        description: updates.description,
        blocks: updates.blocks,
        connections: updates.connections,
        config: updates.config
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Diagram not found');

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      blocks: data.blocks || [],
      connections: data.connections || [],
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async deleteDiagram(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
