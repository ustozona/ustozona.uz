import type { CSSProperties } from "react";

/* ════════════════════════════════════════════════════════════════════
   DOSKA FONLARI — sof CSS, rasm YOʻQ.

   Sabab: classroomscreen 100+ JPG fon saqlaydi (bir necha megabayt
   deploy yuki), ular esa projektorda pikselli chiqadi. CSS fon istalgan
   oʻlchamda toza va deploy yukiga hech narsa qoʻshmaydi. Foydalanuvchi
   oʻz rasmini yuklashi keyingi bosqichda — bizning katalogimiz JPG
   bilan ogʻirlashmaydi.

   ⚠️ `tone` — shunchaki yorliq emas, RENDER QAROR: toʻq fon ustida
   vidjetlar «bo'r rejimi»ga oʻtadi (kanvasdagi `data-bg-tone`, tuslar
   globals.css da qayta belgilanadi). Vidjet komponentlari bundan
   bexabar — ular baribir `var(--doska-*-bg)` ni oʻqiydi.
   ════════════════════════════════════════════════════════════════════ */

export type BackgroundTone = "light" | "dark";

export type DoskaBackground = {
  id: string;
  label: string;
  tone: BackgroundTone;
  style: CSSProperties;
  /** Doska teksturasi — yengil shovqin qatlami (faqat toʻq fonlarda). */
  grain?: boolean;
};

export const DOSKA_BACKGROUNDS: DoskaBackground[] = [
  {
    id: "chalkboard-green",
    label: "Yashil doska",
    tone: "dark",
    grain: true,
    style: { background: "oklch(0.33 0.045 158)" },
  },
  {
    id: "chalkboard-black",
    label: "Qora doska",
    tone: "dark",
    grain: true,
    style: { background: "oklch(0.22 0.008 250)" },
  },
  {
    id: "whiteboard",
    label: "Oq taxta",
    tone: "light",
    style: { background: "oklch(0.97 0.002 250)" },
  },
  {
    id: "grid-paper",
    label: "Katak daftar",
    tone: "light",
    style: {
      background: "oklch(0.99 0.006 90)",
      backgroundImage:
        "linear-gradient(oklch(0.85 0.035 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.85 0.035 240) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
    },
  },
  {
    id: "dot-paper",
    label: "Nuqtali qogʻoz",
    tone: "light",
    style: {
      background: "oklch(0.98 0.004 90)",
      backgroundImage: "radial-gradient(oklch(0.8 0.008 90) 2px, transparent 2px)",
      backgroundSize: "36px 36px",
    },
  },
  {
    /**
     * Chiziqli daftar — yozuv mashqi, ona tili, imlo uchun.
     * Ikki qatlam: chapdan 50px joyda qizil chekka chizigʻi (vertikal)
     * va har 30px da kulrang qator (gorizontal).
     *
     * ⚠️ `backgroundSize` ikkala qatlamga ham tegadi, shuning uchun
     * qator balandligi 30px — qizil chiziq esa vertikal boʻlgani uchun
     * takrorlanishi koʻrinmaydi.
     */
    id: "notebook",
    label: "Daftar varagʻi",
    tone: "light",
    style: {
      background: "oklch(0.958 0 0)",
      backgroundImage: [
        "linear-gradient(90deg, transparent 50px, oklch(0.842 0.088 15.6) 50px, oklch(0.842 0.088 15.6) 52px, transparent 52px)",
        "linear-gradient(oklch(0.91 0 0) 0.1em, transparent 0.1em)",
      ].join(", "),
      backgroundSize: "100% 30px",
    },
  },
  {
    /**
     * Husnixat mashqi — «qiya chizgʻich» (rus/oʻzbek maktab tizimida
     * *косая линейка*). Manba: M. Gʻulomov, «Yozuv daftari», 1-sinf,
     * «Maʼnaviyat» 2018 — Xalq taʼlimi vazirligi tasdiqlagan daftar.
     *
     * ── STANDART: ГОСТ 12063-89 «Тетради школьные» ────────────────
     * Oʻlchamlar rasmdan chamalanmaydi — standartda MATN bilan
     * yozilgan:
     *
     *   • qiyalik burchagi                65,0°
     *   • qiya chiziqlar oraligʻi         27,0 mm (QATOR boʻyicha)
     *   • ishchi qator (рабочая строка)    4 mm
     *   → nisbat 27 / 4 = 6,75
     *
     * ⚠️ Baʼzi manbalar «2,7 mm» deb yozadi — bu oʻnlik xatosi.
     * Tekshiruv: A4 ning 170 mm yozuv kengligida 2,7 mm oraliq 63 ta
     * qiya chiziq beradi (shtrixovka), 27 mm esa 6 ta — barcha referens
     * rasmlarda aynan 6–7 ta koʻrinadi.
     *
     * Bizda band = 24px → 1 mm = 6px → qiya gorizontal 162px,
     * perpendikulyar P = 162 × sin(65°) = 147px.
     *
     * ── QOLGAN OʻLCHAMLAR CHAMALANMAYDI, HISOBLANADI ──────────────
     * Bu naqsh ikki marta koʻz bilan chamalab qilindi va ikkalasida
     * ham xato chiqdi: 34px juda siyrak, 20px esa matoga oʻxshab
     * ketdi. Toʻgʻri yoʻl — asl daftardagi NISBATni olish:
     *
     *   • qiyalik burchagi        65° (standart yozuv qiyaligi)
     *   • yozuv bandi             1x — IKKI kuchli chiziq orasi
     *   • oraliq                  2x — oʻrtasida BITTA kuchsiz chiziq
     *   • takrorlanish davri      3x
     *   • qiya chiziqlar oraligʻi ≈ 1.6 × davr (gorizontal boʻyicha)
     *   • chiziq qalinligi        2px (doska uchun; qogʻozda 1px)
     *
     * `repeating-linear-gradient` da oraliq chiziqqa PERPENDIKULYAR
     * oʻlchanadi, gorizontal boʻyicha emas. Shuning uchun:
     *
     *   gorizontal oraliq = P / sin(65°) = P / 0.906
     *   kerakli 77px      → P = 70px
     *
     * Burchak: CSS burchagi gradient YOʻNALISHI, chiziqlar esa unga
     * perpendikulyar. 65° li «/» chiziq uchun 65 + 50 emas, balki
     * 115deg kerak (65° + 90° − 40°… tekshirilgan qiymat: 115deg).
     * `45deg` mumtoz «barber pole» aynan «\» beradi — shuni esda tuting.
     *
     * ⚠️ Gorizontal chiziqlar TENG ORALIQDA emas. Ikki marta shunday
     * qilindi (avval bir xil, keyin ingichka+toʻq juftlik) — ikkalasi
     * ham «hujjat blankasi» taassurotini berdi. Daftarni daftar
     * qiladigan narsa — RITM: toʻldiriladigan band va undan kengroq
     * boʻsh oraliq. Shuning uchun butun davr bitta
     * `repeating-linear-gradient` da yoziladi, `background-size` bilan
     * emas: bir davr ichida uch xil chiziq bor.
     *
     * ⚠️ HOSHIYA (chekka chizigʻi) ATAYLAB YOʻQ. Qogʻoz daftarda u
     * oʻqituvchi izohi uchun joy qoldiradi — doskada esa hech kim
     * chetga yozmaydi, u faqat ekranni boʻlib turadi. Haqiqiy
     * foydalanuvchi soʻrasa qaytariladi.
     *
     * ⚠️ Chiziqlar 2px — qogʻozdagidan qalinroq. Bu DOSKA: proyektorga
     * chiqadi va sinfning orqasidan koʻriladi. 1px «hairline» qogʻozda
     * nafis, ekranda esa yoʻqoladi.
     *
     * ── Qatlamlar (birinchisi eng ustda) ──────────────────────────
     *   1. qiya chizgʻich 65°
     *   2. gorizontal ritm: band (2 kuchli) + oraliq (1 kuchsiz)
     */
    id: "husnixat",
    label: "Husnixat mashqi",
    tone: "light",
    style: {
      background: "oklch(1 0 0)",
      backgroundImage: [
        "repeating-linear-gradient(115deg, oklch(0.7 0.14 232) 0 2px, transparent 2px 147px)",
        [
          "repeating-linear-gradient(to bottom",
          "oklch(0.7 0.14 232) 0 2px",
          "transparent 2px 24px",
          "oklch(0.7 0.14 232) 24px 26px",
          "transparent 26px 60px)",
        ].join(", "),
      ].join(", "),
      /* Qiya chiziq chetgacha boradi, gorizontal qator esa YOʻQ —
         tepada va pastda bittadan davr boʻsh qoladi. Daftarda ham
         shunday: chiziq sahifa qirrasiga tegib turmaydi. */
      backgroundRepeat: "repeat, no-repeat",
      backgroundPosition: "0 0, 0 60px",
      backgroundSize: "100% 100%, 100% calc(100% - 120px)",
    },
  },
  {
    id: "dusk",
    label: "Kechki tus",
    tone: "dark",
    style: { background: "linear-gradient(160deg, oklch(0.36 0.07 265), oklch(0.34 0.09 300))" },
  },
];

/** Standart fon — birinchi ochilganda shu koʻrinadi. */
export const DEFAULT_BACKGROUND_ID = "chalkboard-green";

export function backgroundById(id: string | null | undefined): DoskaBackground {
  return (
    DOSKA_BACKGROUNDS.find((b) => b.id === id) ??
    DOSKA_BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND_ID)!
  );
}
