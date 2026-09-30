import "server-only";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes, enrollmentPeriods } from "@/server/db/schema";
import { periodOnSql } from "@/server/db/membership";
import { parallelKey } from "@/lib/parallel";
import { ForbiddenError } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   AʼZOLIK DAVRLARINI YOZISH — `enrollment_periods` ga yozadigan YAGONA joy.

   docs/sinf-azoligi-spec.md §4, §6. Davr jadvali — haqiqat manbai;
   `enrollments.started_at/ended_at` esa OXIRGI davrning nusxasi (kesh).
   Davrni oʻzgartirgan har bir amal BITTA tranzaksiyada `syncEnrollmentCache`
   ni chaqiradi — aks holda kesh (eski ustunlarni oʻqiydigan
   `ended_at IS NULL` filtrlari) jadvaldan uzilib qoladi.

   ⚠️ Faqat shu modul orqali yozing. Yangi `enrollments` qatori uchun
   birinchi davrni bazadagi trigger (`trg_enrollment_default_period`)
   ochadi — DAL uni qayta yozmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const CHUNK = 400;

function chunks<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += CHUNK) out.push(arr.slice(i, i + CHUNK));
  return out;
}

/**
 * Davr cheklovi buzilganda tushunarli xato: ustma-ust tushish (`23P01`)
 * yoki tugash boshlanishdan oldin (`23514`). Boshqa xatolar oʻz holicha
 * ketadi.
 */
export function periodError(e: unknown): unknown {
  const code = (e as { code?: string; cause?: { code?: string } })?.code
    ?? (e as { cause?: { code?: string } })?.cause?.code;
  if (code === "23P01") {
    return new ForbiddenError("Sana bolaning shu sinfdagi boshqa aʼzolik davri bilan kesishadi");
  }
  if (code === "23514") {
    return new ForbiddenError("Sana bolaning shu sinfga qoʻshilgan sanasidan oldin boʻla olmaydi");
  }
  return e;
}

/**
 * `enrollments.started_at/ended_at` keshini oxirgi davrdan qayta yozadi.
 * «Oxirgi» — eng kech boshlangan (boshlanishi yoʻq davr — eng erta).
 */
export async function syncEnrollmentCache(
  tx: Tx,
  classId: string,
  studentIds: string[]
): Promise<void> {
  for (const part of chunks(studentIds)) {
    await tx.execute(sql`
      UPDATE enrollments e
         SET started_at = to_char(l.started_on, 'YYYY-MM-DD'),
             ended_at   = to_char(l.ended_on,   'YYYY-MM-DD')
        FROM (
          SELECT DISTINCT ON (student_id) student_id, started_on, ended_on
            FROM enrollment_periods
           WHERE class_id = ${classId}
             AND ${inArray(enrollmentPeriods.studentId, part)}
           ORDER BY student_id, started_on DESC NULLS LAST, created_at DESC
        ) l
       WHERE e.class_id = ${classId} AND e.student_id = l.student_id
    `);
  }
}

/**
 * Yopilgan OXIRGI davrni qayta ochadi (`ended_on = NULL`) — roʻyxat
 * sinxronida (`applyGradesBatch`) bola sinfga qaytadan qoʻshilganda:
 * sana yoʻq, shuning uchun bola oraliqsiz davom etadi (ilgarigi
 * `ended_at = NULL` bilan bir xil). Sana bilan QAYTISH — `openPeriods`.
 *
 * Ochiq davri bor bola oʻzgarmaydi.
 */
export async function reopenLatestPeriods(
  tx: Tx,
  classId: string,
  studentIds: string[]
): Promise<void> {
  for (const part of chunks(studentIds)) {
    const rows = await tx
      .select({
        id: enrollmentPeriods.id,
        studentId: enrollmentPeriods.studentId,
        startedOn: enrollmentPeriods.startedOn,
        endedOn: enrollmentPeriods.endedOn,
      })
      .from(enrollmentPeriods)
      .where(and(eq(enrollmentPeriods.classId, classId), inArray(enrollmentPeriods.studentId, part)));

    const byStudent = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = byStudent.get(r.studentId) ?? [];
      list.push(r);
      byStudent.set(r.studentId, list);
    }
    const toReopen: string[] = [];
    for (const list of byStudent.values()) {
      if (list.some((p) => p.endedOn === null)) continue;
      // Oxirgi = eng kech tugagan.
      const latest = list.reduce((a, b) => ((b.endedOn ?? "") > (a.endedOn ?? "") ? b : a));
      toReopen.push(latest.id);
    }
    if (toReopen.length === 0) continue;
    try {
      await tx
        .update(enrollmentPeriods)
        .set({ endedOn: null, exitReason: null, moveId: null })
        .where(inArray(enrollmentPeriods.id, toReopen));
    } catch (e) {
      throw periodError(e);
    }
    await syncEnrollmentCache(tx, classId, part);
  }
}

/**
 * `studentIds` ning shu sinfdagi OCHIQ davrlarini `endedOn` bilan yopadi.
 * Ochiq davri yoʻq bolaga tegmaydi. Kesh yangilanadi.
 *
 * `moveIdOf` — koʻchirish hodisasi id'si (bola boʻyicha); boʻlmasa null.
 */
export async function closeOpenPeriods(
  tx: Tx,
  args: {
    classId: string;
    studentIds: string[];
    endedOn: string;
    reason: "moved" | "left_school" | "no_show" | "year_end" | "removed";
    moveIdOf?: Map<string, string>;
  }
): Promise<void> {
  const { classId, studentIds, endedOn, reason, moveIdOf } = args;
  try {
    for (const id of studentIds) {
      await tx
        .update(enrollmentPeriods)
        .set({ endedOn, exitReason: reason, moveId: moveIdOf?.get(id) ?? null })
        .where(
          and(
            eq(enrollmentPeriods.classId, classId),
            eq(enrollmentPeriods.studentId, id),
            isNull(enrollmentPeriods.endedOn)
          )
        );
    }
  } catch (e) {
    throw periodError(e);
  }
  await syncEnrollmentCache(tx, classId, studentIds);
}

/**
 * Q3: bir sanada bolaning barcha darajali guruhlari BITTA parallelga
 * tegishli (docs/sinf-azoligi-spec.md §3, `lib/parallel.ts`).
 *
 * `studentIds` ni `classId` ga `onDate` dan qoʻshishdan OLDIN chaqiriladi:
 * bolaning shu sanada AʼZO boʻlgan boshqa darajali guruhlari nishonning
 * paralleli bilan bir xilmi. Koʻchirishda eski guruh oldin yopilgan
 * boʻladi, shuning uchun u hisobga kirmaydi — yopilmay qolgan boshqa
 * fan guruhlari esa qoidani buzadi (parallel koʻchirish: spec §6.1).
 *
 * Darajasiz guruh (toʻgarak) va nishonning oʻzi qoidaga kirmaydi.
 */
async function assertSingleParallel(
  tx: Tx,
  classId: string,
  studentIds: string[],
  onDate: string
): Promise<void> {
  if (studentIds.length === 0) return;
  const [target] = await tx
    .select({
      name: classes.name,
      parentClassId: classes.parentClassId,
      grade: classes.grade,
      section: classes.section,
    })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);
  const targetKey = target ? parallelKey(target) : null;
  if (!target || targetKey === null) return;

  for (const part of chunks(studentIds)) {
    const others = await tx
      .select({
        studentId: enrollmentPeriods.studentId,
        name: classes.name,
        parentClassId: classes.parentClassId,
        grade: classes.grade,
        section: classes.section,
      })
      .from(enrollmentPeriods)
      .innerJoin(classes, eq(classes.id, enrollmentPeriods.classId))
      .where(
        and(
          inArray(enrollmentPeriods.studentId, part),
          ne(enrollmentPeriods.classId, classId),
          isNull(classes.archivedAt),
          periodOnSql(onDate)
        )
      );
    const bad = others.filter((o) => {
      const key = parallelKey(o);
      return key !== null && key !== targetKey;
    });
    if (bad.length > 0) {
      const names = [...new Set(bad.map((b) => b.name))].join(", ");
      throw new ForbiddenError(
        `Bola shu sanada ${names} guruhida ham oʻqiydi — u boshqa parallelda, ${target.name} esa boshqa. ` +
          `Bola bir vaqtda bitta parallelda boʻlishi kerak: avval oʻsha guruh(lar)dan ham chiqaring yoki koʻchiring`
      );
    }
  }
}

/**
 * `startedOn` dan boshlab YANGI davr ochadi (bola shu sinfga keldi yoki
 * qaytdi). `enrollments` qatori yoʻq boʻlsa yaratiladi (birinchi davrni
 * trigger ochadi), bor boʻlsa — yangi davr qoʻshiladi. Ochiq davri
 * allaqachon bor bolaga tegilmaydi (u allaqachon shu sinfda).
 *
 * `sortOrderOf` — yangi `enrollments` qatori uchun jurnal raqami.
 * `moveIdOf` — koʻchirish hodisasi id'si (bola boʻyicha).
 */
export async function openPeriods(
  tx: Tx,
  args: {
    classId: string;
    studentIds: string[];
    startedOn: string;
    sortOrderOf: Map<string, number>;
    moveIdOf?: Map<string, string>;
  }
): Promise<void> {
  const { classId, studentIds, startedOn, sortOrderOf, moveIdOf } = args;
  try {
    for (const part of chunks(studentIds)) {
      // Q3: allaqachon shu sinfda (ochiq davri bor) boʻlmaganlar uchungina.
      const openHere = await tx
        .select({ studentId: enrollmentPeriods.studentId })
        .from(enrollmentPeriods)
        .where(
          and(
            eq(enrollmentPeriods.classId, classId),
            inArray(enrollmentPeriods.studentId, part),
            isNull(enrollmentPeriods.endedOn)
          )
        );
      const alreadyHere = new Set(openHere.map((r) => r.studentId));
      await assertSingleParallel(tx, classId, part.filter((id) => !alreadyHere.has(id)), startedOn);

      // Yangi bogʻlanish — trigger birinchi davrni `[startedOn, NULL)` bilan ochadi.
      const inserted = await tx.execute<{ student_id: string }>(sql`
        INSERT INTO enrollments (class_id, student_id, sort_order, started_at)
        VALUES ${sql.join(
          part.map((id) => sql`(${classId}, ${id}, ${sortOrderOf.get(id) ?? 0}, ${startedOn})`),
          sql`, `
        )}
        ON CONFLICT (class_id, student_id) DO NOTHING
        RETURNING student_id
      `);
      const fresh = new Set([...inserted].map((r) => r.student_id));

      // Bogʻlanish oldindan bor edi: ochiq davri yoʻqlarga yangi davr.
      const existing = part.filter((id) => !fresh.has(id));
      if (existing.length > 0) {
        const open = await tx
          .select({ studentId: enrollmentPeriods.studentId })
          .from(enrollmentPeriods)
          .where(
            and(
              eq(enrollmentPeriods.classId, classId),
              inArray(enrollmentPeriods.studentId, existing),
              isNull(enrollmentPeriods.endedOn)
            )
          );
        const alreadyOpen = new Set(open.map((r) => r.studentId));
        const needNew = existing.filter((id) => !alreadyOpen.has(id));
        if (needNew.length > 0) {
          await tx.insert(enrollmentPeriods).values(
            needNew.map((id) => ({ classId, studentId: id, startedOn }))
          );
        }
      }

      // Koʻchirish hodisasini yangi (shu sanada boshlangan ochiq) davrga bogʻlash.
      if (moveIdOf) {
        for (const id of part) {
          const moveId = moveIdOf.get(id);
          if (!moveId) continue;
          await tx
            .update(enrollmentPeriods)
            .set({ moveId })
            .where(
              and(
                eq(enrollmentPeriods.classId, classId),
                eq(enrollmentPeriods.studentId, id),
                eq(enrollmentPeriods.startedOn, startedOn),
                isNull(enrollmentPeriods.endedOn),
                isNull(enrollmentPeriods.moveId)
              )
            );
        }
      }
    }
  } catch (e) {
    throw periodError(e);
  }
  await syncEnrollmentCache(tx, classId, studentIds);
}
