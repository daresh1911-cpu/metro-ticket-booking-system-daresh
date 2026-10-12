-- ========================================================
-- MetroX 3D — Database Triggers (MySQL 8.0+)
-- ========================================================

USE metrox_reservation;

DELIMITER //

-- Trigger 1: Record booking status changes automatically in booking_status_history
DROP TRIGGER IF EXISTS trg_after_booking_status_change //
CREATE TRIGGER trg_after_booking_status_change
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.booking_status <> NEW.booking_status THEN
    INSERT INTO booking_status_history (
      booking_id,
      previous_status,
      new_status,
      changed_at,
      changed_by
    ) VALUES (
      NEW.booking_id,
      OLD.booking_status,
      NEW.booking_status,
      NOW(),
      NEW.user_id
    );
  END IF;
END //

-- Trigger 2: Log cancellation in audit_logs
DROP TRIGGER IF EXISTS trg_after_cancellation_audit //
CREATE TRIGGER trg_after_cancellation_audit
AFTER INSERT ON cancellations
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    (SELECT user_id FROM bookings WHERE booking_id = NEW.booking_id),
    'CANCEL_BOOKING',
    'booking',
    CAST(NEW.booking_id AS CHAR),
    CONCAT('Cancellation recorded with refund amount: ₹', NEW.refund_amount, ', reason: ', NEW.cancellation_reason),
    NOW()
  );
END //

-- Trigger 3: Log completed payments
DROP TRIGGER IF EXISTS trg_after_payment_completed //
CREATE TRIGGER trg_after_payment_completed
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'completed' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      (SELECT user_id FROM bookings WHERE booking_id = NEW.booking_id),
      'PAYMENT_SUCCESS',
      'payment',
      CAST(NEW.payment_id AS CHAR),
      CONCAT('Payment of ₹', NEW.amount, ' completed via ', NEW.payment_method),
      NOW()
    );
  END IF;
END //

DELIMITER ;
