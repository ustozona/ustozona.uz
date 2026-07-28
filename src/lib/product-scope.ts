/* ════════════════════════════════════════════════════════════════════
   MAHSULOT QAMROVI — dizayn tizimining ikki oʻqi.

   Ost-loyihalar dizayn tizimi MAHSULOT boʻyicha emas, foydalanish
   KONTEKSTI boʻyicha boʻlinadi (docs/ost-loyihalar-arxitektura.md, C):

   1-oʻq — Surface (oʻlcham/zichlik):  desk | handheld | stage
   2-oʻq — Product (faqat palitra):    ustozona | baholash | doska | ...

   Sabab: bitta mahsulot bir vaqtda uch xil ekranda yashaydi. Baholash
   noutbukda yoziladi (desk), telefonda oʻynaladi (handheld) va
   projektorda koʻrsatiladi (stage). Sirtlar soni 3 tadan oshmaydi,
   mahsulotlar soni esa oshaveradi.

   Bu fayl `server-only` EMAS: proxy runtime, root layout va klient
   kodi ham yuklaydi. Sof funksiyalar, hech qanday I/O yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export const SURFACE_HEADER = "x-ustozona-surface";
export const PRODUCT_HEADER = "x-ustozona-product";

export type Surface = "desk" | "handheld" | "stage";
export type Product = "ustozona" | "baholash" | "doska" | "shogird" | "boshqaruv";

/** Oʻqituvchi paneli — mavjud 14px/36px shkalasi. Sarlavha yoʻq boʻlsa ham shu. */
export const DEFAULT_SURFACE: Surface = "desk";
export const DEFAULT_PRODUCT: Product = "ustozona";

const SURFACES = new Set<string>(["desk", "handheld", "stage"]);
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
export function toSurface(value: string | null | undefined): Surface {
  return value && SURFACES.has(value) ? (value as Surface) : DEFAULT_SURFACE;
}

export function toProduct(value: string | null | undefined): Product {
  return value && PRODUCTS.has(value) ? (value as Product) : DEFAULT_PRODUCT;
}
