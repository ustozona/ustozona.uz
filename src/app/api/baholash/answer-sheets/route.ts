import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { answerSheetPdf, isConfigured, LessonLabError } from "@/server/lessonlab/baholash";
import { UnauthorizedError } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   POST /api/baholash/answer-sheets   body: { setId, mode? }

   Qogʻoz test uchun OMR javob varaqlari (PDF). Chizishni LessonLab
   dvigateli bajaradi, lekin varaqda NIMA yozilishini biz beramiz —
   test nomi, sinf, oʻquvchi ismlari.

   NEGA SERVER ACTION EMAS: javob — binar PDF. Server action uni
   qaytara olmaydi (serializatsiya JSON), shuning uchun oddiy route
   handler. Brauzer faylni toʻgʻridan-toʻgʻri yuklab oladi.

   NEGA GET EMAS: soʻrov LessonLab tomonida haqiqiy ish qildiradi
   (PDF chizish — sekin va qimmat). GET boʻlsa uni brauzer, proksi yoki
   havolani oldindan yuklaydigan har qanday narsa oʻzi chaqirib
   yuborardi.

   Maʼlumot chegarasi buzilmaydi: LessonLab'ga oʻquvchi ismi varaqqa
   BOSISH uchun ketadi, saqlash uchun emas — dvigatel endpointlari
   hech narsa yozmaydi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json(
      { ok: false, error: "not_configured", message: "LessonLab dvigateli sozlanmagan" },
      { status: 503 }
    );
  }

  let body: { setId?: unknown; classId?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const setId = typeof body.setId === "string" ? body.setId : "";
  const classId = typeof body.classId === "string" ? body.classId : "";
  if (!setId || !classId) {
    return Response.json({ ok: false, error: "set_and_class_required" }, { status: 400 });
  }
  // Imtihon rejimi — ismsiz bitta varaq, oʻquvchi oʻzi toʻldiradi.
  // Sinf roʻyxati sir boʻlgan yoki oʻrindiqlar aralashgan holat uchun.
  const examMode = body.mode === "exam";

  try {
    const plan = await buildSheetPlan(setId, classId);
    if (plan.questionCount < 1) {
      return Response.json(
        { ok: false, error: "empty_test", message: "Testda savol yoʻq" },
        { status: 400 }
      );
    }
    if (!examMode && plan.roster.length === 0) {
      return Response.json(
        { ok: false, error: "empty_class", message: "Sinfda oʻquvchi yoʻq" },
        { status: 400 }
      );
    }

    const pdf = await answerSheetPdf({
      testRef: plan.testRef,
      classRef: examMode ? 0 : plan.classRef,
      questionCount: plan.questionCount,
      title: plan.title,
      className: plan.className,
      students: examMode ? [] : plan.roster.map(({ no, name }) => ({ no, name })),
    });

    return new Response(pdf.bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        // Varaqda oʻquvchi ismlari bor — keshda qolmasin.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof LessonLabError) {
      // Dvigatel xatosini oʻz holicha oʻtkazamiz — «503 sozlanmagan»
      // bilan «422 rasm buzuq» ni farqlash oʻqituvchiga kerak.
      return Response.json(
        { ok: false, error: err.code, message: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Varaq tayyorlanmadi";
    return Response.json({ ok: false, error: "failed", message }, { status: 400 });
  }
}
