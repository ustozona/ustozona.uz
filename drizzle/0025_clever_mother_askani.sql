CREATE TABLE "student_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text,
	"student_id" text,
	"relation" text NOT NULL,
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"used_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_links" (
	"user_id" text NOT NULL,
	"student_id" text NOT NULL,
	"relation" text NOT NULL,
	"granted_by" text,
	"verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_links_user_id_student_id_pk" PRIMARY KEY("user_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "user_telegram" (
	"telegram_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "require_guardian_contact" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_links" ADD CONSTRAINT "student_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_links" ADD CONSTRAINT "student_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_links" ADD CONSTRAINT "student_links_granted_by_teachers_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_telegram" ADD CONSTRAINT "user_telegram_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;