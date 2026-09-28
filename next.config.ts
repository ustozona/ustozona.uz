import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { SERVER_ACTION_BODY_LIMIT } from "./src/lib/upload-config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/* ════════════════════════════════════════════════════════════════════
   SERVER ACTION CSRF — apex ↔ www MOSLIGI

   ⛔ MUAMMO (2026-08-08 da prodda ushlangan)
   Next.js har Server Action so'rovida `Origin` ni `Host` bilan
   solishtiradi (CSRF himoyasi). Mos kelmasa amal RAD ETILADI.

   Bizda apex `ustozona.uz` → `www.ustozona.uz` ga 308 bilan
   yo'naltiriladi. 308 metod va tanani saqlaydi, ya'ni brauzer POST'ni
   `www` ga qayta yuboradi — lekin `Origin` sarlavhasi APEX bo'lib
   qoladi. Natijada:

       Origin: https://ustozona.uz   ≠   Host: www.ustozona.uz
       → BARCHA Server Action'lar yiqiladi

   Alomatlari ATAYLAB chalg'ituvchi edi:
     · sahifalar normal ochiladi (GET tekshiruvdan o'tmaydi)
     · sessiya ham ishlaydi — profil email'i to'g'ri ko'rinadi
     · lekin HECH NARSA saqlanmaydi: «Dars jadvali serverga
       saqlanmadi», «O'quv yili kalendari…», «Sozlamalar…»
     · qaytadan kirish YORDAM BERMAYDI (cookie aybdor emas)

   Shu sababli muammo auth yoki bazada deb izlangan edi. Aslida ikkalasi
   ham sog'lom: `/api/health` → `db: connected`, sessiyalar amal qiladi,
   RLS `FORCE` emas, ulanishlar 16/60.

   YECHIM: ikkala domenni ham ochiq ro'yxatga olamiz. `auth.ts` dagi
   `trustedOrigins` allaqachon shunday qilgan — bu uning Server Action
   qatlamidagi juftligi. Ikkalasi bir joyda turishi kerak: biri
   o'zgarsa ikkinchisi ham.

   ⚠️ `*.vercel.app` ATAYLAB QO'SHILMADI. Preview deploy o'z hostida
   ishlaydi va origin u yerda tabiiy mos keladi, ya'ni kerak emas. Uni
   qo'shish esa istalgan vercel.app sahifasiga bizning amallarni
   chaqirish yo'lini ochib, CSRF himoyasini bekorga kengaytirardi.
   ════════════════════════════════════════════════════════════════════ */

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["ustozona.uz", "www.ustozona.uz"],
      /* Standart chegara 1 MB — muharrirga rasm qoʻyilganda unga urilardi
         (`server/actions/uploads.ts` dagi izohga qarang).

         ⚠️ Bu chegara BARCHA Server Action'ga tegadi, shuning uchun u
         "yetarlicha katta" emas, HISOBLANGAN boʻlishi kerak: qiymat
         `src/lib/upload-config.ts` da rasm chegarasi + base64 shishishidan
         keltirib chiqariladi. Qoʻlda kattaroq son yozilsa, bitta muharrir
         yoʻli uchun butun ilovaning qabul qiladigan tanasi kengayadi. */
      bodySizeLimit: SERVER_ACTION_BODY_LIMIT,
    },
    /* ⛔ Turbopack build keshi (`.next/cache/turbopack`) — Next 16.3 dan
       beri standart yoqilgan — O'CHIRILGAN (2026-09-28).

       Kesh `globals.css` o'zgarishini ilg'amadi va ESKI CSS'ni chiqardi:
       prodga yangi selektor yetib bormadi (sinf tanlagichidagi glif
       rangsiz chiqdi), build esa xatosiz o'tdi. Lokal build ham xuddi shu
       eski CSS'ni berdi va faqat `.next/cache/turbopack` o'chirilgach
       to'g'ri chiqdi. Deploy platformasi `.next/cache` ni oldingi
       build'dan tiklagani uchun bu prodda ham takrorlanadi.

       Narxi — build biroz sekinroq. Evaziga CSS jimgina eskirib qolmaydi.
       Qayta yoqishdan oldin `globals.css` o'zgarishi kesh bilan build'da
       aks etishini tekshiring. Dev keshi (`turbopackFileSystemCacheForDev`)
       tegilmagan — dev'da muammo bo'lsa: `rm -rf .next/dev`. */
    turbopackFileSystemCacheForBuild: false,
  },
};

export default withNextIntl(nextConfig);
