/* ════════════════════════════════════════════════════════════════════
   USTOZONA DOSKA — maʼlumot turlari.

   Tuzilma: deck → screen → widget (docs/ost-loyihalar-arxitektura.md
   R133). Doska bitta ekran emas — tartiblangan ekranlar toʻplami:
   1-ekran kirish, 2-ekran topshiriq, 3-ekran uy vazifasi.

   ⚠️ `kind` — SATR va VERSIYALI (`"timer.v1"`), enum EMAS (R131).
   Sabab: saqlangan ekran vidjet konfiguratsiyasini oʻz ichida saqlaydi.
   Vidjet qayta yozilsa `.v2` chiqadi, `.v1` esa eski renderer bilan
   oʻqilishda davom etadi — eski ekranlar buzilmaydi. Enum boʻlsa har
   safar migratsiya kerak boʻlardi.
   ════════════════════════════════════════════════════════════════════ */

/** Hozir qurilgan vidjetlar. Yangi qoʻshilganda shu yerga versiya bilan. */
export type WidgetKind = "clock.v1" | "timer.v1" | "traffic-light.v1";

/**
 * Vidjetning ekrandagi oʻrni va oʻz holati.
 * `state` — har vidjet oʻzi biladigan erkin obyekt (taymer uchun
 * qolgan soniya, svetofor uchun joriy rang va h.k.).
 */
export type DoskaWidget = {
  id: string;
  kind: WidgetKind;
  /** Ekran boʻyicha piksel koordinatasi (chap-yuqori burchak). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Ustma-ust tartib. Kattasi tepada. */
  z: number;
  state: Record<string, unknown>;
};

export type DoskaScreen = {
  id: string;
  ordinal: number;
  /** Fon kaliti yoki `null` (standart fon). Fon vidjeti keyingi bosqichda. */
  background: string | null;
  widgets: DoskaWidget[];
};

export type DoskaDeck = {
  id: string;
  title: string;
  screens: DoskaScreen[];
  /**
   * Bogʻlangan sinf. Ixtiyoriy — Doska sinfsiz ham ochiladi (R134).
   * Bogʻlansa Tasodifiy ism / Guruh tuzuvchi roʻyxatni avtomatik oladi.
   */
  classId?: string;
  updatedAt: string;
};
