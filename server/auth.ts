/**
 * MetroX 3D — JWT authentication helpers for Netlify Functions
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'metrox_super_secret_jwt_key_2026';

export interface SessionUser {
  user_id: number;
  email: string;
  role: 'passenger' | 'admin';
  full_name: string;
}

export function generateToken(user: { user_id: number; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hasBearer(req: Request): boolean {
  return (req.headers.get('authorization') || '').startsWith('Bearer ');
}

// Returns the decoded session, or null when the header is missing / invalid
export function getSessionUser(req: Request): SessionUser | null {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.split(' ')[1], JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

// Best-effort login throttling per function instance
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
export function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const record = loginAttempts.get(ip);
  if (!record || now - record.lastAttempt > windowMs) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }
  record.count += 1;
  record.lastAttempt = now;
  return record.count > 10;
}
