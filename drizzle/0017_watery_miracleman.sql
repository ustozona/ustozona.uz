ALTER TABLE "student_notes" ALTER COLUMN "sentiment" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_notes" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "student_notes" ADD COLUMN "visibility" text DEFAULT 'teachers' NOT NULL;--> statement-breakpoint
UPDATE "student_notes" SET "tags" = jsonb_build_array("sentiment") WHERE "sentiment" IS NOT NULL;