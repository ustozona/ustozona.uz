import "server-only";
import { and, count, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  academicYears, attendanceRecords, classes, enrollmentPeriods, enrollments, studentMoves,
} from "@/server/db/schema";
import {
  closeOpenPeriods, openPeriods, periodError, syncEnrollmentCache,
} from "@/server/dal/enrollment-periods";
import { ForbiddenError } from "@/server/session";
import {
  assertCanTouchStudent, requireWorkspace, taughtClassIds, type WorkspaceContext,
} from "@/server/workspace";
import { gradeForYear } from "@/lib/class-naming";
import type { CorrectMoveDateResult, MembershipHistoryPeriod } from "@/lib/membership-history";

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
  /** Buyruq raqami — ixtiyoriy (`student_moves.order_no`). */
  orderNo?: string | null;
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
export async function movableClassIds(ctx: WorkspaceContext): Promise<string[]> {
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
  const orderNo = input.orderNo?.trim() || null;

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

    // 0) Koʻchirish HODISASI — bitta buyruq, bola boʻyicha bitta qator
    //    (spec §4.3). Ikkala davr shunga bogʻlanadi.
    const moves = await tx
      .insert(studentMoves)
      .values(
        ids.map((studentId) => ({
          workspaceId: ctx.workspaceId,
          studentId,
          fromClassId,
          toClassId,
          effectiveOn: date,
          orderNo,
        }))
      )
      .returning({ id: studentMoves.id, studentId: studentMoves.studentId });
    const moveIdOf = new Map(moves.map((m) => [m.studentId, m.id]));

    // 1) Eski davr YOPILADI — oʻchirilmaydi. Oʻtgan yil jurnali roster'ni
    //    shu davrdan quradi; qator yoʻqolsa bolaning eski baholari egasiz
    //    qolib koʻrinmay ketadi (spec §4).
    await closeOpenPeriods(tx, {
      classId: fromClassId,
      studentIds: ids,
      endedOn: date,
      reason: "moved",
      moveIdOf,
    });

    // 2) Yangi sinfda YANGI davr. Bola ilgari u yerda boʻlib chiqib
    //    ketgan boʻlsa — qaytish: eski davr yopiq qoladi (tarix saqlanadi),
    //    yangisi qoʻshiladi. Sana eski davr bilan kesishsa — rad etiladi.
    await openPeriods(tx, {
      classId: toClassId,
      studentIds: ids,
      startedOn: date,
      sortOrderOf: new Map(openRows.map((r) => [r.id, r.sortOrder])),
      moveIdOf,
    });
  });

  return { moved: openRows.length };
}

/**
 * Bolaning barcha aʼzolik davrlari (profil tarixi) — yangisi tepada.
 * Koʻchirish hodisasidan kelgan davrga hodisa maʼlumoti biriktiriladi.
 *
 * Faqat shu ish maydonidagi sinflar; koʻrish huquqi — roʻyxat darajasida
 * (`assertCanTouchStudent(…, "roster")`).
 */
export async function membershipOf(studentId: string): Promise<MembershipHistoryPeriod[]> {
  const ctx = await assertCanTouchStudent(studentId, "roster");

  const rows = await db
    .select({
      id: enrollmentPeriods.id,
      classId: enrollmentPeriods.classId,
      className: classes.name,
      from: enrollmentPeriods.startedOn,
      to: enrollmentPeriods.endedOn,
      exitReason: enrollmentPeriods.exitReason,
      moveId: enrollmentPeriods.moveId,
    })
    .from(enrollmentPeriods)
    .innerJoin(classes, eq(classes.id, enrollmentPeriods.classId))
    .where(and(eq(enrollmentPeriods.studentId, studentId), eq(classes.workspaceId, ctx.workspaceId)));

  const moves = await db
    .select()
    .from(studentMoves)
    .where(and(eq(studentMoves.studentId, studentId), eq(studentMoves.workspaceId, ctx.workspaceId)));
  const moveById = new Map(moves.map((m) => [m.id, m]));

  const nameIds = [...new Set(moves.flatMap((m) => [m.fromClassId, m.toClassId]))];
  const names = new Map<string, string>();
  if (nameIds.length > 0) {
    const cls = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(inArray(classes.id, nameIds));
    for (const c of cls) names.set(c.id, c.name);
  }

  const movable = new Set(await movableClassIds(ctx));

  const out: MembershipHistoryPeriod[] = rows.map((r) => {
    const m = r.moveId ? moveById.get(r.moveId) : undefined;
    return {
      id: r.id,
      classId: r.classId,
      className: r.className,
      from: r.from,
      to: r.to,
      exitReason: r.exitReason,
      move: m
        ? {
            id: m.id,
            effectiveOn: m.effectiveOn,
            orderNo: m.orderNo,
            direction: m.fromClassId === r.classId ? "out" : "in",
            otherClassName:
              names.get(m.fromClassId === r.classId ? m.toClassId : m.fromClassId) ?? "Boshqa sinf",
            canCorrect: movable.has(m.fromClassId) && movable.has(m.toClassId),
          }
        : null,
    };
  });

  // Yangisi tepada; boshlanishi yoʻq (boshidan) davr — eng pastda.
  out.sort((a, b) => (b.from ?? "").localeCompare(a.from ?? ""));
  return out;
}

/**
 * Koʻchirish sanasini tuzatadi — hodisa boʻyicha IKKALA tomon birga:
 * eski sinfda davr `effectiveOn` da yopiladi, yangisida `effectiveOn` dan
 * boshlanadi. Shu tufayli ikki sinf orasida «hech kimniki emas» kunlar
 * yoki ikkalasiga ham tegishli kunlar paydo boʻlmaydi (spec §4.3).
 *
 * ⚠️ Oraliqdan chiqib qolgan davomat yozuvlari OʻCHIRILMAYDI — faqat soni
 * qaytariladi (interfeys ogohlantiradi).
 *
 * Ruxsat koʻchirish bilan bir xil: ikkala sinfni boshqara oladigan.
 */
export async function correctMoveDate(
  moveId: string,
  date: string
): Promise<CorrectMoveDateResult> {
  const ctx = await requireWorkspace();
  const [move] = await db
    .select()
    .from(studentMoves)
    .where(and(eq(studentMoves.id, moveId), eq(studentMoves.workspaceId, ctx.workspaceId)))
    .limit(1);
  if (!move) throw new ForbiddenError("Koʻchirish topilmadi");

  const allowed = new Set(await movableClassIds(ctx));
  if (!allowed.has(move.fromClassId) || !allowed.has(move.toClassId)) {
    throw new ForbiddenError("Bu sinflardan biri sizga biriktirilmagan");
  }
  if (move.effectiveOn === date) return { outsideAttendance: 0 };

  await db.transaction(async (tx) => {
    try {
      const closed = await tx
        .update(enrollmentPeriods)
        .set({ endedOn: date })
        .where(
          and(
            eq(enrollmentPeriods.moveId, moveId),
            eq(enrollmentPeriods.classId, move.fromClassId),
            eq(enrollmentPeriods.studentId, move.studentId)
          )
        )
        .returning({ id: enrollmentPeriods.id });
      const opened = await tx
        .update(enrollmentPeriods)
        .set({ startedOn: date })
        .where(
          and(
            eq(enrollmentPeriods.moveId, moveId),
            eq(enrollmentPeriods.classId, move.toClassId),
            eq(enrollmentPeriods.studentId, move.studentId)
          )
        )
        .returning({ id: enrollmentPeriods.id });
      if (closed.length === 0 || opened.length === 0) {
        throw new ForbiddenError("Bu koʻchirishning davrlari topilmadi — sanani tuzatib boʻlmaydi");
      }
      await tx
        .update(studentMoves)
        .set({ effectiveOn: date, updatedAt: sql`now()` })
        .where(eq(studentMoves.id, moveId));
    } catch (e) {
      throw periodError(e);
    }
    await syncEnrollmentCache(tx, move.fromClassId, [move.studentId]);
    await syncEnrollmentCache(tx, move.toClassId, [move.studentId]);
  });

  // Yangi oraliqdan tashqarida qolgan yozuvlar: eski sinfda `date` va undan
  // keyin, yangisida `date` dan oldin.
  const [row] = await db
    .select({ n: count() })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentId, move.studentId),
        or(
          and(eq(attendanceRecords.classId, move.fromClassId), gte(attendanceRecords.date, date)),
          and(eq(attendanceRecords.classId, move.toClassId), lt(attendanceRecords.date, date))
        )
      )
    );
  return { outsideAttendance: Number(row?.n ?? 0) };
}
