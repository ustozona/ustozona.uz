"use server";

import { runAction } from "@/server/action-result";
import { doskaCalendar } from "@/server/dal/doska-calendar";
import type { ActionResult } from "@/lib/action-result";
import type { DoskaCalendarResult } from "@/lib/doska/countdown";

/* ⚠️ Bu faylda `export type` YOʻQ — tip `lib/doska/countdown.ts` da
   (AGENTS.md: "use server" fayldan tip eksporti prodni buzadi). */

export async function doskaCalendarAction(): Promise<ActionResult<DoskaCalendarResult>> {
  return runAction(() => doskaCalendar());
}
