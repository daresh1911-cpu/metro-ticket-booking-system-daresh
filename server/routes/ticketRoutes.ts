/**
 * MetroX 3D — Electronic Ticket & QR Verification API Routes
 */

import { Router, Request, Response } from 'express';
import { inMemoryDB } from '../db/connection.js';

const router = Router();

// GET /api/tickets/:reference
router.get('/:reference', (req: Request, res: Response) => {
  const ref = req.params.reference;
  const booking = inMemoryDB.sp_get_booking_details(ref);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Ticket not found' });
  }

  // Construct secure ticket payload
  const ticketData = {
    booking_reference: booking.booking_reference,
    passenger_name: booking.passenger_name,
    source_station: {
      name: booking.source_station_name,
      code: booking.source_station_code,
    },
    destination_station: {
      name: booking.destination_station_name,
      code: booking.destination_station_code,
    },
    travel_date: booking.travel_date,
    scheduled_departure: booking.scheduled_departure,
    passenger_count: booking.passenger_count,
    total_amount: booking.total_fare,
    fare_per_passenger: booking.fare_per_passenger,
    ticket_status: booking.ticket_status,
    payment_status: booking.payment_status,
    payment_method: booking.payment_method,
    verification_token: booking.verification_token_hash,
    issued_at: booking.booked_at,
    // Opaque QR verification code for turnstile scanning
    qr_payload: JSON.stringify({
      t: 'METROX_E_TICKET',
      ref: booking.booking_reference,
      tok: booking.verification_token_hash,
      src: booking.source_station_code,
      dst: booking.destination_station_code,
      p: booking.passenger_count,
    }),
  };

  return res.json({
    success: true,
    data: ticketData,
  });
});

// POST /api/tickets/verify (QR code verification endpoint)
router.post('/verify', (req: Request, res: Response) => {
  try {
    const { token, reference } = req.body;

    if (!token && !reference) {
      return res.status(400).json({ success: false, error: 'Ticket token or reference is required for verification' });
    }

    let ticket: any = null;
    if (token) {
      ticket = inMemoryDB.tickets.find((t) => t.verification_token_hash === token);
    }

    let booking: any = null;
    if (ticket) {
      booking = inMemoryDB.bookings.find((b) => b.booking_id === ticket.booking_id);
    } else if (reference) {
      booking = inMemoryDB.bookings.find((b) => b.booking_reference === reference);
      if (booking) {
        ticket = inMemoryDB.tickets.find((t) => t.booking_id === booking.booking_id);
      }
    }

    if (!booking || !ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid ticket. No matching record located in MetroX database.',
      });
    }

    const details = inMemoryDB.sp_get_booking_details(booking.booking_reference);

    const isValid = ticket.ticket_status === 'valid' && booking.booking_status === 'confirmed';

    return res.json({
      success: true,
      valid: isValid,
      ticket_status: ticket.ticket_status,
      booking_status: booking.booking_status,
      booking_reference: booking.booking_reference,
      passenger_name: details?.passenger_name,
      source_station: details?.source_station_name,
      destination_station: details?.destination_station_name,
      travel_date: booking.travel_date,
      passengers: booking.passenger_count,
      verified_at: new Date().toISOString(),
      gate_access_granted: isValid,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Verification process failed' });
  }
});

// GET /api/tickets/:reference/pdf (Printable HTML view)
router.get('/:reference/pdf', (req: Request, res: Response) => {
  const ref = req.params.reference;
  const booking = inMemoryDB.sp_get_booking_details(ref);

  if (!booking) {
    return res.status(404).send('<h1>Ticket not found</h1>');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MetroX Electronic Ticket - ${booking.booking_reference}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0b1329; color: #f8fafc; padding: 40px; }
    .ticket-card { max-width: 600px; margin: 0 auto; background: #131d36; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0284c7, #0f172a); padding: 24px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; color: #ffffff; }
    .body { padding: 30px; }
    .route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #1e293b; }
    .station-title { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
    .val { font-size: 15px; font-weight: 600; color: #f1f5f9; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; background: #064e3b; color: #34d399; }
    .qr-box { text-align: center; padding: 20px; background: #0f172a; border-radius: 12px; margin-top: 20px; }
    @media print { body { background: #fff; color: #000; } .ticket-card { border: 1px solid #ccc; background: #fff; color: #000; } }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <h1>METROX 3D TRANSIT</h1>
      <span class="status-badge">${booking.ticket_status.toUpperCase()}</span>
    </div>
    <div class="body">
      <div class="route">
        <div>
          <div class="label">Origin</div>
          <div class="station-title">${booking.source_station_name}</div>
          <div style="color: #64748b;">${booking.source_station_code}</div>
        </div>
        <div style="font-size: 24px; color: #38bdf8;">→</div>
        <div style="text-align: right;">
          <div class="label">Destination</div>
          <div class="station-title">${booking.destination_station_name}</div>
          <div style="color: #64748b;">${booking.destination_station_code}</div>
        </div>
      </div>
      <div class="grid">
        <div>
          <div class="label">Booking Ref</div>
          <div class="val">${booking.booking_reference}</div>
        </div>
        <div>
          <div class="label">Passenger</div>
          <div class="val">${booking.passenger_name}</div>
        </div>
        <div>
          <div class="label">Travel Date</div>
          <div class="val">${booking.travel_date}</div>
        </div>
        <div>
          <div class="label">Departure</div>
          <div class="val">${booking.scheduled_departure}</div>
        </div>
        <div>
          <div class="label">Passengers</div>
          <div class="val">${booking.passenger_count} Adult(s)</div>
        </div>
        <div>
          <div class="label">Total Fare Paid</div>
          <div class="val">₹${booking.total_fare} (${(booking.payment_method || 'DEMO').toUpperCase()})</div>
        </div>
      </div>
      <div class="qr-box">
        <p style="font-size: 13px; color: #94a3b8; margin: 0 0 10px 0;">Scan at automated AFC entry barrier gates</p>
        <div style="font-family: monospace; font-size: 14px; color: #38bdf8; word-break: break-all;">
          TOKEN: ${booking.verification_token_hash}
        </div>
      </div>
    </div>
  </div>
  <script>
    if (window.location.search.includes('print=true')) {
      window.print();
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
