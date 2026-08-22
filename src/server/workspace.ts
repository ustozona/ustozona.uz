import "server-only";
import { cache } from "react";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db/client";
import {
  classTeachers,
  classes,
  enrollments,
  students,
  teachers,
  workspaceMembers,
  workspaces,
} from "./db/schema";
import { ForbiddenError, requireTeacher } from "./session";

/* ════════════════════════════════════════════════════════════════════
   ISH MAYDONI QAMROVI — koʻrinuvchanlikning YAGONA MANBAI.

   ⛔⛔ QATʼIY QOIDA: yangi kodda `eq(students.workspaceId, …)` yoki
   `eq(classes.workspaceId, …)` QOʻLDA yozilmaydi. Har doim shu fayldagi
   funksiyalardan oʻtiladi.

   Sabab tajribadan: ilgari qamrov `eq(X.teacherId, tid)` shaklida 22 ta
   joyga sochilgan edi. Qoidani bir marta kengaytirish kerak boʻlganda
   (sinf rahbari, maktab admini) 22 joyni ochish kerak boʻlardi — va
   BITTA unutilgan joy butun qoidani bekor qiladi.

   Batafsil: docs/ish-maydoni-arxitektura.md §4.1
   ════════════════════════════════════════════════════════════════════ */

/** Faol maydon konteksti. */
export type WorkspaceContext = {
  teacherId: string;
  workspaceId: string;
  /** owner | admin | teacher */
  role: string;
};

/**
 * KOʻRINUVCHANLIK MAQSADI — ikki xil javob beradi (§4.1).
 *
 * `roster` — ISM darajasi. Maydondagi barcha oʻquvchi. Kerak, chunki
 *   oʻqituvchi yangi guruh tuzayotganda 7-A dagi 30 bolani koʻrishi
 *   shart, aks holda 30 ta ismni qoʻlda qayta yozadi. Haqiqiy maktabda
 *   ham bu sir emas — kim 7-A da ekani hammaga maʼlum.
 *
 * `data` — BAHO / DAVOMAT / XULQ / QAYD darajasi. Faqat oʻzi oʻtadigan
 *   darsdagi bolalar. Jahon amaliyoti (Blackbaud, PowerSchool, Google
 *   Classroom, Moodle) va FERPA "legitimate educational interest"
 *   tamoyili shuni talab qiladi.
 */
export type VisibilityPurpose = "roster" | "data";

/**
 * Faol ish maydonini qaytaradi; birinchi kirishda shaxsiy maydon
 * yaratadi ("yakka oʻqituvchi = aʼzosi bitta maydon", §1).
 *
 * `teachers.activeWorkspaceId` — faqat "oxirgi tanlov" xotirasi. Ruxsat
 * har doim `workspace_members` dan tekshiriladi: aʼzolik bekor qilingan
 * boʻlsa eskirgan tanlov ishlamaydi.
 */
export const requireWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const teacher = await requireTeacher();

  const memberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.teacherId, teacher.id));

  if (memberships.length === 0) {
    return createPersonalWorkspace(teacher.id, teacher.name);
  }

  const active =
    memberships.find((m) => m.workspaceId === teacher.activeWorkspaceId) ?? memberships[0];
  return { teacherId: teacher.id, workspaceId: active.workspaceId, role: active.role };
});

async function createPersonalWorkspace(
  teacherId: string,
  teacherName: string
): Promise<WorkspaceContext> {
  const id = crypto.randomUUID();
  await db.insert(workspaces).values({ id, name: teacherName, kind: "personal" });
  await db
    .insert(workspaceMembers)
    .values({ workspaceId: id, teacherId, role: "owner" })
    .onConflictDoNothing();
  await db.update(teachers).set({ activeWorkspaceId: id }).where(eq(teachers.id, teacherId));
  return { teacherId, workspaceId: id, role: "owner" };
}

/** Oʻqituvchi aʼzo boʻlgan barcha maydonlar (almashtirgich uchun). */
export async function listMyWorkspaces() {
  const teacher = await requireTeacher();
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      kind: workspaces.kind,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.teacherId, teacher.id))
    .orderBy(workspaces.createdAt);
}

/**
 * Koʻrinadigan sinf/guruh id'lari.
 *
 * `data`   — faqat oʻzi oʻtadigan darslar (`class_teachers`)
 * `roster` — maydondagi barcha sinf
 */
export async function visibleClassIds(purpose: VisibilityPurpose): Promise<string[]> {
  const ctx = await requireWorkspace();

  if (purpose === "roster") {
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.workspaceId, ctx.workspaceId));
    return rows.map((r) => r.id);
  }

  // "data" — dars biriktirilgan boʻlishi shart. Maydon tekshiruvi ham
  // saqlanadi: aʼzolik bekor qilinsa eski biriktirish ishlamasin.
  const rows = await db
    .select({ id: classes.id })
    .from(classTeachers)
    .innerJoin(classes, eq(classes.id, classTeachers.classId))
    .where(
      and(eq(classTeachers.teacherId, ctx.teacherId), eq(classes.workspaceId, ctx.workspaceId))
    );
  return rows.map((r) => r.id);
}

/**
 * Koʻrinadigan oʻquvchi id'lari.
 *
 * `roster` — maydondagi barcha bola (ism darajasi)
 * `data`   — faqat oʻzi oʻtadigan darslarga yozilgan bolalar
 */
export async function visibleStudentIds(purpose: VisibilityPurpose): Promise<string[]> {
  const ctx = await requireWorkspace();

  if (purpose === "roster") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.workspaceId, ctx.workspaceId));
    return rows.map((r) => r.id);
  }

  const classIds = await visibleClassIds("data");
  if (classIds.length === 0) return [];
  const rows = await db
    .selectDistinct({ id: enrollments.studentId })
    .from(enrollments)
    .where(inArray(enrollments.classId, classIds));
  return rows.map((r) => r.id);
}

/**
 * Darsga tegish huquqini tekshiradi (yozish amallari uchun).
 *
 * 🔴 IMTIYOZ OSHIRISHDAN HIMOYA: koʻrinuvchanlik "men oʻtadigan
 * darsdagi bolalar" qoidasiga tayangani uchun, oʻzini istalgan darsga
 * qoʻsha oladigan oʻqituvchi OʻZIGA OʻZI ruxsat bergan boʻladi.
 */
export async function assertTeachesClass(classId: string): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  const [row] = await db
    .select({ id: classes.id })
    .from(classTeachers)
    .innerJoin(classes, eq(classes.id, classTeachers.classId))
    .where(
      and(
        eq(classTeachers.classId, classId),
        eq(classTeachers.teacherId, ctx.teacherId),
        eq(classes.workspaceId, ctx.workspaceId)
      )
    );
  if (!row) throw new ForbiddenError("Bu darsga ruxsat yoʻq");
  return ctx;
}

/**
 * Oʻquvchiga tegish huquqi.
 *
 * ⚠️ Bu tekshiruv YOZISH yoʻllarida majburiy. Sabab: `student_notes`
 * DAL'i ilgari clientdan kelgan `studentId` ni tekshiruvsiz yozardi —
 * qaydlar ulashilgach bu "har kim istalgan bolaga qayd yozib qoʻyadi"
 * ga aylanardi.
 */
export async function assertCanTouchStudent(
  studentId: string,
  purpose: VisibilityPurpose = "data"
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  const allowed = await visibleStudentIds(purpose);
  if (!allowed.includes(studentId)) throw new ForbiddenError("Bu oʻquvchiga ruxsat yoʻq");
  return ctx;
}
