import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { answerCardsPdf, isConfigured, LessonLabError } from "@/server/lessonlab/baholash";
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

   ⚠️ HOZIRCHA FAQAT CHOP ETISH. Kartani OʻQIYDIGAN skaner yoʻq:
   kartaning qaysi burilishi qaysi javobni bildirishi LessonLab
   tomonidagi kelishuv va u bizga hujjatlashtirilgan holda berilmagan.
   Shu sababli panelda ham buni ochiq yozamiz — «tayyor» deb
   koʻrsatib, keyin oʻqiy olmaslik eng yomon holat boʻlardi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json(
      { ok: false, error: "not_configured", message: "LessonLab dvigateli sozlanmagan" },
      { status: 503 }
    );
  }

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

    const pdf = await answerCardsPdf({
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
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof LessonLabError) {
      return Response.json(
        { ok: false, error: err.code, message: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Kartalar tayyorlanmadi";
    return Response.json({ ok: false, error: "failed", message }, { status: 400 });
  }
}
