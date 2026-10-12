/**
 * MetroX 3D — Payment Simulation & Processing API Routes
 */

import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/payments/initialize
router.post('/initialize', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { amount, method } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
  }

  const orderId = `ORD-METROX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  res.json({
    success: true,
    data: {
      order_id: orderId,
      amount,
      currency: 'INR',
      method: method || 'demo_simulation',
      is_simulated_environment: true,
      simulation_notice: 'This is a demo payment flow. No real financial transaction will occur.',
    },
  });
});

// POST /api/payments/confirm
router.post('/confirm', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { order_id, payment_method, simulate_failure } = req.body;

  if (simulate_failure) {
    return res.status(402).json({
      success: false,
      error: 'Payment authorization declined by simulated gateway (Test Failure Triggered).',
    });
  }

  const providerRef = `${(payment_method || 'DEMO').toUpperCase()}-REF-${Math.floor(100000000 + Math.random() * 900000000)}`;

  res.json({
    success: true,
    message: 'Payment verified and confirmed',
    data: {
      order_id,
      payment_status: 'completed',
      provider_reference: providerRef,
      confirmed_at: new Date().toISOString(),
    },
  });
});

export default router;
