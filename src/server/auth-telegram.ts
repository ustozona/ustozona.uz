import "server-only";
import { and, eq, gt } from "drizzle-orm";
import * as z from "zod";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint, getSessionFromCtx } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { db } from "./db/client";
import { tgAuthRequests } from "./db/schema";
import { hashSecret } from "./telegram/auth-requests";

/* ════════════════════════════════════════════════════════════════════
   BETTER AUTH PLAGINI — Telegram orqali tasdiqlangan soʻrovdan sessiya

   Nega plagin, oʻzimiz `session` qatori yozmaymiz: sessiyani Better
   Auth'ning OʻZI ochsin — shunda uning hook'lari ishlaydi (admin
   plagini bloklangan foydalanuvchiga sessiya bermaydi), cookie nomi,
   imzo va muddati email/Google kirishi bilan aynan bir xil boʻladi.

   ⛔ HTTP orqali CHAQIRILMAYDI. Endpoint `/api/auth/[...all]` ostida
   ham paydo boʻladi, lekin `ctx.request` bor boʻlsa rad etiladi — u
   faqat serverdan `auth.api.telegramSignIn(...)` bilan chaqiriladi
   (`dal/tg-auth.ts`). Sir baribir kerak boʻlardi, lekin tashqi kirish
   nuqtasi umuman boʻlmagani yaxshiroq.

   Sxemaga taʼsiri YOʻQ (jadval qoʻshmaydi) — `auth-schema-config.ts`
   ni yangilash shart emas.
   ════════════════════════════════════════════════════════════════════ */

const bodySchema = z.object({
  requestId: z.string().min(16).max(64),
  secret: z.string().min(16).max(128),
});

/** BIR MARTALIK: `approved → consumed` shartli UPDATE. Ikki parallel
    soʻrovdan faqat bittasi qator oladi — yaʼni bitta tasdiqdan ikkita
    sessiya chiqmaydi. Sayt (cookie) va mobil ilova (bearer) uchun umumiy. */
async function claimApprovedLogin(requestId: string, secret: string): Promise<string> {
  const [claimed] = await db
    .update(tgAuthRequests)
    .set({ status: "consumed", consumedAt: new Date() })
    .where(
      and(
        eq(tgAuthRequests.id, requestId),
        eq(tgAuthRequests.kind, "login"),
        eq(tgAuthRequests.status, "approved"),
        eq(tgAuthRequests.browserSecretHash, hashSecret(secret)),
        gt(tgAuthRequests.expiresAt, new Date())
      )
    )
    .returning({ userId: tgAuthRequests.userId });

  if (!claimed?.userId) {
    throw new APIError("UNAUTHORIZED", { message: "TG_REQUEST_INVALID" });
  }
  return claimed.userId;
}

export const telegramAuth = () =>
  ({
    id: "ustozona-telegram",
    endpoints: {
      telegramSignIn: createAuthEndpoint(
        "/telegram/sign-in",
        { method: "POST", body: bodySchema },
        async (ctx) => {
          if (ctx.request) throw new APIError("NOT_FOUND");

          const userId = await claimApprovedLogin(ctx.body.requestId, ctx.body.secret);
          const user = await ctx.context.internalAdapter.findUserById(userId);
          if (!user) throw new APIError("UNAUTHORIZED", { message: "TG_USER_MISSING" });

          // Bloklangan foydalanuvchi — admin plagini hook'i shu yerda otadi.
          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) throw new APIError("INTERNAL_SERVER_ERROR");

          await setSessionCookie(ctx, { session, user });
          return ctx.json({ ok: true });
        }
      ),

      /* Mobil ilova: xuddi shu tasdiq, lekin cookie EMAS — sessiya tokeni
         javobda qaytadi. Ilova uni `Authorization: Bearer` bilan yuboradi
         (`bearer()` plagini, auth.ts). Sessiya sayt sessiyalari bilan bitta
         jadvalda — Sozlamalardan koʻrinadi va bekor qilinadi. Faqat
         serverdan chaqiriladi (`dal/mobile-auth.ts`). */
      telegramMobileSignIn: createAuthEndpoint(
        "/telegram/mobile-sign-in",
        { method: "POST", body: bodySchema },
        async (ctx) => {
          if (ctx.request) throw new APIError("NOT_FOUND");

          const userId = await claimApprovedLogin(ctx.body.requestId, ctx.body.secret);
          const user = await ctx.context.internalAdapter.findUserById(userId);
          if (!user) throw new APIError("UNAUTHORIZED", { message: "TG_USER_MISSING" });

          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) throw new APIError("INTERNAL_SERVER_ERROR");

          return ctx.json({
            token: session.token,
            expiresAt: session.expiresAt.toISOString(),
            user: { id: user.id, name: user.name, image: user.image ?? null },
          });
        }
      ),

      /* Mobil ilova ichida ochilgan sayt sahifalari uchun: bearer sessiyadan
         AYNAN shu sessiyaning imzolangan cookie'si. Ilova uni WebView'ga
         qoʻyadi — foydalanuvchi saytga QAYTA kirmaydi. Yangi sessiya
         ochilmaydi. Faqat serverdan chaqiriladi (`dal/mobile-auth.ts`). */
      mobileWebCookie: createAuthEndpoint(
        "/telegram/mobile-web-cookie",
        { method: "POST" },
        async (ctx) => {
          if (ctx.request) throw new APIError("NOT_FOUND");
          const current = await getSessionFromCtx(ctx);
          if (!current) throw new APIError("UNAUTHORIZED");
          const cookie = ctx.context.authCookies.sessionToken;
          await ctx.setSignedCookie(
            cookie.name,
            current.session.token,
            ctx.context.secret,
            cookie.attributes,
          );
          return ctx.json({ ok: true });
        }
      ),
    },
  }) satisfies BetterAuthPlugin;
