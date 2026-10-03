import "server-only";
import { esc, sendMessage } from "./api";
import type { SessionShareData } from "@/server/dal/assess/result-share";
import { isConfigured, lessonlab, LessonLabError } from "@/server/lessonlab/client";

/* ════════════════════════════════════════════════════════════════════
   TEST NATIJASI → TELEGRAM (docs/natija-telegram-spec.md).

   Ikki qabul qiluvchi, ikki yoʻl:
     • OʻQITUVCHI — sinf xulosasi, Ustozona botidan (`sendMessage`):
       sinf foizi, eng yaxshilar, yordam kerak boʻlganlar, eng qiyin
       savollar. Bitta xabar — dars tugagach telefonda bir qarashda.
     • OTA-ONALAR — har biriga FAQAT oʻz farzandining natijasi. Ota-ona
       roʻyxati LessonLab botida (`bot_parents`), shuning uchun xabarni
       roʻyxat egasi yuboradi: imzolangan hamkor soʻrovi
       `POST /api/v1/parents/test-results` (LessonLab
       `services/parent_results.py` — obunadan chiqish tugmasi bilan).
   ════════════════════════════════════════════════════════════════════ */

const SITE = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");
/** «Yordam kerak» chegarasi — toʻgʻri javob shu foizdan past. */
const HELP_BELOW = 50;

function pct(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0;
}

function names(list: { name: string }[], max: number): string {
  const shown = list.slice(0, max).map((s) => esc(s.name)).join(", ");
  return list.length > max ? `${shown} va yana ${list.length - max} kishi` : shown;
}

export function buildTeacherSummary(d: SessionShareData): string {
  const where = [d.subject, d.className].filter(Boolean).map(esc).join(" · ");
  const top = d.students.filter((s) => s.correct > 0).slice(0, 3);
  const help = d.students.filter((s) => pct(s.correct, s.total) < HELP_BELOW);
  const lines = [
    `📊 <b>${esc(d.title)}</b>`,
    where ? `🏫 ${where}` : "",
    "",
    `👥 Qatnashdi: <b>${d.students.length}</b> oʻquvchi · ${d.questionCount} savol`,
    `✅ Sinf natijasi: <b>${d.classAccuracy}%</b>`,
  ];
  if (top.length) {
    lines.push(`🏆 Eng yaxshi: ${top.map((s) => `${esc(s.name)} (${s.correct}/${s.total})`).join(", ")}`);
  }
  if (help.length) {
    lines.push(`🤝 Yordam kerak (${HELP_BELOW}% dan past): ${names(help, 8)}`);
  }
  if (d.hardest.length) {
    lines.push("", "❓ <b>Eng qiyin savollar:</b>");
    for (const h of d.hardest) {
      const stem = h.stem.length > 70 ? `${h.stem.slice(0, 70)}…` : h.stem;
      lines.push(`  ${h.no}-savol — ${h.accuracy}%${stem ? `: ${esc(stem)}` : ""}`);
    }
    lines.push("", "💡 Bu mavzularni keyingi darsda takrorlash tavsiya etiladi.");
  }
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

export async function sendTeacherSummary(chatId: string, d: SessionShareData) {
  return sendMessage(chatId, buildTeacherSummary(d), {
    inline_keyboard: [[{ text: "📋 Natijalarni ochish", url: `${SITE}/dashboard/assignments` }]],
  });
}

export type ParentsOutcome =
  | { ok: true; sent: number; failed: number; reached: number; withoutParents: number; students: number }
  | { ok: false; reason: "not_configured" | "not_linked" | "already" | "failed" };

/** Ota-onalarga — LessonLab hamkor API orqali. Idempotentlik kaliti — sessiya:
    tarmoq uzilib qayta yuborilsa ham ota-onaga xabar ikki marta ketmaydi. */
export async function sendParentsResults(
  d: SessionShareData,
  teacher: { userId: string; telegramId: string },
): Promise<ParentsOutcome> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const res = await lessonlab<{
      sent: number;
      failed: number;
      students: number;
      students_reached: number;
      students_without_parents: number;
    }>({
      method: "POST",
      path: "/api/v1/parents/test-results",
      idempotencyKey: `parents:${d.sessionId}`,
      timeoutMs: 45_000,
      body: {
        uz_user_id: teacher.userId,
        telegram_id: teacher.telegramId,
        test_title: d.title.slice(0, 120),
        class_name: d.className.slice(0, 60),
        subject: d.subject.slice(0, 60),
        teacher_name: d.teacherName.slice(0, 80),
        question_count: d.questionCount,
        class_accuracy: d.classAccuracy,
        results: d.students.slice(0, 200).map((s) => ({
          uz_student_id: s.studentId,
          name: s.name.slice(0, 80),
          correct: s.correct,
          total: s.total,
          wrong: s.wrong,
        })),
      },
    });
    return {
      ok: true,
      sent: res.sent,
      failed: res.failed,
      reached: res.students_reached,
      withoutParents: res.students_without_parents,
      students: res.students,
    };
  } catch (err) {
    if (err instanceof LessonLabError) {
      if (err.code === "not_linked") return { ok: false, reason: "not_linked" };
      if (err.code === "idempotency_key_reuse") return { ok: false, reason: "already" };
    }
    console.error("[test-results] ota-onalarga yuborilmadi", err);
    return { ok: false, reason: "failed" };
  }
}
