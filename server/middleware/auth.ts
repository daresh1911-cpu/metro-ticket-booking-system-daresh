/**
 * MetroX 3D — Authentication & Authorization Middleware
 * Enforces JWT verification, rate limiting, and role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { inMemoryDB, User } from '../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'metrox_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: 'passenger' | 'admin';
    full_name: string;
  };
}

// Generate Auth Token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Rate Limiter for Login Protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10;

  const record = loginAttempts.get(ip);
  if (record) {
    if (now - record.lastAttempt > windowMs) {
      loginAttempts.set(ip, { count: 1, lastAttempt: now });
    } else {
      record.count += 1;
      record.lastAttempt = now;
      if (record.count > maxAttempts) {
        return res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please wait 5 minutes before trying again.',
        });
      }
    }
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  }

  next();
}

// Require Authenticated User Middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please sign in again.',
    });
  }
}

// Require Admin Role Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrative privileges are required for this endpoint.',
      });
    }
    next();
  });
}
