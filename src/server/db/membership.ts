import { and, gt, isNull, lte, or, type SQL } from "drizzle-orm";
import { enrollments } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   AʼZOLIK SHARTI — SQL koʻrinishida («bola `date` kuni shu guruhda»).

   Mijozdagi `isMemberOn` (lib/membership.ts) bilan AYNAN bir xil qoida:
   yarim-ochiq [started_at, ended_at), null = chegara yoʻq.

   Nega `server/db` da, `server/dal` da emas: oʻqituvchi DAL'i ham
   (`dal/class-roster.ts`), ishtirokchi DAL'i ham (`dal/play/**` — u
   oʻqituvchi DAL'ini import qila olmaydi, eslint) shu shartdan
   foydalanadi. Soʻrovlar har qatlamda oʻzicha yoziladi, QOIDA esa bitta.
   ════════════════════════════════════════════════════════════════════ */

/** `date` — "YYYY-MM-DD". */
export function memberOnSql(date: string): SQL {
  return and(
    or(isNull(enrollments.startedAt), lte(enrollments.startedAt, date)),
    or(isNull(enrollments.endedAt), gt(enrollments.endedAt, date))
  )!;
}
