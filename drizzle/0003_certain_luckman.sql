CREATE TABLE "behavior_events" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"skill_id" text,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"note" text,
	"date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"reward_id" text,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"cost" integer NOT NULL,
	"date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"cost" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior_skills" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_redemptions" ADD CONSTRAINT "behavior_redemptions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_redemptions" ADD CONSTRAINT "behavior_redemptions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_redemptions" ADD CONSTRAINT "behavior_redemptions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_rewards" ADD CONSTRAINT "behavior_rewards_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_skills" ADD CONSTRAINT "behavior_skills_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "behavior_events_teacher_idx" ON "behavior_events" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "behavior_events_class_idx" ON "behavior_events" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "behavior_events_student_idx" ON "behavior_events" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "behavior_redemptions_teacher_idx" ON "behavior_redemptions" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "behavior_redemptions_class_idx" ON "behavior_redemptions" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "behavior_redemptions_student_idx" ON "behavior_redemptions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "behavior_rewards_teacher_idx" ON "behavior_rewards" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "behavior_skills_teacher_idx" ON "behavior_skills" USING btree ("teacher_id");