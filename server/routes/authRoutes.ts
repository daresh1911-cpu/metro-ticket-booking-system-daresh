/**
 * MetroX 3D — Authentication API Routes
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { inMemoryDB } from '../db/connection.js';
import { generateToken, requireAuth, loginRateLimiter, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, password, confirm_password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }

    // Check duplicate
    const existing = inMemoryDB.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = {
      user_id: inMemoryDB.users.length + 1,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password_hash,
      role: 'passenger' as const,
      account_status: 'active' as const,
      created_at: new Date().toISOString(),
    };

    inMemoryDB.users.push(newUser);

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account successfully created',
      token,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = inMemoryDB.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account has been deactivated or suspended' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Authentication error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = inMemoryDB.users.find((u) => u.user_id === req.user?.user_id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  return res.json({
    success: true,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      account_status: user.account_status,
      created_at: user.created_at,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully' });
});

export default router;
