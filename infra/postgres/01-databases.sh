#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v user_password="$USER_DB_PASSWORD" -v room_password="$ROOM_DB_PASSWORD" \
  -v booking_password="$BOOKING_DB_PASSWORD" -v notification_password="$NOTIFICATION_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE audit_users LOGIN PASSWORD %L', :'user_password') \gexec
SELECT format('CREATE ROLE audit_rooms LOGIN PASSWORD %L', :'room_password') \gexec
SELECT format('CREATE ROLE audit_bookings LOGIN PASSWORD %L', :'booking_password') \gexec
SELECT format('CREATE ROLE audit_notifications LOGIN PASSWORD %L', :'notification_password') \gexec
CREATE DATABASE audit_users OWNER audit_users;
CREATE DATABASE audit_rooms OWNER audit_rooms;
CREATE DATABASE audit_bookings OWNER audit_bookings;
CREATE DATABASE audit_notifications OWNER audit_notifications;
REVOKE CONNECT ON DATABASE audit_users, audit_rooms, audit_bookings, audit_notifications FROM PUBLIC;
GRANT CONNECT ON DATABASE audit_users TO audit_users;
GRANT CONNECT ON DATABASE audit_rooms TO audit_rooms;
GRANT CONNECT ON DATABASE audit_bookings TO audit_bookings;
GRANT CONNECT ON DATABASE audit_notifications TO audit_notifications;
SQL
