CREATE TYPE "public"."asset_status" AS ENUM('active', 'retired', 'replaced');--> statement-breakpoint
CREATE TYPE "public"."assignment_event" AS ENUM('sent_to_center', 'rejected', 'technician_assigned', 'technician_reassigned');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('bill', 'warranty_card', 'manual', 'service_document', 'other');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('warranty_expiry', 'maintenance_due');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'accepted', 'rejected', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_record_source" AS ENUM('request', 'manual');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('maintenance', 'repair');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'center_staff', 'technician');--> statement-breakpoint
CREATE TYPE "public"."visit_proposal_status" AS ENUM('pending', 'confirmed', 'declined');--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"model" text,
	"serial_number" text,
	"purchase_date" date,
	"purchase_price" numeric(12, 2),
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"status_changed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" "document_type" NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"title" text NOT NULL,
	"interval_months" integer NOT NULL,
	"next_due_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" "reminder_type" NOT NULL,
	"warranty_id" uuid,
	"maintenance_schedule_id" uuid,
	"due_date" date NOT NULL,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"service_center_id" uuid NOT NULL,
	"technician_id" uuid,
	"assigned_by" uuid NOT NULL,
	"event" "assignment_event" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"from_status" "request_status",
	"to_status" "request_status",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_center_brands" (
	"service_center_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	CONSTRAINT "service_center_brands_service_center_id_brand_id_pk" PRIMARY KEY("service_center_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "service_center_categories" (
	"service_center_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "service_center_categories_service_center_id_category_id_pk" PRIMARY KEY("service_center_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "service_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"service_request_id" uuid,
	"source" "service_record_source" NOT NULL,
	"type" "service_type" NOT NULL,
	"maintenance_schedule_id" uuid,
	"service_date" date NOT NULL,
	"problem" text,
	"work_done" text,
	"parts_replaced" text,
	"cost" numeric(12, 2),
	"performed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_records_service_request_id_unique" UNIQUE("service_request_id")
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_center_id" uuid NOT NULL,
	"technician_id" uuid,
	"type" "service_type" NOT NULL,
	"maintenance_schedule_id" uuid,
	"description" text NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" "user_role" NOT NULL,
	"service_center_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visit_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"proposed_by" uuid NOT NULL,
	"proposed_at" timestamp with time zone NOT NULL,
	"status" "visit_proposal_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homes" ADD CONSTRAINT "homes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_warranty_id_warranties_id_fk" FOREIGN KEY ("warranty_id") REFERENCES "public"."warranties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_service_center_id_service_centers_id_fk" FOREIGN KEY ("service_center_id") REFERENCES "public"."service_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_updates" ADD CONSTRAINT "request_updates_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_updates" ADD CONSTRAINT "request_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_center_brands" ADD CONSTRAINT "service_center_brands_service_center_id_service_centers_id_fk" FOREIGN KEY ("service_center_id") REFERENCES "public"."service_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_center_brands" ADD CONSTRAINT "service_center_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_center_categories" ADD CONSTRAINT "service_center_categories_service_center_id_service_centers_id_fk" FOREIGN KEY ("service_center_id") REFERENCES "public"."service_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_center_categories" ADD CONSTRAINT "service_center_categories_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_center_id_service_centers_id_fk" FOREIGN KEY ("service_center_id") REFERENCES "public"."service_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_service_center_id_service_centers_id_fk" FOREIGN KEY ("service_center_id") REFERENCES "public"."service_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_proposals" ADD CONSTRAINT "visit_proposals_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_proposals" ADD CONSTRAINT "visit_proposals_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_home_idx" ON "assets" USING btree ("home_id");--> statement-breakpoint
CREATE INDEX "documents_asset_idx" ON "documents" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "homes_owner_idx" ON "homes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "maintenance_schedules_asset_idx" ON "maintenance_schedules" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "maintenance_schedules_next_due_idx" ON "maintenance_schedules" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "reminders_user_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_warranty_due_uq" ON "reminders" USING btree ("warranty_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_schedule_due_uq" ON "reminders" USING btree ("maintenance_schedule_id","due_date");--> statement-breakpoint
CREATE INDEX "request_assignments_request_idx" ON "request_assignments" USING btree ("service_request_id");--> statement-breakpoint
CREATE INDEX "request_updates_request_idx" ON "request_updates" USING btree ("service_request_id");--> statement-breakpoint
CREATE INDEX "service_records_asset_idx" ON "service_records" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "service_requests_asset_idx" ON "service_requests" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "service_requests_customer_idx" ON "service_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "service_requests_center_idx" ON "service_requests" USING btree ("service_center_id");--> statement-breakpoint
CREATE INDEX "service_requests_technician_idx" ON "service_requests" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_service_center_idx" ON "users" USING btree ("service_center_id");--> statement-breakpoint
CREATE INDEX "visit_proposals_request_idx" ON "visit_proposals" USING btree ("service_request_id");--> statement-breakpoint
CREATE INDEX "warranties_asset_idx" ON "warranties" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "warranties_end_date_idx" ON "warranties" USING btree ("end_date");