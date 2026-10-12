-- Chennai Metro Rail (CMRL) network seed data with demo accounts and sample bookings.
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, account_status, created_at) VALUES
(1, 'System Administrator', 'admin@metrox.internal', '+91 98765 43210', '$2b$10$61uLitfGhYXQWHxI8iOPY.C.5NZBBDdpZe68y4aDhVlfheG2XV/xm', 'admin', 'active', NOW() - INTERVAL '30 days'),
(2, 'Aarav Sharma', 'passenger@metrox.internal', '+91 91234 56789', '$2b$10$AIti4tAbchebzzy5uHGYf.CsYIaXHH.x3MJ4MDgfIDFoNCd6ZE4YC', 'passenger', 'active', NOW() - INTERVAL '15 days'),
(3, 'Priya Nair', 'priya.nair@example.com', '+91 98111 22334', '$2b$10$AIti4tAbchebzzy5uHGYf.CsYIaXHH.x3MJ4MDgfIDFoNCd6ZE4YC', 'passenger', 'active', NOW() - INTERVAL '10 days'),
(4, 'Vikram Mehta', 'vikram.m@example.com', '+91 98450 12345', '$2b$10$AIti4tAbchebzzy5uHGYf.CsYIaXHH.x3MJ4MDgfIDFoNCd6ZE4YC', 'passenger', 'active', NOW() - INTERVAL '7 days');
--> statement-breakpoint
INSERT INTO metro_lines (line_id, line_name, line_code, line_color, status) VALUES
(1, 'Blue Line (Corridor 1: Wimco Nagar Depot to Chennai Airport)', 'L1', '#0284c7', 'active'),
(2, 'Green Line (Corridor 2: Chennai Central to St. Thomas Mount)', 'L2', '#10b981', 'active');
--> statement-breakpoint
INSERT INTO stations (station_id, station_name, station_code, latitude, longitude, status, is_interchange) VALUES
(1, 'Washermanpet Metro', 'WPT', 13.1065, 80.283, 'active', false),
(2, 'Mannadi Metro', 'MND', 13.097, 80.288, 'active', false),
(3, 'High Court Metro', 'HCT', 13.0878, 80.2872, 'active', false),
(4, 'Puratchi Thalaivar Dr. M.G.R Central Metro', 'MAS', 13.0827, 80.2755, 'active', true),
(5, 'Government Estate Metro', 'GVE', 13.069, 80.273, 'active', false),
(6, 'LIC Metro', 'LIC', 13.064, 80.264, 'active', false),
(7, 'Thousand Lights Metro', 'THL', 13.0583, 80.2528, 'active', false),
(8, 'AG-DMS Metro', 'DMS', 13.048, 80.247, 'active', false),
(9, 'Teynampet Metro', 'TYN', 13.039, 80.242, 'active', false),
(10, 'Nandanam Metro', 'NDM', 13.031, 80.235, 'active', false),
(11, 'Saidapet Metro', 'SDP', 13.0238, 80.2223, 'active', false),
(12, 'Little Mount Metro', 'LMT', 13.016, 80.22, 'active', false),
(13, 'Guindy Metro', 'GND', 13.0093, 80.2131, 'active', false),
(14, 'Arignar Anna Alandur Metro', 'ALR', 13.0038, 80.2015, 'active', true),
(15, 'Meenambakkam Metro', 'MBK', 12.989, 80.178, 'active', false),
(16, 'Chennai International Airport Metro', 'MAA', 12.9806, 80.1636, 'active', false),
(17, 'Egmore Metro', 'EGM', 13.0782, 80.2612, 'active', false),
(18, 'Nehru Park Metro', 'NPK', 13.079, 80.251, 'active', false),
(19, 'Kilpauk Medical College Metro', 'KMC', 13.0795, 80.241, 'active', false),
(20, 'Shenoy Nagar Metro', 'SNG', 13.078, 80.226, 'active', false),
(21, 'Anna Nagar Tower Metro', 'ANT', 13.0858, 80.212, 'active', false),
(22, 'Thirumangalam Metro', 'TMG', 13.0855, 80.199, 'active', false),
(23, 'Koyambedu Metro', 'KYM', 13.073, 80.195, 'active', false),
(24, 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', 'CBT', 13.0694, 80.1948, 'active', false),
(25, 'Vadapalani Metro', 'VAD', 13.0504, 80.2121, 'active', false),
(26, 'Ashok Nagar Metro', 'ASH', 13.036, 80.2116, 'active', false),
(27, 'St. Thomas Mount Metro', 'STM', 12.995, 80.1985, 'active', false),
(28, 'Pachaiyappa''s College Metro', 'PAC', 13.0768, 80.2335, 'active', false),
(29, 'Anna Nagar East Metro', 'ANE', 13.0845, 80.219, 'active', false),
(30, 'Arumbakkam Metro', 'ABK', 13.061, 80.203, 'active', false),
(31, 'Ekkattuthangal Metro', 'EKT', 13.021, 80.2055, 'active', false),
(32, 'Nanganallur Road (OTA) Metro', 'OTA', 12.996, 80.1915, 'active', false),
(33, 'Sir Theagaraya College Metro', 'STC', 13.113, 80.2855, 'active', false),
(34, 'Tondiarpet Metro', 'TDP', 13.118, 80.287, 'active', false),
(35, 'New Washermanpet Metro', 'NWP', 13.1235, 80.29, 'active', false),
(36, 'Tollgate Metro', 'TLG', 13.131, 80.2925, 'active', false),
(37, 'Kaladipet Metro', 'KPT', 13.14, 80.296, 'active', false),
(38, 'Tiruvottriyur Theradi Metro', 'TTD', 13.149, 80.2985, 'active', false),
(39, 'Tiruvottriyur Metro', 'TVT', 13.16, 80.3005, 'active', false),
(40, 'Wimco Nagar Metro', 'WMN', 13.1695, 80.3015, 'active', false),
(41, 'Wimco Nagar Depot Metro', 'WND', 13.179, 80.306, 'active', false);
--> statement-breakpoint
INSERT INTO line_stations (line_id, station_id, sequence_no, distance_from_previous_km) VALUES
(1, 41, 1, 0.00),
(1, 40, 2, 1.10),
(1, 39, 3, 1.20),
(1, 38, 4, 1.30),
(1, 37, 5, 1.20),
(1, 36, 6, 1.10),
(1, 35, 7, 1.00),
(1, 34, 8, 0.90),
(1, 33, 9, 0.80),
(1, 1, 10, 1.20),
(1, 2, 11, 1.40),
(1, 3, 12, 1.20),
(1, 4, 13, 1.50),
(1, 5, 14, 1.60),
(1, 6, 15, 1.10),
(1, 7, 16, 1.30),
(1, 8, 17, 1.40),
(1, 9, 18, 1.20),
(1, 10, 19, 1.10),
(1, 11, 20, 1.50),
(1, 12, 21, 1.00),
(1, 13, 22, 1.40),
(1, 14, 23, 1.80),
(1, 32, 24, 1.30),
(1, 15, 25, 1.50),
(1, 16, 26, 1.90),
(2, 4, 1, 0.00),
(2, 17, 2, 1.60),
(2, 18, 3, 1.20),
(2, 19, 4, 1.30),
(2, 28, 5, 1.20),
(2, 20, 6, 1.10),
(2, 29, 7, 1.30),
(2, 21, 8, 1.40),
(2, 22, 9, 1.30),
(2, 23, 10, 1.40),
(2, 24, 11, 1.10),
(2, 30, 12, 1.40),
(2, 25, 13, 1.50),
(2, 26, 14, 1.70),
(2, 31, 15, 1.60),
(2, 14, 16, 2.10),
(2, 27, 17, 1.30);
--> statement-breakpoint
INSERT INTO station_connections (from_station_id, to_station_id, travel_minutes, distance_km, line_id) VALUES
(41, 40, 2, 1.10, 1),
(40, 41, 2, 1.10, 1),
(40, 39, 2, 1.20, 1),
(39, 40, 2, 1.20, 1),
(39, 38, 2, 1.30, 1),
(38, 39, 2, 1.30, 1),
(38, 37, 2, 1.20, 1),
(37, 38, 2, 1.20, 1),
(37, 36, 2, 1.10, 1),
(36, 37, 2, 1.10, 1),
(36, 35, 2, 1.00, 1),
(35, 36, 2, 1.00, 1),
(35, 34, 2, 0.90, 1),
(34, 35, 2, 0.90, 1),
(34, 33, 2, 0.80, 1),
(33, 34, 2, 0.80, 1),
(33, 1, 2, 1.20, 1),
(1, 33, 2, 1.20, 1),
(1, 2, 2, 1.40, 1),
(2, 1, 2, 1.40, 1),
(2, 3, 2, 1.20, 1),
(3, 2, 2, 1.20, 1),
(3, 4, 2, 1.50, 1),
(4, 3, 2, 1.50, 1),
(4, 5, 2, 1.60, 1),
(5, 4, 2, 1.60, 1),
(5, 6, 2, 1.10, 1),
(6, 5, 2, 1.10, 1),
(6, 7, 2, 1.30, 1),
(7, 6, 2, 1.30, 1),
(7, 8, 2, 1.40, 1),
(8, 7, 2, 1.40, 1),
(8, 9, 2, 1.20, 1),
(9, 8, 2, 1.20, 1),
(9, 10, 2, 1.10, 1),
(10, 9, 2, 1.10, 1),
(10, 11, 2, 1.50, 1),
(11, 10, 2, 1.50, 1),
(11, 12, 2, 1.00, 1),
(12, 11, 2, 1.00, 1),
(12, 13, 2, 1.40, 1),
(13, 12, 2, 1.40, 1),
(13, 14, 2, 1.80, 1),
(14, 13, 2, 1.80, 1),
(14, 32, 2, 1.30, 1),
(32, 14, 2, 1.30, 1),
(32, 15, 2, 1.50, 1),
(15, 32, 2, 1.50, 1),
(15, 16, 2, 1.90, 1),
(16, 15, 2, 1.90, 1),
(4, 17, 3, 1.60, 2),
(17, 4, 3, 1.60, 2),
(17, 18, 3, 1.20, 2),
(18, 17, 3, 1.20, 2),
(18, 19, 3, 1.30, 2),
(19, 18, 3, 1.30, 2),
(19, 28, 3, 1.20, 2),
(28, 19, 3, 1.20, 2),
(28, 20, 3, 1.10, 2),
(20, 28, 3, 1.10, 2),
(20, 29, 3, 1.30, 2),
(29, 20, 3, 1.30, 2),
(29, 21, 3, 1.40, 2),
(21, 29, 3, 1.40, 2),
(21, 22, 3, 1.30, 2),
(22, 21, 3, 1.30, 2),
(22, 23, 3, 1.40, 2),
(23, 22, 3, 1.40, 2),
(23, 24, 3, 1.10, 2),
(24, 23, 3, 1.10, 2),
(24, 30, 3, 1.40, 2),
(30, 24, 3, 1.40, 2),
(30, 25, 3, 1.50, 2),
(25, 30, 3, 1.50, 2),
(25, 26, 3, 1.70, 2),
(26, 25, 3, 1.70, 2),
(26, 31, 3, 1.60, 2),
(31, 26, 3, 1.60, 2),
(31, 14, 3, 2.10, 2),
(14, 31, 3, 2.10, 2),
(14, 27, 3, 1.30, 2),
(27, 14, 3, 1.30, 2);
--> statement-breakpoint
INSERT INTO trains (train_id, train_code, line_id, capacity, status) VALUES
(1, 'CMRL-BLUE-01', 1, 400, 'active'),
(2, 'CMRL-BLUE-02', 1, 400, 'active'),
(3, 'CMRL-GREEN-01', 2, 350, 'active'),
(4, 'CMRL-GREEN-02', 2, 350, 'active');
--> statement-breakpoint
INSERT INTO schedules (schedule_id, train_id, departure_time, direction, operating_start_date, operating_end_date, status) VALUES
(1, 1, '05:30:00', 'southbound', '2026-01-01', '2027-12-31', 'active'),
(2, 1, '07:15:00', 'southbound', '2026-01-01', '2027-12-31', 'active'),
(3, 1, '08:45:00', 'southbound', '2026-01-01', '2027-12-31', 'active'),
(4, 2, '10:00:00', 'northbound', '2026-01-01', '2027-12-31', 'active'),
(5, 3, '06:00:00', 'southbound', '2026-01-01', '2027-12-31', 'active'),
(6, 3, '07:30:00', 'southbound', '2026-01-01', '2027-12-31', 'active'),
(7, 4, '08:30:00', 'northbound', '2026-01-01', '2027-12-31', 'active'),
(8, 4, '18:15:00', 'northbound', '2026-01-01', '2027-12-31', 'active');
--> statement-breakpoint
INSERT INTO fare_rules (fare_rule_id, pricing_method, base_fare, per_stop_rate, per_km_rate, concession_discount_percent, effective_from, status) VALUES
(1, 'stop_based', 10.00, 2.50, 3.00, 10.00, '2026-01-01', 'active');
--> statement-breakpoint
INSERT INTO bookings (booking_id, booking_reference, user_id, schedule_id, source_station_id, destination_station_id, travel_date, passenger_count, fare_per_passenger, total_fare, booking_status, created_at) VALUES
(1, 'MX-2026-94812', 2, 2, 4, 16, CURRENT_DATE, 2, 35.00, 70.00, 'confirmed', NOW() - INTERVAL '3 hours'),
(2, 'MX-2026-38102', 2, 1, 24, 4, CURRENT_DATE, 1, 25.00, 25.00, 'confirmed', NOW() - INTERVAL '5 hours'),
(3, 'MX-2026-19384', 3, 5, 25, 16, CURRENT_DATE - 1, 1, 30.00, 30.00, 'completed', NOW() - INTERVAL '26 hours'),
(4, 'MX-2026-77291', 2, 8, 13, 1, CURRENT_DATE - 1, 2, 35.00, 70.00, 'cancelled', NOW() - INTERVAL '28 hours');
--> statement-breakpoint
INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_status, provider_reference, paid_at) VALUES
(1, 1, 70.00, 'upi', 'completed', 'UPI-DEMO-9874102941', NOW() - INTERVAL '3 hours'),
(2, 2, 25.00, 'card', 'completed', 'CARD-DEMO-1029384812', NOW() - INTERVAL '5 hours'),
(3, 3, 30.00, 'upi', 'completed', 'UPI-DEMO-7718294012', NOW() - INTERVAL '26 hours'),
(4, 4, 70.00, 'net_banking', 'refunded', 'NET-DEMO-8829104829', NOW() - INTERVAL '28 hours');
--> statement-breakpoint
INSERT INTO tickets (ticket_id, booking_id, verification_token_hash, ticket_status, issued_at) VALUES
(1, 1, 'v_tok_94812_8a7df8a6', 'valid', NOW() - INTERVAL '3 hours'),
(2, 2, 'v_tok_38102_19c8f2a1', 'valid', NOW() - INTERVAL '5 hours'),
(3, 3, 'v_tok_19384_4b8ec993', 'used', NOW() - INTERVAL '26 hours'),
(4, 4, 'v_tok_77291_77b310aa', 'cancelled', NOW() - INTERVAL '28 hours');
--> statement-breakpoint
INSERT INTO cancellations (cancellation_id, booking_id, cancellation_reason, refund_amount, refund_status, cancelled_at) VALUES
(1, 4, 'Change in schedule', 70.00, 'processed', NOW() - INTERVAL '27 hours');
--> statement-breakpoint
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'SYSTEM_INIT', 'system', '1', 'MetroX database seeded with Chennai Metro Rail network data');
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('metro_lines', 'line_id'), (SELECT MAX(line_id) FROM metro_lines));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('stations', 'station_id'), (SELECT MAX(station_id) FROM stations));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('trains', 'train_id'), (SELECT MAX(train_id) FROM trains));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('schedules', 'schedule_id'), (SELECT MAX(schedule_id) FROM schedules));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('fare_rules', 'fare_rule_id'), (SELECT MAX(fare_rule_id) FROM fare_rules));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('bookings', 'booking_id'), (SELECT MAX(booking_id) FROM bookings));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('payments', 'payment_id'), (SELECT MAX(payment_id) FROM payments));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('tickets', 'ticket_id'), (SELECT MAX(ticket_id) FROM tickets));
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('cancellations', 'cancellation_id'), (SELECT MAX(cancellation_id) FROM cancellations));
