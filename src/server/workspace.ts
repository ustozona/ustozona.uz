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

/**
 * Shaxsiy maydon yaratadi.
 *
 * ⚠️ id ATAYLAB deterministik (`ws-<teacherId>`), `randomUUID()` emas.
 * Sabab — poyga holati: ikki parallel soʻrov ham "aʼzolik yoʻq" deb
 * topsa, tasodifiy id bilan IKKI maydon yaratilardi va ikkala aʼzolik
 * ham yozilardi (PK (workspaceId, teacherId) turlicha boʻlgani uchun
 * konflikt boʻlmasdi) — oʻqituvchi ikkita shaxsiy maydonga ega boʻlib
 * qolardi. Deterministik id bilan `onConflictDoNothing` haqiqatan
 * ishlaydi.
 *
 * Xuddi shu qoida 0035 migratsiyasida ham ishlatilgan — ikkalasi bir
 * xil id beradi, demak migratsiya va ilova bir-birini takrorlamaydi.
 */
async function createPersonalWorkspace(
  teacherId: string,
  teacherName: string
): Promise<WorkspaceContext> {
  const id = `ws-${teacherId}`;
  await db
    .insert(workspaces)
    .values({ id, name: teacherName, kind: "personal" })
    .onConflictDoNothing();
  await db
    .insert(workspaceMembers)
    .values({ workspaceId: id, teacherId, role: "owner" })
    .onConflictDoNothing();
  await db.update(teachers).set({ activeWorkspaceId: id }).where(eq(teachers.id, teacherId));
  return { teacherId, workspaceId: id, role: "owner" };
}

/** Oʻqituvchi aʼzo boʻlgan barcha maydonlar (almashtirgich uchun).

    `isActive` `requireWorkspace()` dan olinadi, `teachers.activeWorkspaceId`
    dan EMAS: eskirgan tanlov (aʼzolik bekor qilingan maydon) boʻlsa
    ikkalasi farq qiladi va haqiqiy qamrov birinchisiniki. */
export async function listMyWorkspaces(): Promise<
  { id: string; name: string; kind: string; role: string; isActive: boolean }[]
> {
  const teacher = await requireTeacher();
  const ctx = await requireWorkspace();
  const rows = await db
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
  return rows.map((r) => ({ ...r, isActive: r.id === ctx.workspaceId }));
}

/**
 * Faol maydonni almashtiradi.
 *
 * ⚠️ Aʼzolik SERVERDA tekshiriladi — `workspaceId` clientdan kelgan
 * qiymat. Busiz istalgan odam istalgan maydonga "oʻtib" olardi.
 */
export async function switchWorkspace(workspaceId: string): Promise<void> {
  const teacher = await requireTeacher();
  const [member] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.teacherId, teacher.id),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    );
  if (!member) throw new ForbiddenError("Bu ish maydoniga ruxsat yoʻq");

  await db
    .update(teachers)
    .set({ activeWorkspaceId: workspaceId })
    .where(eq(teachers.id, teacher.id));
}

/** Maydon aʼzolari — hamkasb tanlash oynasi va admin-lite roʻyxati uchun.

    ⚠️ Faqat ism/email/rol. Bu «kim biz bilan ishlaydi» roʻyxati,
    maʼlumot qamrovi emas — ikkisini aralashtirmaslik kerak. */
export async function listWorkspaceMembers(): Promise<
  { teacherId: string; name: string; email: string; role: string; isMe: boolean }[]
> {
  const ctx = await requireWorkspace();
  const rows = await db
    .select({
      teacherId: workspaceMembers.teacherId,
      role: workspaceMembers.role,
      name: teachers.name,
      email: teachers.email,
    })
    .from(workspaceMembers)
    .innerJoin(teachers, eq(teachers.id, workspaceMembers.teacherId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspaceId))
    .orderBy(workspaceMembers.createdAt);
  return rows.map((r) => ({ ...r, isMe: r.teacherId === ctx.teacherId }));
}

/**
 * Maydondagi butun oʻquvchi roʻyxati — ISM darajasi (`roster` qamrovi).
 *
 * Nima uchun kerak: ikkinchi oʻqituvchi 6-A ga oʻz fan guruhini
 * tuzayotganda 30 bolaning ismi kerak, aks holda ularni QOʻLDA qayta
 * yozadi — va oʻshanda bir bola ikki yozuvga boʻlinib, butun koʻchish
 * maʼnosini yoʻqotadi.
 *
 * ⚠️ Faqat ism/bosh harf/sinflar qaytadi — baho, davomat, qayd EMAS.
 * Bu ajratish ataylab: docs/ish-maydoni-arxitektura.md §4.1.
 */
export async function listWorkspaceRoster(): Promise<
  { id: string; name: string; initials: string; classNames: string[] }[]
> {
  const ctx = await requireWorkspace();

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      initials: students.initials,
      className: classes.name,
    })
    .from(students)
    .leftJoin(enrollments, eq(enrollments.studentId, students.id))
    .leftJoin(classes, eq(classes.id, enrollments.classId))
    .where(and(eq(students.workspaceId, ctx.workspaceId), eq(students.status, "active")));

  const byId = new Map<string, { id: string; name: string; initials: string; classNames: string[] }>();
  for (const r of rows) {
    const prev = byId.get(r.id);
    if (prev) {
      if (r.className) prev.classNames.push(r.className);
    } else {
      byId.set(r.id, {
        id: r.id,
        name: r.name,
        initials: r.initials,
        classNames: r.className ? [r.className] : [],
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "uz"));
}

/* ════════════════════════════════════════════════════════════════════
   MAYDON ADMINI (admin-lite) — direktor, zavuch va ular ruxsat bergan
   har kim. docs/ish-maydoni-arxitektura.md §11.

   ⚠️ Bu PLATFORMA admini EMAS. `/admin/*` va `super_admin` — Ustozona
   jamoasining paneli, butunlay boshqa oʻq (§11.1). Ikkisini
   aralashtirish tarixiy xato edi: eski `requireSchoolAdmin()` global
   auth roli VA aʼzolikni birga talab qilardi, natijada mijoz oʻzi
   zavuch tayinlay olmasdi. U olib tashlandi.

   ⭐ Faqat `admin` roli hisobga olinadi, `owner` EMAS. Sabab: `owner`
   maydonni yaratgan odam (hisob/oʻchirish maʼnosida), bu maʼlumot roli
   emas. Aks holda jamoa maydonini ochgan oʻqituvchi hamkasblarining
   baholarini SEZDIRMASDAN koʻra boshlardi — nazorat oshirish ochiq
   qadam boʻlishi kerak, yon taʼsir emas. Shaxsiy maydonda farq yoʻq:
   u yerda hamma sinf baribir oʻzining `class_teachers` i orqali
   koʻrinadi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * MAʼLUMOT QAMROVI kengaytiriladimi — ⚠️ FAQAT `admin`.
 *
 * ⛔ `owner` ATAYLAB kirmaydi. Sabab §11.4/§11.6 da: `owner` — maydonni
 * yaratgan odam (hisob maʼnosida), bu maʼlumot roli emas. Aks holda
 * jamoa maydonini ochgan oʻqituvchi hamkasblarining baholarini
 * SEZDIRMASDAN koʻra boshlardi.
 */
function hasAdminRole(ctx: WorkspaceContext): boolean {
  return ctx.role === "admin";
}

/**
 * BOSHQARUV darvozasi — hamkasb taklif qilish, aʼzolarni koʻrish,
 * maydon tarixini oʻqish.
 *
 * ⭐ `owner` HAM kiradi — `hasAdminRole` dan farqli. Bu ikkisi boshqa
 * savolga javob beradi:
 *
 *   hasAdminRole()        → «boshqaning MAʼLUMOTINI koʻra oladimi?»
 *   requireWorkspaceAdmin() → «maydonni BOSHQARA oladimi?»
 *
 * 🔴 2026-08-26 da ikkisi bitta funksiyada edi va prodda darhol
 * bilindi: yakka oʻqituvchining roli `owner`, demak u OʻZ maydoniga
 * hamkasb taklif qila olmasdi («Kod yaratilmadi»). Maydonni yaratgan
 * odam uni boshqara olmasligi maʼnosiz.
 *
 * ⛔ Baho/davomat YOZISH uchun ishlatilmaydi: §11.6 boʻyicha yozish
 * `assertTeachesClass` dan oʻtadi va u hech qanday istisno tan olmaydi.
 */
export async function requireWorkspaceAdmin(): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    throw new ForbiddenError("Bu amal maydon egasi yoki adminiga tegishli");
  }
  return ctx;
}

/**
 * Koʻrinadigan sinf/guruh id'lari.
 *
 * `data`   — faqat oʻzi oʻtadigan darslar (`class_teachers`)
 * `roster` — maydondagi barcha sinf
 *
 * ⭐ ADMIN ISTISNOSI (§11.6): admin uchun `data` ham butun maydon.
 * Zavuchning darsi yoʻq, demak umumiy qoida boʻyicha u HECH NARSA
 * koʻrmasdi — bu admin-lite'ning maʼnosini yoʻqotadi. ClassDojo'da ham
 * School Leader butun maktabni koʻradi; FERPA buni "legitimate
 * educational interest" bilan oqlaydi.
 *
 * ⚠️ Istisno maydon TURIGA emas, ROLGA qaraydi — yaʼni §1 dagi
 * `if (kind === "school")` taqigʻi buzilmaydi.
 */
export async function visibleClassIds(purpose: VisibilityPurpose): Promise<string[]> {
  const ctx = await requireWorkspace();

  if (purpose === "roster" || hasAdminRole(ctx)) {
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.workspaceId, ctx.workspaceId));
    return rows.map((r) => r.id);
  }

  return taughtClassIds(ctx);
}

/**
 * Haqiqatan biriktirilgan darslar — ⛔ admin istisnosiSIZ.
 *
 * YOZISH va OʻCHIRISH yoʻllari shu yerdan oʻtadi (§11.6). Masalan
 * `applyGradesBatch` dagi «ajrat yoki oʻchir»: admin butun maydonni
 * KOʻRADI, lekin hech kimning sinfini oʻchira olmaydi.
 *
 * Maydon tekshiruvi ham saqlanadi: aʼzolik bekor qilinsa eski
 * biriktirish ishlamasin.
 */
export async function taughtClassIds(ctx?: WorkspaceContext): Promise<string[]> {
  const scope = ctx ?? (await requireWorkspace());
  const rows = await db
    .select({ id: classes.id })
    .from(classTeachers)
    .innerJoin(classes, eq(classes.id, classTeachers.classId))
    .where(
      and(
        eq(classTeachers.teacherId, scope.teacherId),
        eq(classes.workspaceId, scope.workspaceId)
      )
    );
  return rows.map((r) => r.id);
}

/**
 * Koʻrinadigan oʻquvchi id'lari.
 *
 * `roster` — maydondagi barcha bola (ism darajasi)
 * `data`   — faqat oʻzi oʻtadigan darslarga yozilgan bolalar
 *
 * Admin uchun ikkalasi ham butun maydon — sabab `visibleClassIds` da.
 */
export async function visibleStudentIds(purpose: VisibilityPurpose): Promise<string[]> {
  const ctx = await requireWorkspace();

  if (purpose === "roster" || hasAdminRole(ctx)) {
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
 *
 * ⛔ ADMIN ISTISNOSI SHU YERGA TEGMAYDI (§11.6). `visibleStudentIds`
 * admin uchun butun maydonni qaytaradi, lekin bu funksiya ATAYLAB
 * undan foydalanmaydi — u faqat haqiqiy biriktirishni tan oladi.
 *
 * ⚠️ Yaʼni oʻqish va yozish darvozalari admin uchun BOSHQACHA javob
 * beradi. Bu nomuvofiqlik emas, qaror: zavuch baho qoʻymoqchi boʻlsa
 * oʻzini darsga biriktirsin — va oʻsha qadam koʻrinadigan boʻlsin.
 * Kim buni "tekislamoqchi" boʻlsa — qoidani buzgan boʻladi.
 */
export async function assertCanTouchStudent(
  studentId: string,
  purpose: VisibilityPurpose = "data"
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();

  if (purpose === "roster") {
    const allowed = await visibleStudentIds("roster");
    if (!allowed.includes(studentId)) throw new ForbiddenError("Bu oʻquvchiga ruxsat yoʻq");
    return ctx;
  }

  const classIds = await taughtClassIds(ctx);
  if (classIds.length === 0) throw new ForbiddenError("Bu oʻquvchiga ruxsat yoʻq");
  const [row] = await db
    .select({ id: enrollments.studentId })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, studentId), inArray(enrollments.classId, classIds)));
  if (!row) throw new ForbiddenError("Bu oʻquvchiga ruxsat yoʻq");
  return ctx;
}
