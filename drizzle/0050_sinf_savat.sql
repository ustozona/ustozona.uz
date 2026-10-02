ALTER TABLE "classes" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "deleted_by" text;--> statement-breakpoint
CREATE INDEX "classes_deleted_idx" ON "classes" USING btree ("deleted_at");