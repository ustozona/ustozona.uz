"use server";

import { z } from "zod";
import { runAction } from "@/server/action-result";
import { doskaAbsent } from "@/server/dal/doska-absent";
import type { ActionResult } from "@/lib/action-result";

/* Ruxsat va tarif tekshiruvi DAL ichida (`server/dal/doska-absent.ts`). */

const schema = z.object({
  classId: z.string().min(1).max(200),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function doskaAbsentAction(input: z.infer<typeof schema>): Promise<ActionResult<string[]>> {
  const { classId, today } = schema.parse(input);
  return runAction(() => doskaAbsent(classId, today));
}
