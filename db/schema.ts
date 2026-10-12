/**
 * MetroX 3D — Netlify Database (Postgres) schema
 * Mirrors the original MySQL design in database/schema.sql.
 */

import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  doublePrecision,
  date,
  time,
  timestamp,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('passenger'),
  accountStatus: varchar('account_status', { length: 20 }).notNull().default('active'),
  createdAt: createdAt(),
});

export const metroLines = pgTable('metro_lines', {
  lineId: serial('line_id').primaryKey(),
  lineName: varchar('line_name', { length: 100 }).notNull(),
  lineCode: varchar('line_code', { length: 10 }).notNull().unique(),
  lineColor: varchar('line_color', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: createdAt(),
});

export const stations = pgTable('stations', {
  stationId: serial('station_id').primaryKey(),
  stationName: varchar('station_name', { length: 100 }).notNull(),
  stationCode: varchar('station_code', { length: 10 }).notNull().unique(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  isInterchange: boolean('is_interchange').notNull().default(false),
  createdAt: createdAt(),
});

export const lineStations = pgTable(
  'line_stations',
  {
    lineId: integer('line_id').notNull().references(() => metroLines.lineId, { onDelete: 'cascade' }),
    stationId: integer('station_id').notNull().references(() => stations.stationId, { onDelete: 'cascade' }),
    sequenceNo: integer('sequence_no').notNull(),
    distanceFromPreviousKm: doublePrecision('distance_from_previous_km').notNull().default(1.5),
  },
  (t) => [primaryKey({ columns: [t.lineId, t.stationId] }), unique('uq_line_sequence').on(t.lineId, t.sequenceNo)]
);

export const stationConnections = pgTable(
  'station_connections',
  {
    connectionId: serial('connection_id').primaryKey(),
    fromStationId: integer('from_station_id').notNull().references(() => stations.stationId, { onDelete: 'cascade' }),
    toStationId: integer('to_station_id').notNull().references(() => stations.stationId, { onDelete: 'cascade' }),
    travelMinutes: integer('travel_minutes').notNull().default(3),
    distanceKm: doublePrecision('distance_km').notNull().default(1.5),
    lineId: integer('line_id').notNull().references(() => metroLines.lineId, { onDelete: 'cascade' }),
  },
  (t) => [index('idx_conn_from_to').on(t.fromStationId, t.toStationId)]
);

export const trains = pgTable('trains', {
  trainId: serial('train_id').primaryKey(),
  trainCode: varchar('train_code', { length: 50 }).notNull().unique(),
  lineId: integer('line_id').notNull().references(() => metroLines.lineId),
  capacity: integer('capacity').notNull().default(300),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: createdAt(),
});

export const schedules = pgTable('schedules', {
  scheduleId: serial('schedule_id').primaryKey(),
  trainId: integer('train_id').notNull().references(() => trains.trainId, { onDelete: 'cascade' }),
  departureTime: time('departure_time').notNull(),
  direction: varchar('direction', { length: 20 }).notNull(),
  operatingStartDate: date('operating_start_date').notNull(),
  operatingEndDate: date('operating_end_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: createdAt(),
});

export const fareRules = pgTable('fare_rules', {
  fareRuleId: serial('fare_rule_id').primaryKey(),
  pricingMethod: varchar('pricing_method', { length: 20 }).notNull().default('stop_based'),
  baseFare: doublePrecision('base_fare').notNull().default(10),
  perStopRate: doublePrecision('per_stop_rate').notNull().default(2.5),
  perKmRate: doublePrecision('per_km_rate').notNull().default(3),
  concessionDiscountPercent: doublePrecision('concession_discount_percent').notNull().default(0),
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: createdAt(),
});

export const bookings = pgTable(
  'bookings',
  {
    bookingId: serial('booking_id').primaryKey(),
    bookingReference: varchar('booking_reference', { length: 32 }).notNull().unique(),
    userId: integer('user_id').notNull().references(() => users.userId),
    scheduleId: integer('schedule_id').references(() => schedules.scheduleId, { onDelete: 'set null' }),
    sourceStationId: integer('source_station_id').notNull().references(() => stations.stationId),
    destinationStationId: integer('destination_station_id').notNull().references(() => stations.stationId),
    travelDate: date('travel_date').notNull(),
    passengerCount: integer('passenger_count').notNull().default(1),
    farePerPassenger: doublePrecision('fare_per_passenger').notNull(),
    totalFare: doublePrecision('total_fare').notNull(),
    bookingStatus: varchar('booking_status', { length: 20 }).notNull().default('confirmed'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
    createdAt: createdAt(),
  },
  (t) => [index('idx_bookings_user').on(t.userId), index('idx_bookings_date').on(t.travelDate)]
);

export const payments = pgTable('payments', {
  paymentId: serial('payment_id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.bookingId, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('completed'),
  providerReference: varchar('provider_reference', { length: 100 }).notNull().unique(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cancellations = pgTable('cancellations', {
  cancellationId: serial('cancellation_id').primaryKey(),
  bookingId: integer('booking_id').notNull().unique().references(() => bookings.bookingId, { onDelete: 'cascade' }),
  cancellationReason: varchar('cancellation_reason', { length: 255 }).notNull().default('User requested cancellation'),
  refundAmount: doublePrecision('refund_amount').notNull().default(0),
  refundStatus: varchar('refund_status', { length: 20 }).notNull().default('processed'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable('tickets', {
  ticketId: serial('ticket_id').primaryKey(),
  bookingId: integer('booking_id').notNull().unique().references(() => bookings.bookingId, { onDelete: 'cascade' }),
  verificationTokenHash: varchar('verification_token_hash', { length: 128 }).notNull(),
  ticketStatus: varchar('ticket_status', { length: 20 }).notNull().default('valid'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookingStatusHistory = pgTable('booking_status_history', {
  historyId: serial('history_id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.bookingId, { onDelete: 'cascade' }),
  previousStatus: varchar('previous_status', { length: 30 }).notNull(),
  newStatus: varchar('new_status', { length: 30 }).notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  changedBy: integer('changed_by').references(() => users.userId, { onDelete: 'set null' }),
});

export const auditLogs = pgTable('audit_logs', {
  logId: serial('log_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 50 }).notNull(),
  details: text('details'),
  createdAt: createdAt(),
});
