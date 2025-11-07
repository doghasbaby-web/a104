import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Diagram } from '@shared/types';
import { Plus, LogOut, FileCode } from 'lucide-react';

export default function Dashboard() {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDiagrams();
  }, []);

  const loadDiagrams = async () => {
    try {
      const { data } = await api.get('/diagrams');
      setDiagrams(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewDiagram = async () => {
    try {
      const { data } = await api.post('/diagrams', {
        name: `New Diagram ${diagrams.length + 1}`,
        description: 'A new BlockFlow diagram',
        blocks: [],
        connections: [],
      });

      navigate(`/diagram/${data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading diagrams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">BlockFlow Builder</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">My Diagrams</h2>
          <Button onClick={createNewDiagram}>
            <Plus className="w-4 h-4 mr-2" />
            New Diagram
          </Button>
        </div>

        {diagrams.length === 0 ? (
          <div className="text-center py-12">
            <FileCode className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No diagrams</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new diagram.</p>
            <div className="mt-6">
              <Button onClick={createNewDiagram}>
                <Plus className="w-4 h-4 mr-2" />
                New Diagram
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                onClick={() => navigate(`/diagram/${diagram.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{diagram.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{diagram.description || 'No description'}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{diagram.blocks.length} blocks</span>
                  <span className="mx-2">•</span>
                  <span>{diagram.connections.length} connections</span>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Updated {new Date(diagram.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
