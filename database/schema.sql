-- ========================================================
-- MetroX 3D — Advanced Smart Metro Reservation System
-- Database Schema: metrox_reservation (MySQL 8.0+)
-- ========================================================

CREATE DATABASE IF NOT EXISTS metrox_reservation;
USE metrox_reservation;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('passenger', 'admin') DEFAULT 'passenger',
  account_status ENUM('active', 'suspended', 'deactivated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Metro Lines Table
CREATE TABLE IF NOT EXISTS metro_lines (
  line_id INT AUTO_INCREMENT PRIMARY KEY,
  line_name VARCHAR(100) NOT NULL,
  line_code VARCHAR(10) NOT NULL UNIQUE,
  line_color VARCHAR(20) NOT NULL,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Stations Table
CREATE TABLE IF NOT EXISTS stations (
  station_id INT AUTO_INCREMENT PRIMARY KEY,
  station_name VARCHAR(100) NOT NULL,
  station_code VARCHAR(10) NOT NULL UNIQUE,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  is_interchange BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_station_code (station_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Line Stations (Many-to-Many with sequence on line)
CREATE TABLE IF NOT EXISTS line_stations (
  line_id INT NOT NULL,
  station_id INT NOT NULL,
  sequence_no INT NOT NULL,
  distance_from_previous_km DECIMAL(5, 2) DEFAULT 1.50,
  PRIMARY KEY (line_id, station_id),
  UNIQUE KEY uq_line_sequence (line_id, sequence_no),
  FOREIGN KEY (line_id) REFERENCES metro_lines(line_id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Station Connections (Graph Edges for Route Algorithm)
CREATE TABLE IF NOT EXISTS station_connections (
  connection_id INT AUTO_INCREMENT PRIMARY KEY,
  from_station_id INT NOT NULL,
  to_station_id INT NOT NULL,
  travel_minutes INT NOT NULL DEFAULT 3,
  distance_km DECIMAL(5, 2) NOT NULL DEFAULT 1.50,
  line_id INT NOT NULL,
  FOREIGN KEY (from_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
  FOREIGN KEY (to_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES metro_lines(line_id) ON DELETE CASCADE,
  INDEX idx_conn_from_to (from_station_id, to_station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Trains Table
CREATE TABLE IF NOT EXISTS trains (
  train_id INT AUTO_INCREMENT PRIMARY KEY,
  train_code VARCHAR(50) NOT NULL UNIQUE,
  line_id INT NOT NULL,
  capacity INT NOT NULL DEFAULT 300,
  status ENUM('active', 'maintenance', 'out_of_service') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (line_id) REFERENCES metro_lines(line_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  departure_time TIME NOT NULL,
  direction ENUM('northbound', 'southbound', 'eastbound', 'westbound', 'clockwise', 'counter_clockwise') NOT NULL,
  operating_start_date DATE NOT NULL,
  operating_end_date DATE NOT NULL,
  status ENUM('active', 'cancelled', 'delayed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
  INDEX idx_sched_time (departure_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Schedule Stops Table
CREATE TABLE IF NOT EXISTS schedule_stops (
  schedule_id INT NOT NULL,
  station_id INT NOT NULL,
  stop_sequence INT NOT NULL,
  arrival_offset_minutes INT NOT NULL DEFAULT 0,
  departure_offset_minutes INT NOT NULL DEFAULT 1,
  PRIMARY KEY (schedule_id, station_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Fare Rules Table
CREATE TABLE IF NOT EXISTS fare_rules (
  fare_rule_id INT AUTO_INCREMENT PRIMARY KEY,
  pricing_method ENUM('stop_based', 'distance_based') NOT NULL DEFAULT 'stop_based',
  base_fare DECIMAL(8, 2) NOT NULL DEFAULT 10.00,
  per_stop_rate DECIMAL(8, 2) NOT NULL DEFAULT 2.50,
  per_km_rate DECIMAL(8, 2) NOT NULL DEFAULT 3.00,
  concession_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  effective_from DATE NOT NULL,
  effective_until DATE DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(32) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  schedule_id INT NULL,
  source_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  travel_date DATE NOT NULL,
  passenger_count INT NOT NULL DEFAULT 1,
  fare_per_passenger DECIMAL(8, 2) NOT NULL,
  total_fare DECIMAL(8, 2) NOT NULL,
  booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE SET NULL,
  FOREIGN KEY (source_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
  FOREIGN KEY (destination_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_ref (booking_reference),
  INDEX idx_bookings_date (travel_date),
  INDEX idx_bookings_status (booking_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(8, 2) NOT NULL,
  payment_method ENUM('upi', 'card', 'net_banking', 'metro_card', 'demo_simulation') NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
  provider_reference VARCHAR(100) NOT NULL UNIQUE,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_payment_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Cancellations Table
CREATE TABLE IF NOT EXISTS cancellations (
  cancellation_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  cancellation_reason VARCHAR(255) DEFAULT 'User requested cancellation',
  refund_amount DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  refund_status ENUM('pending', 'processed', 'ineligible') DEFAULT 'processed',
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  verification_token_hash VARCHAR(128) NOT NULL,
  ticket_status ENUM('valid', 'used', 'cancelled', 'expired') DEFAULT 'valid',
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_ticket_token (verification_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Booking Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS booking_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  previous_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Favorite Stations
CREATE TABLE IF NOT EXISTS favorite_stations (
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, station_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
