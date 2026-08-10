import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities, activityItems, activitySets, classes, setSources, userTelegram,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type {
  AssignBankTestResult, BankFacets, BankPage, BankQuery, BankTest, BankTier,
} from "@/lib/test-bank-types";

/* ════════════════════════════════════════════════════════════════════
   TEST BANKI — LessonLab testlarini Ustozonada koʻrish va sinfga berish

   NIMA UCHUN BU FAYL BOR
   ----------------------
   Oʻqituvchi «Topshiriqlar» boʻlimida LessonLab test bazasini koʻradi
   va xohlaganini oʻz sinfiga beradi — botga umuman kirmasdan.

   ⛔ NUSXA OLINMAYDI — ROʻYXAT JONLI OʻQILADI
   ------------------------------------------
   Ikkala mahsulot 2026-08-05 dan BITTA Supabase loyihasida
   (`docs/CROSS_PLATFORM.md` §1). Shuning uchun bank roʻyxati
   `bot_tests` dan TOʻGʻRIDAN oʻqiladi (`v_test_bank` koʻrinishi orqali)
   va hech qayerga koʻchirilmaydi: botda test tuzatilsa yoki oʻchirilsa
   — Ustozonadagi roʻyxatda DARHOL koʻrinadi, sinxronizatsiya deganning
   oʻzi yoʻq.

   ⚠️ SINFGA BERILGANDA esa qator MATERIALIZATSIYA QILINADI — va bu
   ziddiyat emas, Postgres talabi. `responses.item_id` →
   `activity_items.id` ga FK qoʻyadi, yaʼni bola javob berishi uchun
   Ustozona tomonida haqiqiy qator boʻlishi SHART
   (`docs/CROSS_PLATFORM.md` §4 dagi bilan aynan bir sabab).

   ⛔ VA MANBA UNI KEYIN OʻZGARTIRA OLMAYDI. Bu ataylab:
   `syncLinkedSet()` faqat `test_links` (oʻqituvchining OʻZ testi)
   boʻyicha ishlaydi va `set_sources` ga umuman qaramaydi. Aks holda
   ommaviy test egasi savolini tahrirlaganda, uni allaqachon
   oʻtkazgan yuzlab sinfdagi natijalar maʼnosini yoʻqotardi.

   ⛔ EGALIK — ENG XAVFLI JOY
   -------------------------
   `shaxsiy` darajasi oʻqituvchining OʻZ bot testlarini koʻrsatadi va
   ular `bot_tests.user_id` (telegram id) boʻyicha topiladi. Telegram
   id FAQAT sessiyadagi oʻqituvchidan, `user_telegram` orqali olinadi —
   argument yoki soʻrov parametridan OLINMAYDI. Aks holda bir oʻqituvchi
   boshqasining shaxsiy testlarini koʻrardi
   (`dal/lessonlab-source.ts` dagi bilan bir xil qoida).
   ════════════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 24;

/** Roʻyxatda nechta test koʻrsatiladi — UI ham shuni bilishi kerak. */
export const BANK_PAGE_SIZE = PAGE_SIZE;

/** Joriy oʻqituvchining bogʻlangan telegram id'si (yoki null).

    ⛔ `teacherId` argument sifatida QABUL QILINMAYDI — chaqiruvchi joy
    uni clientdan uzatib yuborishi mumkin edi. */
async function linkedTelegramId(teacherId: string): Promise<string | null> {
  const [row] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, teacherId));
  return row?.telegramId ?? null;
}

/** Sinf shu oʻqituvchinikimi — har amaldan oldin. */
async function requireOwnClass(classId: string, teacherId: string): Promise<void> {
  const [own] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, teacherId)));
  if (!own) throw new Error("Sinf topilmadi yoki sizga tegishli emas");
}

/* ── Filtr shartlari — uchala soʻrov uchun BITTA joyda ─────────────── */

/** `subject`/`grade` uchun uch holat bor va ular boshqa-boshqa:

      undefined / null — filtr yoʻq, hammasi
      ""               — ataylab «fansiz» tanlangan (bazada NULL)
      "Matematika"     — aniq qiymat

    Ilgari bu ikkiga siqilsa «fansiz» testlarni umuman koʻrib
    boʻlmasdi — ular hech bir filtrga tushmasdi. */
function nullableEq(column: string, value: string | null | undefined) {
  if (value === undefined || value === null) return sql``;
  if (value === "") return sql` AND ${sql.raw(column)} IS NULL`;
  return sql` AND lower(${sql.raw(column)}) = lower(${value})`;
}

function searchClause(search: string | null | undefined) {
  if (!search) return sql``;
  // LIKE metabelgilari qochiriladi — aks holda `%` kiritgan
  // foydalanuvchi butun bankni bitta soʻrovda tortib olardi.
  const esc = search.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  const like = `%${esc}%`;
  return sql` AND (b.title ILIKE ${like} ESCAPE '\\' OR b.subject ILIKE ${like} ESCAPE '\\')`;
}

/** Darajaga qarab manba va shart.

    `ommaviy` / `tasdiqlangan` — `v_test_bank` koʻrinishidan, daraja
    taʼrifi OʻSHA YERDA (`supabase/migrations/20260810_test_bank.sql`).
    Uni bu yerda takrorlash — `norm_name` da oʻlchangan xato: ikki
    kodbaza ajralib ketadi va bir tizim testni «ommaviy», ikkinchisi
    «tasdiqlangan» deb koʻrsatardi.

    `shaxsiy` — koʻrinishda YOʻQ (u faqat ochiq testlarni qamraydi),
    shuning uchun `bot_tests` dan egasi boʻyicha oʻqiladi. Ustunlar
    roʻyxati koʻrinishnikiga AYNAN mos boʻlishi shart. */
function tierSource(tier: BankTier, telegramId: string | null) {
  if (tier !== "shaxsiy") {
    return sql`
      SELECT ll_test_id AS id, title, subject, grade, author_name,
             question_count, usage_count, tier
        FROM v_test_bank
       WHERE tier = ${tier}
    `;
  }
  // Bogʻlanmagan oʻqituvchi — shaxsiy testlar YOʻQ, lekin bu xato
  // emas: UI «botni bogʻlang» deb koʻrsatadi. `FALSE` sharti bilan
  // boʻsh natija qaytaramiz, soʻrov tuzilishi esa bir xil qoladi.
  if (!telegramId) return sql`SELECT NULL::int AS id, NULL::text AS title,
    NULL::text AS subject, NULL::text AS grade, NULL::text AS author_name,
    0::bigint AS question_count, 0::int AS usage_count, 'shaxsiy'::text AS tier
    WHERE FALSE`;
  return sql`
    SELECT t.id,
           t.title,
           NULLIF(btrim(COALESCE(t.subject, '')), '')     AS subject,
           NULLIF(btrim(COALESCE(t.grade,   '')), '')     AS grade,
           NULLIF(btrim(COALESCE(t.author_name, '')), '') AS author_name,
           (SELECT count(*) FROM bot_questions q WHERE q.test_id = t.id)
             AS question_count,
           t.usage_count,
           'shaxsiy'::text AS tier
      FROM bot_tests t
     WHERE t.user_id = ${telegramId}::bigint
       AND EXISTS (SELECT 1 FROM bot_questions q WHERE q.test_id = t.id)
  `;
}

/** Bank roʻyxati — sahifalangan.

    `classId` MAJBURIY: har kartochkada «bu test shu sinfda bormi»
    koʻrsatiladi va usiz oʻqituvchi allaqachon bergan testni qayta
    bosib, «dublikat» xabarini olib turardi. */
export async function listBankTests(
  classId: string,
  query: BankQuery
): Promise<BankPage> {
  const teacher = await requireTeacher();
  await requireOwnClass(classId, teacher.id);

  const tier: BankTier = query.tier;
  const telegramId = tier === "shaxsiy" ? await linkedTelegramId(teacher.id) : null;
  const page = Math.max(0, Math.floor(query.page ?? 0));

  const base = tierSource(tier, telegramId);
  const filters = sql`${nullableEq("b.subject", query.subject)}${nullableEq(
    "b.grade",
    query.grade
  )}${searchClause(query.search)}`;

  const countRows = await db.execute<{ n: string | number }>(sql`
    SELECT count(*) AS n FROM (${base}) b WHERE TRUE${filters}
  `);
  // ⚠️ `count(*)` bigint va postgres-js uni STRING qilib beradi —
  // `Number()` siz sahifalash solishtiruvlari jimgina notoʻgʻri boʻlardi.
  const total = Number(Array.from(countRows)[0]?.n ?? 0);

  const rows = await db.execute<{
    id: number; title: string | null; subject: string | null; grade: string | null;
    author_name: string | null; question_count: string | number;
    usage_count: number | null; tier: string; already: boolean;
  }>(sql`
    SELECT b.*,
           EXISTS (
             SELECT 1 FROM set_sources s
              WHERE s.uz_class_id = ${classId} AND s.ll_test_id = b.id
           ) AS already
      FROM (${base}) b
     WHERE TRUE${filters}
     ORDER BY b.usage_count DESC NULLS LAST, b.id DESC
     LIMIT ${PAGE_SIZE} OFFSET ${page * PAGE_SIZE}
  `);

  const tests: BankTest[] = Array.from(rows).map((r) => ({
    id: Number(r.id),
    title: r.title ?? "",
    subject: r.subject,
    grade: r.grade,
    author: r.author_name,
    questionCount: Number(r.question_count),
    usageCount: Number(r.usage_count ?? 0),
    tier: r.tier as BankTier,
    alreadyInClass: Boolean(r.already),
  }));

  return { tests, total, page, pageSize: PAGE_SIZE };
}

/** Filtr paneli qiymatlari — joriy DARAJA ichidan.

    Daraja boʻyicha ajratilgani muhim: «Tasdiqlangan» da faqat 10 ta fan
    bor, «Ommaviy» da esa yuzlab. Umumiy roʻyxat koʻrsatilsa oʻqituvchi
    boʻsh natija beradigan fanlarni tanlab, bank buzuq deb oʻylardi. */
export async function bankFacets(tier: BankTier): Promise<BankFacets> {
  const teacher = await requireTeacher();
  const telegramId = tier === "shaxsiy" ? await linkedTelegramId(teacher.id) : null;
  const base = tierSource(tier, telegramId);

  const rows = await db.execute<{ subject: string | null; grade: string | null }>(sql`
    SELECT DISTINCT b.subject, b.grade FROM (${base}) b
  `);

  const subjects = new Set<string>();
  const grades = new Set<string>();
  for (const r of Array.from(rows)) {
    if (r.subject) subjects.add(r.subject);
    if (r.grade) grades.add(r.grade);
  }
  // `localeCompare` — oʻzbekcha harflar ASCII tartibida notoʻgʻri
  // joylashardi (Ў, Ғ, Ҳ roʻyxat oxiriga tushib qolardi).
  return {
    subjects: [...subjects].sort((a, b) => a.localeCompare(b, "uz")),
    grades: [...grades].sort((a, b) => a.localeCompare(b, "uz", { numeric: true })),
  };
}

/* ── Sinfga berish ─────────────────────────────────────────────────── */

type ParsedQuestion = {
  stem: string;
  options: { id: string; text: string; isCorrect: boolean }[];
};

/** Bank testining savollarini oʻqiydi va Ustozona shakliga keltiradi.

    ⚠️ EGALIK BU YERDA TEKSHIRILMAYDI — ataylab. Bank testi taʼrifi
    boʻyicha OCHIQ (`v_test_bank`: `is_public OR is_in_baza`), yaʼni
    uni oʻqish huquqi hammada bor. Shaxsiy testda egalik esa
    `assignBankTest()` da, `v_test_bank` dan tashqaridagi yoʻlda
    tekshiriladi. */
async function readQuestions(llTestId: number): Promise<ParsedQuestion[]> {
  const rows = await db.execute<{
    q_id: number; q_text: string | null;
    o_text: string | null; is_correct: boolean | null;
  }>(sql`
    SELECT q.id AS q_id, q.text AS q_text, o.text AS o_text, o.is_correct
      FROM bot_questions q
      LEFT JOIN bot_options o ON o.question_id = q.id
     WHERE q.test_id = ${llTestId}
     ORDER BY q.id, o.id
     LIMIT 2000
  `);

  // Tartib `ORDER BY q.id, o.id` bilan qatʼiy: variant tartibi javob
  // harfini (a/b/c/d) belgilaydi va u pastda `fromCharCode(97 + i)`
  // bilan beriladi — tartib oʻzgarsa javoblar siljib ketardi.
  const byQuestion = new Map<number, { text: string; opts: { text: string; ok: boolean }[] }>();
  for (const r of Array.from(rows)) {
    const qid = Number(r.q_id);
    let q = byQuestion.get(qid);
    if (!q) {
      q = { text: r.q_text ?? "", opts: [] };
      byQuestion.set(qid, q);
    }
    // LEFT JOIN — variantsiz savolda `o_text` null boʻladi.
    if (r.o_text !== null) q.opts.push({ text: r.o_text, ok: Boolean(r.is_correct) });
  }

  const parsed: ParsedQuestion[] = [];
  for (const q of byQuestion.values()) {
    const options = q.opts.map((o, i) => ({
      id: String.fromCharCode(97 + i),
      text: o.text,
      isCorrect: o.ok,
    }));
    // Toʻgʻri javobi yoʻq savolni baholab boʻlmaydi — uni jim koʻchirish
    // oʻqituvchini keyin adashtirardi (`lessonlab-import.ts` bilan bir
    // xil qoida).
    if (!options.some((o) => o.isCorrect)) continue;
    parsed.push({ stem: q.text, options });
  }
  return parsed;
}

/** Bank testini sinfga berish — toʻplam yaratadi va manbani yozadi.

    ⛔ DUBLIKAT IKKI QATLAMDA TOʻXTATILADI:
      1. Bu yerda — oldindan tekshiriladi va tushunarli javob qaytadi.
      2. Bazada — `UNIQUE (uz_class_id, ll_test_id)`. Ikkinchisi
         MAJBURIY: ikki tab bir vaqtda bosilsa 1-tekshiruv ikkalasida
         ham «yoʻq» deb javob berib ulgurardi (poyga holati) va sinfda
         ikkita bir xil test paydo boʻlardi.

    Toʻplam `assignments` ga YOZILMAYDI — baho ustuni faqat sessiya
    oʻtkazilib natija nashr qilinganda tugʻiladi. Bu chegara mavjud
    oqimniki (`assignments/page.tsx` dagi «Tayyorlangan testlar»
    izohiga qarang) va u yerda oldindan yaratilgan ustun nashrda
    IKKINCHI marta qoʻshilardi. */
export async function assignBankTest(
  llTestId: number,
  classId: string
): Promise<AssignBankTestResult> {
  const teacher = await requireTeacher();
  await requireOwnClass(classId, teacher.id);

  // Test bankka tegishlimi (ochiq) — yoki oʻqituvchining OʻZINIKIMI.
  // ⛔ Ikkinchi shartsiz «Shaxsiy» tabidan test berib boʻlmasdi;
  //    birinchisisiz esa har kim istalgan yopiq testni id boʻyicha
  //    taxmin qilib sinfiga koʻchirib olardi.
  const telegramId = await linkedTelegramId(teacher.id);
  const found = await db.execute<{ title: string | null; tier: string }>(sql`
    SELECT title, tier FROM v_test_bank WHERE ll_test_id = ${llTestId}
    UNION ALL
    SELECT t.title, 'shaxsiy'::text AS tier
      FROM bot_tests t
     WHERE ${telegramId === null ? sql`FALSE` : sql`t.user_id = ${telegramId}::bigint`}
       AND t.id = ${llTestId}
    LIMIT 1
  `);
  const meta = Array.from(found)[0];
  if (!meta) return { ok: false, reason: "not_found" };

  const [existing] = await db
    .select({ setId: setSources.uzSetId })
    .from(setSources)
    .where(and(eq(setSources.uzClassId, classId), eq(setSources.llTestId, llTestId)));
  if (existing) return { ok: false, reason: "duplicate", setId: existing.setId };

  const parsed = await readQuestions(llTestId);
  if (parsed.length === 0) return { ok: false, reason: "no_usable_questions" };

  const setId = randomUUID();
  const title = meta.title ?? "Test";

  // Toʻplam, savollar va MANBA YOZUVI bitta tranzaksiyada. Aks holda
  // tarmoq uzilsa manbasiz toʻplam qolib ketardi — yaʼni dublikat
  // cheklovi uni koʻrmasdi va keyingi urinish IKKINCHI nusxa yaratardi
  // (`importTests()` dagi bilan aynan bir sabab).
  await db.transaction(async (tx) => {
    const items: { activityId: string; role: "check" }[] = [];
    for (const [ordinal, p] of parsed.entries()) {
      const activityId = randomUUID();
      await tx.insert(activities).values({
        id: activityId, teacherId: teacher.id, shape: "mcq",
        title: p.stem.slice(0, 200), source: "bank", approved: true,
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
      title, purpose: "formative", items,
    });
    await tx.insert(setSources).values({
      uzSetId: setId, llTestId, uzClassId: classId,
      tier: meta.tier as BankTier,
    });
  });

  return { ok: true, setId, title, questionCount: parsed.length };
}
