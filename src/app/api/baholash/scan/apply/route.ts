import { z } from "zod";
import { applyOmrScan } from "@/server/dal/baholash-scan";
import { UnauthorizedError } from "@/server/session";
import { verifyScanTicket } from "@/server/baholash/scan-ticket";

/* ════════════════════════════════════════════════════════════════════
   POST /api/baholash/scan/apply

   Tasdiqlangan varaqlarni yozadi. Server action EMAS, chunki bu
   endpoint TELEFONDAN ham chaqiriladi va u yerda cookie sessiyasi
   yoʻq — kimlik imzolangan chiptadan keladi. Ikkita yoʻl uchun ikkita
   kirish nuqtasi qurish esa mantiqni ikkiga boʻlardi.

   Chipta boʻlsa test/sinf undan olinadi, tanadan EMAS: aks holda
   chipta bitta testga berilib, boshqasiga ishlatilardi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

const schema = z.object({
  ticket: z.string().optional(),
  setId: z.string().optional(),
  classId: z.string().optional(),
  sheets: z
    .array(
      z.object({
        studentId: z.string().min(1),
        answers: z.record(z.string(), z.string().nullable()),
      })
    )
    .min(1)
    .max(60),
});

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const ticket = body.ticket ? verifyScanTicket(body.ticket) : null;
  if (body.ticket && !ticket) {
    return Response.json(
      { ok: false, error: "bad_ticket", message: "Havola eskirgan — QR ni qaytadan oching" },
      { status: 401 }
    );
  }

  const setId = ticket?.setId ?? body.setId ?? "";
  const classId = ticket?.classId ?? body.classId ?? "";
  if (!setId || !classId) {
    return Response.json({ ok: false, error: "set_and_class_required" }, { status: 400 });
  }

  try {
    const report = await applyOmrScan({
      setId,
      classId,
      sheets: body.sheets,
      actorId: ticket?.teacherId,
    });
    return Response.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Kiritilmadi";
    return Response.json({ ok: false, error: "failed", message }, { status: 400 });
  }
}
