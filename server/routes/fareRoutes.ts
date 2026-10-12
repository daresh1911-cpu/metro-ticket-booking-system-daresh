/**
 * MetroX 3D — Fare Calculation API Routes
 */

import { Router, Request, Response } from 'express';
import { inMemoryDB } from '../db/connection.js';

const router = Router();

// POST /api/fares/calculate
router.post('/calculate', (req: Request, res: Response) => {
  try {
    const { source_id, destination_id, passenger_count, pricing_method } = req.body;

    const srcId = parseInt(source_id, 10);
    const dstId = parseInt(destination_id, 10);
    const count = parseInt(passenger_count, 10) || 1;
    const method = pricing_method === 'distance_based' ? 'distance_based' : 'stop_based';

    if (isNaN(srcId) || isNaN(dstId)) {
      return res.status(400).json({ success: false, error: 'Valid source_id and destination_id are required' });
    }

    if (srcId === dstId) {
      return res.status(400).json({ success: false, error: 'Source and destination cannot be identical' });
    }

    const calc = inMemoryDB.sp_calculate_fare(srcId, dstId, count, method);

    res.json({
      success: true,
      data: {
        source_id: srcId,
        destination_id: dstId,
        passenger_count: count,
        pricing_method: calc.pricing_method,
        stops: calc.stops,
        fare_per_passenger: calc.fare_per_passenger,
        total_fare: calc.total_fare,
        currency: 'INR',
        applied_policy_version: 'METROX_POLICY_2026_V1',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Fare calculation failed' });
  }
});

export default router;
