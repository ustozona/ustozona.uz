/* ════════════════════════════════════════════════════════════════════
   MAHSULOT QAMROVI — dizayn tizimining uch oʻqi.

   Ost-loyihalar dizayn tizimi MAHSULOT boʻyicha emas, foydalanish
   KONTEKSTI boʻyicha boʻlinadi (docs/ost-loyihalar-arxitektura.md, C):

   1-oʻq — Surface (oʻlcham/zichlik):  desk | handheld | stage
   2-oʻq — Product (faqat palitra):    ustozona | baholash | doska | ...
   3-oʻq — Tone (xarakter):            serious | playful

   Sabab: bitta mahsulot bir vaqtda uch xil ekranda yashaydi. Baholash
   noutbukda yoziladi (desk), telefonda oʻynaladi (handheld) va
   projektorda koʻrsatiladi (stage). Sirtlar soni 3 tadan oshmaydi,
   mahsulotlar soni esa oshaveradi.

   Bu fayl `server-only` EMAS: proxy runtime, root layout va klient
   kodi ham yuklaydi. Sof funksiyalar, hech qanday I/O yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export const SURFACE_HEADER = "x-ustozona-surface";
export const PRODUCT_HEADER = "x-ustozona-product";
export const TONE_HEADER = "x-ustozona-tone";

export type Surface = "desk" | "handheld" | "stage";
export type Product = "ustozona" | "baholash" | "doska" | "shogird" | "boshqaruv";

/**
 * 3-oʻq — OHANG (xarakter). Sirt oʻlchamni beradi, ohang xarakterni:
 * burchak, rang toʻyinganligi, soya, animatsiya.
 *
 * Jurnal bilan sinf ekrani bir xil xarakterda boʻlishi mumkin emas —
 * birinchisi tinch va professional, ikkinchisi quvnoq va jonli. Faqat
 * kattalashtirish buni bermaydi: kattalashtirilgan jurnal baribir
 * jurnalga oʻxshaydi.
 */
export type Tone = "serious" | "playful";

/** Oʻqituvchi paneli — mavjud 14px/36px shkalasi. Sarlavha yoʻq boʻlsa ham shu. */
export const DEFAULT_SURFACE: Surface = "desk";
export const DEFAULT_PRODUCT: Product = "ustozona";
/** Oʻqituvchi paneli — tinch, quruq, professional. */
export const DEFAULT_TONE: Tone = "serious";

const SURFACES = new Set<string>(["desk", "handheld", "stage"]);
const TONES = new Set<string>(["serious", "playful"]);
const PRODUCTS = new Set<string>([
  "ustozona",
  "baholash",
  "doska",
  "shogird",
  "boshqaruv",
]);

/** Yoʻl shu prefiksga tegishlimi (aniq moslik yoki `/` bilan davomi). */
function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/* Qoidalar TARTIBI muhim — birinchi mos kelgani gʻolib.
   `/play` ichida uch xil sirt bor: ishtirokchi telefonda, oʻqituvchi
   noutbukda boshqaradi, projektor esa katta ekranda. */
export function surfaceFor(pathname: string): Surface {
  if (under(pathname, "/play/stage")) return "stage";
  if (under(pathname, "/play/host")) return "desk";
  if (under(pathname, "/play")) return "handheld";
  /* Ikona nazorat sahifasi — Doska ichida, lekin proyektorga emas,
     monitorga qaraydi. `stage` da butun oʻlcham shkalasi kattayadi va
     ikonalarni haqiqiy 16/28/48px da solishtirib boʻlmaydi. */
  if (under(pathname, "/doska/ikonalar")) return "desk";
  if (under(pathname, "/doska")) return "stage";
  if (under(pathname, "/shogird")) return "handheld";
  return DEFAULT_SURFACE;
}

export function productFor(pathname: string): Product {
  if (under(pathname, "/play")) return "baholash";
  if (under(pathname, "/dashboard/baholash")) return "baholash";
  if (under(pathname, "/doska")) return "doska";
  if (under(pathname, "/shogird")) return "shogird";
  if (under(pathname, "/boshqaruv")) return "boshqaruv";
  return DEFAULT_PRODUCT;
}

/** Sarlavhadan oʻqiyotganda ishonchsiz qiymatni standartga qaytaradi. */
/* Ohang sirtdan MUSTAQIL: `stage` + `serious` (projektorga chiqarilgan
   hisobot) ham, `desk` + `playful` (oʻquvchining oʻz qurilmasidagi kviz)
   ham mumkin. Shuning uchun alohida qoidalar roʻyxati. */
export function toneFor(pathname: string): Tone {
  /* Nazorat sahifasi — ichki vosita, oʻyinbop radius/animatsiya
     ikonalarni baholashga xalaqit qiladi (surfaceFor'dagi izohga qarang). */
  if (under(pathname, "/doska/ikonalar")) return "serious";
  if (under(pathname, "/doska")) return "playful";
  if (under(pathname, "/play")) return "playful";
  return DEFAULT_TONE;
}

/** Sarlavhadan oʻqiyotganda ishonchsiz qiymatni standartga qaytaradi. */
export function toSurface(value: string | null | undefined): Surface {
  return value && SURFACES.has(value) ? (value as Surface) : DEFAULT_SURFACE;
}

export function toProduct(value: string | null | undefined): Product {
  return value && PRODUCTS.has(value) ? (value as Product) : DEFAULT_PRODUCT;
}

export function toTone(value: string | null | undefined): Tone {
  return value && TONES.has(value) ? (value as Tone) : DEFAULT_TONE;
}
