CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'personal' NOT NULL,
	"region" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"role" text DEFAULT 'teacher' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_teacher_id_pk" PRIMARY KEY("workspace_id","teacher_id")
);
--> statement-breakpoint
CREATE TABLE "class_teachers" (
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_teachers_class_id_teacher_id_pk" PRIMARY KEY("class_id","teacher_id")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_class_id_student_id_pk" PRIMARY KEY("class_id","student_id")
);
--> statement-breakpoint
DROP INDEX "classes_teacher_idx";--> statement-breakpoint
DROP INDEX "students_teacher_idx";--> statement-breakpoint
DROP INDEX "students_class_idx";--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "teacher_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "teacher_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "class_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "active_workspace_id" text;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "parent_class_id" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_members_teacher_idx" ON "workspace_members" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "class_teachers_teacher_idx" ON "class_teachers" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classes_workspace_idx" ON "classes" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "classes_parent_idx" ON "classes" USING btree ("parent_class_id");--> statement-breakpoint
CREATE INDEX "students_workspace_idx" ON "students" USING btree ("workspace_id");