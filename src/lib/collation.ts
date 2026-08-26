/* ════════════════════════════════════════════════════════════════════
   ALIFBO TARTIBI — ism/nom saralash uchun.

   ⚠️ Standart `a.localeCompare(b)` brauzer tiliga qarab ishlaydi va
   oʻzbekcha roʻyxatni NOTOʻGʻRI saralaydi:

     ingliz tartibi : Andijon Chust Gʻuzor Oʻzbekiston Qarshi …
     oʻzbek tartibi : Andijon Qarshi Urgut Xiva Zomin Oʻzbekiston Gʻuzor
                      Shovot Chust

   Sabab: oʻzbek lotin alifbosida Oʻ, Gʻ, Sh, Ch — alohida harflar va
   ular alifbo OXIRIDA turadi, O/G/S/C yonida emas.

   ✅ ICU (`Intl.Collator`) "uz" lokalida buni toʻgʻri bajaradi — qoʻlda
   harflar jadvalini yozish shart emas (2026-08-22 da tekshirilgan).

   `numeric: true` — "10-A" "9-A" dan KEYIN kelsin (sof matn tartibida
   "10" "9" dan oldin chiqardi).

   ⚠️ Bu modul ATAYLAB sof: React ham, next-intl ham import qilmaydi —
   `uz-regions.ts` kabi maʼlumot modullari va server kodi undan bemalol
   foydalana olsin. React ilgagi yonidagi `use-collator.ts` da.
   ════════════════════════════════════════════════════════════════════ */

const cache = new Map<string, Intl.Collator>();

/** Til uchun taqqoslagich (bir marta yaratilib, keshlanadi). */
export function collatorFor(locale: string): Intl.Collator {
  let c = cache.get(locale);
  if (!c) {
    c = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
    cache.set(locale, c);
  }
  return c;
}

/**
 * OʻZBEK tartibi — tilga bogʻlanmagan roʻyxatlar uchun.
 *
 * Viloyat/tuman nomlari tarjima qilinmaydi, shu bois ular interfeys
 * tilidan qatʼi nazar shu tartibda saralanadi.
 */
export function compareUz(a: string, b: string): number {
  return collatorFor("uz").compare(a, b);
}
