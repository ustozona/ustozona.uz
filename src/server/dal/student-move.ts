import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes, enrollments } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace, taughtClassIds } from "@/server/workspace";

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
async function movableClassIds(): Promise<string[]> {
  const ctx = await requireWorkspace();
  if (ctx.role === "admin") {
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.workspaceId, ctx.workspaceId));
    return rows.map((r) => r.id);
  }
  return taughtClassIds(ctx);
}

export async function moveStudents(input: MoveStudentsInput): Promise<MoveStudentsResult> {
  const { studentIds, fromClassId, toClassId, date } = input;

  if (fromClassId === toClassId) {
    throw new ForbiddenError("Oʻquvchi allaqachon shu sinfda");
  }
  if (studentIds.length === 0) return { moved: 0 };

  const allowed = new Set(await movableClassIds());
  if (!allowed.has(fromClassId) || !allowed.has(toClassId)) {
    throw new ForbiddenError("Bu sinflardan biri sizga biriktirilmagan");
  }

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
