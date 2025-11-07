import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Diagram } from '@shared/types';
import BlockCanvas from '@/components/BlockCanvas';
import CodeViewer from '@/components/CodeViewer';
import BlockLibrary from '@/components/BlockLibrary';
import { ArrowLeft, Save, Play } from 'lucide-react';

export default function DiagramEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadDiagram(id);
    }
  }, [id]);

  const loadDiagram = async (diagramId: string) => {
    try {
      const { data } = await api.get(`/diagrams/${diagramId}`);
      setDiagram(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveDiagram = async () => {
    if (!diagram) return;

    setSaving(true);
    try {
      await api.put(`/diagrams/${diagram.id}`, {
        name: diagram.name,
        description: diagram.description,
        blocks: diagram.blocks,
        connections: diagram.connections,
        config: diagram.config,
      });

      toast({
        title: 'Success',
        description: 'Diagram saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const executeFlow = async () => {
    if (!diagram) return;

    setExecuting(true);
    try {
      // First save the diagram
      await saveDiagram();

      // Then execute
      const { data } = await api.post('/execute', {
        diagramId: diagram.id,
        inputs: {},
        testCases: [],
      });

      setGeneratedCode(data.generatedCode?.code || '');
      setExecutionResult(data);

      toast({
        title: data.success ? 'Success' : 'Error',
        description: data.success
          ? 'Flow executed successfully'
          : data.error || 'Execution failed',
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const updateDiagram = useCallback((updates: Partial<Diagram>) => {
    setDiagram((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading diagram...</div>
      </div>
    );
  }

  if (!diagram) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{diagram.name}</h1>
            <p className="text-sm text-gray-500">{diagram.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={saveDiagram}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={executeFlow}
            disabled={executing}
          >
            <Play className="w-4 h-4 mr-2" />
            {executing ? 'Running...' : 'Run'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Block Diagram Editor */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex">
              {/* Block Library Sidebar */}
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                <BlockLibrary diagram={diagram} updateDiagram={updateDiagram} />
              </div>

              {/* Canvas */}
              <div className="flex-1 bg-gray-100">
                <BlockCanvas diagram={diagram} updateDiagram={updateDiagram} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

          {/* Right Panel - Code Viewer and Test Runner */}
          <Panel defaultSize={40} minSize={20}>
            <CodeViewer
              code={generatedCode}
              executionResult={executionResult}
              diagram={diagram}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
