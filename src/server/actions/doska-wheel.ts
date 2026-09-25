"use server";

import { z } from "zod";
import { runAction } from "@/server/action-result";
import { wheelAccess, wheelRoster } from "@/server/dal/doska-wheel";
import type { ActionResult } from "@/lib/action-result";
import type { WheelAccess, WheelRosterResult } from "@/lib/doska/wheel";

/* ⚠️ Bu faylda `export type` YOʻQ — tiplar `lib/doska/wheel.ts` da
   (AGENTS.md: "use server" fayldan tip eksporti prodni buzadi).
   Ruxsat va tarif tekshiruvi DAL ichida (`server/dal/doska-wheel.ts`). */

export async function wheelAccessAction(): Promise<ActionResult<WheelAccess>> {
  return runAction(() => wheelAccess());
}

const rosterSchema = z.object({ classId: z.string().min(1).max(200) });

export async function wheelRosterAction(
  input: z.infer<typeof rosterSchema>,
): Promise<ActionResult<WheelRosterResult>> {
  return runAction(() => wheelRoster(rosterSchema.parse(input).classId));
}
