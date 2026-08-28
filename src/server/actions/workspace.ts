"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { listWorkspaceMembers, listWorkspaceRoster, switchWorkspace } from "@/server/workspace";
import {
  addClassTeacher,
  listClassTeachers,
  previewClassDeletion,
  removeClassTeacher,
  transferClassOwnership,
} from "@/server/dal/class-teachers";
import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
  leaveWorkspace,
  listWorkspaceInvites,
  previewWorkspaceInvite,
  revokeWorkspaceInvite,
} from "@/server/dal/workspace-invites";
import {
  removeWorkspaceMember,
  transferWorkspaceOwnership,
} from "@/server/dal/workspace-roles";
import { getClassParentInfo, setClassParent } from "@/server/dal/class-parent";
import { findDuplicateStudents, mergeStudents } from "@/server/dal/student-merge";
import { listWorkspaceAudit } from "@/server/dal/workspace-audit";
import { runAction } from "@/server/action-result";

/* ⛔ Bu faylda `export type { … }` YOZILMAYDI — `"use server"` modulida
   tip-reeksporti prodda runtime eksportga aylanadi va BARCHA server
   amalini oʻldiradi (AGENTS.md, 2026-08-08). Tip kerak boʻlsa neytral
   modulga chiqariladi. */

const switchSchema = z.object({ workspaceId: z.string().min(1).max(200) });

/** Faol ish maydonini almashtiradi (aʼzolik tekshiruvi DAL ichida). */
export async function switchWorkspaceAction(input: unknown) {
  return runAction(async () => {
    const { workspaceId } = switchSchema.parse(input);
    await switchWorkspace(workspaceId);
    // Butun dashboard qamrovga bogʻliq — sinflar, oʻquvchilar, jurnal.
    revalidatePath("/dashboard", "layout");
  });
}

/**
 * Maydondagi oʻquvchilar roʻyxati — mavjud bolani oʻz guruhiga qoʻshish
 * uchun. Faqat ism darajasi (§4.1).
 */
export async function getWorkspaceRosterAction() {
  return runAction(() => listWorkspaceRoster());
}

/* ─── Darsni kim oʻtadi (§10.4) ───────────────────────────────────────

   Ruxsat tekshiruvi DAL ichida (`src/server/dal/class-teachers.ts`) —
   bu yerda faqat kirish maʼlumoti tozalanadi. */

const classIdSchema = z.object({ classId: z.string().min(1).max(200) });
const classTeacherSchema = classIdSchema.extend({
  teacherId: z.string().min(1).max(200),
});

export async function getWorkspaceMembersAction() {
  return runAction(() => listWorkspaceMembers());
}

export async function getClassTeachersAction(input: unknown) {
  return runAction(() => {
    const { classId } = classIdSchema.parse(input);
    return listClassTeachers(classId);
  });
}

/* Oʻchirish dialogi shu javobga qarab matnini tanlaydi: sinf haqiqatan
   oʻchadimi yoki faqat biriktirish uziladimi (dal/class-teachers.ts). */
const classIdsSchema = z.object({
  classIds: z.array(z.string().min(1).max(200)).max(500),
});

export async function previewClassDeletionAction(input: unknown) {
  return runAction(() => {
    const { classIds } = classIdsSchema.parse(input);
    return previewClassDeletion(classIds);
  });
}

export async function addClassTeacherAction(input: unknown) {
  return runAction(async () => {
    const { classId, teacherId } = classTeacherSchema.parse(input);
    await addClassTeacher(classId, teacherId);
    revalidatePath("/dashboard", "layout");
  });
}

export async function removeClassTeacherAction(input: unknown) {
  return runAction(async () => {
    const { classId, teacherId } = classTeacherSchema.parse(input);
    await removeClassTeacher(classId, teacherId);
    revalidatePath("/dashboard", "layout");
  });
}

export async function transferClassOwnershipAction(input: unknown) {
  return runAction(async () => {
    const { classId, teacherId } = classTeacherSchema.parse(input);
    await transferClassOwnership(classId, teacherId);
    revalidatePath("/dashboard", "layout");
  });
}

/* ─── Hamkasbni taklif qilish (§10.4) ─────────────────────────────── */

const inviteRoleSchema = z.object({ role: z.enum(["admin", "teacher"]) });
const inviteCodeSchema = z.object({ code: z.string().min(1).max(64) });
const inviteIdSchema = z.object({ inviteId: z.string().min(1).max(200) });

export async function createWorkspaceInviteAction(input: unknown) {
  return runAction(() => {
    const { role } = inviteRoleSchema.parse(input);
    return createWorkspaceInvite(role);
  });
}

export async function getWorkspaceInvitesAction() {
  return runAction(() => listWorkspaceInvites());
}

export async function revokeWorkspaceInviteAction(input: unknown) {
  return runAction(async () => {
    const { inviteId } = inviteIdSchema.parse(input);
    await revokeWorkspaceInvite(inviteId);
  });
}

/** Kodni tekshiradi — hech narsani oʻzgartirmaydi (qabul qaytarilmas). */
export async function previewWorkspaceInviteAction(input: unknown) {
  return runAction(() => {
    const { code } = inviteCodeSchema.parse(input);
    return previewWorkspaceInvite(code);
  });
}

export async function acceptWorkspaceInviteAction(input: unknown) {
  return runAction(async () => {
    const { code } = inviteCodeSchema.parse(input);
    await acceptWorkspaceInvite(code);
    revalidatePath("/dashboard", "layout");
  });
}

export async function leaveWorkspaceAction() {
  return runAction(async () => {
    await leaveWorkspace();
    revalidatePath("/dashboard", "layout");
  });
}

/* ─── Dublikat oʻquvchilar (§7.2) ─────────────────────────────────── */

const mergeSchema = z.object({
  survivorId: z.string().min(1).max(200),
  loserId: z.string().min(1).max(200),
});

export async function findDuplicateStudentsAction() {
  return runAction(() => findDuplicateStudents());
}

/** 🔴 QAYTARILMAS — UI ochiq tasdiq soʻragan boʻlishi shart. */
export async function mergeStudentsAction(input: unknown) {
  return runAction(async () => {
    const { survivorId, loserId } = mergeSchema.parse(input);
    await mergeStudents(survivorId, loserId);
    revalidatePath("/dashboard", "layout");
  });
}

export async function getWorkspaceAuditAction() {
  return runAction(() => listWorkspaceAudit());
}

/* ─── Maydon aʼzoligi (§10.6) ─────────────────────────────────────────

   ⛔ Har ikkala amal maydonda «kamida bitta ega» invariantini saqlaydi.
   Tekshiruv DAL ichida — bu yerda faqat kirish maʼlumoti tozalanadi. */

const memberSchema = z.object({ teacherId: z.string().min(1).max(200) });

/** Egalikni boshqa aʼzoga oʻtkazadi. Eski ega `admin` boʻlib qoladi. */
export async function transferWorkspaceOwnershipAction(input: unknown) {
  return runAction(async () => {
    const { teacherId } = memberSchema.parse(input);
    await transferWorkspaceOwnership(teacherId);
    // Rol butun dashboard qamroviga taʼsir qiladi.
    revalidatePath("/dashboard", "layout");
  });
}

/** Aʼzoni maydondan chiqaradi — u shaxsiy maydoniga qaytadi. */
export async function removeWorkspaceMemberAction(input: unknown) {
  return runAction(async () => {
    const { teacherId } = memberSchema.parse(input);
    await removeWorkspaceMember(teacherId);
    revalidatePath("/dashboard", "layout");
  });
}

/* ─── Maʼmuriy sinf ↔ dars guruhi (§4.3) ─────────────────────────── */

const setParentSchema = classIdSchema.extend({
  parentClassId: z.string().min(1).max(200).nullable(),
});

export async function getClassParentInfoAction(input: unknown) {
  return runAction(() => {
    const { classId } = classIdSchema.parse(input);
    return getClassParentInfo(classId);
  });
}

/** Guruhni maʼmuriy sinfga ulaydi; `parentClassId: null` — uzadi. */
export async function setClassParentAction(input: unknown) {
  return runAction(async () => {
    const { classId, parentClassId } = setParentSchema.parse(input);
    await setClassParent(classId, parentClassId);
    revalidatePath("/dashboard", "layout");
  });
}
