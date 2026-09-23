import "server-only";
import { and, eq, gt } from "drizzle-orm";
import * as z from "zod";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
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

export const telegramAuth = () =>
  ({
    id: "ustozona-telegram",
    endpoints: {
      telegramSignIn: createAuthEndpoint(
        "/telegram/sign-in",
        { method: "POST", body: bodySchema },
        async (ctx) => {
          if (ctx.request) throw new APIError("NOT_FOUND");

          // BIR MARTALIK: `approved → consumed` shartli UPDATE. Ikki
          // parallel soʻrovdan faqat bittasi qator oladi — yaʼni bitta
          // tasdiqdan ikkita sessiya chiqmaydi.
          const [claimed] = await db
            .update(tgAuthRequests)
            .set({ status: "consumed", consumedAt: new Date() })
            .where(
              and(
                eq(tgAuthRequests.id, ctx.body.requestId),
                eq(tgAuthRequests.kind, "login"),
                eq(tgAuthRequests.status, "approved"),
                eq(tgAuthRequests.browserSecretHash, hashSecret(ctx.body.secret)),
                gt(tgAuthRequests.expiresAt, new Date())
              )
            )
            .returning({ userId: tgAuthRequests.userId });

          if (!claimed?.userId) {
            throw new APIError("UNAUTHORIZED", { message: "TG_REQUEST_INVALID" });
          }

          const user = await ctx.context.internalAdapter.findUserById(claimed.userId);
          if (!user) throw new APIError("UNAUTHORIZED", { message: "TG_USER_MISSING" });

          // Bloklangan foydalanuvchi — admin plagini hook'i shu yerda otadi.
          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) throw new APIError("INTERNAL_SERVER_ERROR");

          await setSessionCookie(ctx, { session, user });
          return ctx.json({ ok: true });
        }
      ),
    },
  }) satisfies BetterAuthPlugin;
