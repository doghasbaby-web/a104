import { useState } from 'react';
import { Button } from './ui/button';
import type { Diagram, Block } from '@shared/types';
import { Plus, Box, Layers, Database } from 'lucide-react';

interface BlockLibraryProps {
  diagram: Diagram;
  updateDiagram: (updates: Partial<Diagram>) => void;
}

export default function BlockLibrary({ diagram, updateDiagram }: BlockLibraryProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [blockType, setBlockType] = useState<'block' | 'composite' | 'stateful'>('block');

  const blockTemplates = [
    {
      name: 'Data Fetcher',
      type: 'block' as const,
      language: 'javascript',
      inputs: { url: 'string', params: 'object' },
      outputs: { data: 'object', status: 'integer' },
      icon: Database,
    },
    {
      name: 'Data Processor',
      type: 'block' as const,
      language: 'python',
      inputs: { data: 'array' },
      outputs: { processed: 'array', count: 'integer' },
      icon: Box,
    },
    {
      name: 'Validator',
      type: 'block' as const,
      language: 'javascript',
      inputs: { input: 'any' },
      outputs: { valid: 'boolean', errors: 'array' },
      icon: Layers,
    },
  ];

  const createBlock = (template?: typeof blockTemplates[0]) => {
    const name = template?.name || newBlockName || 'New Block';

    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template?.type || blockType,
      name,
      language: template?.language || 'javascript',
      inputs: template?.inputs || { input: 'string' },
      outputs: template?.outputs || { output: 'string' },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
    };

    updateDiagram({
      blocks: [...diagram.blocks, newBlock],
    });

    setNewBlockName('');
    setShowCreateForm(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Block Library</h3>

        <div className="space-y-2">
          {blockTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.name}
                onClick={() => createBlock(template)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">{template.name}</span>
                </div>
                <div className="text-xs text-gray-500">{template.language}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Custom Block
          </Button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              placeholder="Block name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="block">Block</option>
              <option value="composite">Composite</option>
              <option value="stateful">Stateful</option>
            </select>

            <div className="flex gap-2">
              <Button onClick={() => createBlock()} size="sm" className="flex-1">
                Create
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-semibold">Diagram Stats:</div>
          <div>{diagram.blocks.length} blocks</div>
          <div>{diagram.connections.length} connections</div>
        </div>
      </div>
    </div>
  );
}
