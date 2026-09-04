CREATE TABLE "school_timetable_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"staff_key" text NOT NULL,
	"display_name" text NOT NULL,
	"teacher_id" text,
	"invite_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_timetables" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"effective_from" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"note" text,
	"data" jsonb NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_timetable_staff" ADD CONSTRAINT "school_timetable_staff_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_timetable_staff" ADD CONSTRAINT "school_timetable_staff_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_timetables" ADD CONSTRAINT "school_timetables_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_timetables" ADD CONSTRAINT "school_timetables_approved_by_teachers_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_timetable_staff_workspace_idx" ON "school_timetable_staff" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_timetable_staff_key_idx" ON "school_timetable_staff" USING btree ("workspace_id","staff_key");--> statement-breakpoint
CREATE UNIQUE INDEX "school_timetable_staff_teacher_idx" ON "school_timetable_staff" USING btree ("workspace_id","teacher_id") WHERE "school_timetable_staff"."teacher_id" is not null;--> statement-breakpoint
CREATE INDEX "school_timetables_workspace_idx" ON "school_timetables" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_timetables_effective_idx" ON "school_timetables" USING btree ("workspace_id","effective_from");