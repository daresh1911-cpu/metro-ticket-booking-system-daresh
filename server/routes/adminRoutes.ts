/**
 * MetroX 3D — Administrative API Routes
 */

import { Router, Response } from 'express';
import { inMemoryDB, getDatabaseStatus } from '../db/connection.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const totalPassengers = inMemoryDB.users.filter((u) => u.role === 'passenger').length;
  const totalBookings = inMemoryDB.bookings.length;
  const confirmedBookings = inMemoryDB.bookings.filter((b) => b.booking_status === 'confirmed').length;
  const cancelledBookings = inMemoryDB.bookings.filter((b) => b.booking_status === 'cancelled').length;
  const todaysBookings = inMemoryDB.bookings.filter((b) => b.travel_date === today).length;

  const grossRevenue = inMemoryDB.payments
    .filter((p) => p.payment_status === 'completed' || p.payment_status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunds = inMemoryDB.cancellations
    .filter((c) => c.refund_status === 'processed')
    .reduce((sum, c) => sum + c.refund_amount, 0);

  const netRevenue = grossRevenue - totalRefunds;

  const popularStations = inMemoryDB.vw_station_popularity().slice(0, 5);
  const dailyRevenue = inMemoryDB.sp_get_daily_revenue();

  // Metro line distribution
  const lineStats = inMemoryDB.metro_lines.map((line) => {
    const lineStationIds = inMemoryDB.line_stations
      .filter((ls) => ls.line_id === line.line_id)
      .map((ls) => ls.station_id);

    const bookingCount = inMemoryDB.bookings.filter(
      (b) => lineStationIds.includes(b.source_station_id) && b.booking_status !== 'cancelled'
    ).length;

    return {
      line_id: line.line_id,
      line_name: line.line_name,
      line_color: line.line_color,
      booking_count: bookingCount,
    };
  });

  res.json({
    success: true,
    data: {
      metrics: {
        totalPassengers,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        todaysBookings,
        grossRevenue,
        totalRefunds,
        netRevenue,
      },
      charts: {
        dailyRevenue,
        lineStats,
        cancellationRatio: {
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
        },
      },
      popularStations,
    },
  });
});

// GET /api/admin/users
router.get('/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = inMemoryDB.users.map((u) => {
    const bookingCount = inMemoryDB.bookings.filter((b) => b.user_id === u.user_id).length;
    return {
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      account_status: u.account_status,
      created_at: u.created_at,
      total_bookings: bookingCount,
    };
  });

  res.json({ success: true, data: users });
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { account_status } = req.body;
  const user = inMemoryDB.users.find((u) => u.user_id === id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (user.role === 'admin' && user.user_id === req.user!.user_id) {
    return res.status(400).json({ success: false, error: 'Cannot alter your own administrative status' });
  }

  user.account_status = account_status;
  res.json({ success: true, message: `Account status updated to ${account_status}` });
});

// GET /api/admin/bookings
router.get('/bookings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const search = (req.query.q as string || '').toLowerCase();
  let list = inMemoryDB.bookings.map((b) => inMemoryDB.sp_get_booking_details(b.booking_reference));

  if (search) {
    list = list.filter(
      (b) =>
        b?.booking_reference.toLowerCase().includes(search) ||
        b?.passenger_name.toLowerCase().includes(search) ||
        b?.passenger_email.toLowerCase().includes(search)
    );
  }

  res.json({ success: true, data: list });
});

// GET /api/admin/database-stats
router.get('/database-stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const status = getDatabaseStatus();
  res.json({ success: true, data: status });
});

export default router;
