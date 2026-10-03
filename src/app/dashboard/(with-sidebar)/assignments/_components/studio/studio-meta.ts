import {
  DoorOpen,
  FileText,
  Gamepad2,
  Hand,
  House,
  IdCard,
  Lightbulb,
  ListChecks,
  MonitorPlay,
  Presentation,
  RadioReceiver,
  Smartphone,
  Users,
  type LucideIcon, PenLine } from "lucide-react";
import type { ClassColor } from "@/lib/class-colors";
import type { CheckMethod, StudioBlockKind } from "@/lib/lesson-studio";
import { LAUNCH_MODES } from "@/components/launch/launch-modes";

/* ════════════════════════════════════════════════════════════════════
   DARS STUDIYASI — blok turlari va yigʻish usullarining belgisi (yagona
   manba). RANG = VAZIFA, sinf rangi bilan chalkashmaydi: SHAKL ajratadi
   (sinf = doira, blok = kvadrat plitka) — `material-kinds.ts` qoidasi.

   Usullar belgisi «Darsda oʻtkazish» oynasi bilan AYNAN bir xil
   (`LAUNCH_MODES`) — oʻqituvchi studiyada koʻrgan «QR-kartalar»
   plitkasini oʻtkazish oynasida ham tanisin.
   ════════════════════════════════════════════════════════════════════ */

export const BLOCK_META: Record<StudioBlockKind, { icon: LucideIcon; color: ClassColor }> = {
  warmup: { icon: Lightbulb, color: "amber" },
  explain: { icon: Presentation, color: "violet" },
  activity: { icon: Users, color: "teal" },
  game: { icon: Gamepad2, color: "orange" },
  check: { icon: ListChecks, color: "green" },
  exit: { icon: DoorOpen, color: "sky" },
  homework: { icon: House, color: "blue" },
};

export const METHOD_META: Record<CheckMethod, { icon: LucideIcon; color: ClassColor }> = {
  live: { icon: MonitorPlay, color: LAUNCH_MODES.live.color },
  selfpaced: { icon: Smartphone, color: LAUNCH_MODES.selfpaced.color },
  cards: { icon: IdCard, color: LAUNCH_MODES.cards.color },
  pult: { icon: RadioReceiver, color: LAUNCH_MODES.pult.color },
  paper: { icon: FileText, color: LAUNCH_MODES.paper.color },
  quick: { icon: PenLine, color: LAUNCH_MODES.quick.color },
  oral: { icon: Hand, color: "gray" },
};
