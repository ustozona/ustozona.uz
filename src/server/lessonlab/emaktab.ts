import "server-only";
import { isConfigured, lessonlab, LessonLabError } from "./client";
import type { EmaktabLessonPlan, EmaktabParseResult } from "@/lib/ish-reja/emaktab-types";

/* ════════════════════════════════════════════════════════════════════
   eMAKTAB PARSERI — LessonLab dvigateli (yagona kod)

   eMaktab eksport fayllarini (ish reja, dars jadvali, jurnal) oʻqiydigan
   kod BITTA — LessonLab'da (`services/emaktab_parser.py`). LessonLab
   Planner, bot va endi Ustozona ish reja importi ham shuni ishlatadi:
   ikki tilda ikki nusxa yozilsa, ular vaqt oʻtib ajralib ketardi.

   Dvigatel HOLATSIZ: fayl oʻqiladi va JSON qaytadi, LessonLab hech
   narsa saqlamaydi (`POST /api/v1/engine/emaktab-parse`).

   Bu faqat BOYITISH. Har qanday xatoda `unavailable` qaytadi va
   Ustozonaning oʻz umumiy parseri odatdagidek ishlayveradi — import
   hech qachon shu sababli toʻxtamaydi.
   ════════════════════════════════════════════════════════════════════ */

const XLS = "application/vnd.ms-excel";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const EMAKTAB_MAX_BYTES = 5 * 1024 * 1024;

type EngineResponse = { type?: string; data?: unknown };

function isLessonPlan(v: unknown): v is EmaktabLessonPlan {
  const d = v as EmaktabLessonPlan | null;
  return !!d && Array.isArray(d.lessons);
}

export async function parseEmaktabFile(
  bytes: Uint8Array,
  fileName: string
): Promise<EmaktabParseResult> {
  if (!isConfigured() || bytes.byteLength === 0 || bytes.byteLength > EMAKTAB_MAX_BYTES) {
    return { type: "unavailable" };
  }
  const contentType = /\.xls$/i.test(fileName) ? XLS : XLSX;
  try {
    const res = await lessonlab<EngineResponse>({
      method: "POST",
      path: "/api/v1/engine/emaktab-parse",
      binary: { bytes, contentType },
      timeoutMs: 15_000,
    });
    if (res?.type === "lesson_plan" && isLessonPlan(res.data)) {
      const lessons = res.data.lessons
        .map((l) => ({ ...l, topic: String(l.topic ?? "").trim() }))
        .filter((l) => l.topic);
      return { type: "lesson_plan", data: { ...res.data, lessons } };
    }
    if (res?.type === "schedule" || res?.type === "journal") return { type: res.type };
    return { type: "unknown" };
  } catch (err) {
    // Xato matni sir emas (LessonLab xato oʻrami), lekin fayl mazmuni
    // logga chiqarilmaydi — faqat kod.
    const code = err instanceof LessonLabError ? err.code : "error";
    console.warn(`[emaktab-parse] LessonLab: ${code}`);
    return { type: "unavailable" };
  }
}
