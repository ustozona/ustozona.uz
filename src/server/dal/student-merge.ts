import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes, enrollments, students } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace, visibleStudentIds } from "@/server/workspace";
import { writeWorkspaceAudit } from "./workspace-audit";

/* ════════════════════════════════════════════════════════════════════
   DUBLIKAT OʻQUVCHILARNI BIRLASHTIRISH.

   ⭐ NEGA KERAK: taklif oqimi ishga tushgach bu MUAMMO EMAS, FAKT
   boʻladi. Aziza opa ham, Laylo opa ham «Bobur Aliyev» ni oʻz shaxsiy
   maydonida yaratgan; jamoaga qoʻshilganda ikkalasi bitta maydonga
   koʻchadi va u yerda IKKITA Bobur turadi. Bu haqda taʼlim tizimlarida
   ataylab ogohlantiriladi: «avval maktab tasdigʻini ol, keyin sinf yarat — aks
   holda dublikat oʻquvchilar paydo boʻladi».

   🔴 BIRLASHTIRISH QAYTARILMAS. Shu bois (docs §7.2):
     - avtomatik EMAS — har doim odam tasdiqlaydi
     - taklif qilinadi, bajarilmaydi
     - tarixi yoziladi (`workspace_audit_logs`)

   ⚠️ Oʻquvchiga 14 ta jadval ishora qiladi. Ularning yettitasida
   `studentId` unikal kalit ichida — koʻr-koʻrona `UPDATE` qilinsa
   konfliktda yiqiladi. Har birida ziddiyatli qator AVVAL oʻchiriladi
   (yutqazgan tomon — dublikatniki), keyin qolganlari koʻchiriladi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * `studentId` ga ishora qiluvchi jadvallar.
 *
 * `keys` — unikal kalitning studentId'dan BOSHQA ustunlari. Boʻsh
 * massiv = unikal cheklov yoʻq, konflikt boʻlmaydi.
 *
 * ⚠️ Yangi jadval qoʻshilganda SHU ROʻYXAT yangilanishi kerak. Aks
 * holda birlashtirish jimgina maʼlumot qoldirib ketadi — dublikat
 * oʻchadi, unga bogʻlangan qatorlar esa FK cascade bilan yoʻqoladi.
 */
type StudentTable = {
  table: string;
  /** Ustun nomi — ⚠️ hamma joyda `student_id` EMAS. */
  column?: string;
  /** Unikal kalitning studentId'dan boshqa ustunlari. */
  keys?: string[];
  /** Unikal kalit FAQAT student ustunidan iborat (bola boʻyicha bitta qator). */
  soleRow?: boolean;
};

const STUDENT_TABLES: StudentTable[] = [
  { table: "enrollments", keys: ["class_id"] },
  { table: "grades", keys: ["assignment_id"] },
  { table: "attendance_records", keys: ["class_id", "date"] },
  { table: "student_accommodations", keys: ["kind", "scope", "scope_ref"] },
  { table: "student_links", keys: ["user_id"] },
  /* ⚠️ Ustun nomi boshqacha va unikal kalit faqat oʻsha ustundan iborat:
     bitta bola — bitta LessonLab bogʻlanishi. */
  { table: "roster_links", column: "uz_student_id", soleRow: true },
  { table: "behavior_events" },
  { table: "behavior_redemptions" },
  { table: "behavior_deletions" },
  { table: "student_notes" },
  { table: "student_invites" },
  { table: "session_participants" },
  { table: "responses" },
  { table: "cj_scripts" },
];

export type DuplicateGroup = {
  /** Normallashtirilgan ism — guruh kaliti. */
  key: string;
  students: {
    id: string;
    name: string;
    classNames: string[];
    createdAt: Date;
  }[];
};

/**
 * Ism boʻyicha normallashtirish.
 *
 * ⚠️ Oʻzbek matnida bir xil ism turlicha yoziladi: «Oʻ» ↔ «O'» ↔ «O`»,
 * qoʻshimcha boʻshliqlar, bosh/kichik harf. Ular tenglashtirilmasa
 * dublikat topilmaydi — aynan shu farqlar ikki oʻqituvchida boshqacha
 * terilgan boʻladi.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ehtimoliy dublikatlar — bir xil normallashtirilgan ismli 2+ oʻquvchi.
 *
 * ⚠️ Bu TAXMIN, xulosa emas: maktabda haqiqatan ikkita bir xil ismli
 * bola boʻlishi mumkin. Shuning uchun natija «birlashtirilsinmi?» degan
 * TAKLIF sifatida koʻrsatiladi, avtomatik amal sifatida emas.
 */
export async function findDuplicateStudents(): Promise<DuplicateGroup[]> {
  const ctx = await requireWorkspace();

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      createdAt: students.createdAt,
      className: classes.name,
    })
    .from(students)
    .leftJoin(enrollments, eq(enrollments.studentId, students.id))
    .leftJoin(classes, eq(classes.id, enrollments.classId))
    .where(and(eq(students.workspaceId, ctx.workspaceId), eq(students.status, "active")));

  const byId = new Map<string, DuplicateGroup["students"][number]>();
  for (const r of rows) {
    const prev = byId.get(r.id);
    if (prev) {
      if (r.className) prev.classNames.push(r.className);
    } else {
      byId.set(r.id, {
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
        classNames: r.className ? [r.className] : [],
      });
    }
  }

  const groups = new Map<string, DuplicateGroup>();
  for (const s of byId.values()) {
    const key = normalizeName(s.name);
    const g = groups.get(key);
    if (g) g.students.push(s);
    else groups.set(key, { key, students: [s] });
  }

  return [...groups.values()]
    .filter((g) => g.students.length > 1)
    .map((g) => ({
      ...g,
      // Eng eskisi birinchi — u odatda «asosiy» yozuv boʻladi.
      students: g.students.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    }))
    .sort((a, b) => a.students[0].name.localeCompare(b.students[0].name, "uz"));
}

/**
 * Ikki oʻquvchini birlashtiradi: `loserId` ning hamma yozuvi
 * `survivorId` ga koʻchadi, keyin dublikat qatori oʻchadi.
 *
 * 🔴 QAYTARILMAS. Chaqiruvchi UI ochiq tasdiq soʻrashi SHART.
 *
 * ⚠️ Ikkalasi ham `data` qamrovida boʻlishi shart — yaʼni chaqiruvchi
 * ikkala bolani ham haqiqatan oʻqitadi (yoki admin). Busiz hamkasbning
 * bolasini oʻzimnikiga «yutib yuborish» mumkin boʻlardi.
 */
export async function mergeStudents(survivorId: string, loserId: string): Promise<void> {
  if (survivorId === loserId) throw new ForbiddenError("Bir xil oʻquvchi");
  const ctx = await requireWorkspace();

  const allowed = new Set(await visibleStudentIds("data"));
  if (!allowed.has(survivorId) || !allowed.has(loserId)) {
    throw new ForbiddenError("Bu oʻquvchilarni birlashtirishga ruxsat yoʻq");
  }

  const rows = await db
    .select({ id: students.id, name: students.name, workspaceId: students.workspaceId })
    .from(students)
    .where(inArray(students.id, [survivorId, loserId]));
  if (rows.length !== 2) throw new ForbiddenError("Oʻquvchi topilmadi");
  if (rows.some((r) => r.workspaceId !== ctx.workspaceId)) {
    throw new ForbiddenError("Oʻquvchilar boshqa ish maydonida");
  }
  const survivor = rows.find((r) => r.id === survivorId)!;
  const loser = rows.find((r) => r.id === loserId)!;

  await db.transaction(async (tx) => {
    for (const t of STUDENT_TABLES) {
      const tbl = sql.identifier(t.table);
      const col = sql.identifier(t.column ?? "student_id");

      /* Ziddiyatli qatorni OʻCHIRAMIZ — dublikatniki yutqazadi.
         Masalan ikkala Bobur ham 6-A ga yozilgan boʻlsa, bitta
         yozilish qoladi. Bu maʼlumot yoʻqotish emas: nishon tomonda
         aynan shu yozuv allaqachon bor. */
      if (t.soleRow) {
        await tx.execute(sql`
          DELETE FROM ${tbl}
          WHERE ${col} = ${loserId}
            AND EXISTS (SELECT 1 FROM ${tbl} s WHERE s.${col} = ${survivorId})
        `);
      } else if (t.keys && t.keys.length > 0) {
        const cols = t.keys.map((k) => sql.identifier(k));
        await tx.execute(sql`
          DELETE FROM ${tbl} d
          WHERE d.${col} = ${loserId}
            AND EXISTS (
              SELECT 1 FROM ${tbl} s
              WHERE s.${col} = ${survivorId}
                AND ${sql.join(
                  cols.map((c) => sql`s.${c} IS NOT DISTINCT FROM d.${c}`),
                  sql` AND `
                )}
            )
        `);
      }

      await tx.execute(sql`UPDATE ${tbl} SET ${col} = ${survivorId} WHERE ${col} = ${loserId}`);
    }

    /* Aka-uka bogʻlanishlari ikki ustunli — oʻziga oʻzi bogʻlanib
       qolmasin va juftlik takrorlanmasin. */
    await tx.execute(sql`
      UPDATE student_relations SET student_a = ${survivorId}
      WHERE student_a = ${loserId}
        AND student_b <> ${survivorId}
        AND NOT EXISTS (
          SELECT 1 FROM student_relations x
          WHERE x.student_a = ${survivorId} AND x.student_b = student_relations.student_b
        )
    `);
    await tx.execute(sql`
      UPDATE student_relations SET student_b = ${survivorId}
      WHERE student_b = ${loserId}
        AND student_a <> ${survivorId}
        AND NOT EXISTS (
          SELECT 1 FROM student_relations x
          WHERE x.student_b = ${survivorId} AND x.student_a = student_relations.student_a
        )
    `);
    await tx.execute(
      sql`DELETE FROM student_relations WHERE student_a = ${loserId} OR student_b = ${loserId}`
    );

    await tx.delete(students).where(eq(students.id, loserId));
  });

  await writeWorkspaceAudit(ctx, {
    action: "student.merge",
    targetType: "student",
    targetId: survivorId,
    targetLabel: survivor.name,
    meta: { mergedId: loserId, mergedName: loser.name },
  });
}
