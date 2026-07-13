ALTER TABLE "behavior_auto_settings" ADD COLUMN "late_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "behavior_auto_settings" ADD COLUMN "absent_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "behavior_auto_settings" ADD COLUMN "graded_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "behavior_auto_settings" ADD COLUMN "missed_due_enabled" boolean DEFAULT true NOT NULL;