import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities, activityItems, activitySets, classes, classLinks, responses,
  rosterLinks, students, syncReports, testLinks,
  type SyncReportDetail, type SyncReportRow,
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
  /** Bogʻlangan va botdagi tuzatish koʻchirilgan testlar soni.
      `test_links` bilan birga qoʻshildi — usiz «yangilandi» degan
      tushunchaning oʻzi yoʻq edi (har import yo yaratardi, yo
      «nizo» deb tashlab ketardi). */
  testsUpdated: number;
  /** Nomi bir xil boʻlgani uchun tegilmagan narsalar. */
  conflicts: { kind: "class" | "test"; name: string; reason: string }[];
  /** Koʻchirib boʻlmagan narsalar (mos kelmaydigan shakl va h.k.). */
  skipped: { kind: string; name: string; reason: string }[];
};

/** Hisobotni SAQLASH — sonlar emas, NOMLAR bilan.

    Ilgari callback natijani URL'ga faqat son sifatida qaytarardi
    (`?conflicts=2&skipped=5`). O'qituvchi «2 ta nizo» ni ko'rardi,
    lekin QAYSI test ekanini bilmasdi va nima qilishni ham bilmasdi.

    Bu nazariy noqulaylik emas: 2026-08 da 25 testdan 25 tasi jimgina
    «savoli yo'q» deb tashlab yuborilgan va ekranda faqat son turgani
    uchun nosozlik uzoq vaqt ko'rinmagan.

    ⚠️ Saqlash YIQILSA import BEKOR QILINMAYDI. Hisobot — ko'rinish
    vositasi; uni yozib bo'lmagani uchun allaqachon muvaffaqiyatli
    ko'chirilgan sinf va testlarni qaytarish nomutanosib zarar bo'lardi.
    Shuning uchun `null` qaytadi va chaqiruvchi joy sonlar bilan davom
    etadi (eski xulq). */
export async function saveImportReport(
  teacherId: string,
  kind: "roster" | "tests",
  report: ImportReport
): Promise<string | null> {
  const details: SyncReportDetail[] = [
    ...report.conflicts.map((c) => ({
      group: "conflict" as const, kind: c.kind, name: c.name, reason: c.reason,
    })),
    ...report.skipped.map((s) => ({
      group: "skipped" as const, kind: s.kind, name: s.name, reason: s.reason,
    })),
  ];

  const id = randomUUID();
  try {
    await db.insert(syncReports).values({
      id,
      teacherId,
      kind,
      summary: {
        classesCreated: report.classesCreated,
        studentsCreated: report.studentsCreated,
        testsCreated: report.testsCreated,
        testsUpdated: report.testsUpdated,
      },
      details,
    });
    return id;
  } catch {
    return null;
  }
}

/** Hisobotni o'qish — FAQAT o'z hisobotini.

    `teacherId` sharti majburiy: `id` URL'da ko'rinadi va usiz begona
    odam boshqa o'qituvchining o'quvchi/test nomlarini o'qib olardi. */
export async function getImportReport(id: string): Promise<SyncReportRow | null> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select()
    .from(syncReports)
    .where(and(eq(syncReports.id, id), eq(syncReports.teacherId, teacher.id)));
  return row ?? null;
}

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
    classesCreated: 0, studentsCreated: 0, testsCreated: 0, testsUpdated: 0,
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

/** Tahlil qilingan savol — LessonLab shaklidan Ustozona shakliga. */
type ParsedQuestion = {
  stem: string;
  options: { id: string; text: string; isCorrect: boolean }[];
};

/** Bogʻlangan toʻplamni bot tomonидagi holatga keltirish.

    Qaytadi:
      `in_use`    — toʻplam allaqachon oʻtkazilgan, TEGILMADI
      `changed`   — yangilandi
      `unchanged` — farq yoʻq edi

    ⛔ NEGA `updateActivity()` NAQSHI BU YERDA ISHLAMAYDI
    ----------------------------------------------------
    `assess/activities.ts:updateActivity()` elementlarni OʻCHIRIB qayta
    yaratadi. U yerda bu toʻgʻri, chunki oʻqituvchi oʻz savolini ongli
    tahrirlayapti. Bu yerda esa oʻzgarish BOTDAN, fon rejimida keladi —
    va `responses.item_id` → `activity_items.id` bogʻlanishi
    **ON DELETE CASCADE**. Yaʼni oʻchirish oʻtmishdagi javoblarni ham
    olib ketardi: oʻqituvchi hech narsa qilmasdan turib chorak natijasini
    yoʻqotardi.

    Shuning uchun ikki himoya:

      1. Javob bor boʻlsa — umuman tegilmaydi (`in_use`). Baholash
         tarixi sinxronizatsiya qulayligidan muhimroq.
      2. Javob yoʻq boʻlsa — element `content` i OʻRNIDA yangilanadi,
         `id` oʻzgarmaydi, ya'ni CASCADE umuman ishga tushmaydi.

    `activities.version` `updateActivity` dagi qoida boʻyicha oshiriladi:
    element tahrirlansa oshadi (`responses.itemVersion` shu bilan
    qulflanadi). */
async function syncLinkedSet(
  teacherId: string,
  setId: string,
  title: string,
  parsed: ParsedQuestion[]
): Promise<"in_use" | "changed" | "unchanged"> {
  const [set] = await db
    .select({ title: activitySets.title, items: activitySets.items })
    .from(activitySets)
    .where(and(eq(activitySets.id, setId), eq(activitySets.teacherId, teacherId)));
  // Bogʻlanish bor, lekin toʻplam yoʻq. FK CASCADE buni imkonsiz qiladi
  // (toʻplam oʻchsa bogʻlanish ham oʻchadi), shuning uchun bu holat
  // faqat sxema qoʻlda buzilganda yuz beradi — jim oʻtkazamiz.
  if (!set) return "unchanged";

  const activityIds = (set.items ?? [])
    .map((i) => i.activityId)
    .filter((id): id is string => Boolean(id));

  // ⛔ HAL QILUVCHI TEKSHIRUV — yuqoridagi izohga qarang.
  if (activityIds.length > 0) {
    const [used] = await db
      .select({ id: responses.id })
      .from(responses)
      .where(inArray(responses.activityId, activityIds))
      .limit(1);
    if (used) return "in_use";
  }

  // Boʻsh toʻplamda umuman soʻrov yubormaymiz — `inArray` boʻsh roʻyxat
  // bilan yaroqsiz SQL (`IN ()`) hosil qiladi.
  const rows = activityIds.length === 0 ? [] : await db
    .select({
      activityId: activityItems.activityId,
      itemId: activityItems.id,
      content: activityItems.content,
    })
    .from(activityItems)
    .where(inArray(activityItems.activityId, activityIds));

  const byActivity = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byActivity.get(r.activityId) ?? [];
    list.push(r);
    byActivity.set(r.activityId, list);
  }

  /* OʻRNIDA yangilash faqat toʻplam AYNAN import yaratgan shaklda
     boʻlganda: faoliyat soni savol soniga teng VA har faoliyatda bitta
     element.

     ⚠️ Nega bu qadar qatʼiy. Bogʻlanish `backfill` orqali oʻqituvchi
     OʻZI tuzgan toʻplamga ham tushishi mumkin, u yerda esa bitta
     faoliyatda bir nechta element boʻlishi odatiy. Faqat umumiy songa
     qarasak (masalan 1+2+0 = 3 element, 3 savol) shakl «mos» koʻrinardi,
     lekin `parsed[i] ↔ element[i]` moslashuvi notoʻgʻri boʻlib savollar
     ARALASHIB ketardi.

     Tartib ham `set.items` dan olinadi, `ordinal` dan emas: import
     yaratgan toʻplamda ordinal 0..N-1 boʻladi, oʻqituvchi tuzganida esa
     har faoliyat oʻz ichida 0 dan boshlanadi va tartib maʼnosini
     yoʻqotadi. `set.items` — yagona ishonchli tartib manbai. */
  const inPlace =
    activityIds.length === parsed.length &&
    activityIds.every((id) => (byActivity.get(id)?.length ?? 0) === 1);

  if (inPlace) {
    let changed = set.title !== title;
    await db.transaction(async (tx) => {
      for (const [i, p] of parsed.entries()) {
        const activityId = activityIds[i];
        const row = byActivity.get(activityId)![0];
        const next = { stem: p.stem, options: p.options };
        if (JSON.stringify(row.content) === JSON.stringify(next)) continue;
        changed = true;
        await tx.update(activityItems)
          .set({ content: next })
          .where(eq(activityItems.id, row.itemId));
        await tx.update(activities)
          .set({
            title: p.stem.slice(0, 200),
            version: sql`${activities.version} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(activities.id, activityId));
      }
      if (set.title !== title) {
        await tx.update(activitySets)
          .set({ title, updatedAt: new Date() })
          .where(eq(activitySets.id, setId));
      }
    });
    return changed ? "changed" : "unchanged";
  }

  // Shakl mos emas — eski faoliyatlar oʻchiriladi va qaytadan
  // quriladi. `activity_items` CASCADE bilan ketadi, `responses` esa
  // YOʻQ (yuqorida tekshirilgan).
  await db.transaction(async (tx) => {
    const items: { activityId: string; role: "check" }[] = [];
    for (const [ordinal, p] of parsed.entries()) {
      const activityId = randomUUID();
      await tx.insert(activities).values({
        id: activityId, teacherId, shape: "mcq",
        title: p.stem.slice(0, 200), source: "teacher", approved: true,
        grading: "exact",
      });
      await tx.insert(activityItems).values({
        id: randomUUID(), activityId, teacherId, ordinal,
        content: { stem: p.stem, options: p.options },
      });
      items.push({ activityId, role: "check" });
    }
    // Toʻplam AVVAL yangi roʻyxatga oʻtadi, keyin eskilari oʻchadi —
    // teskari tartibda `items` bir lahza mavjud boʻlmagan faoliyatga
    // ishora qilardi.
    await tx.update(activitySets)
      .set({ title, items, updatedAt: new Date() })
      .where(eq(activitySets.id, setId));
    if (activityIds.length > 0) {
      await tx.delete(activities).where(inArray(activities.id, activityIds));
    }
  });
  return "changed";
}

/** Testlarni `activities` (mcq) sifatida koʻchirish.

    LessonLab testi — faqat ABCD savollar, shuning uchun ular toʻgʻridan
    toʻgʻri `shape: "mcq"` ga tushadi. Har test bitta toʻplam (`set`)
    boʻlib keladi, chunki Ustozonada sessiya toʻplam ustida ochiladi.

    ⚠️ 2026-08-09 dan buyon bu funksiya ham nusxa qoldirmaydi — BOGʻLAYDI.
    Sinf/oʻquvchi 2026-08-08 da oʻtkazilgan, test esa chetda qolgan edi.

    Idempotentlik darvozasi endi NOM emas, `test_links`:

      link bor  → savollar YANGILANADI (botdagi tuzatish oʻtadi)
      link yoʻq → yaratiladi va bogʻlanish DARHOL yoziladi

    Nom oʻzgarishi endi dublikat yaratmaydi va botdagi tuzatish
    Ustozonaga yetib boradi — ikkalasi ham eski modelda imkonsiz edi.

    ⛔ YANGILASH — FAQAT ISHLATILMAGAN TOʻPLAM UCHUN
    -----------------------------------------------
    Bu cheklov kod oʻqib topilgan va u MAJBURIY:
    `responses.item_id` → `activity_items.id` ga **ON DELETE CASCADE**
    bilan bogʻlangan. Yaʼni `updateActivity()` naqshidagi
    «oʻchir-va-qayta-yarat» yoʻli oʻtmishdagi javoblarni CASCADE bilan
    OʻCHIRIB YUBORADI — aynan `itemVersion` himoya qilmoqchi boʻlgan
    narsani.

    Shuning uchun bu yerda ikki himoya bor:

      1. Toʻplam allaqachon ISHLATILGAN boʻlsa (bironta javob bor) —
         umuman TEGILMAYDI va hisobotda sabab koʻrsatiladi. Oʻqituvchining
         baholash tarixi sinxronizatsiya qulayligidan MUHIMROQ.
      2. Ishlatilmagan boʻlsa — element `content` i OʻRNIDA yangilanadi
         (id oʻzgarmaydi, ya'ni CASCADE ishga tushmaydi) va
         `activities.version` oshiriladi (`updateActivity` bilan bir xil
         qoida).

    Savol soni oʻzgargan boʻlsa toʻplam qayta quriladi — lekin bu ham
    faqat 1-shart oʻtganda, ya'ni yoʻqotiladigan javob yoʻqligi
    ANIQLANGANDAN keyin. */
export async function importTests(token: string, classId: string): Promise<ImportReport> {
  const teacher = await requireTeacher();
  const report: ImportReport = {
    classesCreated: 0, studentsCreated: 0, testsCreated: 0, testsUpdated: 0,
    conflicts: [], skipped: [],
  };

  const [own] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, teacher.id)));
  if (!own) throw new Error("Sinf topilmadi yoki sizga tegishli emas");

  const existingSets = await db
    .select({ id: activitySets.id, title: activitySets.title })
    .from(activitySets)
    .where(eq(activitySets.teacherId, teacher.id));
  const takenSets = new Set(existingSets.map((s) => normalizeName(s.title)));

  // ASOSIY idempotentlik darvozasi: allaqachon bogʻlangan bot testlari.
  // Nom emas, BOGʻLANISH boʻyicha — `importRoster` dagi bilan bir xil.
  const linkedSet = new Map(
    (await db.select({ llTestId: testLinks.llTestId, uzSetId: testLinks.uzSetId })
      .from(testLinks))
      .map((r) => [r.llTestId, r.uzSetId] as const)
  );

  const llTests = await fetchAll<LlTest>("/api/v1/tests?limit=100", token, "data");

  for (const test of llTests) {
    const linkedSetId = linkedSet.get(test.id);

    // Bogʻlanmagan, lekin nomi band — HAQIQIY nizo: yo tarixiy nusxa,
    // yo boshqa test. Avtomatik bogʻlamaymiz (noto'gʻri bogʻlanish
    // boshqa testning savollarini ustiga yozardi), oʻqituvchiga
    // koʻrsatamiz. Bogʻlash uchun: `v_test_duplicate_candidates`.
    if (!linkedSetId && takenSets.has(normalizeName(test.title))) {
      report.conflicts.push({
        kind: "test", name: test.title,
        reason: "Shu nomli test bor, lekin bogʻlanmagan — tegilmadi",
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

    // Savollarni bir marta tahlil qilamiz — natija ikkala yoʻl
    // (yangilash va yaratish) uchun bir xil.
    const parsed: ParsedQuestion[] = [];
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
      parsed.push({ stem: q.text, options });
    }

    if (parsed.length === 0) {
      report.skipped.push({ kind: "test", name: test.title,
                            reason: "Koʻchirishga yaroqli savol qolmadi" });
      continue;
    }

    // ── YOʻL 1: bogʻlangan toʻplam bor — yangilaymiz ──────────────────
    if (linkedSetId) {
      const outcome = await syncLinkedSet(teacher.id, linkedSetId, test.title, parsed);
      if (outcome === "in_use") {
        // T2 (shaffoflik): bu jim oʻtkazib yuborilmaydi. Oʻqituvchi
        // botda savolni tuzatgan boʻlishi mumkin va u OʻTMAGANINI
        // bilishi kerak — aks holda eski savol bilan ishlab yuraveradi.
        report.skipped.push({
          kind: "test", name: test.title,
          reason: "Test allaqachon oʻtkazilgan — javoblarni saqlash uchun tegilmadi",
        });
      } else if (outcome === "changed") {
        report.testsUpdated += 1;
      }
      // "unchanged" — oʻzgarish yoʻq, hisobotda shovqin qilmaydi.
      continue;
    }

    // ── YOʻL 2: yangi toʻplam — yaratamiz va DARHOL bogʻlaymiz ────────
    const setId = randomUUID();

    // Toʻplam, savollar va BOGʻLANISH bitta tranzaksiyada.
    // Aks holda tarmoq uzilsa bogʻlanmagan toʻplam qolib ketardi — ya'ni
    // aynan tuzatayotgan xatoni qaytadan yaratardik (`importRoster`
    // dagi bilan bir xil sabab).
    await db.transaction(async (tx) => {
      const items: { activityId: string; role: "check" }[] = [];
      for (const [ordinal, p] of parsed.entries()) {
        const activityId = randomUUID();
        await tx.insert(activities).values({
          id: activityId, teacherId: teacher.id, shape: "mcq",
          title: p.stem.slice(0, 200), source: "teacher", approved: true,
          grading: "exact",
        });
        await tx.insert(activityItems).values({
          id: randomUUID(), activityId, teacherId: teacher.id, ordinal,
          content: { stem: p.stem, options: p.options },
        });
        items.push({ activityId, role: "check" });
      }

      await tx.insert(activitySets).values({
        id: setId, teacherId: teacher.id, classId,
        title: test.title, purpose: "formative", items,
      });
      await tx.insert(testLinks).values({
        llTestId: test.id, uzSetId: setId,
        origin: "lessonlab", linkedBy: "shadow",
      });
    });

    takenSets.add(normalizeName(test.title));
    linkedSet.set(test.id, setId);
    report.testsCreated += 1;
  }

  return report;
}
