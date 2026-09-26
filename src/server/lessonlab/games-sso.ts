import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { userTelegram } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";
import { isConfigured, lessonlab, LessonLabError } from "./client";

/* ════════════════════════════════════════════════════════════════════
   OʻYINLARGA AVTOMATIK KIRISH — Ustozona sessiyasi → oʻyin sessiyasi

   Oʻyinlar LessonLab serverida (iframe) va oʻqituvchini faqat Telegram
   sessiyasi orqali taniydi. Ilgari Ustozona'ga kirgan oʻqituvchi
   oʻyinlarda ikkinchi marta, Telegram orqali kirishi kerak edi.

   Endi: server (brauzer EMAS) imzolangan hamkor soʻrovi bilan
   120 soniyalik BIR MARTALIK chipta oladi, sahifa uni iframe
   manzilining FRAGMENTIGA qoʻyadi (`#ll_ticket=…` — fragment serverga,
   jurnalga va Referer'ga tushmaydi), oʻyin tomoni esa chiptani oʻz
   sessiyasiga almashtiradi. Chipta shartlari LessonLab tomonida
   tekshiriladi (`services/games_sso.py`):
     · soʻrov Ustozona hamkor kaliti bilan imzolangan;
     · `user_telegram` da AYNAN shu juftlik bor — oʻqituvchining oʻzi
       botda tasdiqlagan bogʻlanish;
     · Telegram akkaunt ustoz rejimida.

   Bu yerda qoʻshimcha ikki shart:
     · faqat oʻqituvchi roli (Shogird akkaunti oʻyin sessiyasi olmaydi);
     · impersonatsiyada chipta BERILMAYDI — administrator oʻqituvchi
       nomidan Ustozona'ni koʻrishi mumkin, lekin uning LessonLab
       sessiyasini olishi shart emas.

   Hamma xato jim: chipta boʻlmasa oʻyinlar oddiy «Telegram orqali
   kirish» tugmasi bilan ochiladi — hech narsa buzilmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Chipta olishni kutish chegarasi — sahifa renderini ushlab turmasin. */
const TICKET_TIMEOUT_MS = 2500;

export type GamesIdentity =
  | { state: "anonymous" }
  | { state: "not_linked" }
  | { state: "ticket"; ticket: string }
  | { state: "unavailable" };

export async function gamesTicket(): Promise<GamesIdentity> {
  const session = await getSession();
  if (!session || !isTeacher(session.user)) return { state: "anonymous" };
  if (session.session.impersonatedBy) return { state: "unavailable" };

  const [link] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, session.user.id))
    .limit(1);
  if (!link) return { state: "not_linked" };
  if (!isConfigured()) return { state: "unavailable" };

  try {
    const res = await lessonlab<{ ticket?: string }>({
      method: "POST",
      path: "/api/v1/games/ticket",
      body: {
        uz_user_id: session.user.id,
        telegram_id: link.telegramId,
        first_name: (session.user.name ?? "").split(/\s+/)[0]?.slice(0, 64) ?? "",
      },
      timeoutMs: TICKET_TIMEOUT_MS,
    });
    const ticket = typeof res?.ticket === "string" ? res.ticket : "";
    return /^[A-Za-z0-9_-]{20,128}$/.test(ticket)
      ? { state: "ticket", ticket }
      : { state: "unavailable" };
  } catch (err) {
    // `not_linked` — bazada bogʻlanish bor, lekin LessonLab boshqacha
    // koʻrdi (poyga: aynan shu paytda uzildi). `not_teacher` — botda rol
    // tanlanmagan. Ikkalasi ham oddiy holat, faqat qisqa log.
    const code = err instanceof LessonLabError ? err.code : "unknown";
    if (code === "not_linked") return { state: "not_linked" };
    console.warn("[games-sso] chipta olinmadi:", code);
    return { state: "unavailable" };
  }
}
