import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { buildAnswerCardsPdf } from "@/lib/cards/card-pdf";
import { UnauthorizedError } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   POST /api/baholash/answer-cards   body: { classId }

   QR-KARTALAR (Plickers naqshi) — telefonsiz sinf uchun.

   Har oʻquvchiga bitta karta beriladi. Karta toʻrt tomonlama: bola
   uni burab koʻtaradi, yuqoriga qaragan tomon javobni bildiradi.
   Oʻqituvchi butun sinfni BITTA suratga oladi.

   Nega bu javob varagʻidan boshqa narsa: varaq — bitta testga bitta
   qogʻoz, karta esa bir marta chop etilib yil boʻyi ishlatiladi.
   Shuning uchun u testga emas, SINFGA bogʻlangan va `setId`
   soʻralmaydi.

   KARTANI OʻZIMIZ CHIZAMIZ, dvigatelga bormaymiz. Sabab: kartani
   OʻQISH uchun «qaysi burilish qaysi javob» va «belgi ichida nima»
   degan kelishuv kerak. Begona chizuvchining kelishuvini bilmasdan
   oʻqib boʻlmaydi, bilgan taqdirda ham u har yangilanishda oʻzgarib
   ketishi mumkin. Karta bir marta chop etilib yillab ishlatiladi —
   bunday narsa oʻz qoʻlimizda boʻlishi kerak.

   Belgi dizayni: `src/lib/cards/marker.ts` (ArUco maktabi, QR emas —
   sinf orqasidan QR oʻqilmaydi).
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { classId?: unknown; setId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const classId = typeof body.classId === "string" ? body.classId : "";
  const setId = typeof body.setId === "string" ? body.setId : "";
  if (!classId || !setId) {
    return Response.json({ ok: false, error: "set_and_class_required" }, { status: 400 });
  }

  try {
    // Egalik tekshiruvi va sinf roʻyxati — varaq bilan bir xil yoʻl.
    const plan = await buildSheetPlan(setId, classId);
    if (plan.roster.length === 0) {
      return Response.json(
        { ok: false, error: "empty_class", message: "Sinfda oʻquvchi yoʻq" },
        { status: 400 }
      );
    }

    const pdf = await buildAnswerCardsPdf({
      students: plan.roster.map(({ no, name }) => ({ no, name })),
      className: plan.className,
    });

    return new Response(pdf.bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        // Kartalarda oʻquvchi ismlari bor — keshda qolmasin.
        "Cache-Control": "no-store",
        /* Lugʻatga sigʻmagan oʻquvchilar — sarlavhada, chunki javob
           tanasi PDF. Panel buni oʻqib oʻqituvchiga koʻrsatadi:
           jimgina tashlab ketish mumkin emas, oʻsha bolaning kartasi
           umuman chop etilmagan boʻladi. */
        "X-Cards-Skipped": String(pdf.skipped.length),
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Kartalar tayyorlanmadi";
    return Response.json({ ok: false, error: "failed", message }, { status: 400 });
  }
}
