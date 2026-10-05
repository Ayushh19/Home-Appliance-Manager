ALTER TABLE "reminders" DROP CONSTRAINT "reminders_warranty_id_warranties_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_maintenance_schedule_id_maintenance_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "service_records" DROP CONSTRAINT "service_records_maintenance_schedule_id_maintenance_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_maintenance_schedule_id_maintenance_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_warranty_id_warranties_id_fk" FOREIGN KEY ("warranty_id") REFERENCES "public"."warranties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_maintenance_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("maintenance_schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE set null ON UPDATE no action;