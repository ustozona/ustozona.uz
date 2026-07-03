import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/* ════════════════════════════════════════════════════════════════════
   FAQAT `@better-auth/cli generate` UCHUN konfiguratsiya.

   Asl runtime konfiguratsiya — `src/server/auth.ts`. U `server-only`
   importlarga tayanadi, CLI esa oddiy Node'da ishlaydi va shu sabab
   uni yuklay olmaydi. Bu fayl sxemaga taʼsir qiluvchi opsiyalarni
   (emailAndPassword, additionalFields, pluginlar) AYNAN takrorlashi
   shart — aks holda generatsiya qilingan jadvallar runtime'dan farq
   qiladi.

   Ishlatish:
     npx @better-auth/cli@<better-auth versiyasi> generate \
       --config scripts/auth-schema-config.ts \
       --output src/server/db/schema/auth.ts
   ════════════════════════════════════════════════════════════════════ */

export const auth = betterAuth({
  appName: "Ustozona",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database: drizzleAdapter({} as any, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      /** Sentyabr: oʻquvchi akkauntlari ham shu jadvalga `role` bilan qoʻshiladi. */
      role: { type: "string", defaultValue: "teacher", input: false },
    },
  },
});
