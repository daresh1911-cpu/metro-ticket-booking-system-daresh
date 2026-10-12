/**
 * MetroX 3D — Full-Stack Server Entry Point
 * Mounts Express API routes and Vite middlewares on port 3000.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabaseConnection } from './server/db/connection.js';

import authRoutes from './server/routes/authRoutes.js';
import stationRoutes from './server/routes/stationRoutes.js';
import routeRoutes from './server/routes/routeRoutes.js';
import fareRoutes from './server/routes/fareRoutes.js';
import scheduleRoutes from './server/routes/scheduleRoutes.js';
import bookingRoutes from './server/routes/bookingRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import ticketRoutes from './server/routes/ticketRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize DB Connection (Live MySQL if configured, otherwise embedded high-availability relational store)
  await initDatabaseConnection();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/stations', stationRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/fares', fareRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/admin', adminRoutes);

  // System Health & Info
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'MetroX 3D Transit Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handler (JSON response, safe from leaking secrets or raw stack traces)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'An unexpected internal error occurred. Please try again.',
    });
  });

  // Vite middleware in development, static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MetroX 3D server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
