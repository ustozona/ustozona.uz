/** Tiptap'ga bevosita base64 sifatida joylanadigan rasmlarni siqadi (max kenglik +
 *  JPEG sifat), lessons.data JSONB qatorini shishirmasligi uchun. Upload-pipeline
 *  (Vercel Blob) oʻrniga vaqtinchalik yechim — hajmni cheklaydi, yoʻqotmaydi. */
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.8;

/** iPhone suratlari HEIC/HEIF formatida keladi. Desktop Chrome/Firefox uni
 *  `<img>` orqali dekod qila olmaydi — natijada siqish bosqichi «image decode
 *  failed» bilan yiqilar va foydalanuvchi rasmni yuklab boʻlmasdi (skrinshot
 *  esa PNG/JPEG boʻlgani uchun ishlardi). Shu sababli HEIC/HEIF aniqlansa,
 *  avval JPEG'ga aylantiramiz. `heic2any` libheif WASM'ni oʻz ichiga oladi
 *  (~200 KB) — shuning uchun FAQAT HEIC fayl tanlanganda dinamik yuklanadi. */
function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  // Brauzer MIME bermasligi (`""`) yoki `application/octet-stream` deb
  // belgilashi mumkin — bunday holatda fayl kengaytmasiga tayanamiz.
  const noUsefulType = type === "" || type === "application/octet-stream";
  return noUsefulType && /\.(heic|heif)$/i.test(file.name);
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  return Array.isArray(out) ? out[0] : out;
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const start = isHeic(file)
      ? heicToJpegBlob(file).catch(() => {
          throw new Error(
            "iPhone rasmini oʻqib boʻlmadi. Telefon sozlamalarida " +
              "«Kamera → Formatlar → Eng mos» ni tanlang yoki skrinshot qilib yuklang."
          );
        })
      : Promise.resolve<Blob>(file);

    start.then((blob) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new window.Image();
        img.onerror = () => reject(new Error("image decode failed"));
        img.onload = () => {
          const scale = Math.min(1, MAX_WIDTH / img.width);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    }, reject);
  });
}
