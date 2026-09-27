import {
  FileText,
  Gamepad2,
  House,
  IdCard,
  MonitorPlay,
  Presentation,
  RadioReceiver,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { ClassColor } from "@/lib/class-colors";
import type { LaunchIntent, LaunchMode, RunKind } from "@/lib/launch-types";

/* ════════════════════════════════════════════════════════════════════
   «QANDAY OʻTKAZAMIZ?» — USULLAR REESTRI (yagona manba).

   Usullar SINF HAQIQATI boʻyicha guruhlangan, texnik atama boʻyicha
   emas: oʻqituvchi «selfpaced» haqida emas, «bolalarda telefon bormi?»
   haqida oʻylaydi (docs/topshiriq-boshlash-markazi.md §2).

   RANG = USUL. Sinf rangi bilan chalkashmaydi — SHAKL ajratadi
   (sinf = doira, usul = kvadrat plitka), `material-kinds.ts` bilan bir
   xil qoida. Rang bazasi — `class-colors.ts` dvigateli (OKLCH, dark
   mode avtomatik), qotirilgan hex yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export type LaunchGroup = "phones" | "offline" | "home";

export type LaunchModeMeta = {
  group: LaunchGroup;
  icon: LucideIcon;
  color: ClassColor;
  /** Faqat variantli (mcq) savollar bilan ishlaydi — qogʻoz, karta, pult. */
  needsMcq: boolean;
};

export const LAUNCH_MODES: Record<LaunchMode, LaunchModeMeta> = {
  live: { group: "phones", icon: MonitorPlay, color: "violet", needsMcq: false },
  game: { group: "phones", icon: Gamepad2, color: "orange", needsMcq: true },
  selfpaced: { group: "phones", icon: Smartphone, color: "sky", needsMcq: false },
  paper: { group: "offline", icon: FileText, color: "green", needsMcq: true },
  cards: { group: "offline", icon: IdCard, color: "teal", needsMcq: true },
  pult: { group: "offline", icon: RadioReceiver, color: "rose", needsMcq: true },
  homework: { group: "home", icon: House, color: "blue", needsMcq: false },
};

/** «Darsda qanday oʻtkazamiz?» ekrani. Uy vazifasi bu yerda YOʻQ —
    u oʻz tugmasi («Uyga berish») bilan alohida qaror. */
export const LAUNCH_GROUPS: { id: Exclude<LaunchGroup, "home">; modes: LaunchMode[] }[] = [
  { id: "phones", modes: ["live", "game", "selfpaced"] },
  { id: "offline", modes: ["paper", "cards", "pult"] },
];

/** Ikki kirish tugmasi — roʻyxat, muharrir, test banki va «Qayerda
    ishlaydi?» ekranida AYNAN bir xil belgi va nom. */
export const LAUNCH_INTENTS: Record<LaunchIntent, { icon: LucideIcon; color: ClassColor }> = {
  class: { icon: Presentation, color: "violet" },
  home: { icon: House, color: "blue" },
};

/** Ish turi (sessiyadan hisoblangan) → roʻyxat va natija ekranidagi belgi. */
export const RUN_KIND_META: Record<RunKind, { icon: LucideIcon; color: ClassColor }> = {
  live: { icon: MonitorPlay, color: "violet" },
  game: { icon: Gamepad2, color: "orange" },
  selfpaced: { icon: Smartphone, color: "sky" },
  homework: { icon: House, color: "blue" },
  offline: { icon: FileText, color: "green" },
};
