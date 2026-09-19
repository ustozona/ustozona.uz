/* ════════════════════════════════════════════════════════════════════
   PPTX → TAHRIRLANADIGAN SLAYDLAR (docs/taqdimot-spec.md, 2-qavat).

   PDF importi sahifani RASM qiladi — koʻrinishi aniq, lekin matnni
   tahrirlab boʻlmaydi. Bu yoʻl esa taqdimot faylidagi slayddan sarlavha, matn
   va asosiy rasmni AJRATIB oladi va ularni bizning maketlarimizdan
   biriga joylaydi. Erkin joylashuv (koordinata, shrift, animatsiya)
   ataylab tashlanadi: maketlar proyektorda har doim toza chiqadi,
   oʻqituvchi esa matnni darhol tuzata oladi.

   Tahlil `pptxtojson` (MIT) bilan brauzerda, fayl serverga bormaydi.
   Kutubxona faqat import bosilganda dinamik yuklanadi.

   Faqat mijozda chaqiriladi.
   ════════════════════════════════════════════════════════════════════ */

import type { SlideLayout } from "./slide-layouts";

export type ImportedSlide = {
  layout: SlideLayout;
  title: string;
  body: string;
  /** JPEG data-URL (siqilgan) — yuklash chaqiruvchi tomonda. */
  imageDataUrl?: string;
};

export type PptxImportResult = {
  slides: ImportedSlide[];
  /** Jadval, diagramma, formula kabi koʻchmagan elementlar bor edi. */
  lossy: boolean;
};

export const MAX_PPTX_SLIDES = 60;
const IMAGE_MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

type Pptx = typeof import("pptxtojson");
type PptxElement = Awaited<ReturnType<Pptx["parse"]>>["slides"][number]["elements"][number];

type TextBox = { text: string; top: number; left: number; name: string };

/** Har slaydda takrorlanadigan xizmat joylari — mazmun emas. Joy egasi
    nomi ofis dasturi tiliga qarab keladi (inglizcha/ruscha). */
const SERVICE_PLACEHOLDER = /slide number|footer|date|номер слайда|нижний колонтитул|^дата/i;
type Picture = { src: string; area: number };

/** Guruh va diagrammalar ichidagi elementlarni tekis roʻyxatga yoyadi. */
function flatten(elements: PptxElement[]): PptxElement[] {
  const out: PptxElement[] = [];
  for (const el of elements) {
    if (el.type === "group") out.push(...flatten(el.elements as PptxElement[]));
    else if (el.type === "diagram") out.push(...(el.elements as PptxElement[]));
    else out.push(el);
  }
  return out;
}

/** HTML matndan qatorlar — har paragraf bitta qator. */
function htmlToLines(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = doc.body.querySelectorAll("p, li");
  const raw = blocks.length
    ? Array.from(blocks, (b) => b.textContent ?? "")
    : (doc.body.textContent ?? "").split(/\r?\n/);
  return raw.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Har qanday rasm manbasini siqilgan JPEG ga oʻgiradi. EMF/WMF kabi
    brauzer chiza olmaydigan formatlar `null` qaytaradi — tashlab ketiladi. */
function toJpeg(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, IMAGE_MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Maket tanlash — mazmun shakliga qarab (R281: maket = joylashuv). */
function pickLayout(isFirst: boolean, lines: string[], hasImage: boolean): SlideLayout {
  if (hasImage) {
    if (lines.length >= 2) return "list";
    if (lines.length === 1) return "classic";
    return "media";
  }
  if (lines.length === 0) return "title";
  if (isFirst && lines.length <= 1) return "title";
  return lines.length >= 2 ? "list" : "text";
}

export async function pptxToSlides(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<PptxImportResult & { totalSlides: number }> {
  const { parse } = await import("pptxtojson");
  const parsed = await parse(await file.arrayBuffer(), {
    imageMode: "base64",
    videoMode: "none",
    audioMode: "none",
  });

  const total = Math.min(parsed.slides.length, MAX_PPTX_SLIDES);
  const slides: ImportedSlide[] = [];
  let lossy = false;

  for (let i = 0; i < total; i++) {
    const elements = flatten(parsed.slides[i].elements);
    const texts: TextBox[] = [];
    const pictures: Picture[] = [];

    for (const el of elements) {
      if ((el.type === "text" || el.type === "shape") && el.content) {
        if (SERVICE_PLACEHOLDER.test(el.name ?? "")) continue;
        const text = htmlToLines(el.content).join("\n");
        if (text) texts.push({ text, top: el.top, left: el.left, name: el.name ?? "" });
      } else if (el.type === "image" && el.base64) {
        pictures.push({ src: el.base64, area: el.width * el.height });
      } else if (el.type === "table" || el.type === "chart" || el.type === "math") {
        lossy = true;
      }
    }

    // Sarlavha: nomida «title» boʻlgan joy egasi, boʻlmasa eng tepadagi matn.
    texts.sort((a, b) => a.top - b.top || a.left - b.left);
    const titleIdx = Math.max(
      0,
      texts.findIndex((t) => /title|заголов|sarlavha/i.test(t.name)),
    );
    const titleBox = texts[titleIdx];
    const title = (titleBox?.text ?? "").replace(/\n+/g, " ").slice(0, 200);
    const lines = texts
      .filter((_, idx) => idx !== titleIdx)
      .flatMap((t) => t.text.split("\n"))
      .filter(Boolean);

    const biggest = pictures.sort((a, b) => b.area - a.area)[0];
    const imageDataUrl = biggest ? (await toJpeg(biggest.src)) ?? undefined : undefined;
    if (pictures.length > 1) lossy = true;

    slides.push({
      layout: pickLayout(i === 0, lines, Boolean(imageDataUrl)),
      title,
      body: lines.join("\n").slice(0, 2000),
      imageDataUrl,
    });
    onProgress?.(i + 1, total);
  }

  return { slides, lossy, totalSlides: parsed.slides.length };
}
