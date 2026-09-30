import { and, isNull, lte, gt, or, sql, type SQL } from "drizzle-orm";
import { enrollmentPeriods, enrollments } from "@/server/db/schema";
import { isDateKeyShape } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   AʼZOLIK SHARTI — SQL koʻrinishida («bola `date` kuni shu guruhda»).

   Mijozdagi `isMemberOn` (lib/membership.ts) bilan AYNAN bir xil qoida:
   yarim-ochiq [started_on, ended_on), null = chegara yoʻq. Haqiqat
   manbai — `enrollment_periods` (docs/sinf-azoligi-spec.md §4.2);
   `enrollments.started_at/ended_at` faqat oxirgi davrning keshi.

   Nega `server/db` da, `server/dal` da emas: oʻqituvchi DAL'i ham
   (`dal/class-roster.ts`), ishtirokchi DAL'i ham (`dal/play/**` — u
   oʻqituvchi DAL'ini import qila olmaydi, eslint) shu shartdan
   foydalanadi. Soʻrovlar har qatlamda oʻzicha yoziladi, QOIDA esa bitta.

   Ikki shakl:
     • `memberOnSql`   — `enrollments` qatorlari ustidagi soʻrov uchun
                         (EXISTS: davrlardan birortasi `date` ni qamrasa);
     • `periodOnSql`   — soʻrov davr jadvalining oʻzini qoʻshsa (JOIN):
                         `joinedAt`/`leftAt` aynan shu davrniki boʻladi.
   ════════════════════════════════════════════════════════════════════ */

/** Davr `date` kunini qamraydi. `date` — "YYYY-MM-DD".

    Solishtirish MATN sifatida (`::text`): ISO sana leksikografik tartibda
    toʻgʻri, «2026-02-31» kabi mavjud boʻlmagan kun esa `::date` kabi
    soʻrovni yiqitmaydi. Notoʻgʻri shakl — hech kim aʼzo emas
    (`isMemberOn` bilan bir xil). */
export function periodOnSql(date: string): SQL {
  if (!isDateKeyShape(date)) return sql`false`;
  return and(
    or(isNull(enrollmentPeriods.startedOn), lte(sql`${enrollmentPeriods.startedOn}::text`, date)),
    or(isNull(enrollmentPeriods.endedOn), gt(sql`${enrollmentPeriods.endedOn}::text`, date))
  )!;
}

/** `enrollments` qatori uchun: `date` kuni bola shu guruhda. */
export function memberOnSql(date: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${enrollmentPeriods}
     WHERE ${enrollmentPeriods.classId} = ${enrollments.classId}
       AND ${enrollmentPeriods.studentId} = ${enrollments.studentId}
       AND ${periodOnSql(date)}
  )`;
}
