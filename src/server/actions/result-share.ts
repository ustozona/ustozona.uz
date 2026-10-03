"use server";

import { z } from "zod";
import { getSession, requireTeacher } from "@/server/session";
import { claimShare, finishShare, sessionShareData, shareStatus } from "@/server/dal/assess/result-share";
import { linkedTelegramIdOf } from "@/server/dal/account-link";
import { activeChatFor } from "@/server/telegram/bot";
import { isTelegramBotEnabled } from "@/server/telegram/config";
import { sendParentsResults, sendTeacherSummary } from "@/server/telegram/test-results";

/* ════════════════════════════════════════════════════════════════════
   NATIJANI TELEGRAMGA YUBORISH — oʻqituvchiga xulosa, ota-onalarga
   farzandining natijasi (docs/natija-telegram-spec.md).

   Har ikkisi BIR MARTALIK (sessiya boʻyicha): qayta bosish «allaqachon
   yuborilgan» deydi, xabar takrorlanmaydi. Vaqtinchalik xatoda band
   qilish bekor qilinadi — oʻqituvchi qayta urina oladi.
   ⚠️ Tip eksporti yoʻq (AGENTS.md) — natija shakli shu yerda inline.
   ════════════════════════════════════════════════════════════════════ */

const inputSchema = z.object({
  sessionId: z.string().min(1).max(64),
  teacher: z.boolean(),
  parents: z.boolean(),
});

type Part =
  | { state: "sent"; sent?: number; reached?: number; withoutParents?: number; students?: number }
  | { state: "already" | "off" | "not_linked" | "bot" | "empty" | "failed" };

export async function shareResultsAction(input: z.infer<typeof inputSchema>) {
  const { sessionId, teacher, parents } = inputSchema.parse(input);
  const me = await requireTeacher();
  // Administrator oʻqituvchi nomidan koʻrayotgan boʻlsa — haqiqiy ota-onalarga
  // xabar KETMAYDI (oʻyin chiptasi bilan bir qoida, `games-sso.ts`).
  const session = await getSession();
  if (session?.session.impersonatedBy) return { ok: false as const, reason: "impersonating" as const };
  const data = await sessionShareData(sessionId);
  if (!data) return { ok: false as const, reason: "not_found" as const };
  if (data.students.length === 0) {
    return { ok: true as const, teacher: { state: "empty" } as Part, parents: { state: "empty" } as Part };
  }

  /* ── Oʻqituvchiga xulosa ── */
  let teacherPart: Part = { state: "off" };
  if (teacher) {
    if (!isTelegramBotEnabled()) teacherPart = { state: "bot" };
    else {
      const chatId = await activeChatFor(me.id);
      if (!chatId) teacherPart = { state: "not_linked" };
      else {
        const claim = await claimShare("test_summary", sessionId);
        if (!claim) teacherPart = { state: "already" };
        else {
          const res = await sendTeacherSummary(chatId, data);
          if (res.ok) {
            await finishShare(claim, "sent");
            teacherPart = { state: "sent" };
          } else {
            await finishShare(claim, "release");
            teacherPart = { state: "failed" };
          }
        }
      }
    }
  }

  /* ── Ota-onalarga ── */
  let parentsPart: Part = { state: "off" };
  if (parents) {
    const telegramId = await linkedTelegramIdOf(me.id);
    if (!telegramId) parentsPart = { state: "not_linked" };
    else {
      const claim = await claimShare("test_parents", sessionId);
      if (!claim) parentsPart = { state: "already" };
      else {
        const res = await sendParentsResults(data, { userId: me.id, telegramId });
        if (res.ok) {
          await finishShare(claim, "sent", JSON.stringify({ sent: res.sent, reached: res.reached, students: res.students }));
          parentsPart = {
            state: "sent",
            sent: res.sent,
            reached: res.reached,
            withoutParents: res.withoutParents,
            students: res.students,
          };
        } else if (res.reason === "already") {
          // Hamkor tomonda allaqachon yuborilgan (boshqa tab) — band qilish qoladi.
          await finishShare(claim, "sent");
          parentsPart = { state: "already" };
        } else {
          await finishShare(claim, "release");
          parentsPart = { state: res.reason === "not_linked" ? "not_linked" : res.reason === "not_configured" ? "bot" : "failed" };
        }
      }
    }
  }

  return { ok: true as const, teacher: teacherPart, parents: parentsPart };
}

const statusSchema = z.object({ sessionId: z.string().min(1).max(64) });

/** Ekran ochilganda — shu natija allaqachon yuborilganmi. */
export async function shareStatusAction(input: z.infer<typeof statusSchema>) {
  const { sessionId } = statusSchema.parse(input);
  const status = await shareStatus(sessionId);
  let parents: { sent: number; reached: number; students: number } | null = null;
  try {
    parents = status.test_parents?.note ? JSON.parse(status.test_parents.note) : null;
  } catch {
    parents = null;
  }
  return {
    teacherAt: status.test_summary?.at ?? null,
    parentsAt: status.test_parents?.at ?? null,
    parents,
  };
}
