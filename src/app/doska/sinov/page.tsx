import type { Metadata } from "next";

import { InputProbe } from "@/components/doska/InputProbe";

/* ════════════════════════════════════════════════════════════════════
   KIRITISH SINOVI — /doska/sinov

   Ichki vosita, mijoz uchun emas (`noindex`). Maktabdagi interaktiv
   panel brauzerga NIMA yuborishini koʻrsatadi: qalammi yoki barmoq,
   bosim, kontakt oʻlchami (kaft), nuqtalar chastotasi.

   Nega kerak: qoʻlyozmaning ikki imkoniyati — «qalam koʻrilsa barmoq
   yozmaydi» va «kaft bilan oʻchirish» — qurilmaga bogʻliq. Koʻp
   infraqizil panel qalamni ham barmoq deb yuboradi, bosim va kontakt
   oʻlchamini esa umuman bermaydi (docs/doska-qolyozma-tadqiqot.md R332,
   §5 0-qadam). Taxmin emas — haqiqiy paneldagi natija kerak.

   Sahifadagi «Hisobotni nusxalash» natijani JSON qilib beradi —
   oʻqituvchi uni chatga tashlaydi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Doska — kiritish sinovi",
  robots: { index: false, follow: false },
};

export default function DoskaInputProbePage() {
  return <InputProbe />;
}
