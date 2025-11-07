import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { Block } from '@shared/types';

interface BlockNodeData {
  block: Block;
}

function BlockNode({ data }: NodeProps<BlockNodeData>) {
  const { block } = data;

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'block':
        return 'bg-blue-500';
      case 'composite':
        return 'bg-purple-500';
      case 'stateful':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-gray-200 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getBlockColor(block.type)}`} />
        <div className="font-bold text-sm text-gray-900">{block.name}</div>
      </div>

      {block.language && (
        <div className="text-xs text-gray-500 mb-2">
          Language: {block.language}
        </div>
      )}

      <div className="text-xs space-y-1">
        {Object.keys(block.inputs).length > 0 && (
          <div>
            <div className="font-semibold text-gray-700">Inputs:</div>
            <div className="text-gray-600">
              {Object.entries(block.inputs).map(([key, type]) => (
                <div key={key}>
                  {key}: {type}
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(block.outputs).length > 0 && (
          <div className="mt-1">
            <div className="font-semibold text-gray-700">Outputs:</div>
            <div className="text-gray-600">
              {Object.entries(block.outputs).map(([key, type]) => (
                <div key={key}>
                  {key}: {type}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

export default memo(BlockNode);
