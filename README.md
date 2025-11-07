# BlockFlow Builder

A visual block-based programming environment for the BlockFlow language. Design complex workflows using drag-and-drop blocks, generate executable code, and run tests in real-time.

![BlockFlow Builder](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Visual Block Editor**: Drag-and-drop interface for designing block diagrams
- **BlockFlow Language Support**: Full implementation of BlockFlow language specification
- **Real-time Code Generation**: Automatically generate JavaScript/TypeScript code from diagrams
- **Test Execution**: Run and test your flows directly in the browser
- **Split Panel Interface**:
  - **Left Panel**: Block diagram designer with library of reusable blocks
  - **Right Panel**: Generated code viewer and test execution results
- **Authentication**: Secure user authentication via Supabase
- **Persistent Storage**: Save and load diagrams from the cloud
- **Connection Types**: Support for sequential, parallel, conditional, loop, merge, and fork connections

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **ReactFlow** - Visual flow editor
- **Zustand** - State management

### Backend
- **Express** - API server
- **TypeScript** - Type safety
- **Supabase** - Database and authentication
- **Zod** - Schema validation

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A Supabase account and project

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd blockflow-builder
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for all workspaces (client, server, and shared).

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Navigate to the SQL Editor in your Supabase dashboard
4. Run the schema from `supabase/schema.sql` to create the database tables

### 4. Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Server Keys (for backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 5. Start the development servers

```bash
npm run dev
```

This will start both the client (on port 5173) and server (on port 3001) concurrently.

Alternatively, start them separately:

```bash
# Terminal 1 - Start the backend
npm run dev:server

# Terminal 2 - Start the frontend
npm run dev:client
```

### 6. Access the application

Open your browser and navigate to:

```
http://localhost:5173
```

## Usage

### Creating a New Diagram

1. **Sign up / Log in** to your account
2. Click **"New Diagram"** on the dashboard
3. You'll be taken to the diagram editor

### Building a Flow

1. **Add Blocks** from the left sidebar:
   - Click on pre-built templates (Data Fetcher, Data Processor, Validator)
   - Or create custom blocks using the "Custom Block" button

2. **Connect Blocks**:
   - Drag from the bottom handle of one block to the top handle of another
   - Connections represent data flow between blocks

3. **Configure Blocks**:
   - Each block shows its inputs and outputs
   - Block types are color-coded:
     - Blue: Standard block
     - Purple: Composite block
     - Green: Stateful block

### Running Your Flow

1. Click the **"Save"** button to save your diagram
2. Click the **"Run"** button to:
   - Generate executable code
   - Execute the flow
   - View results in the right panel

### Viewing Results

The right panel has three tabs:

1. **Generated Code**: View the JavaScript code generated from your diagram
2. **Execution**: See execution results, outputs, and any errors
3. **BlockFlow**: View the BlockFlow language representation of your diagram

## BlockFlow Language

BlockFlow is a meta-language for visual programming. Key concepts:

### Block Definition

```blockflow
@block UserAuthenticator {
  language: "javascript"
  inputs: {
    username: string
    password: string
  }
  outputs: {
    token: string
    success: boolean
  }
  internal: "./auth.js"
}
```

### Connection Types

- `->` Sequential flow
- `||` Parallel execution
- `?` Conditional branching
- `@repeat` Loop
- `+` Merge multiple inputs
- `=>` Fork to multiple outputs

### Example Flow

```blockflow
@flow CheckoutProcess {
  CartValidator -> PaymentProcessor -> ? success {
    true: OrderConfirmation
    false: ErrorHandler
  }
}
```

## Project Structure

```
blockflow-builder/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configs
│   │   └── hooks/          # Custom React hooks
│   └── package.json
│
├── server/                 # Backend Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities
│   └── package.json
│
├── shared/                 # Shared types and schemas
│   └── types/
│       └── index.ts        # TypeScript types
│
├── supabase/
│   └── schema.sql          # Database schema
│
└── package.json            # Root package.json
```

## API Endpoints

### Diagrams

- `GET /api/diagrams` - Get all diagrams for user
- `GET /api/diagrams/:id` - Get specific diagram
- `POST /api/diagrams` - Create new diagram
- `PUT /api/diagrams/:id` - Update diagram
- `DELETE /api/diagrams/:id` - Delete diagram

### Execution

- `POST /api/execute` - Execute a diagram flow
- `GET /api/execute/logs/:diagramId` - Get execution logs

### Tests

- `GET /api/tests/diagram/:diagramId` - Get tests for diagram
- `POST /api/tests` - Create test case
- `PUT /api/tests/:id` - Update test case
- `DELETE /api/tests/:id` - Delete test case
- `POST /api/tests/:id/run` - Run specific test
- `GET /api/tests/:id/results` - Get test results

### Code Generation

- `POST /api/codegen/generate` - Generate code from diagram
- `GET /api/codegen/:diagramId` - Get generated code

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run client tests
npm run test:client

# Run server tests
npm run test:server
```

### Building for Production

```bash
npm run build
```

This builds both client and server applications.

### Code Style

The project uses ESLint and TypeScript for code quality:

```bash
# Lint code
npm run lint

# Type check
npm run type-check
```

## Deployment

### Frontend (Vercel/Netlify)

1. Build the client: `npm run build --workspace=client`
2. Deploy the `client/dist` directory
3. Set environment variables for Supabase

### Backend (Railway/Render/Heroku)

1. Build the server: `npm run build --workspace=server`
2. Deploy the `server` directory
3. Set environment variables
4. Ensure the start script runs `node dist/index.js`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Port Already in Use

If ports 3001 or 5173 are already in use:

```bash
# Change server port in .env
PORT=3002

# Change client port in client/vite.config.ts
server: { port: 5174 }
```

### Supabase Connection Issues

- Verify your Supabase URL and keys in `.env`
- Check that RLS policies are properly set up
- Ensure the database schema has been applied

### Module Resolution Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
npm install
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the BlockFlow language specification

## Roadmap

- [ ] Real-time collaboration
- [ ] Block marketplace for sharing templates
- [ ] More language targets (Python, Go, Rust)
- [ ] Visual debugging with step-through execution
- [ ] Import/export diagrams as BlockFlow files
- [ ] Custom block implementations
- [ ] Version control for diagrams
- [ ] Performance monitoring and analytics

---

Built with ❤️ using React, Express, and Supabase
