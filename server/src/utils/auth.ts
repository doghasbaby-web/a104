import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db, { generateId } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email);

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate user ID
  const userId = generateId();

  // Create user
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash)
    VALUES (?, ?, ?)
  `);
  insertUser.run(userId, email, passwordHash);

  // Create profile
  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, email, full_name)
    VALUES (?, ?, ?)
  `);
  insertProfile.run(userId, email, fullName || null);

  // Get created user
  const user = db
    .prepare('SELECT id, email, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as User;

  // Generate token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user, token };
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Get user
  const user = db
    .prepare('SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?')
    .get(email) as any;

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    token,
  };
}

/**
 * Verify JWT token and return user
 */
export function verifyToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  const user = db
    .prepare('SELECT id, email, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as User | undefined;

  return user || null;
}
