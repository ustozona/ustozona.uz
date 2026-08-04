import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems, activitySets, classes, students } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { lessonlab } from "@/server/lessonlab/client";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB'DAN KOʻCHIRISH — bir martalik import

   Bu fayl `dal/` da turadi, `server/lessonlab/` da emas: loyiha qoidasi
   boʻyicha DB klienti faqat maʼlumot qatlamida ishlatiladi. Yonidagi
   `server/lessonlab/` esa tashqi HTTP mijozi — u bazaga tegmaydi.

   Oʻqituvchi LessonLab botida yillar davomida sinf va test yigʻgan
   boʻlishi mumkin. Ularni qoʻlda qayta kiritish — yuzlab ism yozish
   degani va Ustozonaga oʻtishning eng katta toʻsigʻi.

   ASOSIY QOIDA — HECH NARSA USTIGA YOZILMAYDI
   -------------------------------------------
   Mavjud sinf, oʻquvchi yoki test HECH QACHON oʻzgartirilmaydi.
   Nomi bir xil narsa uchrasa — u OʻTKAZIB YUBORILADI va hisobotda
   «nizo» sifatida koʻrsatiladi. Qaysi birini qoldirishni oʻqituvchi
   oʻzi hal qiladi; avtomatik birlashtirish jim ravishda maʼlumot
   yoʻqotardi.

   Shu sababli importni xohlagancha takrorlash mumkin: ikkinchi marta
   hech narsa qoʻshilmaydi, dublikat paydo boʻlmaydi.

   NEGA «jonli sinxron» EMAS
   -------------------------
   Doimiy ikki tomonlama oqim muqarrar nizoga olib keladi: bir joyda
   tuzatilgan ism ikkinchisida qaytadan yoziladi, oʻchirilgan oʻquvchi
   qayta paydo boʻladi. Koʻchirishdan keyin EGASI Ustozona boʻladi.
   ════════════════════════════════════════════════════════════════════ */

export type ImportReport = {
  classesCreated: number;
  studentsCreated: number;
  testsCreated: number;
  /** Nomi bir xil boʻlgani uchun tegilmagan narsalar. */
  conflicts: { kind: "class" | "test"; name: string; reason: string }[];
  /** Koʻchirib boʻlmagan narsalar (mos kelmaydigan shakl va h.k.). */
  skipped: { kind: string; name: string; reason: string }[];
};

/** Nom solishtirish uchun normalizatsiya.

    Oʻzbek apostroflari (ʻ ʼ ‘ ’ ` ´) bir xil koʻrinadi, lekin turli
    kodlarda yoziladi — normalizatsiyasiz «Gʻafur» va «G'afur» ikki
    xil sinf boʻlib qolardi va dublikat paydo boʻlardi. */
export function normalizeName(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[‘’ʻʼ`´']/g, "")
    .replace(/[‐-―-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type LlClass = { id: number; name: string; subject?: string | null; grade?: string | null };
type LlStudent = { id: number; number_in_class: number; full_name: string };
type LlTest = { id: number; title: string; subject?: string | null; question_count?: number | null };

async function fetchAll<T>(path: string, token: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let cursor = "";
  // Sahifalash cheksiz aylanmasin — 40 sahifa (2000 yozuv) yetarlidan
  // ortiq; undan koʻpi maʼlumotda nosozlik belgisi.
  for (let page = 0; page < 40; page++) {
    const qs = cursor ? `${path}${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}` : path;
    const res = await lessonlab<{ data: T[]; next_cursor: string | null }>({
      method: "GET", path: qs, accessToken: token,
    });
    out.push(...(res[key as "data"] as T[] ?? []));
    if (!res.next_cursor) break;
    cursor = res.next_cursor;
  }
  return out;
}

/** Sinf va oʻquvchilarni koʻchirish. */
export async function importRoster(token: string): Promise<ImportReport> {
  const teacher = await requireTeacher();
  const report: ImportReport = {
    classesCreated: 0, studentsCreated: 0, testsCreated: 0,
    conflicts: [], skipped: [],
  };

  const existing = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.teacherId, teacher.id));
  const taken = new Set(existing.map((c) => normalizeName(c.name)));

  const llClasses = await fetchAll<LlClass>("/api/v1/classes?limit=100", token, "data");

  for (const cls of llClasses) {
    const key = normalizeName(cls.name);
    if (taken.has(key)) {
      report.conflicts.push({
        kind: "class", name: cls.name,
        reason: "Shu nomli sinf allaqachon bor — tegilmadi",
      });
      continue;
    }

    const classId = randomUUID();
    await db.insert(classes).values({
      id: classId,
      teacherId: teacher.id,
      name: cls.name,
      subject: cls.subject ?? null,
      sortOrder: existing.length + report.classesCreated,
    });
    taken.add(key);
    report.classesCreated += 1;

    const roster = await fetchAll<LlStudent>(
      `/api/v1/classes/${cls.id}/students?limit=100`, token, "data");
    if (roster.length === 0) continue;

    await db.insert(students).values(
      roster.map((s) => ({
        id: randomUUID(),
        teacherId: teacher.id,
        classId,
        name: s.full_name,
        initials: initialsOf(s.full_name),
      }))
    );
    report.studentsCreated += roster.length;
  }

  return report;
}

type LlQuestion = {
  text: string;
  options: { text: string; is_correct?: boolean }[];
};

/** Testlarni `activities` (mcq) sifatida koʻchirish.

    LessonLab testi — faqat ABCD savollar, shuning uchun ular toʻgʻridan
    toʻgʻri `shape: "mcq"` ga tushadi. Har test bitta toʻplam (`set`)
    boʻlib keladi, chunki Ustozonada sessiya toʻplam ustida ochiladi. */
export async function importTests(token: string, classId: string): Promise<ImportReport> {
  const teacher = await requireTeacher();
  const report: ImportReport = {
    classesCreated: 0, studentsCreated: 0, testsCreated: 0,
    conflicts: [], skipped: [],
  };

  const [own] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, teacher.id)));
  if (!own) throw new Error("Sinf topilmadi yoki sizga tegishli emas");

  const existingSets = await db
    .select({ title: activitySets.title })
    .from(activitySets)
    .where(eq(activitySets.teacherId, teacher.id));
  const takenSets = new Set(existingSets.map((s) => normalizeName(s.title)));

  const llTests = await fetchAll<LlTest>("/api/v1/tests?limit=100", token, "data");

  for (const test of llTests) {
    if (takenSets.has(normalizeName(test.title))) {
      report.conflicts.push({
        kind: "test", name: test.title,
        reason: "Shu nomli test allaqachon bor — tegilmadi",
      });
      continue;
    }

    const full = await lessonlab<{ test: { questions?: LlQuestion[] } }>({
      method: "GET", path: `/api/v1/tests/${test.id}`, accessToken: token,
    });
    const questions = full?.test?.questions ?? [];
    if (questions.length === 0) {
      report.skipped.push({ kind: "test", name: test.title, reason: "Savollari yoʻq" });
      continue;
    }

    const items: { activityId: string; role: "check" }[] = [];
    for (const [ordinal, q] of questions.entries()) {
      const options = (q.options ?? []).map((o, i) => ({
        id: String.fromCharCode(97 + i),
        text: o.text,
        isCorrect: Boolean(o.is_correct),
      }));
      // Toʻgʻri javobi yoʻq savol baholab boʻlmaydi — uni jim koʻchirish
      // oʻqituvchini keyin adashtirardi.
      if (!options.some((o) => o.isCorrect)) {
        report.skipped.push({
          kind: "question", name: `${test.title} — ${ordinal + 1}-savol`,
          reason: "Toʻgʻri javobi belgilanmagan",
        });
        continue;
      }

      const activityId = randomUUID();
      await db.insert(activities).values({
        id: activityId, teacherId: teacher.id, shape: "mcq",
        title: q.text.slice(0, 200), source: "teacher", approved: true,
        grading: "exact",
      });
      await db.insert(activityItems).values({
        id: randomUUID(), activityId, teacherId: teacher.id, ordinal,
        content: { stem: q.text, options },
      });
      items.push({ activityId, role: "check" });
    }

    if (items.length === 0) {
      report.skipped.push({ kind: "test", name: test.title,
                            reason: "Koʻchirishga yaroqli savol qolmadi" });
      continue;
    }

    await db.insert(activitySets).values({
      id: randomUUID(), teacherId: teacher.id, classId,
      title: test.title, purpose: "formative", items,
    });
    takenSets.add(normalizeName(test.title));
    report.testsCreated += 1;
  }

  return report;
}
