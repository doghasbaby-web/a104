import type { Diagram, Block, Connection } from '../../../shared/types/index.js';

export class CodeGenerator {
  generateFromDiagram(diagram: Diagram, language: string = 'javascript'): {
    code: string;
    orchestrationCode: string;
  } {
    const blocks = diagram.blocks || [];
    const connections = diagram.connections || [];

    // Generate block interface definitions
    const blockInterfaces = this.generateBlockInterfaces(blocks);

    // Generate flow orchestration
    const orchestration = this.generateOrchestration(blocks, connections);

    // Generate complete code
    const code = this.generateCompleteCode(blocks, connections, blockInterfaces, orchestration);

    return {
      code,
      orchestrationCode: orchestration
    };
  }

  private generateBlockInterfaces(blocks: Block[]): string {
    return blocks
      .map(block => {
        const inputTypes = Object.entries(block.inputs)
          .map(([key, type]) => `  ${key}: ${this.mapType(type)};`)
          .join('\n');

        const outputTypes = Object.entries(block.outputs)
          .map(([key, type]) => `  ${key}: ${this.mapType(type)};`)
          .join('\n');

        return `
// Block: ${block.name}
interface ${block.name}Input {
${inputTypes}
}

interface ${block.name}Output {
${outputTypes}
}

async function ${block.name}(input: ${block.name}Input): Promise<${block.name}Output> {
  // Implementation: ${block.internal || 'inline'}
  ${this.generateBlockImplementation(block)}
}`;
      })
      .join('\n\n');
  }

  private generateBlockImplementation(block: Block): string {
    // Generate placeholder implementation
    const outputs = Object.keys(block.outputs);
    const returnObj = outputs
      .map(key => `${key}: null as any`)
      .join(',\n    ');

    return `
  // TODO: Implement ${block.name} logic
  // Expected inputs: ${JSON.stringify(block.inputs)}
  // Expected outputs: ${JSON.stringify(block.outputs)}

  return {
    ${returnObj}
  };`;
  }

  private generateOrchestration(blocks: Block[], connections: Connection[]): string {
    if (connections.length === 0) {
      return '// No connections defined';
    }

    // Build execution graph
    const graph = this.buildExecutionGraph(connections);

    // Generate execution flow
    let orchestration = `
async function executeFlow(initialInputs: any) {
  const results: Record<string, any> = {};
  const errors: any[] = [];

  try {`;

    // Find starting blocks (no incoming connections)
    const startingBlocks = this.findStartingBlocks(blocks, connections);

    for (const block of startingBlocks) {
      orchestration += `
    // Execute ${block.name}
    try {
      const ${block.id}_result = await ${block.name}(initialInputs);
      results['${block.id}'] = ${block.id}_result;
    } catch (error) {
      errors.push({ block: '${block.name}', error });
      throw error;
    }`;

      // Generate subsequent blocks
      orchestration += this.generateBlockChain(block.id, connections, blocks, 1);
    }

    orchestration += `

    return {
      success: true,
      outputs: results,
      errors
    };
  } catch (error) {
    return {
      success: false,
      outputs: results,
      error: error instanceof Error ? error.message : 'Unknown error',
      errors
    };
  }
}`;

    return orchestration;
  }

  private generateBlockChain(
    blockId: string,
    connections: Connection[],
    blocks: Block[],
    depth: number
  ): string {
    const outgoingConnections = connections.filter(c => c.source === blockId);
    if (outgoingConnections.length === 0) return '';

    let code = '';
    const indent = '    '.repeat(depth + 1);

    for (const conn of outgoingConnections) {
      const targetBlock = blocks.find(b => b.id === conn.target);
      if (!targetBlock) continue;

      switch (conn.type) {
        case 'sequential':
          code += `\n${indent}// Sequential: ${blockId} -> ${conn.target}`;
          code += `\n${indent}const ${conn.target}_input = this.mapData(results['${blockId}'], ${JSON.stringify(conn.mapping || {})});`;
          code += `\n${indent}const ${conn.target}_result = await ${targetBlock.name}(${conn.target}_input);`;
          code += `\n${indent}results['${conn.target}'] = ${conn.target}_result;`;
          code += this.generateBlockChain(conn.target, connections, blocks, depth + 1);
          break;

        case 'conditional':
          code += `\n${indent}// Conditional: ${blockId} ? ${conn.target}`;
          code += `\n${indent}if (${conn.condition || 'true'}) {`;
          code += `\n${indent}  const ${conn.target}_result = await ${targetBlock.name}(results['${blockId}']);`;
          code += `\n${indent}  results['${conn.target}'] = ${conn.target}_result;`;
          code += this.generateBlockChain(conn.target, connections, blocks, depth + 2);
          code += `\n${indent}}`;
          break;

        case 'parallel':
          code += `\n${indent}// Parallel execution`;
          break;

        case 'fork':
          code += `\n${indent}// Fork: ${blockId} => ${conn.target}`;
          code += `\n${indent}${targetBlock.name}(results['${blockId}']).then(result => results['${conn.target}'] = result);`;
          break;
      }
    }

    return code;
  }

  private generateCompleteCode(
    blocks: Block[],
    connections: Connection[],
    blockInterfaces: string,
    orchestration: string
  ): string {
    return `// Generated BlockFlow Code
// Generated at: ${new Date().toISOString()}

${blockInterfaces}

${orchestration}

// Helper function to map data between blocks
function mapData(source: any, mapping: Record<string, string>): any {
  if (!mapping || Object.keys(mapping).length === 0) {
    return source;
  }

  const result: any = {};
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    const keys = sourcePath.split('.');
    let value = source;
    for (const key of keys) {
      value = value?.[key];
    }
    result[targetKey] = value;
  }
  return result;
}

// Export
export { executeFlow };
`;
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

  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      integer: 'number',
      float: 'number',
      boolean: 'boolean',
      array: 'any[]',
      object: 'any',
      email: 'string',
      timestamp: 'string',
      uuid: 'string'
    };

    return typeMap[type] || 'any';
  }
}
