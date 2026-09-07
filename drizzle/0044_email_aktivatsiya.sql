CREATE TABLE "email_activation" (
	"user_id" text PRIMARY KEY NOT NULL,
	"opted_out" boolean DEFAULT false NOT NULL,
	"stage" text DEFAULT 'a1' NOT NULL,
	"scheduled_email_id" text,
	"scheduled_for" timestamp with time zone,
	"sent_log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_activation" ADD CONSTRAINT "email_activation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;