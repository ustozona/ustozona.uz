import { Skeleton } from "@/components/ui/skeleton";

/* ════════════════════════════════════════════════════════════════════
   /admin — KUTISH EKRANI (bosh sahifa uchun; boʻlimlarda oʻz fayli bor)

   NEGA KERAK — bu «panel ochilmayapti» shikoyatining ASOSIY sababi edi.

   App Router'da dinamik marshrutga oʻtganda, agar yoʻlda birorta ham
   `loading.tsx` (Suspense chegarasi) boʻlmasa, brauzer server javob
   bergunicha ESKI sahifada turadi: URL ham oʻzgarmaydi, ekran ham.
   Yaʼni yon menyudagi havolani bosgan odam «bosilmadi» yoki «osilib
   qoldi» deb oʻylaydi va qayta-qayta bosadi — 2026-09-02 da aynan
   shunday xulosa qilindi («kirsa ham boshqa sahifaga oʻtmay qoladi»).
   Sahifa aslida ishlayotgan edi, faqat kutayotganini AYTMASDI.

   Ikkinchi, koʻrinmas foydasi: `loading.tsx` boʻlmagan dinamik
   marshrutni Next PREFETCH ham qilolmaydi. Fayl paydo boʻlishi bilan
   yon menyudagi havolalar uchun qobiq oldindan yuklanadi.

   ⛔ Bu faylni «shunchaki skelet» deb oʻchirmang — u UX bezagi emas,
   navigatsiyaning ishlash sharti.
   ════════════════════════════════════════════════════════════════════ */

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Voronka — olti bosqichli qator */}
      <Skeleton className="h-[120px] rounded-xl" />

      {/* Grafik + tarif taqsimoti */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl" />
      </div>

      {/* Eʼtibor talab qiladi */}
      <Skeleton className="h-[320px] rounded-xl" />
    </div>
  );
}
