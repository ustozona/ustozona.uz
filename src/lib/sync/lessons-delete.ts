import { toast } from "sonner";
import { deleteLessonsAction } from "@/server/actions/lessons";
import { flushLessonsNow } from "@/components/sync/LessonsServerSync";

/* ════════════════════════════════════════════════════════════════════
   OʻCHIRISHNI SERVERDA MUHRLASH — barcha oʻchirish yoʻllarining
   yagona darvozasi.

   Tartib MUHIM:
   1. `flushLessonsNow()` — kutilayotgan tahrirlar avval yetib borsin.
      Aks holda oʻchirishdan KEYIN kelgan eski upsert qatorni qayta
      tiklab qoʻyishi mumkin edi.
   2. Buyruq yuboriladi va javob KUTILADI.
   3. Faqat tasdiqdan keyin chaqiruvchi store'ni oʻzgartiradi.

   Shu sabab funksiya `false` qaytarsa chaqiruvchi HECH NARSA
   oʻchirmasligi kerak — foydalanuvchi «oʻchdi» deb oʻylab qolmasin.

   «Bekor qilish» uchun alohida buyruq kerak emas: store'ga qaytarilgan
   yozuv oddiy tahrir sifatida upsert boʻlib ketadi (idempotent).
   ════════════════════════════════════════════════════════════════════ */

/** Xato matni — `LessonsServerSync` tarjimadan toʻldiradi (bu modul hook ishlatolmaydi). */
let errorMessage = "Oʻchirish serverda bajarilmadi";
export function setLessonsDeleteErrorMessage(msg: string) {
  errorMessage = msg;
}

export async function commitLessonsDelete(cmd: {
  unitIds?: string[];
  lessonIds?: string[];
}): Promise<boolean> {
  const unitIds = cmd.unitIds ?? [];
  const lessonIds = cmd.lessonIds ?? [];
  if (!unitIds.length && !lessonIds.length) return true;

  try {
    await flushLessonsNow();
    await deleteLessonsAction({ unitIds, lessonIds });
    return true;
  } catch (err) {
    console.error("[lessons] oʻchirish buyrugʻi bajarilmadi:", err);
    toast.error(errorMessage);
    return false;
  }
}
