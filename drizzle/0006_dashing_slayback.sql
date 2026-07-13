CREATE TABLE "behavior_auto_settings" (
	"teacher_id" text PRIMARY KEY NOT NULL,
	"attendance_enabled" boolean NOT NULL,
	"late_points" integer NOT NULL,
	"absent_points" integer NOT NULL,
	"present_enabled" boolean NOT NULL,
	"present_points" integer NOT NULL,
	"streak_enabled" boolean NOT NULL,
	"streak_n" integer NOT NULL,
	"streak_bonus" integer NOT NULL,
	"attendance_since" text NOT NULL,
	"journal_enabled" boolean NOT NULL,
	"graded_points" integer NOT NULL,
	"missed_due_points" integer NOT NULL,
	"journal_since" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "behavior_events" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "behavior_auto_settings" ADD CONSTRAINT "behavior_auto_settings_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;