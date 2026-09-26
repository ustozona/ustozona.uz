import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { academicYears, classes, enrollments } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import {
  requireWorkspace, taughtClassIds, type WorkspaceContext,
} from "@/server/workspace";
import { gradeForYear } from "@/lib/class-naming";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHINI BOSHQA SINFGA KOʻCHIRISH.

   ⭐ QOʻSHISH EMAS, KOʻCHIRISH. Ikkisi butunlay boshqa amal:

     qoʻshish   — bola ikkala sinfda HAM oʻqiydi (7-A matematika + toʻgarak)
     koʻchirish — bola 5-A dan CHIQDI, 6-B ga oʻtdi

   Ilgari faqat birinchisi bor edi, ikkinchisini esa qoʻlda «oʻchirib,
   qayta qoʻshish» bilan qilishga toʻgʻri kelardi. Bu MAʼLUMOTNI YOʻQ
   QILADI: `detachOrDeleteStudents` yozilishlarni oʻqituvchining barcha
   sinflaridan uzadi, hech qayerda yozilish qolmagan bolani esa
   `students` dan oʻchiradi — cascade uning butun bahosi va davomatini
   olib ketadi. Ikki qadam orasida bola butunlay yoʻqoladi.

   Shu bois koʻchirish — ATOMAR amal: bitta tranzaksiyada eski yozilish
   sana bilan YOPILADI (oʻchirilmaydi), yangisi ochiladi. Bola hech
   qachon «yozilishsiz» holatga tushmaydi.

   Batafsil: docs/oquvchini-kochirish-spec.md
   ════════════════════════════════════════════════════════════════════ */

export type MoveStudentsInput = {
  studentIds: string[];
  fromClassId: string;
  toClassId: string;
  /** Koʻchish sanasi "YYYY-MM-DD" — eski yozilish shu kunda yopiladi,
      yangisi shu kunda boshlanadi. */
  date: string;
};

export type MoveStudentsResult = {
  /** Haqiqatan koʻchirilgan bolalar soni (eski sinfda ochiq yozilishi
      bor boʻlganlar). */
  moved: number;
};

/**
 * KOʻCHIRA OLADIGAN SINFLAR — «oʻz sinflarim; admin — hammasi».
 *
 * ⚠️ Bu `taughtClassIds()` dan ATAYLAB kengroq va §11.6 ning umumiy
 * qoidasidan («admin koʻradi, lekin oʻzgartirmaydi») ongli chekinish.
 * Sabab: sinf taqsimoti — maʼmuriy ish, dars maʼlumoti emas. Yil
 * boshida bolalarni guruhlarga boʻlish aynan zavuchning vazifasi va u
 * hech bir sinfda dars oʻtmasligi mumkin.
 *
 * ⛔ Baho/davomat YOZISHga bu kenglik TARQALMAYDI — koʻchirish faqat
 * `enrollments` ga tegadi, oʻquvchining yozuvlariga emas.
 */
async function movableClassIds(ctx: WorkspaceContext): Promise<string[]> {
  if (ctx.role === "admin") {
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.workspaceId, ctx.workspaceId));
    return rows.map((r) => r.id);
  }
  return taughtClassIds(ctx);
}

/**
 * Ikki sinf orasida koʻchirish MANTIQAN mumkinmi.
 *
 * Qoida: DARAJA bir xil boʻlishi shart, va darajasiz guruh umuman
 * qatnashmaydi.
 *
 * ⭐ Nega daraja: 7-sinf oʻquvchisini 6-sinfga koʻchirish sinf almashish
 * emas, bolani bir yil pastga tushirish — bu boshqa qaror va boshqa
 * hujjat. Roʻyxatni faqat interfeysda filtrlash yetarli emas edi: amal
 * server action orqali ochiq turadi, yaʼni qoida shu yerda boʻlmasa
 * tavsiya boʻlib qolardi.
 *
 * ⭐ Nega darajasiz guruh (toʻgarak, qoʻshimcha dars) chiqarib
 * tashlanadi: undan «koʻchirish» maʼnosiz. Bola toʻgarakni tashlab
 * matematikaga oʻtmaydi — u toʻgarakdan chiqadi, sinfda esa qolaveradi.
 * Bu QOʻSHISH/CHIQARISH amali, koʻchirish emas.
 *
 * ⚠️ Daraja FAOL OʻQUV YILIGA proyeksiya qilinadi (`gradeForYear`), xom
 * `classes.grade` ustuni emas. Rollover darajani ustunda oshiradi va
 * eskisini `gradeByYear` ga yozadi, shu bois eski yil faollashtirilganda
 * sinf oʻsha yildagi darajasi bilan koʻrinadi. Interfeys aynan shu
 * proyeksiyalangan qiymat boʻyicha filtrlaydi — server xom ustunni
 * solishtirsa, ikkisi bir-biriga mos kelmay qolardi: oynada bir xil
 * darajali koʻringan ikki sinf serverda rad etilardi, yaʼni foydalanuvchi
 * OʻZI taklif qilingan tanlov uchun xato olardi.
 */
function assertSameGrade(
  from: { id: string; name: string; grade: number | null },
  to: { id: string; name: string; grade: number | null }
): void {
  if (from.grade == null || to.grade == null) {
    throw new ForbiddenError(
      "Darajasiz guruhga (toʻgarak, qoʻshimcha dars) koʻchirib boʻlmaydi — " +
        "unga oʻquvchi qoʻshiladi, sinfi esa oʻzgarmaydi"
    );
  }
  if (from.grade !== to.grade) {
    throw new ForbiddenError(
      `Faqat bir xil darajadagi sinflar orasida koʻchirish mumkin ` +
        `(${from.name} — ${from.grade}-daraja, ${to.name} — ${to.grade}-daraja)`
    );
  }
}

export async function moveStudents(input: MoveStudentsInput): Promise<MoveStudentsResult> {
  const { studentIds, fromClassId, toClassId, date } = input;

  if (fromClassId === toClassId) {
    throw new ForbiddenError("Oʻquvchi allaqachon shu sinfda");
  }
  if (studentIds.length === 0) return { moved: 0 };

  const ctx = await requireWorkspace();
  const allowed = new Set(await movableClassIds(ctx));
  if (!allowed.has(fromClassId) || !allowed.has(toClassId)) {
    throw new ForbiddenError("Bu sinflardan biri sizga biriktirilmagan");
  }

  const [gradeRows, [activeYear]] = await Promise.all([
    db
      .select({
        id: classes.id,
        name: classes.name,
        grade: classes.grade,
        gradeByYear: classes.gradeByYear,
      })
      .from(classes)
      .where(inArray(classes.id, [fromClassId, toClassId])),
    /* Faol oʻquv yili — daraja proyeksiyasi uchun. Yoʻq boʻlsa
       (kalendar sozlanmagan) `gradeForYear` xom `grade` ga tushadi,
       yaʼni ilgarigi xatti-harakat saqlanadi. */
    db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(and(eq(academicYears.teacherId, ctx.teacherId), eq(academicYears.isActive, true)))
      .limit(1),
  ]);

  const projected = (id: string) => {
    const row = gradeRows.find((c) => c.id === id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      grade: gradeForYear(
        {
          id: row.id,
          name: row.name,
          grade: row.grade ?? undefined,
          gradeByYear: row.gradeByYear ?? undefined,
        },
        activeYear?.id
      ),
    };
  };

  const from = projected(fromClassId);
  const to = projected(toClassId);
  if (!from || !to) throw new ForbiddenError("Sinf topilmadi");
  assertSameGrade(from, to);

  /* Faqat eski sinfda HOZIR oʻqiyotganlar koʻchiriladi. Client eskirgan
     holatdan begona id yuborishi mumkin — jimgina tashlab yuboriladi
     (roster yoʻllaridagi bilan bir xil naqsh). */
  const openRows = await db
    .select({ id: enrollments.studentId, sortOrder: enrollments.sortOrder })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.classId, fromClassId),
        inArray(enrollments.studentId, studentIds),
        isNull(enrollments.endedAt)
      )
    );
  if (openRows.length === 0) return { moved: 0 };

  await db.transaction(async (tx) => {
    const ids = openRows.map((r) => r.id);

    // 1) Eski yozilish YOPILADI — oʻchirilmaydi. Oʻtgan yil jurnali
    //    roster'ni shu jadvaldan quradi; qator yoʻqolsa bolaning eski
    //    baholari egasiz qolib koʻrinmay ketadi (spec §4).
    await tx
      .update(enrollments)
      .set({ endedAt: date })
      .where(
        and(
          eq(enrollments.classId, fromClassId),
          inArray(enrollments.studentId, ids),
          isNull(enrollments.endedAt)
        )
      );

    // 2) Yangi sinfga yozilish. Bola ilgari u yerda boʻlib chiqib
    //    ketgan boʻlsa `ended_at` tozalanadi — qaytib kelish ham shu
    //    yoʻldan oʻtadi, yangi qator yaratilmaydi.
    await tx
      .insert(enrollments)
      .values(
        openRows.map((r) => ({
          classId: toClassId,
          studentId: r.id,
          sortOrder: r.sortOrder,
          startedAt: date,
          endedAt: null,
        }))
      )
      .onConflictDoUpdate({
        target: [enrollments.classId, enrollments.studentId],
        set: { startedAt: date, endedAt: null },
      });
  });

  return { moved: openRows.length };
}
