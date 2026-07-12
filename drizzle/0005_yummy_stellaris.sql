CREATE TABLE "behavior_deletions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"points" integer NOT NULL,
	"date" text NOT NULL,
	"reason" text,
	"deleted_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "behavior_deletions" ADD CONSTRAINT "behavior_deletions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_deletions" ADD CONSTRAINT "behavior_deletions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_deletions" ADD CONSTRAINT "behavior_deletions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "behavior_deletions_teacher_idx" ON "behavior_deletions" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "behavior_deletions_class_idx" ON "behavior_deletions" USING btree ("class_id");