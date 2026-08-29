"use server";

import { requireTeacher } from "@/server/session";
import { EDITOR_IMAGE_BUCKET, MAX_EDITOR_IMAGE_BYTES } from "@/lib/upload-config";

/* ════════════════════════════════════════════════════════════════════
   MUHARRIR RASMLARI — Supabase Storage'ga yuklash

   ⛔ NEGA KERAK BOʻLDI
   Ilgari rasm Tiptap hujjatiga toʻgʻridan-toʻgʻri `data:image/jpeg;base64,…`
   sifatida joylanardi. 1280px/q0.8 siqilgan surat ≈ 150–400 KB, base64'da
   esa ≈ 200 000–530 000 belgi. Blogda `savePostAction` `content` uchun
   `z.string().max(200_000)` talab qilardi — yaʼni deyarli HAR QANDAY foto
   limitdan oshib, zod xato tashlardi va foydalanuvchi «Saqlashda xatolik»
   toast'ini koʻrardi. Matnli maqola esa bemalol saqlanardi, shuning uchun
   xato faqat rasm qoʻshganda chiqardi.

   Base64 limitni koʻtarish bilan ham tuzalmaydi: maqola HTML'i megabaytga
   chiqadi, ochiq `/blog` sahifasi shuncha baytni har oʻqishda uzatadi.
   Shu sababli rasm endi obyekt saqlagichga chiqadi, hujjatda esa faqat
   qisqa URL qoladi.

   ✅ FALLBACK — MAJBURIY
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` sozlanmagan boʻlsa (lokal
   muhit, yoki hali kalit qoʻyilmagan prod) amal XATO BERMAYDI — kelgan
   data-URL'ni oʻzini qaytaradi, yaʼni eski base64 xulqiga qaytadi.
   Shuning uchun `savePostSchema.content` limiti ham kengaytirilgan holda
   qoladi: saqlagichsiz ham ishlashi kerak.

   Kutubxona qoʻshilmadi — Supabase Storage REST API oddiy `fetch` bilan
   ishlaydi (`@supabase/supabase-js` faqat shu uchun 100 KB dep boʻlardi).
   ════════════════════════════════════════════════════════════════════ */

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp|gif|avif));base64,([A-Za-z0-9+/]+={0,2})$/;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Base64 data-URL'ni Supabase Storage'ga yuklab, ommaviy URL qaytaradi.
 * Saqlagich sozlanmagan yoki yuklash muvaffaqiyatsiz boʻlsa — kelgan
 * data-URL'ni oʻzini qaytaradi (muharrir hech qachon qulab tushmaydi).
 *
 * `stored` — natija HAQIQATAN saqlagichda ekanini bildiradi. Chaqiruvchi
 * buni bilishi SHART: hujjat ichidagi rasm base64 boʻlib qolsa ham
 * yashaydi, lekin MUQOVA rasmi `/blog` roʻyxatida har bir post uchun
 * yuklanadi — u yerda base64 qabul qilinmaydi (BlogEditor.onPickCover).
 */
export async function uploadEditorImageAction(
  dataUrl: string
): Promise<{ url: string; stored: boolean }> {
  const teacher = await requireTeacher();

  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) return { url: dataUrl, stored: false }; // allaqachon URL yoki notanish format

  /* ⚠️ Tartib MUHIM: saqlagich sozlanmaganini AVVAL tekshiramiz. Hajm
     chegarasi faqat bucket'ni himoya qiladi — saqlagich umuman ishlatilmasa
     uni tekshirib xato tashlash yuqoridagi "hech qachon qulab tushmaydi"
     vaʼdasini buzardi (katta rasm base64 fallback'ga ham tushmasdi). */
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return { url: dataUrl, stored: false };

  const [, mime, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength > MAX_EDITOR_IMAGE_BYTES) {
    throw new Error("Rasm hajmi juda katta");
  }

  const path = `${teacher.id}/${crypto.randomUUID()}.${EXT_BY_MIME[mime]}`;

  try {
    const res = await fetch(`${baseUrl}/storage/v1/object/${EDITOR_IMAGE_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": mime,
        // Fayl nomi UUID — mazmuni hech qachon oʻzgarmaydi, shuning uchun
        // abadiy keshlanadi (Supabase egress kvotasini tejaydi).
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) {
      console.error("[uploads] Supabase Storage rad etdi:", res.status, await res.text());
      return { url: dataUrl, stored: false };
    }
  } catch (err) {
    console.error("[uploads] Supabase Storage'ga ulanib boʻlmadi:", err);
    return { url: dataUrl, stored: false };
  }

  return {
    url: `${baseUrl}/storage/v1/object/public/${EDITOR_IMAGE_BUCKET}/${path}`,
    stored: true,
  };
}
