/**
 * MetroX 3D — Route Planning API Routes
 */

import { Router, Request, Response } from 'express';
import { inMemoryDB } from '../db/connection.js';
import { routeService } from '../services/routeService.js';

const router = Router();

// GET /api/routes/search
router.get('/search', (req: Request, res: Response) => {
  try {
    const fromId = parseInt(req.query.from as string, 10);
    const toId = parseInt(req.query.to as string, 10);
    const passengers = parseInt(req.query.passengers as string, 10) || 1;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    if (isNaN(fromId) || isNaN(toId)) {
      return res.status(400).json({ success: false, error: 'Both from and to station IDs are required' });
    }

    if (fromId === toId) {
      return res.status(400).json({ success: false, error: 'Source and destination stations must be distinct' });
    }

    const routes = routeService.searchRoutes(fromId, toId, passengers, date);

    // Also attach matching schedules
    const availableSchedules = inMemoryDB.schedules.filter((s) => s.status === 'active');

    return res.json({
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        isSimulatedEstimates: true,
        simulationNote: 'Journey durations and interchange transfer buffer estimates calculated using graph edge traversal weights.',
      },
      routes,
      schedules: availableSchedules,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Route search failed' });
  }
});

// GET /api/routes/network
router.get('/network', (_req: Request, res: Response) => {
  const lines = inMemoryDB.metro_lines;
  const stations = inMemoryDB.stations.map((st) => {
    const linesPassing = inMemoryDB.line_stations
      .filter((ls) => ls.station_id === st.station_id)
      .map((ls) => inMemoryDB.metro_lines.find((l) => l.line_id === ls.line_id))
      .filter(Boolean);

    return {
      ...st,
      lines: linesPassing,
    };
  });

  const connections = inMemoryDB.station_connections.map((c) => ({
    connection_id: c.connection_id,
    from_station_id: c.from_station_id,
    to_station_id: c.to_station_id,
    travel_minutes: c.travel_minutes,
    distance_km: c.distance_km,
    line_id: c.line_id,
    line_color: inMemoryDB.metro_lines.find((l) => l.line_id === c.line_id)?.line_color || '#38bdf8',
  }));

  res.json({
    success: true,
    data: {
      lines,
      stations,
      connections,
    },
  });
});

export default router;
