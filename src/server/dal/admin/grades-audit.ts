import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { requireAdmin } from "@/server/session";
import { writeAuditLog } from "./audit";

/* ════════════════════════════════════════════════════════════════════
   NASHR QILINGAN BAHOLAR — «800%» xatosini topish va tuzatish

   NIMA BOʻLGAN
   ------------
   `publishSessionToGrades()` `grades.score` ga XOM BALL oʻrniga FOIZ
   yozardi. `assignments.max_score` esa (toʻgʻri holicha) element soni
   edi. Jurnal foizni yana maxrajga boʻladi:

       10 savolli testda 8 ta toʻgʻri
       yozilgan: 80   →  jurnal: 80 / 10 * 100 = 800 %
       toʻgʻrisi: 8   →  jurnal:  8 / 10 * 100 =  80 %

   Tuzatish `ff4ce87` da, main'ga 2026-08-04 07:40 UTC da tushgan.
   Undan OLDIN nashr qilingan baholar bazada foiz boʻlib qolgan.

   NEGA BU MODUL BOR
   -----------------
   Prod bazasiga qoʻlda SQL yozish oʻrniga — ilovaning oʻzidan, admin
   huquqi bilan. Sabab: qoʻlda `UPDATE` da bitta xato shart butun
   jurnalni buzadi va orqaga qaytarib boʻlmaydi.

   ⚠️ ENG MUHIM QAROR — NIMA TUZATILADI, NIMA TUZATILMAYDI
   -------------------------------------------------------
   Vaqt boʻyicha koʻr-koʻrona tuzatib boʻlmaydi. Oʻqituvchi nashrdan
   keyin bahoni QOʻLDA tuzatgan boʻlishi mumkin — u yerda allaqachon
   xom ball turadi va vaqt sharti uni ham ushlab, 10 ni 1 ga aylantirib
   yuborardi. Yaʼni «tuzatish» oʻzi maʼlumot buzardi.

   Shuning uchun faqat `score > max_score` qatorlari tuzatiladi. Xom
   ball maxrajdan katta boʻlishi MANTIQAN mumkin emas — u yerda faqat
   foiz boʻlishi mumkin. Bu isbot, taxmin emas.

   Qolgani — `suspect`: buzuq davrda yozilgan, lekin qiymati maxrajdan
   kichik (masalan 20 savolli testda 10 % → `10 < 20`). Ularni
   ajratib boʻlmaydi, shuning uchun ular FAQAT KOʻRSATILADI. Ular uchun
   toʻgʻri yoʻl — sessiyani qayta nashr qilish (`sourceSessionId`
   idempotent, javoblardan qaytadan hisoblaydi).
   ════════════════════════════════════════════════════════════════════ */

/** Tuzatish prodga chiqqan payt (ff4ce87 → main 07:40 UTC + deploy). */
const FIX_DEPLOYED_AT = "2026-08-04T07:42:00Z";

export type GradesAudit = {
  fixDeployedAt: string;
  /** Nashrdan kelgan barcha baho qatorlari. */
  totalPublished: number;
  /** `score > max_score` — isbotlangan foiz. Tuzatiladi. */
  broken: number;
  /** Buzuq davrda yozilgan, lekin ajratib boʻlmaydigan. Faqat koʻrsatiladi. */
  suspect: number;
  /** Nechta sessiya taʼsirlangan (`broken` boʻyicha). */
  affectedSessions: number;
  /** Koʻzdan kechirish uchun namuna (eng koʻpi 25 ta). */
  samples: {
    studentName: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    /** Hozir jurnalda shu foiz koʻrinadi. */
    shownPercent: number;
    /** Tuzatishdan keyin shu boʻladi. */
    repairedScore: number;
    updatedAt: string;
  }[];
};

export async function auditPublishedGrades(): Promise<GradesAudit> {
  await requireAdmin();

  /* Bitta soʻrov — uchta hisob. `source_session_id IS NOT NULL` sharti
     qoʻlda kiritilgan baholarni butunlay chetlab oʻtadi: ular boshqa
     yoʻl bilan yozilgan va bu xatoga aloqasi yoʻq. */
  const counts = await db.execute(sql`
    SELECT
      COUNT(*)::int                                              AS total_published,
      COUNT(*) FILTER (WHERE g.score > a.max_score)::int          AS broken,
      COUNT(*) FILTER (WHERE g.updated_at < ${FIX_DEPLOYED_AT}::timestamptz
                         AND g.score <= a.max_score
                         AND g.score > 0)::int                    AS suspect,
      COUNT(DISTINCT a.source_session_id)
        FILTER (WHERE g.score > a.max_score)::int                 AS affected_sessions
    FROM grades g
    JOIN assignments a ON a.id = g.assignment_id
    WHERE a.source_session_id IS NOT NULL
  `);

  // postgres-js: `execute()` massiv qaytaradi (`.rows` emas).
  const c = ((counts as unknown as unknown[])[0] ?? {}) as Record<string, number | null>;

  const samples = await db.execute(sql`
    SELECT s.name                                    AS student_name,
           a.title                                   AS assignment_title,
           g.score::float                            AS score,
           a.max_score::int                          AS max_score,
           g.updated_at                              AS updated_at
    FROM grades g
    JOIN assignments a ON a.id = g.assignment_id
    JOIN students s    ON s.id = g.student_id
    WHERE a.source_session_id IS NOT NULL
      AND g.score > a.max_score
    ORDER BY g.updated_at DESC
    LIMIT 25
  `);

  return {
    fixDeployedAt: FIX_DEPLOYED_AT,
    totalPublished: c.total_published ?? 0,
    broken: c.broken ?? 0,
    suspect: c.suspect ?? 0,
    affectedSessions: c.affected_sessions ?? 0,
    samples: ((samples as unknown as unknown[]) ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const score = Number(row.score);
      const maxScore = Number(row.max_score);
      return {
        studentName: String(row.student_name ?? ""),
        assignmentTitle: String(row.assignment_title ?? ""),
        score,
        maxScore,
        shownPercent: Math.round((score / maxScore) * 100 * 10) / 10,
        // Eski kod `round(earned / maxScore * 100, 2)` yozgan, demak
        // teskarisi aniq: `earned = score * maxScore / 100`.
        repairedScore: Math.round((score * maxScore) / 100 * 100) / 100,
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      };
    }),
  };
}

export type RepairResult = { repaired: number; remaining: number };

/** Isbotlangan qatorlarni tuzatadi. `suspect` larga TEGMAYDI. */
export async function repairPercentGrades(): Promise<RepairResult> {
  const { actor } = await requireAdmin();

  /* `score > max_score` sharti UPDATE ning oʻzida — bu shunchaki filtr
     emas, xavfsizlik chegarasi. Uni WHERE dan chiqarib, oldindan
     hisoblangan id roʻyxatiga tayanish xavfli boʻlardi: roʻyxat
     olingandan keyin oʻqituvchi bahoni qoʻlda tuzatib ulgursa, biz
     uning toʻgʻri qiymatini bosib yozardik.

     Shart UPDATE bilan bitta atomik amalda tekshirilgani uchun bunday
     poyga (race) mumkin emas: shartga tushmay qolgan qator umuman
     tegilmaydi. */
  const updated = await db.execute(sql`
    UPDATE grades g
       SET score = ROUND((g.score * a.max_score / 100.0)::numeric, 2)::real,
           updated_at = now()
      FROM assignments a
     WHERE g.assignment_id = a.id
       AND a.source_session_id IS NOT NULL
       AND g.score > a.max_score
    RETURNING g.student_id
  `);

  const repaired = (updated as unknown as unknown[]).length ?? 0;

  // Tekshiruv: tuzatilgandan keyin bitta ham qolmasligi kerak.
  const left = await db.execute(sql`
    SELECT COUNT(*)::int AS n
      FROM grades g
      JOIN assignments a ON a.id = g.assignment_id
     WHERE a.source_session_id IS NOT NULL AND g.score > a.max_score
  `);
  const remaining = Number(((left as unknown as unknown[])[0] as { n?: number })?.n ?? 0);

  if (repaired > 0) {
    await writeAuditLog(actor, {
      action: "grades.repair_percent",
      targetType: "grades",
      targetLabel: `${repaired} ta baho tuzatildi`,
      meta: { repaired, remaining, fixDeployedAt: FIX_DEPLOYED_AT },
    });
  }

  return { repaired, remaining };
}
