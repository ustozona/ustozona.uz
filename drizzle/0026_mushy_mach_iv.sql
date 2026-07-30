CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"bank_id" text,
	"standard_id" text,
	"shape" text NOT NULL,
	"title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source" text DEFAULT 'teacher' NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"grading" text DEFAULT 'exact' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_banks" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"grade" integer,
	"visibility" text DEFAULT 'private' NOT NULL,
	"copied_from" text,
	"verified" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_items" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"title" text NOT NULL,
	"purpose" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"container_kind" text DEFAULT 'none' NOT NULL,
	"container_ref" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cj_judgements" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"left_script_id" text NOT NULL,
	"right_script_id" text NOT NULL,
	"winner_script_id" text NOT NULL,
	"judged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cj_ranks" (
	"task_id" text NOT NULL,
	"script_id" text NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"comparisons" integer DEFAULT 0 NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cj_ranks_task_id_script_id_pk" PRIMARY KEY("task_id","script_id")
);
--> statement-breakpoint
CREATE TABLE "cj_scripts" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"response_id" text,
	"student_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cj_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"set_id" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "misconceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"standard_id" text,
	"label" text NOT NULL,
	"remediation_ref" text
);
--> statement-breakpoint
CREATE TABLE "omr_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"session_id" text NOT NULL,
	"image_url" text NOT NULL,
	"sheet_layout" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"detected" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"set_id" text NOT NULL,
	"class_id" text NOT NULL,
	"title" text,
	"mode" text NOT NULL,
	"mode_boundary" integer,
	"state" text DEFAULT 'draft' NOT NULL,
	"join_code" text,
	"current_index" integer DEFAULT 0 NOT NULL,
	"render_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completion" jsonb DEFAULT '{"kind":"allItems"}'::jsonb NOT NULL,
	"runtime_ref" text,
	"scheduled_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"session_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"student_id" text,
	"activity_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_version" integer DEFAULT 1 NOT NULL,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"score" numeric(4, 3),
	"misconception_id" text,
	"standard_id" text,
	"source" text,
	"confidence" text,
	"accommodations" jsonb,
	"elapsed_ms" integer,
	"client_seq" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "responses_participant_item_attempt_unique" UNIQUE("participant_id","item_id","item_version","attempt_no")
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"student_id" text,
	"team_id" text,
	"display_name" text NOT NULL,
	"token_hash" text NOT NULL,
	"device_label" text,
	"device_kind" text,
	"game_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"integrity" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "student_accommodations" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"kind" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scope" text DEFAULT 'student' NOT NULL,
	"scope_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_accommodations_unique" UNIQUE("student_id","kind","scope","scope_ref")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_bank_id_activity_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."activity_banks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_banks" ADD CONSTRAINT "activity_banks_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sets" ADD CONSTRAINT "activity_sets_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sets" ADD CONSTRAINT "activity_sets_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_judgements" ADD CONSTRAINT "cj_judgements_task_id_cj_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."cj_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_judgements" ADD CONSTRAINT "cj_judgements_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_judgements" ADD CONSTRAINT "cj_judgements_left_script_id_cj_scripts_id_fk" FOREIGN KEY ("left_script_id") REFERENCES "public"."cj_scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_judgements" ADD CONSTRAINT "cj_judgements_right_script_id_cj_scripts_id_fk" FOREIGN KEY ("right_script_id") REFERENCES "public"."cj_scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_judgements" ADD CONSTRAINT "cj_judgements_winner_script_id_cj_scripts_id_fk" FOREIGN KEY ("winner_script_id") REFERENCES "public"."cj_scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_ranks" ADD CONSTRAINT "cj_ranks_task_id_cj_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."cj_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_ranks" ADD CONSTRAINT "cj_ranks_script_id_cj_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."cj_scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_scripts" ADD CONSTRAINT "cj_scripts_task_id_cj_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."cj_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_scripts" ADD CONSTRAINT "cj_scripts_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_scripts" ADD CONSTRAINT "cj_scripts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_tasks" ADD CONSTRAINT "cj_tasks_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_tasks" ADD CONSTRAINT "cj_tasks_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cj_tasks" ADD CONSTRAINT "cj_tasks_set_id_activity_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."activity_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "misconceptions" ADD CONSTRAINT "misconceptions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "omr_scans" ADD CONSTRAINT "omr_scans_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "omr_scans" ADD CONSTRAINT "omr_scans_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "omr_scans" ADD CONSTRAINT "omr_scans_reviewed_by_teachers_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_set_id_activity_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."activity_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_participant_id_session_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."session_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_item_id_activity_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_misconception_id_misconceptions_id_fk" FOREIGN KEY ("misconception_id") REFERENCES "public"."misconceptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_team_id_session_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."session_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_teams" ADD CONSTRAINT "session_teams_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_teams" ADD CONSTRAINT "session_teams_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_accommodations" ADD CONSTRAINT "student_accommodations_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_accommodations" ADD CONSTRAINT "student_accommodations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_teacher_idx" ON "activities" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "activities_bank_idx" ON "activities" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "activity_banks_teacher_idx" ON "activity_banks" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "activity_items_activity_idx" ON "activity_items" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_items_teacher_idx" ON "activity_items" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "activity_sets_teacher_idx" ON "activity_sets" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "activity_sets_class_idx" ON "activity_sets" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "cj_judgements_task_idx" ON "cj_judgements" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cj_scripts_task_idx" ON "cj_scripts" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cj_tasks_teacher_idx" ON "cj_tasks" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "omr_scans_session_idx" ON "omr_scans" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_teacher_idx" ON "quiz_sessions" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_class_idx" ON "quiz_sessions" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_set_idx" ON "quiz_sessions" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "responses_student_standard_idx" ON "responses" USING btree ("student_id","standard_id");--> statement-breakpoint
CREATE INDEX "responses_misconception_idx" ON "responses" USING btree ("misconception_id") WHERE "responses"."misconception_id" is not null;--> statement-breakpoint
CREATE INDEX "responses_session_idx" ON "responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_participants_session_idx" ON "session_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_participants_student_idx" ON "session_participants" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "session_participants_team_idx" ON "session_participants" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "session_teams_session_idx" ON "session_teams" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "student_accommodations_teacher_idx" ON "student_accommodations" USING btree ("teacher_id");