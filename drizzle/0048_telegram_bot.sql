CREATE TABLE "tg_auth_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"browser_secret_hash" text NOT NULL,
	"code" text NOT NULL,
	"client_label" text DEFAULT '' NOT NULL,
	"user_id" text,
	"telegram_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tg_chats" (
	"telegram_id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"language_code" text,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_at" timestamp with time zone,
	"marketing_consent_at" timestamp with time zone,
	"marketing_opt_out_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_notify_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"date_key" text NOT NULL,
	"status" text DEFAULT 'sending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tg_notify_log_once" UNIQUE("user_id","kind","date_key")
);
--> statement-breakpoint
CREATE TABLE "tg_notify_prefs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"morning_enabled" boolean DEFAULT true NOT NULL,
	"morning_time" text DEFAULT '07:00' NOT NULL,
	"evening_enabled" boolean DEFAULT true NOT NULL,
	"evening_time" text DEFAULT '20:00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tg_auth_requests" ADD CONSTRAINT "tg_auth_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_notify_log" ADD CONSTRAINT "tg_notify_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_notify_prefs" ADD CONSTRAINT "tg_notify_prefs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tg_auth_requests_telegram_idx" ON "tg_auth_requests" USING btree ("telegram_id");--> statement-breakpoint
-- QOʻLDA qoʻshilgan (drizzle-kit RLS chiqarmaydi) — 0045 dagi naqsh:
-- RLS siyosatsiz = ommaviy API (anon/authenticated) uchun yopiq, ilova
-- esa toʻgʻridan-toʻgʻri Postgres ulanishi bilan kiradi. Bu jadvallarda
-- telefon raqami va kirish soʻrovlari bor — ochiq qolishi mumkin emas.
ALTER TABLE "tg_chats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tg_auth_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tg_notify_prefs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tg_notify_log" ENABLE ROW LEVEL SECURITY;
