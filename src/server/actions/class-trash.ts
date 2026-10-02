"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/action-result";
import {
  listTrashedClasses,
  previewClassTrash,
  purgeClassesNow,
  restoreClasses,
  trashClasses,
} from "@/server/dal/class-trash";

/* Sinf savati amallari — qoidalar dal/class-trash.ts da.
   ⛔ Bu faylda tip eksporti YOʻQ: tiplar `@/lib/class-trash` da (AGENTS.md). */

const classIdsSchema = z.object({
  classIds: z.array(z.string().min(1).max(200)).min(1).max(500),
});

export async function previewClassTrashAction(input: unknown) {
  return runAction(() => previewClassTrash(classIdsSchema.parse(input).classIds));
}

export async function trashClassesAction(input: unknown) {
  return runAction(async () => {
    const res = await trashClasses(classIdsSchema.parse(input).classIds);
    revalidatePath("/dashboard", "layout");
    return res;
  });
}

export async function listTrashedClassesAction() {
  return runAction(() => listTrashedClasses());
}

export async function restoreClassesAction(input: unknown) {
  return runAction(async () => {
    const n = await restoreClasses(classIdsSchema.parse(input).classIds);
    revalidatePath("/dashboard", "layout");
    return n;
  });
}

export async function purgeClassesNowAction(input: unknown) {
  return runAction(async () => {
    const n = await purgeClassesNow(classIdsSchema.parse(input).classIds);
    revalidatePath("/dashboard", "layout");
    return n;
  });
}
