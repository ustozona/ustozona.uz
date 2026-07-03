import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/client";
import * as schema from "./db/schema";

/* ════════════════════════════════════════════════════════════════════
   BETTER AUTH — runtime konfiguratsiya (yagona haqiqat manbai).

   DIQQAT: sxemaga taʼsir qiluvchi opsiyalar oʻzgarsa (additionalFields,
   plugin qoʻshish), `scripts/auth-schema-config.ts` ham yangilanib,
   sxema qayta generatsiya qilinishi shart.

   Google OAuth env-gated: GOOGLE_CLIENT_ID/SECRET qoʻyilganda oʻzi
   yoqiladi, boʻlmasa faqat email+parol.
   ════════════════════════════════════════════════════════════════════ */

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Ustozona",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  user: {
    additionalFields: {
      /** Sentyabr: oʻquvchi akkauntlari ham shu jadvalga `role` bilan qoʻshiladi. */
      role: { type: "string", defaultValue: "teacher", input: false },
    },
  },
  // Next 16 async cookies() bilan server action ichida cookie yozishni hal qiladi.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
