CREATE TABLE "audit_logs" (
	"log_id" serial PRIMARY KEY,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(50) NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"history_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"previous_status" varchar(30) NOT NULL,
	"new_status" varchar(30) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" integer
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"booking_id" serial PRIMARY KEY,
	"booking_reference" varchar(32) NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"schedule_id" integer,
	"source_station_id" integer NOT NULL,
	"destination_station_id" integer NOT NULL,
	"travel_date" date NOT NULL,
	"passenger_count" integer DEFAULT 1 NOT NULL,
	"fare_per_passenger" double precision NOT NULL,
	"total_fare" double precision NOT NULL,
	"booking_status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"idempotency_key" varchar(100) UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cancellations" (
	"cancellation_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL UNIQUE,
	"cancellation_reason" varchar(255) DEFAULT 'User requested cancellation' NOT NULL,
	"refund_amount" double precision DEFAULT 0 NOT NULL,
	"refund_status" varchar(20) DEFAULT 'processed' NOT NULL,
	"cancelled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fare_rules" (
	"fare_rule_id" serial PRIMARY KEY,
	"pricing_method" varchar(20) DEFAULT 'stop_based' NOT NULL,
	"base_fare" double precision DEFAULT 10 NOT NULL,
	"per_stop_rate" double precision DEFAULT 2.5 NOT NULL,
	"per_km_rate" double precision DEFAULT 3 NOT NULL,
	"concession_discount_percent" double precision DEFAULT 0 NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_stations" (
	"line_id" integer,
	"station_id" integer,
	"sequence_no" integer NOT NULL,
	"distance_from_previous_km" double precision DEFAULT 1.5 NOT NULL,
	CONSTRAINT "line_stations_pkey" PRIMARY KEY("line_id","station_id"),
	CONSTRAINT "uq_line_sequence" UNIQUE("line_id","sequence_no")
);
--> statement-breakpoint
CREATE TABLE "metro_lines" (
	"line_id" serial PRIMARY KEY,
	"line_name" varchar(100) NOT NULL,
	"line_code" varchar(10) NOT NULL UNIQUE,
	"line_color" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"payment_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"amount" double precision NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'completed' NOT NULL,
	"provider_reference" varchar(100) NOT NULL UNIQUE,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"schedule_id" serial PRIMARY KEY,
	"train_id" integer NOT NULL,
	"departure_time" time NOT NULL,
	"direction" varchar(20) NOT NULL,
	"operating_start_date" date NOT NULL,
	"operating_end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "station_connections" (
	"connection_id" serial PRIMARY KEY,
	"from_station_id" integer NOT NULL,
	"to_station_id" integer NOT NULL,
	"travel_minutes" integer DEFAULT 3 NOT NULL,
	"distance_km" double precision DEFAULT 1.5 NOT NULL,
	"line_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"station_id" serial PRIMARY KEY,
	"station_name" varchar(100) NOT NULL,
	"station_code" varchar(10) NOT NULL UNIQUE,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_interchange" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"ticket_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL UNIQUE,
	"verification_token_hash" varchar(128) NOT NULL,
	"ticket_status" varchar(20) DEFAULT 'valid' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trains" (
	"train_id" serial PRIMARY KEY,
	"train_code" varchar(50) NOT NULL UNIQUE,
	"line_id" integer NOT NULL,
	"capacity" integer DEFAULT 300 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL UNIQUE,
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'passenger' NOT NULL,
	"account_status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_bookings_user" ON "bookings" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_date" ON "bookings" ("travel_date");--> statement-breakpoint
CREATE INDEX "idx_conn_from_to" ON "station_connections" ("from_station_id","to_station_id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_users_user_id_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("user_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedule_id_schedules_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("schedule_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_source_station_id_stations_station_id_fkey" FOREIGN KEY ("source_station_id") REFERENCES "stations"("station_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_destination_station_id_stations_station_id_fkey" FOREIGN KEY ("destination_station_id") REFERENCES "stations"("station_id");--> statement-breakpoint
ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "line_stations" ADD CONSTRAINT "line_stations_line_id_metro_lines_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "metro_lines"("line_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "line_stations" ADD CONSTRAINT "line_stations_station_id_stations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_train_id_trains_train_id_fkey" FOREIGN KEY ("train_id") REFERENCES "trains"("train_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "station_connections" ADD CONSTRAINT "station_connections_from_station_id_stations_station_id_fkey" FOREIGN KEY ("from_station_id") REFERENCES "stations"("station_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "station_connections" ADD CONSTRAINT "station_connections_to_station_id_stations_station_id_fkey" FOREIGN KEY ("to_station_id") REFERENCES "stations"("station_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "station_connections" ADD CONSTRAINT "station_connections_line_id_metro_lines_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "metro_lines"("line_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trains" ADD CONSTRAINT "trains_line_id_metro_lines_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "metro_lines"("line_id");