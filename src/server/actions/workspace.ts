"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { listWorkspaceMembers, listWorkspaceRoster, switchWorkspace } from "@/server/workspace";
import {
  addClassTeacher,
  listClassTeachers,
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

/* ⛔ Bu faylda `export type { … }` YOZILMAYDI — `"use server"` modulida
   tip-reeksporti prodda runtime eksportga aylanadi va BARCHA server
   amalini oʻldiradi (AGENTS.md, 2026-08-08). Tip kerak boʻlsa neytral
   modulga chiqariladi. */

const switchSchema = z.object({ workspaceId: z.string().min(1).max(200) });

/** Faol ish maydonini almashtiradi (aʼzolik tekshiruvi DAL ichida). */
export async function switchWorkspaceAction(input: unknown): Promise<void> {
  const { workspaceId } = switchSchema.parse(input);
  await switchWorkspace(workspaceId);
  // Butun dashboard qamrovga bogʻliq — sinflar, oʻquvchilar, jurnal.
  revalidatePath("/dashboard", "layout");
}

/**
 * Maydondagi oʻquvchilar roʻyxati — mavjud bolani oʻz guruhiga qoʻshish
 * uchun. Faqat ism darajasi (§4.1).
 */
export async function getWorkspaceRosterAction() {
  return listWorkspaceRoster();
}

/* ─── Darsni kim oʻtadi (§10.4) ───────────────────────────────────────

   Ruxsat tekshiruvi DAL ichida (`src/server/dal/class-teachers.ts`) —
   bu yerda faqat kirish maʼlumoti tozalanadi. */

const classIdSchema = z.object({ classId: z.string().min(1).max(200) });
const classTeacherSchema = classIdSchema.extend({
  teacherId: z.string().min(1).max(200),
});

export async function getWorkspaceMembersAction() {
  return listWorkspaceMembers();
}

export async function getClassTeachersAction(input: unknown) {
  const { classId } = classIdSchema.parse(input);
  return listClassTeachers(classId);
}

export async function addClassTeacherAction(input: unknown): Promise<void> {
  const { classId, teacherId } = classTeacherSchema.parse(input);
  await addClassTeacher(classId, teacherId);
  revalidatePath("/dashboard", "layout");
}

export async function removeClassTeacherAction(input: unknown): Promise<void> {
  const { classId, teacherId } = classTeacherSchema.parse(input);
  await removeClassTeacher(classId, teacherId);
  revalidatePath("/dashboard", "layout");
}

export async function transferClassOwnershipAction(input: unknown): Promise<void> {
  const { classId, teacherId } = classTeacherSchema.parse(input);
  await transferClassOwnership(classId, teacherId);
  revalidatePath("/dashboard", "layout");
}

/* ─── Hamkasbni taklif qilish (§10.4) ─────────────────────────────── */

const inviteRoleSchema = z.object({ role: z.enum(["admin", "teacher"]) });
const inviteCodeSchema = z.object({ code: z.string().min(1).max(64) });
const inviteIdSchema = z.object({ inviteId: z.string().min(1).max(200) });

export async function createWorkspaceInviteAction(input: unknown): Promise<string> {
  const { role } = inviteRoleSchema.parse(input);
  return createWorkspaceInvite(role);
}

export async function getWorkspaceInvitesAction() {
  return listWorkspaceInvites();
}

export async function revokeWorkspaceInviteAction(input: unknown): Promise<void> {
  const { inviteId } = inviteIdSchema.parse(input);
  await revokeWorkspaceInvite(inviteId);
}

/** Kodni tekshiradi — hech narsani oʻzgartirmaydi (qabul qaytarilmas). */
export async function previewWorkspaceInviteAction(input: unknown) {
  const { code } = inviteCodeSchema.parse(input);
  return previewWorkspaceInvite(code);
}

export async function acceptWorkspaceInviteAction(input: unknown): Promise<void> {
  const { code } = inviteCodeSchema.parse(input);
  await acceptWorkspaceInvite(code);
  revalidatePath("/dashboard", "layout");
}

export async function leaveWorkspaceAction(): Promise<void> {
  await leaveWorkspace();
  revalidatePath("/dashboard", "layout");
}
