CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'teacher',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"school" text,
	"subject" text,
	"avatar_url" text,
	"language" text DEFAULT 'uz' NOT NULL,
	"academic_year" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teachers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"time" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"gender" text,
	"birth_date" text,
	"parent_name" text,
	"parent_phone" text,
	"student_phone" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"title" text NOT NULL,
	"max_score" integer NOT NULL,
	"date" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"teacher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"score" real,
	"is_draft" boolean DEFAULT false NOT NULL,
	"missing" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grades_student_id_assignment_id_pk" PRIMARY KEY("student_id","assignment_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"group_id" text,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"purpose" text NOT NULL,
	"weight_percent" integer DEFAULT 0 NOT NULL,
	"input_mode" text NOT NULL,
	"scale_kind" text,
	"pass_label" text DEFAULT 'Bajardi' NOT NULL,
	"fail_label" text DEFAULT 'Bajarmadi' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_class_id_student_id_date_pk" PRIMARY KEY("class_id","student_id","date")
);
--> statement-breakpoint
CREATE TABLE "attendance_statuses" (
	"teacher_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"score_impact" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"built_in" boolean DEFAULT false NOT NULL,
	"tone" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "attendance_statuses_teacher_id_key_pk" PRIMARY KEY("teacher_id","key")
);
--> statement-breakpoint
CREATE TABLE "student_relations" (
	"teacher_id" text NOT NULL,
	"student_a" text NOT NULL,
	"student_b" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_relations_student_a_student_b_pk" PRIMARY KEY("student_a","student_b")
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"teacher_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"unit_id" text,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"effective_from" text NOT NULL,
	"note" text,
	"created_at" text NOT NULL,
	"bell_config" jsonb NOT NULL,
	"events" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"status" text NOT NULL,
	"due_date" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standard_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_notes" (
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_notes_teacher_id_class_id_pk" PRIMARY KEY("teacher_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"status" text NOT NULL,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_statuses" ADD CONSTRAINT "attendance_statuses_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_relations" ADD CONSTRAINT "student_relations_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_relations" ADD CONSTRAINT "student_relations_student_a_students_id_fk" FOREIGN KEY ("student_a") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_relations" ADD CONSTRAINT "student_relations_student_b_students_id_fk" FOREIGN KEY ("student_b") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_sets" ADD CONSTRAINT "standard_sets_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_notes" ADD CONSTRAINT "class_notes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "classes_teacher_idx" ON "classes" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "students_teacher_idx" ON "students" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "students_class_idx" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "assignments_teacher_idx" ON "assignments" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "assignments_class_idx" ON "assignments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "assignments_topic_idx" ON "assignments" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "grades_teacher_idx" ON "grades" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "grades_assignment_idx" ON "grades" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "topics_teacher_idx" ON "topics" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "topics_class_idx" ON "topics" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "attendance_records_teacher_idx" ON "attendance_records" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "attendance_records_student_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_relations_teacher_idx" ON "student_relations" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "lessons_teacher_idx" ON "lessons" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "lessons_class_idx" ON "lessons" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "timetable_versions_teacher_idx" ON "timetable_versions" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "units_teacher_idx" ON "units" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "tasks_teacher_idx" ON "tasks" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "standard_sets_teacher_idx" ON "standard_sets" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "notifications_teacher_idx" ON "notifications" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "feedback_teacher_idx" ON "feedback" USING btree ("teacher_id");