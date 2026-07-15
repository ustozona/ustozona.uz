import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { ac, roles, ADMIN_ROLES } from "../src/lib/auth-roles";

/* ════════════════════════════════════════════════════════════════════
   FAQAT `@better-auth/cli generate` UCHUN konfiguratsiya.

   Asl runtime konfiguratsiya — `src/server/auth.ts`. U `server-only`
   importlarga tayanadi, CLI esa oddiy Node'da ishlaydi va shu sabab
   uni yuklay olmaydi. Bu fayl sxemaga taʼsir qiluvchi opsiyalarni
   (emailAndPassword, pluginlar) AYNAN takrorlashi shart — aks holda
   generatsiya qilingan jadvallar runtime'dan farq qiladi.

   DIQQAT: `src/server/db/schema/auth.ts` qoʻlda qoʻshilgan indekslar
   va `relations()` bloklarini saqlaydi. CLI natijasini HECH QACHON
   toʻgʻridan-toʻgʻri u faylning ustiga yozmang — faqat vaqtinchalik
   faylga generatsiya qilib, diff orqali qoʻlda koʻchiring:

     npx @better-auth/cli@<better-auth versiyasi> generate \
       --config scripts/auth-schema-config.ts \
       --output /tmp/auth-schema-generated.ts
   ════════════════════════════════════════════════════════════════════ */

export const auth = betterAuth({
  appName: "Ustozona",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database: drizzleAdapter({} as any, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [
    admin({
      defaultRole: "teacher",
      adminRoles: [...ADMIN_ROLES],
      ac,
      roles,
    }),
  ],
});
