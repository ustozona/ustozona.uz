"use server";

import { z } from "zod";
import { runAction } from "@/server/action-result";
import { doskaBells } from "@/server/dal/doska-bells";
import type { ActionResult } from "@/lib/action-result";
import type { DoskaBellsResult } from "@/lib/doska/bells";

/* ⚠️ Bu faylda `export type` YOʻQ — tip `lib/doska/bells.ts` da
   (AGENTS.md: "use server" fayldan tip eksporti prodni buzadi). */

const schema = z.object({ today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function doskaBellsAction(input: z.infer<typeof schema>): Promise<ActionResult<DoskaBellsResult>> {
  return runAction(() => doskaBells(schema.parse(input).today));
}
