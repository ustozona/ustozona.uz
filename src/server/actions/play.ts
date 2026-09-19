"use server";

import { z } from "zod";
import { getLiveState } from "@/server/dal/play/live";
import type { LiveState } from "@/lib/live-session";
import { joinByCode, listRosterByCode, type JoinResult } from "@/server/dal/play/join";
import { getSessionContent, type PlaySessionContent } from "@/server/dal/play/content";
import { submitResponse, type SubmitResponseInput } from "@/server/dal/play/responses";
import { gameShellUrl } from "@/server/lessonlab/baholash";
import { runAction } from "@/server/action-result";
import type { ActionResult } from "@/lib/action-result";

/* Ishtirokchi (akkauntsiz) tomon — yupqa qatlam: zod-parse → DAL.
   `requireTeacher()` HECH QACHON bu faylda ishlatilmaydi.

   Oʻquvchi koʻradigan rad etishlar («Topshiriq muddati tugagan», «Javob
   allaqachon yuborilgan») `runAction` orqali JAVOB boʻlib qaytadi, xato
   boʻlib otilmaydi: prodda Next otilgan xato matnini yashiradi va oʻquvchi
   inglizcha umumiy xabar koʻrardi (src/lib/action-result.ts). Mijoz
   `unwrap()` bilan ochadi — xato endi mijozda otiladi va matni saqlanadi. */

const joinSchema = z.object({
  joinCode: z.string().min(4).max(10),
  studentId: z.string().min(1).nullable(),
  displayName: z.string().min(1).max(100),
});

export async function joinSessionAction(
  input: z.infer<typeof joinSchema>,
): Promise<ActionResult<JoinResult>> {
  return runAction(async () => {
    const parsed = joinSchema.parse(input);
    return joinByCode(parsed.joinCode, parsed.studentId, parsed.displayName);
  });
}

/** `data: null` — bunday kod yoʻq; `data: []` — kod bor, sinf roʻyxati boʻsh. */
export async function listRosterByCodeAction(
  joinCode: string,
): Promise<ActionResult<{ id: string; name: string }[] | null>> {
  return runAction(() => listRosterByCode(joinCode));
}

export async function getSessionContentAction(token: string): Promise<PlaySessionContent> {
  return getSessionContent(token);
}

const submitSchema = z.object({
  token: z.string().min(1),
  itemId: z.string().min(1),
  answer: z.record(z.string(), z.unknown()),
  elapsedMs: z.number().optional(),
});

export async function submitResponseAction(
  input: z.infer<typeof submitSchema>
): Promise<ActionResult<{ isCorrect: boolean | null; correctOptionIds?: string[] }>> {
  return runAction(async () => {
    const parsed = submitSchema.parse(input) as SubmitResponseInput;
    const { row, correctOptionIds } = await submitResponse(parsed);
    return { isCorrect: row?.isCorrect ?? null, correctOptionIds };
  });
}

/** Oʻyin qobigʻining toʻliq havolasi — qobiq boshqa domenda turadi,
    uning manzili faqat serverda (env) maʼlum.

    `null` qaytsa — qobiq sozlanmagan yoki notoʻgʻri nom berilgan;
    chaqiruvchi oddiy ekranda davom etadi. Sessiya baribir ishlaydi:
    oʻyin — qobiq, majburiy emas. */
export async function gameShellUrlAction(input: {
  shellId: string;
  token: string;
  origin: string;
}): Promise<string | null> {
  const parsed = z
    .object({
      shellId: z.string().min(1).max(50),
      token: z.string().min(1),
      origin: z.string().url(),
    })
    .parse(input);
  return gameShellUrl(parsed);
}

/** Jonli sessiya: oʻquvchi qurilmasi joriy qadamni soʻraydi (R284). */
export async function getLiveStateAction(token: string): Promise<LiveState> {
  return getLiveState(z.string().min(1).parse(token));
}
