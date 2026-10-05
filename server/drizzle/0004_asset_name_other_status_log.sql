CREATE TABLE "asset_status_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"from_status" "asset_status" NOT NULL,
	"to_status" "asset_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "custom_category" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "custom_brand" text;--> statement-breakpoint
ALTER TABLE "asset_status_changes" ADD CONSTRAINT "asset_status_changes_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_status_changes" ADD CONSTRAINT "asset_status_changes_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_status_changes_asset_idx" ON "asset_status_changes" USING btree ("asset_id");