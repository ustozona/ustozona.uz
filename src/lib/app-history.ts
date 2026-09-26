/* ════════════════════════════════════════════════════════════════════
   ILOVA ICHIDAGI TARIX CHUQURLIGI

   Toʻliq-ekran muharrirni «yopish» — bu yangi sahifaga oʻtish emas, balki
   ORQAGA qaytish. `router.back()` buni toʻgʻri bajaradi: brauzer oldingi
   yozuvni butun holati bilan (URL param'lari, skroll oʻrni) tiklaydi va
   tarixga keraksiz yozuv qoʻshmaydi. `router.push("/dashboard/lessons")`
   esa aksincha — kontekstni yoʻqotadi va «orqaga» tugmasini muharrirga
   qaytaradigan tuzoqqa aylantiradi.

   Yagona shart: `back()` faqat ilova ichida qaytadigan yozuv BOR boʻlsa
   ishlatiladi. Foydalanuvchi muharrirga toʻgʻridan-toʻgʻri havola orqali
   kirgan boʻlsa, `back()` uni ilovadan butunlay chiqarib yuborardi.

   Shuni bilish uchun tarix chuqurligi markazdan sanaladi
   ([[AppHistoryTracker]] ildiz layout'da). Har kirish nuqtasiga belgi
   qoʻyish shart emas — muharrirga oʻnlab joydan kiriladi va bittasi
   unutilsa xato jimgina qaytadi.

   ⚠️ Har navigatsiya chuqurlikni OSHIRMAYDI: `replace` yozuvni almashtiradi
   (chuqurlik oʻzgarmaydi), «orqaga» esa uni kamaytiradi. Buni hisobga
   olmaslik amalda xatoga olib kelgan: darsni nusxalab, nusxani yopganda
   `back()` roʻyxatga emas, ASL darsning muharririga qaytarardi — yaʼni
   «yopish» tugmasi hech nimani yopmaganday koʻrinardi.
   ════════════════════════════════════════════════════════════════════ */

/** Ilova ichidagi tarix yozuvlari soni (ochilish sahifasi — 1). */
let depth = 0;

/** Keyingi marshrut oʻzgarishining turi. Navigatsiyani BOSHLAGAN kod uni
    oldindan belgilaydi; belgilanmasa oddiy `push` deb hisoblanadi. */
let pendingKind: "push" | "replace" | "pop" = "push";

/** `router.replace(...)` dan OLDIN chaqiriladi — yozuv almashtiriladi,
    demak chuqurlik oʻzgarmaydi. */
export function notePendingReplace() {
  pendingKind = "replace";
}

/** Brauzerning «orqaga»/«oldinga» tugmasi (popstate) — chuqurlik kamayadi. */
export function notePendingPop() {
  pendingKind = "pop";
}

/** Marshrut oʻzgarganda [[AppHistoryTracker]] chaqiradi. */
export function noteNavigation() {
  const kind = pendingKind;
  pendingKind = "push";
  if (kind === "push") depth += 1;
  else if (kind === "pop") depth = Math.max(1, depth - 1);
}

/** Ilova ichida qaytadigan yozuv bormi. */
export function canGoBackInApp() {
  return depth > 1;
}
