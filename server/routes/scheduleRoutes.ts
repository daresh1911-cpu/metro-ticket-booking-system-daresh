/**
 * MetroX 3D — Schedule API Routes
 */

import { Router, Request, Response } from 'express';
import { inMemoryDB } from '../db/connection.js';

const router = Router();

// GET /api/schedules
router.get('/', (req: Request, res: Response) => {
  const lineId = req.query.line_id ? parseInt(req.query.line_id as string, 10) : null;

  let schedules = inMemoryDB.schedules;
  if (lineId) {
    schedules = schedules.filter((s) => s.line_id === lineId);
  }

  const enriched = schedules.map((s) => {
    const train = inMemoryDB.trains.find((t) => t.train_id === s.train_id);
    const line = inMemoryDB.metro_lines.find((l) => l.line_id === train?.line_id);
    return {
      ...s,
      train_code: train?.train_code,
      capacity: train?.capacity,
      line_name: line?.line_name,
      line_color: line?.line_color,
    };
  });

  res.json({
    success: true,
    data: enriched,
  });
});

export default router;
