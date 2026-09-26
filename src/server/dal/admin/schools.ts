import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  classes,
  students,
  teachers,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/session";
import { moveTeacherToWorkspace } from "../workspace-membership";
import { writeAuditLog } from "./audit";

/* Admin paneli "Maktablar" boʻlimi.

   ⚠️ Maktab — bu `kind = "school"` boʻlgan ISH MAYDONI (alohida jadval
   emas). Har oʻqituvchining shaxsiy maydoni ham bor (`kind = "personal"`),
   lekin u bu roʻyxatda koʻrinmaydi — aks holda roʻyxat yuzlab shaxsiy
   maydon bilan toʻlib ketardi.

   Batafsil: docs/ish-maydoni-arxitektura.md §1 */

export type AdminSchoolItem = {
  id: string;
  name: string;
  region: string | null;
  city: string | null;
  createdAt: Date;
  teacherCount: number;
  /** Maydonga tegishli sinf soni — oʻchirish oqibatini koʻrsatish uchun. */
  classCount: number;
  /** Maydonga tegishli oʻquvchi soni — oʻchirish oqibatini koʻrsatish uchun. */
  studentCount: number;
};

/** Maktablar roʻyxati (oʻqituvchi/sinf/oʻquvchi soni bilan) — faqat super_admin.

    ⚠️ Sinf va oʻquvchi soni ATAYLAB olinadi, garchi roʻyxatda ular
    koʻrsatilmasa ham: `deleteSchool` oqibati aynan shu raqamlar bilan
    tushuntiriladi (quyidagi izohga qarang). */
export async function listSchools(): Promise<AdminSchoolItem[]> {
  await requireAdmin();
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      region: workspaces.region,
      city: workspaces.city,
      createdAt: workspaces.createdAt,
      teacherCount: count(workspaceMembers.teacherId),
      /* Skalyar quyi-soʻrov, JOIN emas: uchta jadvalni birga JOIN qilsa
         qatorlar koʻpayib ketardi va `count()` bir-birini koʻpaytirardi. */
      classCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${classes} WHERE ${classes.workspaceId} = ${workspaces.id}
      )`,
      studentCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${students} WHERE ${students.workspaceId} = ${workspaces.id}
      )`,
    })
    .from(workspaces)
    .leftJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaces.kind, "school"))
    .groupBy(workspaces.id)
    .orderBy(workspaces.name);
}

/* ⛔ `getSchoolForCurrentAdmin()` OLIB TASHLANDI (2026-08-26) — 0 ta
   chaqiruvchisi bor edi va notoʻgʻri qatlamda turardi: maktab
   admin-lite'i `/dashboard` ichida boʻladi, PLATFORMA panelida emas
   (docs/ish-maydoni-arxitektura.md §11.1). */

export type TeacherListItem = {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
};

/** Maktabga biriktirilmagan / biriktirish uchun oʻqituvchilar roʻyxati.

    `schoolId` — oʻqituvchi aʼzo boʻlgan `kind = "school"` maydon (shaxsiy
    maydon hisobga olinmaydi). Bir nechta maktabga aʼzo boʻlish texnik
    jihatdan mumkin; bu roʻyxat birinchisini koʻrsatadi. */
export async function listTeachersForAssignment(): Promise<TeacherListItem[]> {
  await requireAdmin();
  const rows = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      schoolId: workspaces.id,
    })
    .from(teachers)
    .leftJoin(workspaceMembers, eq(workspaceMembers.teacherId, teachers.id))
    .leftJoin(
      workspaces,
      and(eq(workspaces.id, workspaceMembers.workspaceId), eq(workspaces.kind, "school"))
    )
    .orderBy(teachers.name);

  // Bir oʻqituvchi bir nechta maydonga aʼzo boʻlsa join takroriy qator
  // beradi — maktabga aʼzoligini ustun qoʻyib yigʻamiz.
  const byId = new Map<string, TeacherListItem>();
  for (const r of rows) {
    const prev = byId.get(r.id);
    if (!prev || (!prev.schoolId && r.schoolId)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

export async function createSchool(input: {
  name: string;
  region?: string;
  city?: string;
}): Promise<void> {
  const { actor } = await requireAdmin();
  const id = crypto.randomUUID();
  await db.insert(workspaces).values({
    id,
    name: input.name,
    kind: "school",
    region: input.region || null,
    city: input.city || null,
  });
  await writeAuditLog(actor, {
    action: "school.create",
    targetType: "school",
    targetId: id,
    targetLabel: input.name,
  });
}

export async function updateSchool(
  schoolId: string,
  input: { name: string; region?: string; city?: string },
): Promise<void> {
  const { actor } = await requireAdmin();
  await db
    .update(workspaces)
    .set({ name: input.name, region: input.region || null, city: input.city || null })
    .where(eq(workspaces.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.update",
    targetType: "school",
    targetId: schoolId,
    targetLabel: input.name,
  });
}

/* ⛔ MAKTABNI OʻCHIRISH — BOʻSH BOʻLSAGINA.

   Bazada `workspaces` dan cascade zanjiri 30+ jadvalga yetadi:

       maktab → sinflar   → topshiriq, davomat, xulq, test, mavzu…
              → oʻquvchilar → baho, davomat, izoh, aloqador bola…

   Yaʼni bitta `DELETE` butun maktabning bir yillik ishini oʻchiradi.
   Prodda avtomatik zaxira YOʻQ, demak bu qaytarilmaydi.

   Ilgari bu funksiya hech narsani tekshirmasdi, ekrandagi ogohlantirish
   esa «oʻqituvchilar maktabsiz qoladi (hisoblari saqlanadi)» deb
   TESKARISINI aytardi — admin hech narsa yoʻqolmaydi deb oʻylab bosardi.

   Yechim: maktab oldin BOʻSHATILADI (oʻqituvchilar «Maktabdan chiqarish»
   orqali koʻchiriladi, sinf/oʻquvchi esa oʻsha yerdan olib ketiladi),
   keyingina oʻchiriladi. Shunda oʻchirish amali maʼlumot yoʻqotmaydi —
   faqat boʻsh idishni olib tashlaydi. */
export async function deleteSchool(schoolId: string): Promise<void> {
  const { actor } = await requireAdmin();
  const [row] = await db.select().from(workspaces).where(eq(workspaces.id, schoolId));
  if (!row) throw new Error("Maktab topilmadi");

  const [impact] = await db
    .select({
      teacherCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${workspaceMembers}
        WHERE ${workspaceMembers.workspaceId} = ${schoolId}
      )`,
      classCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${classes} WHERE ${classes.workspaceId} = ${schoolId}
      )`,
      studentCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${students} WHERE ${students.workspaceId} = ${schoolId}
      )`,
    })
    .from(workspaces)
    .where(eq(workspaces.id, schoolId));

  const band: string[] = [];
  if (impact.teacherCount > 0) band.push(`${impact.teacherCount} ta oʻqituvchi`);
  if (impact.classCount > 0) band.push(`${impact.classCount} ta sinf`);
  if (impact.studentCount > 0) band.push(`${impact.studentCount} ta oʻquvchi`);
  if (band.length > 0) {
    throw new Error(
      `«${row.name}» boʻsh emas: ${band.join(", ")}. Oʻchirilsa bularning ` +
        `barcha baho va davomati ham yoʻqoladi va qaytarib boʻlmaydi. ` +
        `Avval oʻqituvchilarni boshqa maktabga koʻchiring yoki maktabdan chiqaring.`,
    );
  }

  await db.delete(workspaces).where(eq(workspaces.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.delete",
    targetType: "school",
    targetId: schoolId,
    targetLabel: row.name,
  });
}

/**
 * Oʻqituvchini maktabga biriktiradi yoki undan chiqaradi.
 *
 * ⭐ ISHI HAM KOʻCHADI. Asoschi qarori (2026-08-22): oʻqituvchi bir
 * vaqtda BITTA joyda ishlaydi. Ilgari maktabga qoʻshilganda unga boʻsh
 * ikkinchi maydon paydo boʻlardi — oʻqituvchi maktabga oʻtib, ilovani
 * BOʻSH koʻrardi va nima boʻlganini tushunmasdi.
 *
 * Endi: 30-maktabga qoʻshilsangiz, sinflaringiz ham 30-maktabga koʻchadi.
 * Shundan keyin hamkasblar bir xil oʻquvchilar ustida ishlay oladi —
 * butun maqsad shu.
 *
 * `schoolId = null` — maktabdan chiqarish. ⚠️ Sinf va oʻquvchilar
 * MAKTABDA QOLADI (maktab oʻz yozuvlarini saqlaydi), oʻqituvchi esa
 * boʻsh shaxsiy maydoniga qaytadi.
 *
 * ⚠️ Koʻp-maydonlilik (maktab + repetitorlik) sxemada saqlangan, lekin
 * hozircha UI'dan berilmaydi — docs/ish-maydoni-arxitektura.md §4.2.
 */
export async function assignTeacherToSchool(
  teacherId: string,
  schoolId: string | null,
): Promise<void> {
  const { actor } = await requireAdmin();

  /* Koʻchirish mantigʻi umumiy modulda — oʻqituvchi taklif kodini qabul
     qilganda ham AYNAN shu bajariladi (dal/workspace-membership.ts). */
  await moveTeacherToWorkspace(teacherId, schoolId);

  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, teacherId));
  await writeAuditLog(actor, {
    action: "school.assign_teacher",
    targetType: "teacher",
    targetId: teacherId,
    targetLabel: teacher?.name ?? teacherId,
    meta: { schoolId },
  });
}
