/** Tiptap'ga bevosita base64 sifatida joylanadigan rasmlarni siqadi (max kenglik +
 *  JPEG sifat), lessons.data JSONB qatorini shishirmasligi uchun. Upload-pipeline
 *  (Vercel Blob) oʻrniga vaqtinchalik yechim — hajmni cheklaydi, yoʻqotmaydi. */
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.8;

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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
    reader.readAsDataURL(file);
  });
}
