import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(__dirname, '../../data/app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table (replaces Supabase auth.users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Diagrams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS diagrams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      blocks TEXT NOT NULL DEFAULT '[]',
      connections TEXT NOT NULL DEFAULT '[]',
      config TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  // Test cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      diagram_id TEXT NOT NULL,
      block_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      inputs TEXT NOT NULL,
      expected_outputs TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
    );
  `);

  // Test results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      test_case_id TEXT NOT NULL,
      passed INTEGER NOT NULL,
      actual_outputs TEXT,
      error TEXT,
      execution_time INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
    );
  `);

  // Generated code table
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_code (
      id TEXT PRIMARY KEY,
      diagram_id TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      orchestration_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
    );
  `);

  // Block templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS block_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      block_type TEXT NOT NULL,
      language TEXT,
      inputs TEXT NOT NULL,
      outputs TEXT NOT NULL,
      internal TEXT,
      is_public INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  // Execution logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      diagram_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      inputs TEXT,
      outputs TEXT,
      error TEXT,
      execution_time INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON diagrams(user_id);
    CREATE INDEX IF NOT EXISTS idx_test_cases_diagram_id ON test_cases(diagram_id);
    CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);
    CREATE INDEX IF NOT EXISTS idx_generated_code_diagram_id ON generated_code(diagram_id);
    CREATE INDEX IF NOT EXISTS idx_block_templates_user_id ON block_templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_diagram_id ON execution_logs(diagram_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
  `);

  // Create triggers for auto-updating updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_updated_at_profiles
    AFTER UPDATE ON profiles
    FOR EACH ROW
    BEGIN
      UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_updated_at_diagrams
    AFTER UPDATE ON diagrams
    FOR EACH ROW
    BEGIN
      UPDATE diagrams SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_updated_at_test_cases
    AFTER UPDATE ON test_cases
    FOR EACH ROW
    BEGIN
      UPDATE test_cases SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_updated_at_block_templates
    AFTER UPDATE ON block_templates
    FOR EACH ROW
    BEGIN
      UPDATE block_templates SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  console.log('Database initialized successfully');
}

// Helper function to generate UUID
export function generateId(): string {
  return uuidv4();
}

export default db;
