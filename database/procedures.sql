-- ========================================================
-- MetroX 3D — Stored Procedures (MySQL 8.0+)
-- ========================================================

USE metrox_reservation;

DELIMITER //

-- Procedure 1: sp_calculate_fare
-- Calculates fare based on stop count or distance and active fare rules
DROP PROCEDURE IF EXISTS sp_calculate_fare //
CREATE PROCEDURE sp_calculate_fare (
  IN p_source_id INT,
  IN p_destination_id INT,
  IN p_passenger_count INT,
  IN p_pricing_method VARCHAR(20),
  OUT p_fare_per_passenger DECIMAL(8, 2),
  OUT p_total_fare DECIMAL(8, 2)
)
BEGIN
  DECLARE v_base_fare DECIMAL(8, 2) DEFAULT 10.00;
  DECLARE v_per_stop_rate DECIMAL(8, 2) DEFAULT 2.50;
  DECLARE v_per_km_rate DECIMAL(8, 2) DEFAULT 3.00;
  DECLARE v_stop_count INT DEFAULT 1;
  DECLARE v_distance_km DECIMAL(6, 2) DEFAULT 3.00;

  -- Read active fare rule parameters
  SELECT base_fare, per_stop_rate, per_km_rate 
  INTO v_base_fare, v_per_stop_rate, v_per_km_rate
  FROM fare_rules
  WHERE status = 'active'
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Estimate distance or stops if directly available on same line
  SELECT ABS(ls1.sequence_no - ls2.sequence_no)
  INTO v_stop_count
  FROM line_stations ls1
  JOIN line_stations ls2 ON ls1.line_id = ls2.line_id
  WHERE ls1.station_id = p_source_id AND ls2.station_id = p_destination_id
  LIMIT 1;

  IF v_stop_count IS NULL OR v_stop_count = 0 THEN
    SET v_stop_count = 3; -- Default traversal estimate for network transfer
  END IF;

  IF p_pricing_method = 'distance_based' THEN
    SET v_distance_km = v_stop_count * 1.8;
    SET p_fare_per_passenger = v_base_fare + (v_distance_km * v_per_km_rate);
  ELSE
    -- Stop-based model: Base fare covers first 3 stops; additional stops incur incremental fare
    IF v_stop_count <= 3 THEN
      SET p_fare_per_passenger = v_base_fare;
    ELSE
      SET p_fare_per_passenger = v_base_fare + (CEIL((v_stop_count - 3) / 2) * 5.00);
    END IF;
  END IF;

  -- Round to nearest integer currency value
  SET p_fare_per_passenger = ROUND(p_fare_per_passenger, 2);
  SET p_total_fare = ROUND(p_fare_per_passenger * p_passenger_count, 2);
END //

-- Procedure 2: sp_get_booking_details
-- Retrieves comprehensive booking details by booking reference
DROP PROCEDURE IF EXISTS sp_get_booking_details //
CREATE PROCEDURE sp_get_booking_details (
  IN p_booking_ref VARCHAR(32)
)
BEGIN
  SELECT * FROM vw_booking_details
  WHERE booking_reference = p_booking_ref;
END //

-- Procedure 3: sp_get_daily_revenue
-- Summarizes financial performance within a specified date window
DROP PROCEDURE IF EXISTS sp_get_daily_revenue //
CREATE PROCEDURE sp_get_daily_revenue (
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    DATE(p.paid_at) AS report_date,
    COUNT(b.booking_id) AS total_bookings,
    SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) AS gross_revenue,
    COALESCE(SUM(c.refund_amount), 0) AS total_refunded,
    SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) - COALESCE(SUM(c.refund_amount), 0) AS net_revenue
  FROM payments p
  JOIN bookings b ON p.booking_id = b.booking_id
  LEFT JOIN cancellations c ON b.booking_id = c.booking_id AND c.refund_status = 'processed'
  WHERE DATE(p.paid_at) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(p.paid_at)
  ORDER BY report_date ASC;
END //

DELIMITER ;
