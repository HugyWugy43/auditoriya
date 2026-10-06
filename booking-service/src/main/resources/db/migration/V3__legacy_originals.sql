ALTER TABLE legacy_import_audit ADD COLUMN original_record jsonb;
ALTER TABLE bookings DROP CONSTRAINT booking_interval;
ALTER TABLE bookings ADD CONSTRAINT booking_interval CHECK(start_time < end_time OR status IN ('NEEDS_REVIEW','CANCELLED'));
