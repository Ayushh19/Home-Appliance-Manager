ALTER TABLE "documents" ADD COLUMN "mime_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "size_bytes" integer NOT NULL;