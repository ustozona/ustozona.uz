"use client";

/* ════════════════════════════════════════════════════════════════════
   EKRANNI RASM QILIB SAQLASH (docs/doska-qolyozma-tadqiqot.md §9).

   Dars oxirida doskadagi yozuv — oʻquvchilar koʻchirib ulgurmagan
   yechim, sxema — PNG boʻlib qurilmaga tushadi: keyin chatga tashlanadi
   yoki keyingi darsda ochiladi.

   Kanvas ildizi (`data-doska-canvas`) butunligicha olinadi: fon,
   vidjetlar va quruq siyoh qatlami — sinf koʻrgan narsa. Boshqaruv
   izlari esa (`data-doska-no-export`): tanlov ramkasi, hoʻl qatlam
   (oʻchirgʻich doirasi, lazer), chizgʻich va transportir — chiqmaydi.

   DOM rasmga kutubxona bilan oʻgiriladi (SVG `foreignObject` orqali,
   shriftlar ichiga joylanadi). U faqat bosilganda yuklanadi — doskani
   ochish tezligiga taʼsir qilmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Qurilma piksel zichligi shundan oshmaydi — 4K doskada fayl 30 MB boʻlib ketmasin. */
const MAX_SCALE = 2;

/** Fayl nomida taqiqlangan belgilar (Windows ham, macOS ham). */
const UNSAFE_NAME = /[\\/:*?"<>|\u0000-\u001f]+/g;

export function exportFileName(deckTitle: string, screenNumber: number): string {
  const title = deckTitle.replace(UNSAFE_NAME, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Doska";
  return `${title} — ${screenNumber}.png`;
}

/**
 * Joriy ekranni PNG qilib yuklab beradi. Kanvas topilmasa yoki
 * brauzer rasmni chiza olmasa — xato otiladi, chaqiruvchi koʻrsatadi.
 */
export async function downloadScreenPng(fileName: string): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-doska-canvas]");
  if (!root) throw new Error("Doska canvas not found");

  const { domToBlob } = await import("modern-screenshot");
  const blob = await domToBlob(root, {
    type: "image/png",
    scale: Math.min(window.devicePixelRatio || 1, MAX_SCALE),
    filter: (node) => !(node instanceof Element && node.hasAttribute("data-doska-no-export")),
  });

  // ⚠️ `data:` URL EMAS: katta doska rasmi 5–15 MB, brauzer bunday
  // `data:` havolani yuklashni rad etadi yoki kesib qoʻyadi. Blob
  // havolasida chegara yoʻq.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Yuklash boshlanishiga ulgursin — darhol bekor qilinsa baʼzi brauzer faylni olmaydi.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
