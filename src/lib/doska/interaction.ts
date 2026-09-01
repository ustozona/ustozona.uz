/* ════════════════════════════════════════════════════════════════════
   INTERAKTSIYA — sof geometriya va DOM kelishuvi (R135).

   Bu faylda React ham, store ham YOʻQ — faqat maʼlumot va matematika.
   Sabab: sudrash hisobi vidjetlar sonidan qatʼi nazar bir xil, va uni
   React'ni ishga tushirmasdan tekshirish mumkin boʻlishi kerak.

   Harakatning oʻzi `src/components/doska/InteractionLayer.tsx` da.
   ════════════════════════════════════════════════════════════════════ */

/** Oʻlcham tutqichlari — toʻrt burchak. */
export type ResizeHandle = "nw" | "ne" | "sw" | "se";

/** Sudrash turi: butun vidjetni koʻchirish yoki burchakdan choʻzish. */
export type DragMode = "move" | ResizeHandle;

export type Rect = { x: number; y: number; w: number; h: number };

export type DragSession = {
  widgetId: string;
  mode: DragMode;
  /** Qaysi barmoq/sichqoncha. Ikkinchi barmoq seansni buzmasligi uchun. */
  pointerId: number;
  startX: number;
  startY: number;
  origin: Rect;
  min: { w: number; h: number };
  /**
   * Ostona bosib oʻtildimi. Bosishni sudrashdan ajratadi — aks holda
   * vidjetni bosgandagi 1–2 piksel titrash ham store'ga yoziladi va
   * vidjet har bosishda sal siljib ketadi.
   */
  moved: boolean;
  /**
   * Bosishdan OLDIN shu vidjet allaqachon tanlangan edimi.
   *
   * Tanlangan tahrirlanadigan vidjetga siljishsiz qayta tegilsa
   * tahrirga kiriladi (`endDrag`). Sichqonchada bu «ikki marta bosish»,
   * sensorli ekranda «ikki marta teginish» — bitta yoʻl, ikkalasida
   * ham ishlaydi. `dblclick` sensorli ekranda ishonchsiz va vidjetdagi
   * `touch-action: none` uni butunlay toʻsadi.
   */
  wasSelected: boolean;
  /** Vidjet matn qabul qiladimi (reyestrdagi `editable`). */
  editable: boolean;
};

/** Shu masofadan keyin bosish sudrashga aylanadi (piksel). */
export const DRAG_THRESHOLD = 3;

/* ── DOM kelishuvi ──────────────────────────────────────────────────

   Dispatcher hodisa nishonidan (`event.target`) nima bosilganini shu
   atributlar boʻyicha biladi. Vidjetlar va ramka listener QOʻYMAYDI —
   ular faqat shu atributlarni chizadi (R135).

   ⚠️ Atribut nomlari JSX'da LITERAL yoziladi (`data-doska-widget={…}`),
   chunki React uchun shunday oʻqiladiganroq. Bu yerdagi doimiylar
   faqat DISPATCHER tomonida — `closest()` va `getAttribute()` uchun.
   Nomni oʻzgartirsangiz `grep data-doska-` bilan ikkala tomonni ham
   yangilang.
   ────────────────────────────────────────────────────────────────── */

/** Ramkada va tanlov qutisida: qaysi vidjet. Qiymati — vidjet `id` si. */
export const ATTR_WIDGET = "data-doska-widget";

/** Tutqichda: qaysi burchak. Qiymati — `ResizeHandle`. */
export const ATTR_HANDLE = "data-doska-handle";

/**
 * Vidjet ICHIDAGI boshqaruvda (taymer tugmasi, svetofor chirogʻi,
 * oʻchirish tugmasi): «bu yerdan sudrash boshlanmasin».
 *
 * ⚠️ Buning oʻrniga `e.stopPropagation()` ISHLATIB BOʻLMAYDI. React
 * oʻz listenerlarini hujjat darajasiga ulaydi, dispatcher esa kanvas
 * elementiga — yaʼni dispatcher React'dan OLDIN ishga tushadi va
 * sintetik hodisadagi `stopPropagation` unga umuman yetib bormaydi.
 * Bu naqsh xuddi shu sabab `data-*` atribut orqali qurilgan.
 */
export const ATTR_NO_DRAG = "data-doska-no-drag";

/**
 * Sudrash natijasidagi yangi toʻrtburchak.
 *
 * Burchakdan choʻzilganda qarama-qarshi burchak QIMIRLAMAYDI: shuning
 * uchun gʻarbiy/shimoliy tutqichlarda `x`/`y` ham suriladi. Minimal
 * oʻlchamga urilganda surilish ham toʻxtaydi — aks holda vidjet
 * oʻlchami oʻzgarmay turib joyidan siljib ketadi.
 */
export function applyDrag(session: DragSession, dx: number, dy: number): Rect {
  const { mode, origin, min } = session;

  if (mode === "move") {
    return { ...origin, x: Math.max(0, origin.x + dx), y: Math.max(0, origin.y + dy) };
  }

  const west = mode === "nw" || mode === "sw";
  const north = mode === "nw" || mode === "ne";

  const w = Math.max(min.w, west ? origin.w - dx : origin.w + dx);
  const h = Math.max(min.h, north ? origin.h - dy : origin.h + dy);

  return {
    x: Math.max(0, west ? origin.x + (origin.w - w) : origin.x),
    y: Math.max(0, north ? origin.y + (origin.h - h) : origin.y),
    w,
    h,
  };
}

/** Bosish sudrashga aylandimi. */
export function passedThreshold(dx: number, dy: number): boolean {
  return Math.abs(dx) >= DRAG_THRESHOLD || Math.abs(dy) >= DRAG_THRESHOLD;
}
