import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities, activityItems, activitySets, classes, classLinks, rosterLinks, students,
} from "@/server/db/schema";
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

/** Sinf va oʻquvchilarni Ustozona tomonida KOʻRINADIGAN qilish.

    ⚠️ 2026-08-08 dan buyon bu funksiya nusxa qoldirmaydi — BOGʻLAYDI.

    Ilgari u `classes`/`students` ga qator yozib, «bu qator AYNAN oʻsha
    bot sinfi» degan faktni HECH QAYERGA yozmasdi. Natijasi oʻlchangan:
    2026-08-05 da 8 sinf va 94 oʻquvchi bogʻlanmagan nusxa boʻlib qoldi,
    oʻqituvchi ikkita bir xil «8 A GRADE» koʻrdi, va `partner_entity_map`
    boʻsh edi — yaʼni dublikatni keyin avtomatik topib boʻlmasdi.

    Endi har yaratilgan qator uchun `class_links` / `roster_links` ga
    bogʻlanish yoziladi. Buning ikki natijasi bor:

      1. IDEMPOTENTLIK ISHONCHLI. Ilgari takrorlanish nom bilan
         tekshirilardi — oʻqituvchi sinfni Ustozonada qayta nomlasa
         («8 A GRADE» → «8-A») ikkinchi import DUBLIKAT yaratardi.
         Endi tekshiruv `ll_class_id` bogʻlanishi boʻyicha, ya'ni nom
         oʻzgarishi ahamiyatsiz.

      2. MAʼLUMOT BITTA MANBADAN oʻqiladi. Qator ikkita boʻlsa ham
         (Postgres FK talabi — pastga qarang) nom va roʻyxat
         `v_unified_*` orqali ASL tomondan keladi.

    NEGA UMUMAN QATOR YARATILADI ("nusxa emasmi?")
    ---------------------------------------------
    Ustozonaning `grades`, `attendance_records`, `responses` jadvallari
    `students.id` ga FK qoʻyadi. Botda tugʻilgan bolaga baho qoʻyish
    uchun Ustozona tomonida qator BOʻLISHI SHART — bu Postgres talabi,
    tanlov emas. Farqi: bu qator mustaqil nusxa emas, `linked_by:
    "shadow"` bilan belgilangan KIMLIK qatori va uning haqiqati
    bogʻlanish orqali ASL tomonda turadi. */
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

  // ASOSIY idempotentlik darvozasi: allaqachon bogʻlangan bot sinflari.
  // Nom emas, BOGʻLANISH boʻyicha — nom oʻzgarsa ham dublikat boʻlmaydi.
  const linked = new Set(
    (await db.select({ llClassId: classLinks.llClassId }).from(classLinks))
      .map((r) => r.llClassId)
  );

  const llClasses = await fetchAll<LlClass>("/api/v1/classes?limit=100", token, "data");

  for (const cls of llClasses) {
    if (linked.has(cls.id)) {
      // Jim oʻtkazib yuborish TOʻGʻRI: bu sinf allaqachon koʻrinadi.
      // «Nizo» deb koʻrsatish oʻqituvchini adashtirardi — muammo yoʻq.
      continue;
    }

    const key = normalizeName(cls.name);
    if (taken.has(key)) {
      // Nomi bir xil, lekin bogʻlanmagan — bu HAQIQIY nizo: yo tarixiy
      // nusxa, yo boshqa sinf. Avtomatik birlashtirmaymiz (o'chirish
      // yoki ustiga yozish xavfi), oʻqituvchiga koʻrsatamiz.
      // Bogʻlash uchun: scripts/backfill_cross_platform_links.sql
      report.conflicts.push({
        kind: "class", name: cls.name,
        reason: "Shu nomli sinf bor, lekin bogʻlanmagan — tegilmadi",
      });
      continue;
    }

    const classId = randomUUID();
    const roster = await fetchAll<LlStudent>(
      `/api/v1/classes/${cls.id}/students?limit=100`, token, "data");

    // Sinf + roʻyxat + bogʻlanish BITTA tranzaksiyada.
    // Aks holda tarmoq uzilsa bogʻlanmagan sinf qolib ketardi — ya'ni
    // aynan tuzatayotgan xatoni qaytadan yaratardik.
    await db.transaction(async (tx) => {
      await tx.insert(classes).values({
        id: classId,
        teacherId: teacher.id,
        name: cls.name,
        subject: cls.subject ?? null,
        sortOrder: existing.length + report.classesCreated,
      });
      await tx.insert(classLinks).values({
        llClassId: cls.id, uzClassId: classId,
        origin: "lessonlab", linkedBy: "shadow",
      });

      if (roster.length === 0) return;

      const rows = roster.map((s) => ({
        id: randomUUID(),
        teacherId: teacher.id,
        classId,
        name: s.full_name,
        initials: initialsOf(s.full_name),
      }));
      await tx.insert(students).values(rows);
      await tx.insert(rosterLinks).values(
        roster.map((s, i) => ({
          llStudentId: s.id, uzStudentId: rows[i].id,
          origin: "lessonlab" as const, linkedBy: "shadow" as const,
        }))
      );
    });

    taken.add(key);
    linked.add(cls.id);
    report.classesCreated += 1;
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

    // DIQQAT — `questions` YUQORI darajada, `test` ICHIDA EMAS.
    // LessonLab javobi: { test: {...}, questions: [...], answers_included }
    // Ilgari `full.test.questions` o'qilardi va u HAR DOIM undefined
    // bo'lgani uchun barcha testlar «savollari yo'q» deb o'tkazib
    // yuborilardi (2026-08: 25 testdan 25 tasi skipped).
    const full = await lessonlab<{ questions?: LlQuestion[] }>({
      method: "GET", path: `/api/v1/tests/${test.id}`, accessToken: token,
    });
    const questions = full?.questions ?? [];
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
