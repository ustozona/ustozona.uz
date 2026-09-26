/** Saytning kanonik manzili — apex EMAS, `www`.
 *
 *  Apex `ustozona.uz` → `www.ustozona.uz` ga 308 bilan yoʻnaltiriladi
 *  (`next.config.ts` dagi CSRF izohiga qarang). Qidiruv tizimlariga
 *  koʻrsatiladigan har bir absolyut URL shu yerdan olinishi kerak:
 *  canonical, sitemap, robots va JSON-LD bir xil hostni koʻrsatmasa,
 *  Google ikkala variantni alohida sahifa deb sanaydi.
 */
export const SITE_URL = "https://www.ustozona.uz";

/** Absolyut URL yasaydi: `abs("/blog/salom")` → `https://www.ustozona.uz/blog/salom`. */
export function abs(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
