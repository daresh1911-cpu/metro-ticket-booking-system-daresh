/**
 * MetroX 3D — Booking API Routes
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { inMemoryDB } from '../db/connection.js';
import { requireAuth, AuthenticatedRequest, generateToken } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'metrox_super_secret_jwt_key_2026';
const router = Router();

// In-memory idempotency cache for duplicate request prevention
const processedRequests = new Set<string>();

// POST /api/bookings
router.post('/', (req: Request, res: Response) => {
  try {
    let userId: number = 2; // Default to demo passenger (Aarav Sharma)

    // Check token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.user_id) {
          userId = decoded.user_id;
        }
      } catch (e) {
        // Fallback to guest details if token is expired/invalid
      }
    }

    const {
      source_station_id,
      destination_station_id,
      schedule_id,
      travel_date,
      passenger_count,
      pricing_method,
      payment_method,
      idempotency_key,
      passenger_name,
      passenger_email,
      passenger_phone,
    } = req.body;

    // If explicit guest info provided and user was not already authenticated
    if (passenger_email && (!authHeader || !authHeader.startsWith('Bearer '))) {
      let existingUser = inMemoryDB.users.find(
        (u) => u.email.toLowerCase() === passenger_email.trim().toLowerCase()
      );
      if (!existingUser) {
        const salt = bcrypt.genSaltSync(10);
        existingUser = {
          user_id: inMemoryDB.users.length + 1,
          full_name: passenger_name?.trim() || 'Passenger',
          email: passenger_email.trim().toLowerCase(),
          phone: passenger_phone?.trim() || '+91 91234 56789',
          password_hash: bcrypt.hashSync('Metro@123', salt),
          role: 'passenger',
          account_status: 'active',
          created_at: new Date().toISOString(),
        };
        inMemoryDB.users.push(existingUser);
      }
      userId = existingUser.user_id;
    }

    // Idempotency check to prevent duplicate form submissions
    if (idempotency_key) {
      if (processedRequests.has(idempotency_key)) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate booking submission detected. Request has already been processed.',
        });
      }
      processedRequests.add(idempotency_key);
      // Clean up idempotency key after 10 minutes
      setTimeout(() => processedRequests.delete(idempotency_key), 10 * 60 * 1000);
    }

    const srcId = parseInt(source_station_id, 10);
    const dstId = parseInt(destination_station_id, 10);
    const pCount = Math.max(1, parseInt(passenger_count, 10) || 1);
    const schedId = schedule_id ? parseInt(schedule_id, 10) : null;
    const date = travel_date || new Date().toISOString().split('T')[0];

    if (isNaN(srcId) || isNaN(dstId)) {
      return res.status(400).json({ success: false, error: 'Valid source and destination stations are required' });
    }

    if (srcId === dstId) {
      return res.status(400).json({ success: false, error: 'Source and destination stations cannot be identical' });
    }

    // Server-side authoritative fare calculation
    const fareResult = inMemoryDB.sp_calculate_fare(srcId, dstId, pCount, pricing_method || 'stop_based');

    // Create booking and ticket via atomic transaction
    const bookingDetails = inMemoryDB.createBookingTransaction({
      userId,
      scheduleId: schedId,
      sourceStationId: srcId,
      destinationStationId: dstId,
      travelDate: date,
      passengerCount: pCount,
      farePerPassenger: fareResult.fare_per_passenger,
      totalFare: fareResult.total_fare,
      paymentMethod: payment_method || 'demo_simulation',
    });

    const userObj = inMemoryDB.users.find((u) => u.user_id === userId);
    const token = userObj ? generateToken(userObj) : null;

    return res.status(201).json({
      success: true,
      message: 'Booking successfully confirmed and electronic ticket issued',
      data: bookingDetails,
      token,
      user: userObj
        ? {
            user_id: userObj.user_id,
            full_name: userObj.full_name,
            email: userObj.email,
            phone: userObj.phone,
            role: userObj.role,
          }
        : null,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Booking creation failed' });
  }
});

// GET /api/bookings/my
router.get('/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.user_id;
  const userBookings = inMemoryDB.bookings
    .filter((b) => b.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((b) => inMemoryDB.sp_get_booking_details(b.booking_reference));

  return res.json({
    success: true,
    data: userBookings,
  });
});

// GET /api/bookings/:reference
router.get('/:reference', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const ref = req.params.reference;
  const booking = inMemoryDB.sp_get_booking_details(ref);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  // Security check: passenger can only view their own bookings; admins can view all
  if (booking.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to view this booking' });
  }

  return res.json({
    success: true,
    data: booking,
  });
});

// POST /api/bookings/:reference/cancel
router.post('/:reference/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const ref = req.params.reference;
    const { cancellation_reason } = req.body;

    const cancelResult = inMemoryDB.cancelBookingTransaction(
      ref,
      req.user!.user_id,
      cancellation_reason || 'Passenger requested cancellation'
    );

    return res.json({
      success: true,
      message: `Booking cancelled successfully. Refund of ₹${cancelResult.refund_amount} (${cancelResult.refund_percent}%) recorded.`,
      data: cancelResult,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Cancellation failed' });
  }
});

export default router;
