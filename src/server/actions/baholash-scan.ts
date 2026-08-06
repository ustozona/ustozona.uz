"use server";

import { z } from "zod";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireTeacher } from "@/server/session";
import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { signScanTicket } from "@/server/baholash/scan-ticket";

/* ════════════════════════════════════════════════════════════════════
   NOUTBUKDAN TELEFONGA OʻTISH — bitta harakat

   Oʻqituvchi Ustozonani noutbukda ochadi, varaqni esa telefon kamerasi
   bilan suratga oladi. Oradagi «havolani telefonga yuboring» qadami —
   oqimning eng zaif joyi: hech kim oʻziga oʻzi havola yuborishni
   yoqtirmaydi.

   Shuning uchun ekranda QR chiqadi: oʻqituvchi telefon kamerasini OʻZ
   EKRANIGA tutadi va sahifa telefonda ochiladi. Hech narsa
   yuborilmaydi, telefonda tizimga kirish ham shart emas — kimlik
   chiptada.
   ════════════════════════════════════════════════════════════════════ */

const schema = z.object({
  setId: z.string().min(1),
  classId: z.string().min(1),
});

export type ScanHandoff = {
  /** Telefonda ochiladigan manzil. */
  url: string;
  /** Oʻsha manzilning QR koʻrinishi (inline SVG). */
  qrSvg: string;
  /** Chipta qachongacha amal qiladi (ISO). */
  expiresAt: string;
};

export async function createScanHandoffAction(
  input: z.infer<typeof schema>
): Promise<ScanHandoff> {
  const parsed = schema.parse(input);
  const teacher = await requireTeacher();
  // Egalik tekshiruvi — chipta berishdan OLDIN. Chipta imzolangandan
  // keyin uni bekor qilib boʻlmaydi, shuning uchun test va sinf
  // haqiqatan shu oʻqituvchiniki ekani shu yerda tasdiqlanadi.
  await buildSheetPlan(parsed.setId, parsed.classId, teacher.id);

  const ticket = signScanTicket({
    teacherId: teacher.id,
    setId: parsed.setId,
    classId: parsed.classId,
  });

  /* Manzil soʻrov sarlavhasidan olinadi, muhit oʻzgaruvchisidan emas:
     preview deploy, maxsus domen va localhost — uchalasi ham ishlashi
     kerak, aks holda QR notoʻgʻri domenga olib borardi. */
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/baholash/skaner/${ticket}`;

  /* NEGA BU YERDA TELEGRAM TUGMASI YOʻQ

     Telegram `?start=` parametri 64 belgi bilan cheklangan va faqat
     `A-Za-z0-9_-` ni qabul qiladi. Chiptamizda uchta UUID + muddat +
     imzo bor — eng ixcham koʻrinishda ham 80+ belgi. Yaʼni chiptani
     botga havola orqali BERIB BOʻLMAYDI.

     Demak bot yoʻli qisqa kod talab qiladi (kod → chipta jadvali) va
     bot tomonida `/start <kod>` ishlovi — u LessonLab loyihasida, bu
     repoda emas. Ikki tomonlama ish tugaguncha tugma qoʻyish
     «bosdim, hech narsa boʻlmadi» degan eng yomon holatni berardi.

     Toʻliq shartnoma: docs/baholash-integratsiya.md §8-ter. */

  return {
    url,
    qrSvg: await QRCode.toString(url, {
      type: "svg",
      margin: 1,
      /* Xato tuzatish darajasi ATAYLAB eng past.

         QR ekrandan oʻqiladi — kontrast mukammal, qogʻozdagidek
         yirtilish yoki dogʻ yoʻq. Yuqori daraja bu yerda faqat
         modullarni maydalashtiradi va eski/xira kamerali telefonga
         zarar qiladi. `M` da 51, `L` da 47 modul. */
      errorCorrectionLevel: "L",
    }),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
}
