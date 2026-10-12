-- ====================================================================
-- MetroX 3D — Advanced SQL Demonstration Scripts (Reports & Analytics)
-- ====================================================================

USE metrox_reservation;

-- --------------------------------------------------------------------
-- 1. INNER JOIN & LEFT JOIN Demonstration
-- Fetch all bookings with passenger profiles, stations, and payment mode
-- --------------------------------------------------------------------
SELECT 
  b.booking_reference,
  u.full_name AS passenger,
  u.email,
  src.station_name AS origin_station,
  dst.station_name AS destination_station,
  b.passenger_count,
  b.total_fare,
  b.booking_status,
  COALESCE(p.payment_method, 'unpaid') AS payment_method,
  COALESCE(p.payment_status, 'pending') AS payment_status
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN stations src ON b.source_station_id = src.station_id
INNER JOIN stations dst ON b.destination_station_id = dst.station_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
ORDER BY b.created_at DESC;

-- --------------------------------------------------------------------
-- 2. GROUP BY & Aggregation
-- Line-wise passenger traffic, revenue, and average booking value
-- --------------------------------------------------------------------
SELECT 
  ml.line_name,
  ml.line_code,
  COUNT(b.booking_id) AS total_trips,
  SUM(b.passenger_count) AS total_passengers_carried,
  SUM(b.total_fare) AS gross_line_revenue,
  ROUND(AVG(b.total_fare), 2) AS avg_fare_per_trip
FROM metro_lines ml
JOIN line_stations ls ON ml.line_id = ls.line_id
JOIN bookings b ON ls.station_id = b.source_station_id
WHERE b.booking_status != 'cancelled'
GROUP BY ml.line_id, ml.line_name, ml.line_code
ORDER BY gross_line_revenue DESC;

-- --------------------------------------------------------------------
-- 3. Stored Procedure Calls
-- Calculate fare between Central Station (ID 1) and Airport T2 (ID 8) for 2 passengers
-- --------------------------------------------------------------------
CALL sp_calculate_fare(1, 8, 2, 'stop_based', @unit_fare, @grand_total);
SELECT @unit_fare AS fare_per_passenger, @grand_total AS total_fare;

-- --------------------------------------------------------------------
-- 4. View Queries
-- Querying vw_booking_details, vw_daily_revenue, and vw_station_popularity
-- --------------------------------------------------------------------
SELECT * FROM vw_booking_details LIMIT 5;
SELECT * FROM vw_daily_revenue;
SELECT * FROM vw_station_popularity LIMIT 10;

-- --------------------------------------------------------------------
-- 5. ACID Transaction Demonstration: Atomic Booking & Payment with Capacity Check
-- --------------------------------------------------------------------
START TRANSACTION;

-- Step A: Check capacity for schedule and lock train row
SELECT t.train_id, t.capacity 
FROM schedules s
JOIN trains t ON s.train_id = t.train_id
WHERE s.schedule_id = 1 
FOR UPDATE;

-- Step B: Insert booking record
INSERT INTO bookings (
  booking_reference, 
  user_id, 
  schedule_id, 
  source_station_id, 
  destination_station_id, 
  travel_date, 
  passenger_count, 
  fare_per_passenger, 
  total_fare, 
  booking_status
) VALUES (
  'MX-TXN-DEMO-001', 
  2, 
  1, 
  1, 
  5, 
  CURDATE(), 
  1, 
  15.00, 
  15.00, 
  'confirmed'
);

SET @new_booking_id = LAST_INSERT_ID();

-- Step C: Record completed payment
INSERT INTO payments (
  booking_id, 
  amount, 
  payment_method, 
  payment_status, 
  provider_reference
) VALUES (
  @new_booking_id, 
  15.00, 
  'upi', 
  'completed', 
  'UPI-TXN-ATOMIC-001'
);

-- Step D: Issue Ticket with hash
INSERT INTO tickets (
  booking_id, 
  verification_token_hash, 
  ticket_status
) VALUES (
  @new_booking_id, 
  SHA2('MX-TXN-DEMO-001-TOKEN-SALT', 256), 
  'valid'
);

-- Commit transaction safely
COMMIT;
