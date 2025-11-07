import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Diagram, Block, Connection as BlockConnection } from '@shared/types';
import BlockNode from './BlockNode';

interface BlockCanvasProps {
  diagram: Diagram;
  updateDiagram: (updates: Partial<Diagram>) => void;
}

export default function BlockCanvas({ diagram, updateDiagram }: BlockCanvasProps) {
  // Convert blocks to ReactFlow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      diagram.blocks.map((block) => ({
        id: block.id,
        type: 'blockNode',
        position: block.position,
        data: { block },
      })),
    [diagram.blocks]
  );

  // Convert connections to ReactFlow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      diagram.connections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        label: conn.type,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: { connection: conn },
      })),
    [diagram.connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      blockNode: BlockNode,
    }),
    []
  );

  // Handle node changes (position, selection, etc.)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Update diagram blocks with new positions
      const updatedBlocks = diagram.blocks.map((block) => {
        const node = nodes.find((n) => n.id === block.id);
        if (node) {
          return {
            ...block,
            position: node.position,
          };
        }
        return block;
      });

      updateDiagram({ blocks: updatedBlocks });
    },
    [diagram.blocks, nodes, onNodesChange, updateDiagram]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        type: 'smoothstep',
        label: 'sequential',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Add to diagram connections
      const newConnection: BlockConnection = {
        id: newEdge.id,
        source: connection.source!,
        target: connection.target!,
        type: 'sequential',
      };

      updateDiagram({
        connections: [...diagram.connections, newConnection],
      });
    },
    [diagram.connections, setEdges, updateDiagram]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((n) => n.id));
      const updatedBlocks = diagram.blocks.filter((b) => !deletedIds.has(b.id));
      const updatedConnections = diagram.connections.filter(
        (c) => !deletedIds.has(c.source) && !deletedIds.has(c.target)
      );

      updateDiagram({
        blocks: updatedBlocks,
        connections: updatedConnections,
      });
    },
    [diagram.blocks, diagram.connections, updateDiagram]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((e) => e.id));
      const updatedConnections = diagram.connections.filter((c) => !deletedIds.has(c.id));

      updateDiagram({ connections: updatedConnections });
    },
    [diagram.connections, updateDiagram]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
