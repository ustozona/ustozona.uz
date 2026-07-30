ALTER TABLE "assignments" DROP CONSTRAINT "assignments_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "kind" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "instructions" text;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;