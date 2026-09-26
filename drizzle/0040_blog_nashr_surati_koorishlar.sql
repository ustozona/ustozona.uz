ALTER TABLE "blog_posts" ADD COLUMN "published_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill: mavjud nashr qilingan postlar uchun suratni joriy ishchi ustunlardan
-- bir marta toʻldirish (aks holda ular ommaviy sahifada boʻsh koʻrinadi).
UPDATE "blog_posts" SET "published_snapshot" = jsonb_build_object(
  'title', "title",
  'excerpt', "excerpt",
  'content', "content",
  'coverImageUrl', "cover_image_url"
) WHERE "status" = 'published' AND "published_snapshot" IS NULL;