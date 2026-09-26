"use server";

import { requireTeacher } from "@/server/session";
import { EMAKTAB_MAX_BYTES, parseEmaktabFile } from "@/server/lessonlab/emaktab";
import type { EmaktabParseResult } from "@/lib/ish-reja/emaktab-types";

/* ════════════════════════════════════════════════════════════════════
   ISH REJA IMPORTI — eMaktab faylini LessonLab dvigateli bilan oʻqish.

   Client (`ImportSource`) faylni oʻzi ham oʻqiydi (umumiy parser); bu
   action PARALLEL ishlaydi va fayl eMaktab eksporti boʻlsa aniq
   mavzular roʻyxatini beradi. Natija `unavailable` boʻlsa client hech
   narsani oʻzgartirmaydi.

   ⚠️ Tiplar `@/lib/ish-reja/emaktab-types` da — bu faylda tip EKSPORT
   QILINMAYDI (AGENTS.md: `"use server"` + `export type` prodni buzadi).
   ════════════════════════════════════════════════════════════════════ */

export async function parseEmaktabFileAction(form: FormData): Promise<EmaktabParseResult> {
  await requireTeacher();
  const file = form.get("file");
  if (!(file instanceof File) || !/\.xlsx?$/i.test(file.name) || file.size > EMAKTAB_MAX_BYTES) {
    return { type: "unavailable" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return parseEmaktabFile(bytes, file.name);
}
