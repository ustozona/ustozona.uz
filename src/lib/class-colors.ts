import type { CSSProperties } from "react";

/* ════════════════════════════════════════════════════════════════════
   SINF RANGLARI — yagona manba (single source of truth)

   Har rang FAQAT bitta joyda, OKLCH formatda aniqlanadi (CLASS_COLOR_BASE).
   Qolgan hamma narsa — hex, badge/fon/chegara ottenkalari, dark mode —
   shu bitta qiymatdan HOSIL qilinadi. Hech qaerda qoʻlda takror yoʻq.

   Palitra: 10 ta yaxshi farqlanadigan, oʻqiladigan rang (avto-tanlov uchun)
   + gray (faqat foydalanuvchi qoʻlda tanlaganda). Idrok yorqinligi (L)
   oʻxshash diapazonda kalibrlangan, ranglar bir oilaga oʻxshaydi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassColor =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "gray";

/** Avto-tanlov hovuzi — `gray` ataylab kiritilmagan (u "belgilanmagan" holat) */
export const CLASS_COLORS: ClassColor[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

/**
 * YAGONA MANBA — har rang bitta OKLCH qiymat.
 * Qiymatlar rasmiy Tailwind/shadcn palitrasining `-400` darajasi
 * (https://v3.shadcn.com/colors). Rang ottenkasini oʻzgartirish kerak boʻlsa,
 * faqat shu yerni tahrirlang. Yangi rang qoʻshish — shu obyektga bitta qator
 * + `ClassColor` tipiga nom.
 */
export const CLASS_COLOR_BASE: Record<ClassColor, string> = {
  red:     "oklch(0.704 0.191 22.216)",
  orange:  "oklch(0.75 0.183 55.934)",
  amber:   "oklch(0.828 0.189 84.429)",
  yellow:  "oklch(0.852 0.199 91.936)",
  lime:    "oklch(0.841 0.238 128.85)",
  green:   "oklch(0.792 0.209 151.711)",
  emerald: "oklch(0.765 0.177 163.223)",
  teal:    "oklch(0.777 0.152 181.912)",
  cyan:    "oklch(0.789 0.154 211.53)",
  sky:     "oklch(0.746 0.16 232.661)",
  blue:    "oklch(0.707 0.165 254.624)",
  indigo:  "oklch(0.673 0.182 276.935)",
  violet:  "oklch(0.702 0.183 293.541)",
  purple:  "oklch(0.714 0.203 305.504)",
  fuchsia: "oklch(0.74 0.238 322.16)",
  pink:    "oklch(0.718 0.202 349.761)",
  rose:    "oklch(0.712 0.194 13.428)",
  gray:    "oklch(0.707 0.022 261.325)",
};

/* ─────────────────────────────────────────────────────────────────────
   OKLCH → sRGB hex konvertori (faqat shu fayl ichida).
   Mavjud isteʼmolchilar inline `style={{ color: hex }}` va `${hex}40`
   (hex-alpha) ishlatadi — shuning uchun hex shaklini ham hosil qilamiz.
   ───────────────────────────────────────────────────────────────────── */

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Linear sRGB kanalini gamma-kodlangan [0..255] ga oʻtkazish */
function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(clamp01(v) * 255);
}

export function oklchToHex(oklch: string): string {
  const m = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return "#888888";
  const L = parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const hDeg = parseFloat(m[3]);
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const mm = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(linearToSrgb(r))}${toHex(linearToSrgb(g))}${toHex(linearToSrgb(bl))}`;
}

/**
 * Hex qiymatlar — CLASS_COLOR_BASE dan HOSIL qilingan (qoʻlda emas).
 * Solid toʻldirish uchun: dot, ikona, avatar, progress, swatch va h.k.
 */
export const CLASS_COLOR_HEX: Record<ClassColor, string> = Object.fromEntries(
  (Object.keys(CLASS_COLOR_BASE) as ClassColor[]).map((k) => [k, oklchToHex(CLASS_COLOR_BASE[k])])
) as Record<ClassColor, string>;

/* ─────────────────────────────────────────────────────────────────────
   Yordamchilar
   ───────────────────────────────────────────────────────────────────── */

/** Seed (id yoki nom) asosida barqaror avto-rang tanlash */
export function autoClassColor(seed: number | string): ClassColor {
  const n =
    typeof seed === "number"
      ? seed
      : Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CLASS_COLORS[Math.abs(n) % CLASS_COLORS.length];
}

/* ─────────────────────────────────────────────────────────────────────
   "Aqilli" tasodifiy rang — shuffle-bag algoritmi.
   Bitta rang berilgach, QOLGAN ranglar tugamaguncha u qayta berilmaydi
   (barcha 10 ta rang navbat bilan, tasodifiy tartibda tarqatiladi).
   Navbat localStorage'da saqlanadi — sahifa yangilansa ham davom etadi.
   ───────────────────────────────────────────────────────────────────── */

const AUTO_COLOR_BAG_KEY = "ustozona:class-color-bag";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Navbatdagi "aqilli" tasodifiy rangni chiqaradi va navbatni yangilaydi */
export function nextAutoClassColor(): ClassColor {
  if (typeof window === "undefined") {
    return CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)];
  }

  let bag: unknown;
  try {
    bag = JSON.parse(window.localStorage.getItem(AUTO_COLOR_BAG_KEY) ?? "[]");
  } catch {
    bag = [];
  }

  let queue = Array.isArray(bag) ? bag.filter((c): c is ClassColor => CLASS_COLORS.includes(c as ClassColor)) : [];
  if (queue.length === 0) queue = shuffle(CLASS_COLORS);

  const [next, ...rest] = queue;
  window.localStorage.setItem(AUTO_COLOR_BAG_KEY, JSON.stringify(rest));
  return next;
}

/** Solid rang qiymati (OKLCH) — inline `color` / `backgroundColor` uchun */
export function classColorValue(color: ClassColor): string {
  return CLASS_COLOR_BASE[color];
}

/**
 * `--class-color` CSS oʻzgaruvchisini ochib beruvchi inline style.
 * globals.css dagi color-mix asosidagi yuzalar (.class-card va h.k.)
 * shu oʻzgaruvchidan foydalanadi — dark mode avtomatik ishlaydi.
 */
export function classColorStyle(color: ClassColor): CSSProperties {
  return { ["--class-color" as string]: CLASS_COLOR_BASE[color] } as CSSProperties;
}

/**
 * Sinf rangidan HOSIL qilingan ottenkalar — tayyor inline-style obyektlari.
 * Hammasi `color-mix` orqali tema tokenlariga (--background / --foreground)
 * aralashtiriladi, shuning uchun dark mode qoʻshimcha koddsiz toʻgʻri chiqadi.
 *
 * Eski `CLASS_COLOR_TOKENS` (Tailwind klasslar) oʻrnini bosadi.
 */
export function classTints(color: ClassColor) {
  return makeColorTints(CLASS_COLOR_BASE[color]);
}

function darkenOklch(oklch: string, factor: number = 0.8): string {
  const m = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return oklch;
  const L = parseFloat(m[1]) * factor; // L ni kamaytiramiz (-600 darajasi uchun)
  return `oklch(${L.toFixed(3)} ${m[2]} ${m[3]})`;
}

/** L ni oshirib (-300 darajasiga yaqin) yorugʻroq ottenka hosil qiladi. */
function lightenOklch(oklch: string, addL: number = 0.09): string {
  const m = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return oklch;
  const L = Math.min(0.97, parseFloat(m[1]) + addL);
  return `oklch(${L.toFixed(3)} ${m[2]} ${m[3]})`;
}

export function classGradient(color: ClassColor | string): React.CSSProperties {
  const c = color in CLASS_COLOR_BASE ? CLASS_COLOR_BASE[color as ClassColor] : color;
  const lightC = lightenOklch(c);
  return { backgroundImage: `linear-gradient(135deg, ${lightC} 0%, ${c} 100%)` } as React.CSSProperties;
}

/**
 * Umumiy ottenka engine'i — ixtiyoriy OKLCH bazadan (sinf VA toifa ranglari
 * shuni ishlatadi, yagona manba). Hammasi `color-mix` orqali tema tokenlariga
 * aralashadi — dark mode avtomatik.
 */
export function makeColorTints(c: string) {
  const mix = (pct: number, into = "var(--background)") =>
    `color-mix(in oklch, ${c} ${pct}%, ${into})`;

  const lightC = lightenOklch(c); // ~ -300 shade (gradientTile uchun)

  return {
    /** Solid rang (OKLCH string) — urgʻu chizigʻi/ikona uchun */
    solid: c,
    /** YAGONA karta yuzasi — eng och fon (matn oʻqilishi uchun) */
    surface: { backgroundColor: mix(3, "var(--card)") } as CSSProperties,
    /** YAGONA karta chegarasi — yumshoq rangli */
    softBorder: { borderColor: mix(22) } as CSSProperties,
    /** Yumshoq fon — qatorlar */
    tint: { backgroundColor: mix(7) } as CSSProperties,
    /** Badge foni */
    badge: { backgroundColor: mix(18) } as CSSProperties,
    /** Och gradient fon (jadval kartalari) — yuqoridan pastga, oqqa yaqin */
    gradient: { backgroundImage: `linear-gradient(155deg, ${mix(13)} 0%, ${mix(4)} 100%)` } as CSSProperties,
    /** Karta pasporti v2: 44px iconbox uchun toʻyingan gradient (-300 dan -400 ga — "portlab turishi" uchun) */
    gradientTile: { backgroundImage: `linear-gradient(135deg, ${lightC} 0%, ${c} 100%)` } as CSSProperties,
    /** Oʻrtacha toʻyingan karta yuzasi — timetable/planner event kartalari */
    surfaceStrong: { backgroundImage: `linear-gradient(155deg, ${mix(35, "var(--card)")} 0%, ${mix(25, "var(--card)")} 100%)` } as CSSProperties,
    /** Rangli matn (badge ichidagi yozuv) */
    text: { color: mix(52, "var(--foreground)") } as CSSProperties,
    /** surfaceStrong yuzasida oʻqiladigan toʻqroq rangli matn */
    textStrong: { color: mix(68, "var(--foreground)") } as CSSProperties,
    /** surfaceStrong ustida koʻrinadigan chegara (softBorder yuzadan ochroq boʻlib qoladi) */
    borderMedium: { borderColor: mix(38) } as CSSProperties,
    /** Kichik nuqta / indikator */
    dot: { backgroundColor: c } as CSSProperties,
    /** Chegara rangi (ring) */
    ring: { borderColor: mix(45) } as CSSProperties,
    /** Ikona konteyner foni */
    iconBg: { backgroundColor: mix(20) } as CSSProperties,
    /** Ikona rangi */
    iconText: { color: c } as CSSProperties,
  } as const;
}

/**
 * Sinf kartalari uchun YAGONA hover/animatsiya tizimi.
 * Sidebar, grid (Erkin), period katagi, toʻgarak — hammasi shuni ishlatadi.
 */
export const CLASS_CARD_INTERACTION =
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm";
