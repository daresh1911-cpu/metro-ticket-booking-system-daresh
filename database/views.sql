-- ========================================================
-- MetroX 3D — Advanced Database Views
-- ========================================================

USE metrox_reservation;

-- View 1: Complete Booking Details with Relational Joins
CREATE OR REPLACE VIEW vw_booking_details AS
SELECT 
  b.booking_id,
  b.booking_reference,
  b.user_id,
  u.full_name AS passenger_name,
  u.email AS passenger_email,
  u.phone AS passenger_phone,
  b.source_station_id,
  s_src.station_name AS source_station_name,
  s_src.station_code AS source_station_code,
  b.destination_station_id,
  s_dst.station_name AS destination_station_name,
  s_dst.station_code AS destination_station_code,
  b.travel_date,
  b.passenger_count,
  b.fare_per_passenger,
  b.total_fare,
  b.booking_status,
  b.created_at AS booked_at,
  COALESCE(sch.departure_time, '08:30:00') AS scheduled_departure,
  tr.train_code,
  p.payment_id,
  p.payment_method,
  p.payment_status,
  p.provider_reference AS payment_reference,
  p.paid_at,
  c.cancellation_id,
  c.refund_amount,
  c.refund_status,
  c.cancelled_at,
  t.ticket_id,
  t.verification_token_hash,
  t.ticket_status
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN stations s_src ON b.source_station_id = s_src.station_id
INNER JOIN stations s_dst ON b.destination_station_id = s_dst.station_id
LEFT JOIN schedules sch ON b.schedule_id = sch.schedule_id
LEFT JOIN trains tr ON sch.train_id = tr.train_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
LEFT JOIN cancellations c ON b.booking_id = c.booking_id
LEFT JOIN tickets t ON b.booking_id = t.booking_id;

-- View 2: Daily Revenue and Metrics
CREATE OR REPLACE VIEW vw_daily_revenue AS
SELECT 
  DATE(p.paid_at) AS revenue_date,
  COUNT(p.payment_id) AS total_transactions,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) AS gross_revenue,
  COALESCE(SUM(c.refund_amount), 0) AS total_refunds,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) - COALESCE(SUM(c.refund_amount), 0) AS net_revenue
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
LEFT JOIN cancellations c ON b.booking_id = c.booking_id AND c.refund_status = 'processed'
GROUP BY DATE(p.paid_at)
ORDER BY revenue_date DESC;

-- View 3: Station Popularity Ranking
CREATE OR REPLACE VIEW vw_station_popularity AS
SELECT 
  s.station_id,
  s.station_name,
  s.station_code,
  COUNT(DISTINCT src_b.booking_id) AS departure_count,
  COUNT(DISTINCT dst_b.booking_id) AS arrival_count,
  (COUNT(DISTINCT src_b.booking_id) + COUNT(DISTINCT dst_b.booking_id)) AS total_traffic
FROM stations s
LEFT JOIN bookings src_b ON s.station_id = src_b.source_station_id AND src_b.booking_status != 'cancelled'
LEFT JOIN bookings dst_b ON s.station_id = dst_b.destination_station_id AND dst_b.booking_status != 'cancelled'
GROUP BY s.station_id, s.station_name, s.station_code
ORDER BY total_traffic DESC;
