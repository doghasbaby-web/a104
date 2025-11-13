import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../utils/auth';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // In development environment, bypass authentication and use default 'king' user
    // Default to development if NODE_ENV is not set
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      req.userId = 'king';
      req.user = {
        id: 'king',
        email: 'king@dev.local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        authorities: ['*'], // All authorities
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = verifyToken(token);

    // Get user from database
    const user = getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
