/**
 * MetroX 3D — Station API Routes
 */

import { Router, Request, Response } from 'express';
import { inMemoryDB, Station } from '../db/connection.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/stations
router.get('/', (_req: Request, res: Response) => {
  const stationsWithLines = inMemoryDB.stations.map((st) => {
    const lineIds = inMemoryDB.line_stations
      .filter((ls) => ls.station_id === st.station_id)
      .map((ls) => ls.line_id);
    const lines = inMemoryDB.metro_lines.filter((l) => lineIds.includes(l.line_id));
    return {
      ...st,
      lines,
    };
  });

  res.json({
    success: true,
    data: stationsWithLines,
  });
});

// GET /api/stations/:id
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const station = inMemoryDB.stations.find((s) => s.station_id === id);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found' });
  }

  const lineIds = inMemoryDB.line_stations
    .filter((ls) => ls.station_id === id)
    .map((ls) => ls.line_id);
  const lines = inMemoryDB.metro_lines.filter((l) => lineIds.includes(l.line_id));

  // Connected neighboring stations
  const connections = inMemoryDB.station_connections
    .filter((c) => c.from_station_id === id)
    .map((c) => {
      const neighbor = inMemoryDB.stations.find((s) => s.station_id === c.to_station_id);
      const line = inMemoryDB.metro_lines.find((l) => l.line_id === c.line_id);
      return {
        to_station: neighbor,
        line,
        travel_minutes: c.travel_minutes,
        distance_km: c.distance_km,
      };
    });

  res.json({
    success: true,
    data: {
      ...station,
      lines,
      connections,
    },
  });
});

// POST /api/admin/stations (Admin only)
router.post('/', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { station_name, station_code, latitude, longitude, is_interchange } = req.body;
  if (!station_name || !station_code) {
    return res.status(400).json({ success: false, error: 'Station name and code are required' });
  }

  const newStation: Station = {
    station_id: inMemoryDB.stations.length + 1,
    station_name: station_name.trim(),
    station_code: station_code.trim().toUpperCase(),
    latitude: parseFloat(latitude) || 19.1000,
    longitude: parseFloat(longitude) || 72.8700,
    status: 'active',
    is_interchange: Boolean(is_interchange),
  };

  inMemoryDB.stations.push(newStation);
  res.status(201).json({ success: true, data: newStation });
});

// PUT /api/admin/stations/:id (Admin only)
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const station = inMemoryDB.stations.find((s) => s.station_id === id);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found' });
  }

  if (req.body.station_name) station.station_name = req.body.station_name;
  if (req.body.status) station.status = req.body.status;
  if (req.body.is_interchange !== undefined) station.is_interchange = Boolean(req.body.is_interchange);

  res.json({ success: true, data: station });
});

export default router;
