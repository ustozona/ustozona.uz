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
export type WidgetKind =
  | "clock.v1"
  | "timer.v1"
  | "traffic-light.v1"
  | "text.v1"
  | "sticky-note.v1"
  | "shape.v1"
  | "presentation.v1"
  | "wheel.v1";

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
  /**
   * Qulflangan vidjet sudralmaydi, oʻlchanmaydi va oʻchirilmaydi —
   * ichidagi tugmalar esa ishlayveradi (taymerni boshlash mumkin).
   *
   * Sensorli doskada bola tegib ketsa jadval yoki koʻrsatma joyidan
   * siljimasin (docs/doska-ux-tadqiqot.md R311, A11). Ixtiyoriy maydon:
   * eski saqlangan ekranlarda yoʻq va `undefined` = qulflanmagan.
   */
  locked?: boolean;
  state: Record<string, unknown>;
};

/* ── QOʻLYOZMA (siyoh) — docs/doska-qolyozma-tadqiqot.md §4 ──────────

   Siyoh vidjet EMAS, ekranning oʻz qatlami: vidjetlar ustida, butun
   ekran boʻylab. Vidjet boʻlsa yozuv qutilarga boʻlinib, vidjet ustidan
   yozib boʻlmasdi (§4.1, B varianti).
   ──────────────────────────────────────────────────────────────────── */

/** Chiziq chizgan asbob. Oʻchirgich va lazer chiziq qoldirmaydi — bu yerda yoʻq. */
export type InkTool = "pen" | "marker";

/**
 * «Chiz va ushlab tur» tekislagan shakl (R336). `points` — ikki nuqta:
 * chiziqda uchlari, toʻrtburchak va ellipsda chegaraviy quti burchaklari.
 */
export type InkShape = "line" | "rect" | "ellipse";

/**
 * Chiziq vidjet SAHIFASIGA bogʻlangan (R338): taqdimot slaydi ustida
 * yozilgan belgi shu slayd bilan birga koʻrinadi va yashirinadi, vidjet
 * surilsa u bilan birga suriladi.
 *
 * Bunda `points` vidjetning chap-yuqori burchagiga nisbatan, `w` —
 * yozilgan paytdagi vidjet eni: vidjet kattalashsa yozuv ham shu
 * nisbatda kattalashadi.
 */
export type InkAnchor = {
  widgetId: string;
  /** Vidjet sahifasi kaliti — `WidgetMeta.inkPage` (lib/doska/registry.ts). */
  page: string;
  w: number;
};

/**
 * Bitta chiziq — bir teginishdan qoʻyib yuborishgacha.
 *
 * ⚠️ `color` — palitra KALITI (`"auto"`, `"red"`), rang qiymati emas.
 * Rangni `src/styles/doska.css` dagi token beradi: `"auto"` och fonda
 * siyoh, toʻq fonda boʻr boʻladi — fon almashtirilsa eski yozuv ham
 * koʻrinib qoladi.
 *
 * ⚠️ `points` — tekis massiv `[x, y, p, x, y, p, …]`, BUTUN sonlar:
 * `x`, `y` ekran pikseli (vidjetlar bilan bir tizim), `p` — bosim
 * 0–100. Obyektlar massivi boʻlsa har nuqta ≈ 3 barobar joy olardi,
 * `localStorage` esa butun saytga ~5 MB (R340).
 */
export type InkStroke = {
  id: string;
  tool: InkTool;
  color: string;
  /** Qalinlik darajasi 1–3; piksel asbobga qarab `lib/doska/ink.ts` da. */
  size: number;
  points: number[];
  /** Tekislangan shakl — boʻlmasa qoʻlyozma chiziq. Ixtiyoriy, migratsiyasiz. */
  shape?: InkShape;
  /** Vidjet sahifasiga bogʻlangan — boʻlmasa ekranning oʻziga. */
  anchor?: InkAnchor;
};

export type DoskaScreen = {
  id: string;
  ordinal: number;
  /** Fon kaliti yoki `null` (standart fon). Fon vidjeti keyingi bosqichda. */
  background: string | null;
  widgets: DoskaWidget[];
  /**
   * Qoʻlyozma. Ixtiyoriy — eski saqlangan ekranlarda yoʻq, `undefined`
   * = boʻsh (`locked` bilan bir xil naqsh, migratsiyasiz).
   */
  ink?: InkStroke[];
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
