"use server";

import { z } from "zod";
import {
  createSchool,
  updateSchool,
  deleteSchool,
  assignTeacherToSchool,
} from "@/server/dal/admin/schools";

const schoolSchema = z.object({
  name: z.string().trim().min(1).max(200),
  region: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
});

export async function createSchoolAction(input: z.infer<typeof schoolSchema>) {
  const data = schoolSchema.parse(input);
  await createSchool(data);
  return { ok: true as const };
}

export async function updateSchoolAction(
  input: { schoolId: string } & z.infer<typeof schoolSchema>,
) {
  const { schoolId, ...rest } = input;
  const data = schoolSchema.parse(rest);
  await updateSchool(schoolId, data);
  return { ok: true as const };
}

const deleteSchema = z.object({ schoolId: z.string().min(1) });

export async function deleteSchoolAction(input: z.infer<typeof deleteSchema>) {
  const { schoolId } = deleteSchema.parse(input);
  await deleteSchool(schoolId);
  return { ok: true as const };
}

const assignSchema = z.object({
  teacherId: z.string().min(1),
  schoolId: z.string().min(1).nullable(),
});

export async function assignTeacherToSchoolAction(input: z.infer<typeof assignSchema>) {
  const { teacherId, schoolId } = assignSchema.parse(input);
  await assignTeacherToSchool(teacherId, schoolId);
  return { ok: true as const };
}
