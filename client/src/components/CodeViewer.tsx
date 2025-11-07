import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import type { Diagram } from '@shared/types';
import { Code, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';

interface CodeViewerProps {
  code: string;
  executionResult: any;
  diagram: Diagram;
}

export default function CodeViewer({ code, executionResult, diagram }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState('code');

  useEffect(() => {
    if (code) {
      Prism.highlightAll();
    }
  }, [code]);

  const renderExecutionResult = () => {
    if (!executionResult) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <TestTube className="w-12 h-12 mb-4" />
          <p>Click "Run" to execute the flow</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          {executionResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="font-semibold">
            {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
          </span>
        </div>

        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Execution time: {executionResult.executionTime}ms</span>
          </div>

          {executionResult.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="font-semibold text-red-900 mb-1">Error:</div>
              <div className="text-red-700 text-sm font-mono">{executionResult.error}</div>
            </div>
          )}

          {executionResult.outputs && (
            <div>
              <div className="font-semibold text-gray-900 mb-2">Outputs:</div>
              <pre className="p-3 bg-gray-100 border border-gray-200 rounded-md overflow-auto text-xs">
                {JSON.stringify(executionResult.outputs, null, 2)}
              </pre>
            </div>
          )}

          {executionResult.testResults && executionResult.testResults.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-2">Test Results:</div>
              <div className="space-y-2">
                {executionResult.testResults.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      result.passed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        Test {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-xs text-red-700">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 px-4">
          <TabsList>
            <TabsTrigger value="code">
              <Code className="w-4 h-4 mr-2" />
              Generated Code
            </TabsTrigger>
            <TabsTrigger value="execution">
              <TestTube className="w-4 h-4 mr-2" />
              Execution
            </TabsTrigger>
            <TabsTrigger value="blockflow">
              <Code className="w-4 h-4 mr-2" />
              BlockFlow
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="code" className="h-full m-0 p-0">
            {code ? (
              <div className="p-4">
                <pre className="text-sm">
                  <code className="language-javascript">{code}</code>
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Code className="w-12 h-12 mb-4" />
                <p>Click "Run" to generate code</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="execution" className="h-full m-0 p-0">
            {renderExecutionResult()}
          </TabsContent>

          <TabsContent value="blockflow" className="h-full m-0 p-0">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">BlockFlow Definition</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Current diagram represented in BlockFlow language
                </p>
              </div>

              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto">
                <code>
                  {`# BlockFlow Definition
# Diagram: ${diagram.name}

${diagram.blocks
  .map(
    (block) => `@block ${block.name} {
  type: "${block.type}"
  language: "${block.language || 'javascript'}"

  inputs: {
${Object.entries(block.inputs)
  .map(([key, type]) => `    ${key}: ${type}`)
  .join('\n')}
  }

  outputs: {
${Object.entries(block.outputs)
  .map(([key, type]) => `    ${key}: ${type}`)
  .join('\n')}
  }

  internal: "${block.internal || './implementations/' + block.name.toLowerCase() + '.js'}"
}`
  )
  .join('\n\n')}

${
  diagram.connections.length > 0
    ? `
@flow MainFlow {
  start: ${diagram.blocks[0]?.name || 'StartBlock'}

  ${diagram.connections
    .map((conn) => {
      const sourceBlock = diagram.blocks.find((b) => b.id === conn.source);
      const targetBlock = diagram.blocks.find((b) => b.id === conn.target);

      if (!sourceBlock || !targetBlock) return '';

      const operator = {
        sequential: '->',
        parallel: '||',
        conditional: '?',
        fork: '=>',
        merge: '+',
        loop: '@repeat',
      }[conn.type];

      return `${sourceBlock.name} ${operator} ${targetBlock.name}`;
    })
    .filter(Boolean)
    .join('\n  ')}
}`
    : '# No flow connections defined'
}
`}
                </code>
              </pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
