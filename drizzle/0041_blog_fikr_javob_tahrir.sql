ALTER TABLE "blog_comments" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parent_id_blog_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_comments_parent_idx" ON "blog_comments" USING btree ("parent_id");