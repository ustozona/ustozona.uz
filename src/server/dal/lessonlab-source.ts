import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { lessonlab } from "@/server/lessonlab/client";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB MA'LUMOT MANBAI — ikki yo'l, bitta shakl

   NIMA UCHUN BU FAYL BOR
   ----------------------
   `lessonlab-import.ts` dagi qimmatli qism — bogʻlash mantigʻi
   (`class_links` / `roster_links` / `test_links`, tranzaksiya, hisobot,
   `syncLinkedSet` dagi «ishlatilganmi» tekshiruvi). U sinovdan oʻtgan
   va uni QAYTA YOZISH kerak emas.

   Oʻzgarishi kerak boʻlgan narsa — maʼlumot QAYERDAN kelishi. Shuning
   uchun u shu yerga, ikkita almashtiriladigan manbaga ajratildi:

     `apiSource(token)` — OAuth token bilan Partner API orqali (eski yoʻl)
     `dbSource(tgId)`   — TOʻGʻRIDAN bazadan (yangi yoʻl)

   ⛔ NEGA TOʻGʻRIDAN OʻQISH MUMKIN
   -------------------------------
   Ikkala mahsulot 2026-08-05 dan BITTA Supabase loyihasida. Kimlik
   koʻprigi (`user_telegram`) yozilgandan keyin OAuth ichki
   sinxronizatsiya uchun ORTIQCHA: bogʻlanish bor — demak ruxsat bor.

   Eski yoʻlda har koʻchirish toʻliq rozilik zanjirini talab qilardi
   (token `callback` da ataylab SAQLANMAYDI), va roʻyxat bilan test
   uchun IKKI ALOHIDA rozilik kerak edi. Natijada sinxronizatsiya
   amalda hech qachon qilinmasdi.

   OAuth OʻCHIRILMAYDI — u ikki joyda qoladi va ikkalasi ham haqiqiy:
     1) birinchi marta kimlikni isbotlash (`bridgeTelegramIdentity`);
     2) tashqi hamkorlar — Partner API v1 shartnomasi oʻzgarmaydi.

   ⛔ EGALIK — ENG XAVFLI JOY
   -------------------------
   Eski yoʻlda «faqat shu oʻqituvchining sinflari» filtrini Partner API
   OʻZI majburlardi. Toʻgʻridan oʻqishda u SHU FAYLGA koʻchadi.

   Shuning uchun `dbSource` telegram id'ni ARGUMENT sifatida oladi va
   chaqiruvchi joy uni FAQAT sessiyadagi oʻqituvchidan oladi
   (`user_telegram` orqali). Uni soʻrov tanasidan, query'dan yoki
   boshqa foydalanuvchi kiritadigan joydan OLMANG — u holda bir
   oʻqituvchi boshqasining sinflarini koʻrardi.
   ════════════════════════════════════════════════════════════════════ */

export type LlClass = {
  id: number; name: string; subject?: string | null; grade?: string | null;
};
export type LlStudent = { id: number; number_in_class: number; full_name: string };
export type LlTest = {
  id: number; title: string; subject?: string | null; question_count?: number | null;
};
export type LlQuestion = {
  text: string;
  options: { text: string; is_correct?: boolean }[];
};

/** Ikki yoʻl ham shu shaklni beradi — `lessonlab-import.ts` qaysi biri
    ekanini BILMAYDI va bilishi ham shart emas. */
export type LlSource = {
  /** Nosozlikni izlashda «qaysi yoʻl bilan keldi» degan savol uchun. */
  readonly kind: "api" | "db";
  classes(): Promise<LlClass[]>;
  students(classId: number): Promise<LlStudent[]>;
  tests(): Promise<LlTest[]>;
  questions(testId: number): Promise<LlQuestion[]>;
};

/* ── 1-YOʻL: Partner API (OAuth token bilan) ─────────────────────── */

async function fetchAll<T>(path: string, token: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let cursor = "";
  // Sahifalash cheksiz aylanmasin — 40 sahifa (2000 yozuv) yetarlidan
  // ortiq; undan koʻpi maʼlumotda nosozlik belgisi.
  for (let page = 0; page < 40; page++) {
    const qs = cursor
      ? `${path}${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
      : path;
    const res = await lessonlab<{ data: T[]; next_cursor: string | null }>({
      method: "GET", path: qs, accessToken: token,
    });
    out.push(...((res[key as "data"] as T[]) ?? []));
    if (!res.next_cursor) break;
    cursor = res.next_cursor;
  }
  return out;
}

export function apiSource(token: string): LlSource {
  return {
    kind: "api",
    classes: () => fetchAll<LlClass>("/api/v1/classes?limit=100", token, "data"),
    students: (classId) =>
      fetchAll<LlStudent>(`/api/v1/classes/${classId}/students?limit=100`, token, "data"),
    tests: () => fetchAll<LlTest>("/api/v1/tests?limit=100", token, "data"),
    questions: async (testId) => {
      // DIQQAT — `questions` YUQORI darajada, `test` ICHIDA EMAS.
      // Ilgari `full.test.questions` oʻqilardi va u HAR DOIM undefined
      // boʻlgani uchun 2026-08 da 25 testdan 25 tasi «savoli yoʻq» deb
      // oʻtkazib yuborilgan.
      const full = await lessonlab<{ questions?: LlQuestion[] }>({
        method: "GET", path: `/api/v1/tests/${testId}`, accessToken: token,
      });
      return full?.questions ?? [];
    },
  };
}

/* ── 2-YOʻL: toʻgʻridan bazadan ──────────────────────────────────── */

/** ⚠️ `telegramId` — FAQAT sessiyadagi oʻqituvchidan (`user_telegram`).
    Foydalanuvchi kiritadigan joydan olinsa, bu funksiya bir oʻqituvchiga
    boshqasining sinflarini ochib berardi. */
export function dbSource(telegramId: string): LlSource {
  // `bot_*.user_id` — BIGINT. JS raqami sifatida uzatish katta id'da
  // aniqlikni yoʻqotishi mumkin, shuning uchun matn sifatida uzatilib
  // bazada cast qilinadi.
  const owner = sql`${telegramId}::bigint`;

  return {
    kind: "db",

    async classes() {
      const rows = await db.execute<{
        id: number; name: string | null;
        subject: string | null; grade: string | null;
      }>(sql`
        SELECT id, name, subject, grade
        FROM bot_classes
        WHERE user_id = ${owner}
        ORDER BY id
        LIMIT 500
      `);
      return Array.from(rows).map((r) => ({
        id: Number(r.id),
        name: r.name ?? "",
        subject: r.subject,
        grade: r.grade,
      }));
    },

    async students(classId) {
      /* ⛔ EGALIK QAYTA TEKSHIRILADI. `classId` chaqiruvchi joydan
         keladi va u `classes()` natijasidan olinadi, ya'ni allaqachon
         shu oʻqituvchiniki. Lekin bu yerda YANA tekshiriladi: keyinchalik
         kimdir bu metodni boshqa joydan chaqirsa, shart oʻz-oʻzidan
         ishlab tursin. Himoya chaqiruvchining ehtiyotkorligiga
         tayanmasligi kerak. */
      const rows = await db.execute<{
        id: number; student_id_in_class: number | null; full_name: string | null;
      }>(sql`
        SELECT s.id, s.student_id_in_class, s.full_name
        FROM bot_students s
        JOIN bot_classes c ON c.id = s.class_id
        WHERE s.class_id = ${classId}
          AND c.user_id  = ${owner}
        ORDER BY s.student_id_in_class NULLS LAST, s.id
        LIMIT 500
      `);
      return Array.from(rows).map((r) => ({
        id: Number(r.id),
        number_in_class: Number(r.student_id_in_class ?? 0),
        full_name: r.full_name ?? "",
      }));
    },

    async tests() {
      const rows = await db.execute<{
        id: number; title: string | null; subject: string | null; qn: number | string;
      }>(sql`
        SELECT t.id, t.title, t.subject,
               (SELECT count(*) FROM bot_questions q WHERE q.test_id = t.id) AS qn
        FROM bot_tests t
        WHERE t.user_id = ${owner}
        ORDER BY t.id
        LIMIT 500
      `);
      return Array.from(rows).map((r) => ({
        id: Number(r.id),
        title: r.title ?? "",
        subject: r.subject,
        // ⚠️ `count(*)` bigint va postgres-js uni STRING qilib beradi —
        // `Number()` siz solishtiruvlar jimgina notoʻgʻri boʻlardi.
        question_count: Number(r.qn),
      }));
    },

    async questions(testId) {
      // Egalik bu yerda ham tekshiriladi — `students()` dagi bilan bir
      // xil sabab.
      const rows = await db.execute<{
        q_id: number; q_text: string | null;
        o_text: string | null; is_correct: boolean | null;
      }>(sql`
        SELECT q.id AS q_id, q.text AS q_text,
               o.text AS o_text, o.is_correct
        FROM bot_questions q
        JOIN bot_tests t ON t.id = q.test_id
        LEFT JOIN bot_options o ON o.question_id = q.id
        WHERE q.test_id = ${testId}
          AND t.user_id = ${owner}
        ORDER BY q.id, o.id
        LIMIT 2000
      `);

      // Qatorlar savol boʻyicha yigʻiladi. Tartib `ORDER BY q.id, o.id`
      // bilan qatʼiy: variant tartibi javob harfini (a/b/c/d) belgilaydi
      // va u import'da `String.fromCharCode(97 + i)` bilan beriladi.
      const byQuestion = new Map<number, LlQuestion>();
      for (const r of Array.from(rows)) {
        const qid = Number(r.q_id);
        let q = byQuestion.get(qid);
        if (!q) {
          q = { text: r.q_text ?? "", options: [] };
          byQuestion.set(qid, q);
        }
        // LEFT JOIN — variantsiz savolda `o_text` null boʻladi. Bunday
        // savol import tomonida «toʻgʻri javobi belgilanmagan» deb
        // oʻtkazib yuboriladi va hisobotda koʻrinadi.
        if (r.o_text !== null) {
          q.options.push({ text: r.o_text, is_correct: Boolean(r.is_correct) });
        }
      }
      return Array.from(byQuestion.values());
    },
  };
}
