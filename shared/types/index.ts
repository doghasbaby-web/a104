import { z } from 'zod';

// Block Types
export const BlockInputOutputSchema = z.record(z.string(), z.string());

export const BlockSchema = z.object({
  id: z.string(),
  type: z.enum(['block', 'composite', 'stateful']),
  name: z.string(),
  language: z.string().optional(),
  version: z.string().optional(),
  inputs: BlockInputOutputSchema,
  outputs: BlockInputOutputSchema,
  errors: z.array(z.string()).optional(),
  state: z.enum(['stateful', 'stateless']).optional(),
  sideEffects: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  internal: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.any().optional()
});

export type Block = z.infer<typeof BlockSchema>;

// Connection Types (edges between blocks)
export const ConnectionTypeSchema = z.enum([
  'sequential',    // ->
  'parallel',      // ||
  'conditional',   // ?
  'loop',          // @repeat
  'merge',         // +
  'fork'           // =>
]);

export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;

export const ConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: ConnectionTypeSchema,
  condition: z.string().optional(),
  mapping: z.record(z.string(), z.string()).optional(),
  transform: z.record(z.string(), z.string()).optional()
});

export type Connection = z.infer<typeof ConnectionSchema>;

// Flow/Diagram Types
export const DiagramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  userId: z.string(),
  blocks: z.array(BlockSchema),
  connections: z.array(ConnectionSchema),
  config: z.object({
    environment: z.string().optional(),
    logging: z.string().optional(),
    monitoring: z.boolean().optional(),
    retryPolicy: z.object({
      maxAttempts: z.number(),
      backoff: z.string(),
      initialDelay: z.string()
    }).optional(),
    timeout: z.record(z.string(), z.string()).optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Diagram = z.infer<typeof DiagramSchema>;

// Test Types
export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  diagramId: z.string(),
  blockId: z.string().optional(),
  inputs: z.record(z.string(), z.any()),
  expectedOutputs: z.record(z.string(), z.any()),
  description: z.string().optional()
});

export type TestCase = z.infer<typeof TestCaseSchema>;

export const TestResultSchema = z.object({
  testCaseId: z.string(),
  passed: z.boolean(),
  actualOutputs: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  executionTime: z.number(),
  timestamp: z.string()
});

export type TestResult = z.infer<typeof TestResultSchema>;

// Code Generation Types
export const GeneratedCodeSchema = z.object({
  diagramId: z.string(),
  language: z.string(),
  code: z.string(),
  orchestrationCode: z.string().optional(),
  timestamp: z.string()
});

export type GeneratedCode = z.infer<typeof GeneratedCodeSchema>;

// API Request/Response Types
export const CreateDiagramRequestSchema = DiagramSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CreateDiagramRequest = z.infer<typeof CreateDiagramRequestSchema>;

export const UpdateDiagramRequestSchema = DiagramSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});

export type UpdateDiagramRequest = z.infer<typeof UpdateDiagramRequestSchema>;

export const ExecuteFlowRequestSchema = z.object({
  diagramId: z.string(),
  inputs: z.record(z.string(), z.any()),
  testCases: z.array(TestCaseSchema).optional()
});

export type ExecuteFlowRequest = z.infer<typeof ExecuteFlowRequestSchema>;

export const ExecuteFlowResponseSchema = z.object({
  success: z.boolean(),
  outputs: z.record(z.string(), z.any()).optional(),
  generatedCode: GeneratedCodeSchema.optional(),
  testResults: z.array(TestResultSchema).optional(),
  error: z.string().optional(),
  executionTime: z.number()
});

export type ExecuteFlowResponse = z.infer<typeof ExecuteFlowResponseSchema>;

// BlockFlow Language AST Types
export interface BlockFlowAST {
  version: string;
  blocks: BlockDefinition[];
  flows: FlowDefinition[];
  types?: TypeDefinition[];
  config?: ConfigDefinition;
}

export interface BlockDefinition {
  type: 'block' | 'composite' | 'stateful';
  name: string;
  language?: string;
  version?: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  errors?: string[];
  state?: string;
  sideEffects?: string[];
  dependencies?: string[];
  internal?: string;
}

export interface FlowDefinition {
  name: string;
  start: string;
  steps: FlowStep[];
  mapping?: Record<string, string | string[]>;
  errorHandling?: Record<string, ErrorHandler>;
  timeout?: Record<string, string>;
}

export interface FlowStep {
  type: 'sequential' | 'parallel' | 'conditional' | 'loop' | 'merge' | 'fork';
  blocks: string[];
  condition?: string;
  next?: FlowStep[];
}

export interface ErrorHandler {
  action: string;
  maxRetries?: number;
}

export interface TypeDefinition {
  name: string;
  fields: Record<string, string>;
}

export interface ConfigDefinition {
  environment?: string;
  logging?: string;
  monitoring?: boolean;
  retryPolicy?: {
    maxAttempts: number;
    backoff: string;
    initialDelay: string;
  };
  circuitBreaker?: {
    failureThreshold: number;
    timeout: string;
    resetAfter: string;
  };
}
