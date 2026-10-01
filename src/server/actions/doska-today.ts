"use server";

import { z } from "zod";
import { runAction } from "@/server/action-result";
import { doskaToday } from "@/server/dal/doska-today";
import type { ActionResult } from "@/lib/action-result";
import type { DoskaTodayResult } from "@/lib/doska/today";

/* ⚠️ Bu faylda `export type` YOʻQ — tip `lib/doska/today.ts` da
   (AGENTS.md: "use server" fayldan tip eksporti prodni buzadi). */

const schema = z.object({ today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function doskaTodayAction(input: z.infer<typeof schema>): Promise<ActionResult<DoskaTodayResult>> {
  return runAction(() => doskaToday(schema.parse(input).today));
}
