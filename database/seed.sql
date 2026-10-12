-- ========================================================
-- MetroX 3D — Comprehensive Seed Data (MySQL 8.0+)
-- ========================================================

USE metrox_reservation;

-- Disable Foreign Key Checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE favorite_stations;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE booking_status_history;
TRUNCATE TABLE tickets;
TRUNCATE TABLE cancellations;
TRUNCATE TABLE payments;
TRUNCATE TABLE bookings;
TRUNCATE TABLE fare_rules;
TRUNCATE TABLE schedule_stops;
TRUNCATE TABLE schedules;
TRUNCATE TABLE trains;
TRUNCATE TABLE station_connections;
TRUNCATE TABLE line_stations;
TRUNCATE TABLE stations;
TRUNCATE TABLE metro_lines;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users (Passwords: Admin@123, Metro@123 using bcrypt)
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, account_status) VALUES
(1, 'System Administrator', 'admin@metrox.internal', '+91 98765 43210', '$2b$10$wE8s0V01z8B2eW4NfFh.nO7ZgH5k8CgB0WlXz0P6t5D7X.2A7oX/2', 'admin', 'active'),
(2, 'Aarav Sharma', 'passenger@metrox.internal', '+91 91234 56789', '$2b$10$wE8s0V01z8B2eW4NfFh.nO7ZgH5k8CgB0WlXz0P6t5D7X.2A7oX/2', 'passenger', 'active'),
(3, 'Priya Nair', 'priya.nair@example.com', '+91 98111 22334', '$2b$10$wE8s0V01z8B2eW4NfFh.nO7ZgH5k8CgB0WlXz0P6t5D7X.2A7oX/2', 'passenger', 'active'),
(4, 'Vikram Mehta', 'vikram.m@example.com', '+91 98450 12345', '$2b$10$wE8s0V01z8B2eW4NfFh.nO7ZgH5k8CgB0WlXz0P6t5D7X.2A7oX/2', 'passenger', 'active');

-- 2. Metro Lines (Chennai Metro Rail Limited - CMRL)
INSERT INTO metro_lines (line_id, line_name, line_code, line_color, status) VALUES
(1, 'Blue Line (Corridor 1: Washermanpet to Chennai Airport)', 'L1', '#0284c7', 'active'),
(2, 'Green Line (Corridor 2: Chennai Central to St. Thomas Mount)', 'L2', '#10b981', 'active');

-- 3. Stations (41 Authentic Chennai Metro Rail Stations)
INSERT INTO stations (station_id, station_name, station_code, latitude, longitude, status, is_interchange) VALUES
(1, 'Washermanpet Metro', 'WPT', 13.1065, 80.2830, 'active', FALSE),
(2, 'Mannadi Metro', 'MND', 13.0970, 80.2880, 'active', FALSE),
(3, 'High Court Metro', 'HCT', 13.0878, 80.2872, 'active', FALSE),
(4, 'Puratchi Thalaivar Dr. M.G.R Central Metro', 'MAS', 13.0827, 80.2755, 'active', TRUE),
(5, 'Government Estate Metro', 'GVE', 13.0690, 80.2730, 'active', FALSE),
(6, 'LIC Metro', 'LIC', 13.0640, 80.2640, 'active', FALSE),
(7, 'Thousand Lights Metro', 'THL', 13.0583, 80.2528, 'active', FALSE),
(8, 'AG-DMS Metro', 'DMS', 13.0480, 80.2470, 'active', FALSE),
(9, 'Teynampet Metro', 'TYN', 13.0390, 80.2420, 'active', FALSE),
(10, 'Nandanam Metro', 'NDM', 13.0310, 80.2350, 'active', FALSE),
(11, 'Saidapet Metro', 'SDP', 13.0238, 80.2223, 'active', FALSE),
(12, 'Little Mount Metro', 'LMT', 13.0160, 80.2200, 'active', FALSE),
(13, 'Guindy Metro', 'GND', 13.0093, 80.2131, 'active', FALSE),
(14, 'Arignar Anna Alandur Metro', 'ALR', 13.0038, 80.2015, 'active', TRUE),
(15, 'Meenambakkam Metro', 'MBK', 12.9890, 80.1780, 'active', FALSE),
(16, 'Chennai International Airport Metro', 'MAA', 12.9806, 80.1636, 'active', FALSE),
(17, 'Egmore Metro', 'EGM', 13.0782, 80.2612, 'active', FALSE),
(18, 'Nehru Park Metro', 'NPK', 13.0790, 80.2510, 'active', FALSE),
(19, 'Kilpauk Medical College Metro', 'KMC', 13.0795, 80.2410, 'active', FALSE),
(20, 'Shenoy Nagar Metro', 'SNG', 13.0780, 80.2260, 'active', FALSE),
(21, 'Anna Nagar Tower Metro', 'ANT', 13.0858, 80.2120, 'active', FALSE),
(22, 'Thirumangalam Metro', 'TMG', 13.0855, 80.1990, 'active', FALSE),
(23, 'Koyambedu Metro', 'KYM', 13.0730, 80.1950, 'active', FALSE),
(24, 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', 'CBT', 13.0694, 80.1948, 'active', FALSE),
(25, 'Vadapalani Metro', 'VAD', 13.0504, 80.2121, 'active', FALSE),
(26, 'Ashok Nagar Metro', 'ASH', 13.0360, 80.2116, 'active', FALSE),
(27, 'St. Thomas Mount Metro', 'STM', 12.9950, 80.1985, 'active', FALSE),
(28, "Pachaiyappa's College Metro", 'PAC', 13.0768, 80.2335, 'active', FALSE),
(29, 'Anna Nagar East Metro', 'ANE', 13.0845, 80.2190, 'active', FALSE),
(30, 'Arumbakkam Metro', 'ABK', 13.0610, 80.2030, 'active', FALSE),
(31, 'Ekkattuthangal Metro', 'EKT', 13.0210, 80.2055, 'active', FALSE),
(32, 'Nanganallur Road (OTA) Metro', 'OTA', 12.9960, 80.1915, 'active', FALSE),
(33, 'Sir Theagaraya College Metro', 'STC', 13.1130, 80.2855, 'active', FALSE),
(34, 'Tondiarpet Metro', 'TDP', 13.1180, 80.2870, 'active', FALSE),
(35, 'New Washermanpet Metro', 'NWP', 13.1235, 80.2900, 'active', FALSE),
(36, 'Tollgate Metro', 'TLG', 13.1310, 80.2925, 'active', FALSE),
(37, 'Kaladipet Metro', 'KPT', 13.1400, 80.2960, 'active', FALSE),
(38, 'Tiruvottriyur Theradi Metro', 'TTD', 13.1490, 80.2985, 'active', FALSE),
(39, 'Tiruvottriyur Metro', 'TVT', 13.1600, 80.3005, 'active', FALSE),
(40, 'Wimco Nagar Metro', 'WMN', 13.1695, 80.3015, 'active', FALSE),
(41, 'Wimco Nagar Depot Metro', 'WND', 13.1790, 80.3060, 'active', FALSE);

-- 4. Line Stations
INSERT INTO line_stations (line_id, station_id, sequence_no, distance_from_previous_km) VALUES
(1, 41, 1, 0.00), (1, 40, 2, 1.10), (1, 39, 3, 1.20), (1, 38, 4, 1.30), (1, 37, 5, 1.20),
(1, 36, 6, 1.10), (1, 35, 7, 1.00), (1, 34, 8, 0.90), (1, 33, 9, 0.80), (1, 1, 10, 1.20),
(1, 2, 11, 1.40), (1, 3, 12, 1.20), (1, 4, 13, 1.50), (1, 5, 14, 1.60), (1, 6, 15, 1.10),
(1, 7, 16, 1.30), (1, 8, 17, 1.40), (1, 9, 18, 1.20), (1, 10, 19, 1.10), (1, 11, 20, 1.50),
(1, 12, 21, 1.00), (1, 13, 22, 1.40), (1, 14, 23, 1.80), (1, 32, 24, 1.30), (1, 15, 25, 1.50), (1, 16, 26, 1.90),
(2, 4, 1, 0.00), (2, 17, 2, 1.60), (2, 18, 3, 1.20), (2, 19, 4, 1.30), (2, 28, 5, 1.20),
(2, 20, 6, 1.10), (2, 29, 7, 1.30), (2, 21, 8, 1.40), (2, 22, 9, 1.30), (2, 23, 10, 1.40),
(2, 24, 11, 1.10), (2, 30, 12, 1.40), (2, 25, 13, 1.50), (2, 26, 14, 1.70), (2, 31, 15, 1.60), (2, 14, 16, 2.10), (2, 27, 17, 1.30);

-- 5. Station Connections (Bidirectional for route graph)
INSERT INTO station_connections (from_station_id, to_station_id, travel_minutes, distance_km, line_id) VALUES
(41, 40, 2, 1.10, 1), (40, 41, 2, 1.10, 1), (40, 39, 2, 1.20, 1), (39, 40, 2, 1.20, 1),
(39, 38, 2, 1.30, 1), (38, 39, 2, 1.30, 1), (38, 37, 2, 1.20, 1), (37, 38, 2, 1.20, 1),
(37, 36, 2, 1.10, 1), (36, 37, 2, 1.10, 1), (36, 35, 2, 1.00, 1), (35, 36, 2, 1.00, 1),
(35, 34, 2, 0.90, 1), (34, 35, 2, 0.90, 1), (34, 33, 2, 0.80, 1), (33, 34, 2, 0.80, 1),
(33, 1, 2, 1.20, 1), (1, 33, 2, 1.20, 1), (1, 2, 2, 1.40, 1), (2, 1, 2, 1.40, 1),
(2, 3, 2, 1.20, 1), (3, 2, 2, 1.20, 1), (3, 4, 3, 1.50, 1), (4, 3, 3, 1.50, 1),
(4, 5, 3, 1.60, 1), (5, 4, 3, 1.60, 1), (5, 6, 2, 1.10, 1), (6, 5, 2, 1.10, 1),
(6, 7, 2, 1.30, 1), (7, 6, 2, 1.30, 1), (7, 8, 2, 1.40, 1), (8, 7, 2, 1.40, 1),
(8, 9, 2, 1.20, 1), (9, 8, 2, 1.20, 1), (9, 10, 2, 1.10, 1), (10, 9, 2, 1.10, 1),
(10, 11, 3, 1.50, 1), (11, 10, 3, 1.50, 1), (11, 12, 2, 1.00, 1), (12, 11, 2, 1.00, 1),
(12, 13, 3, 1.40, 1), (13, 12, 3, 1.40, 1), (13, 14, 3, 1.80, 1), (14, 13, 3, 1.80, 1),
(14, 32, 2, 1.30, 1), (32, 14, 2, 1.30, 1), (32, 15, 2, 1.50, 1), (15, 32, 2, 1.50, 1),
(15, 16, 3, 1.90, 1), (16, 15, 3, 1.90, 1),
(4, 17, 3, 1.60, 2), (17, 4, 3, 1.60, 2), (17, 18, 2, 1.20, 2), (18, 17, 2, 1.20, 2),
(18, 19, 2, 1.30, 2), (19, 18, 2, 1.30, 2), (19, 28, 2, 1.20, 2), (28, 19, 2, 1.20, 2),
(28, 20, 2, 1.10, 2), (20, 28, 2, 1.10, 2), (20, 29, 2, 1.30, 2), (29, 20, 2, 1.30, 2),
(29, 21, 2, 1.40, 2), (21, 29, 2, 1.40, 2), (21, 22, 2, 1.30, 2), (22, 21, 2, 1.30, 2),
(22, 23, 2, 1.40, 2), (23, 22, 2, 1.40, 2), (23, 24, 2, 1.10, 2), (24, 23, 2, 1.10, 2),
(24, 30, 2, 1.40, 2), (30, 24, 2, 1.40, 2), (30, 25, 2, 1.50, 2), (25, 30, 2, 1.50, 2),
(25, 26, 3, 1.70, 2), (26, 25, 3, 1.70, 2), (26, 31, 2, 1.60, 2), (31, 26, 2, 1.60, 2),
(31, 14, 3, 2.10, 2), (14, 31, 3, 2.10, 2), (14, 27, 2, 1.30, 2), (27, 14, 2, 1.30, 2);

-- 6. Trains
INSERT INTO trains (train_id, train_code, line_id, capacity, status) VALUES
(1, 'CMRL-BLUE-01', 1, 400, 'active'),
(2, 'CMRL-BLUE-02', 1, 400, 'active'),
(3, 'CMRL-GREEN-01', 2, 350, 'active'),
(4, 'CMRL-GREEN-02', 2, 350, 'active');

-- 7. Schedules
INSERT INTO schedules (schedule_id, train_id, departure_time, direction, operating_start_date, operating_end_date, status) VALUES
(1, 1, '05:30:00', 'southbound', '2026-01-01', '2026-12-31', 'active'),
(2, 1, '07:15:00', 'southbound', '2026-01-01', '2026-12-31', 'active'),
(3, 1, '08:45:00', 'southbound', '2026-01-01', '2026-12-31', 'active'),
(4, 2, '10:00:00', 'northbound', '2026-01-01', '2026-12-31', 'active'),
(5, 3, '06:00:00', 'southbound', '2026-01-01', '2026-12-31', 'active'),
(6, 3, '07:30:00', 'southbound', '2026-01-01', '2026-12-31', 'active'),
(7, 4, '08:30:00', 'northbound', '2026-01-01', '2026-12-31', 'active'),
(8, 4, '18:15:00', 'northbound', '2026-01-01', '2026-12-31', 'active');

-- 8. Fare Rules
INSERT INTO fare_rules (fare_rule_id, pricing_method, base_fare, per_stop_rate, per_km_rate, concession_discount_percent, effective_from, status) VALUES
(1, 'stop_based', 10.00, 2.50, 3.00, 10.00, '2026-01-01', 'active');

-- 9. Sample Bookings & Payments
INSERT INTO bookings (booking_id, booking_reference, user_id, schedule_id, source_station_id, destination_station_id, travel_date, passenger_count, fare_per_passenger, total_fare, booking_status, created_at) VALUES
(1, 'MX-2026-94812', 2, 2, 4, 16, CURDATE(), 2, 35.00, 70.00, 'confirmed', NOW() - INTERVAL 3 HOUR),
(2, 'MX-2026-38102', 2, 1, 24, 4, CURDATE(), 1, 25.00, 25.00, 'confirmed', NOW() - INTERVAL 5 HOUR),
(3, 'MX-2026-19384', 3, 5, 25, 16, CURDATE() - INTERVAL 1 DAY, 1, 30.00, 30.00, 'completed', NOW() - INTERVAL 26 HOUR),
(4, 'MX-2026-77291', 4, 8, 13, 1, CURDATE() - INTERVAL 1 DAY, 2, 35.00, 70.00, 'cancelled', NOW() - INTERVAL 28 HOUR);

-- 10. Payments for bookings
INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_status, provider_reference, paid_at) VALUES
(1, 1, 50.00, 'upi', 'completed', 'UPI-PAY-9874102941', NOW() - INTERVAL 3 HOUR),
(2, 2, 15.00, 'card', 'completed', 'CARD-TXN-1029384812', NOW() - INTERVAL 5 HOUR),
(3, 3, 20.00, 'upi', 'completed', 'UPI-PAY-7718294012', NOW() - INTERVAL 26 HOUR),
(4, 4, 50.00, 'net_banking', 'refunded', 'NET-REF-8829104829', NOW() - INTERVAL 28 HOUR);

-- 11. Tickets
INSERT INTO tickets (ticket_id, booking_id, verification_token_hash, ticket_status, issued_at) VALUES
(1, 1, 'v_tok_94812_8a7df8a6', 'valid', NOW() - INTERVAL 3 HOUR),
(2, 2, 'v_tok_38102_19c8f2a1', 'valid', NOW() - INTERVAL 5 HOUR),
(3, 3, 'v_tok_19384_4b8ec993', 'used', NOW() - INTERVAL 26 HOUR),
(4, 4, 'v_tok_77291_77b310aa', 'cancelled', NOW() - INTERVAL 28 HOUR);

-- 12. Cancellations
INSERT INTO cancellations (cancellation_id, booking_id, cancellation_reason, refund_amount, refund_status, cancelled_at) VALUES
(1, 4, 'Change in travel plans', 50.00, 'processed', NOW() - INTERVAL 27 HOUR);

-- 13. Audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'DATABASE_SEED', 'system', '0', 'Seed script executed with sample lines, stations, schedules, and bookings.');
