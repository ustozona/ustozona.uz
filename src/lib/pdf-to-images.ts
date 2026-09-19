/* ════════════════════════════════════════════════════════════════════
   PDF → SLAYD RASMLARI (docs/taqdimot-spec.md, 2-qavat: import).

   Oʻqituvchining tayyor taqdimoti (istalgan ofis dasturidan)
   PDF sifatida yuklanadi va har sahifa bitta rasmga aylanadi. Hammasi
   BRAUZERDA: fayl serverga bormaydi, faqat tayyor rasmlar mavjud
   `uploadEditorImageAction` orqali saqlagichga chiqadi.

   pdf.js katta (~1 MB) — shuning uchun faqat import bosilganda dinamik
   yuklanadi, muharrirning boshlangʻich paketiga kirmaydi. Worker
   `new Worker(new URL(...))` naqshi bilan ulanadi (bundler uni alohida
   faylga ajratadi).

   Faqat mijozda chaqiriladi.
   ════════════════════════════════════════════════════════════════════ */

/** Slayd rasmi eni — 1600px proyektorda aniq, siqilgan JPEG ~150–350 KB. */
const TARGET_WIDTH = 1600;
/** Tik sahifa (A4) haddan tashqari baland chiqmasin. */
const MAX_HEIGHT = 1600;
const JPEG_QUALITY = 0.82;
export const MAX_PDF_PAGES = 60;

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerPort) {
        pdfjs.GlobalWorkerOptions.workerPort = new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
          { type: "module" },
        );
      }
      return pdfjs;
    });
    // Yuklash muvaffaqiyatsiz boʻlsa keyingi urinish qaytadan boshlasin.
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

export type PdfPagesResult = {
  /** JPEG data-URL'lar, sahifa tartibida. */
  images: string[];
  /** PDF dagi jami sahifa — `MAX_PDF_PAGES` dan oshsa qolgani kesiladi. */
  totalPages: number;
};

export async function pdfToImages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfPagesResult> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  try {
    const total = Math.min(doc.numPages, MAX_PDF_PAGES);
    const images: string[] = [];
    for (let n = 1; n <= total; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(TARGET_WIDTH / base.width, MAX_HEIGHT / base.height);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas yaratib boʻlmadi");
      // Shaffof PDF sahifasi JPEG da qora boʻlib chiqmasin.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      page.cleanup();
      onProgress?.(n, total);
    }
    return { images, totalPages: doc.numPages };
  } finally {
    // Umumiy `workerPort` bu yerda yopilmaydi — pdf.js uni oʻzi yaratmagan.
    void task.destroy();
  }
}
