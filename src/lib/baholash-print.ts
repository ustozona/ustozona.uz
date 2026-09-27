/* ════════════════════════════════════════════════════════════════════
   CHOP ETISH — javob varaqlari va QR-kartalar (PDF).

   Faqat BRAUZERDA chaqiriladi (`window`, `document`). PDF serverdan
   keladi (`/api/baholash/answer-sheets`, `/api/baholash/answer-cards`)
   va yangi oynada ochiladi — oʻqituvchi darhol chop etadi, sahifa
   almashmaydi va tanlangan test yoʻqolmaydi.

   Ikki varaq rejimi ataylab ajratilgan:
     • `class` — sinf roʻyxati: har varaqda ism va QR bor, skaner
       varaqni kimnikiligini oʻzi biladi;
     • `exam`  — ismsiz bitta varaq, koʻpaytirib tarqatiladi; QR faqat
       testni koʻrsatadi, ismni oʻquvchi qoʻlda yozadi.
   QR-karta esa testga emas, SINFGA bogʻlangan: bir marta chop etilib
   yil boʻyi ishlatiladi.
   ════════════════════════════════════════════════════════════════════ */

export type PrintKind = "class" | "exam" | "cards";

export type PrintResult = {
  /** Lugʻatga sigʻmagan oʻquvchilar — ularga karta chiqmadi (faqat `cards`). */
  skippedCards: number;
};

export async function openBaholashPdf(
  kind: PrintKind,
  setId: string,
  classId: string,
): Promise<PrintResult> {
  const cards = kind === "cards";
  const res = await fetch(cards ? "/api/baholash/answer-cards" : "/api/baholash/answer-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cards ? { setId, classId } : { setId, classId, mode: kind }),
  });
  if (!res.ok) {
    const info = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(info?.message ?? `Tayyorlanmadi (${res.status})`);
  }
  /* Lugʻatga sigʻmagan oʻquvchilar sarlavhada keladi (tana — PDF).
     Jimgina tashlab ketib boʻlmaydi: oʻsha bolaning kartasi umuman
     chop etilmagan boʻladi. */
  const skippedCards = cards ? Number(res.headers.get("X-Cards-Skipped") ?? 0) || 0 : 0;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    // Popup bloklandi — oddiy yuklab olishga tushamiz.
    const a = document.createElement("a");
    a.href = url;
    a.download = cards ? "javob-kartalari.pdf" : "javob-varaqlari.pdf";
    a.click();
  }
  // Blob URL'ni darhol boʻshatib boʻlmaydi — yangi oyna hali oʻqiyapti.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { skippedCards };
}
