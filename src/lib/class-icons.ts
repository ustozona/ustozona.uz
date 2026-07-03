import {
  GraduationCap,
  BookOpen,
  Languages,
  MessagesSquare,
  Calculator,
  Sigma,
  FlaskConical,
  Atom,
  Microscope,
  Globe,
  Map as MapIcon,
  Landmark,
  Palette,
  Music,
  Drama,
  Dumbbell,
  Code,
  Cpu,
  PenTool,
  Library,
  Brain,
  Trophy,
  Telescope,
  Rocket,
  Lightbulb,
  Compass,
  Ruler,
  NotebookPen,
  Award,
  Star,
  Heart,
  Leaf,
  Earth,
  Beaker,
  Binary,
  Building2,
  Gamepad2,
  Guitar,
  Hammer,
  Keyboard,
  Puzzle,
  Shapes,
  Speech,
  Stethoscope,
  TreePine,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   SINF IKONKALARI — sinf "avatari" uchun tanlanadigan ikonkalar.

   Sinf maʼlumotida `icon` faqat KALIT (string) sifatida saqlanadi,
   komponent emas — shu sababli data fayllar lucide'ga bogʻlanmaydi.
   Render paytida `classIcon(key)` orqali komponentga aylantiriladi.
   ════════════════════════════════════════════════════════════════════ */

export const CLASS_ICONS = {
  "graduation-cap": GraduationCap,
  book: BookOpen,
  languages: Languages,
  speaking: MessagesSquare,
  calculator: Calculator,
  sigma: Sigma,
  flask: FlaskConical,
  atom: Atom,
  microscope: Microscope,
  globe: Globe,
  map: MapIcon,
  history: Landmark,
  palette: Palette,
  music: Music,
  drama: Drama,
  sport: Dumbbell,
  code: Code,
  tech: Cpu,
  pen: PenTool,
  library: Library,
  brain: Brain,
  trophy: Trophy,
  telescope: Telescope,
  rocket: Rocket,
  lightbulb: Lightbulb,
  compass: Compass,
  ruler: Ruler,
  notebook: NotebookPen,
  award: Award,
  star: Star,
  heart: Heart,
  leaf: Leaf,
  earth: Earth,
  beaker: Beaker,
  binary: Binary,
  building: Building2,
  gamepad: Gamepad2,
  guitar: Guitar,
  hammer: Hammer,
  keyboard: Keyboard,
  puzzle: Puzzle,
  shapes: Shapes,
  speech: Speech,
  stethoscope: Stethoscope,
  tree: TreePine,
  wrench: Wrench,
} satisfies Record<string, LucideIcon>;

export type ClassIconKey = keyof typeof CLASS_ICONS;

export const CLASS_ICON_KEYS = Object.keys(CLASS_ICONS) as ClassIconKey[];

export const DEFAULT_CLASS_ICON: ClassIconKey = "graduation-cap";

/** Kalitni ikonka komponentiga aylantiradi; notoʻgʻri/boʻsh boʻlsa — default. */
export function classIcon(key?: string | null): LucideIcon {
  if (key && key in CLASS_ICONS) return CLASS_ICONS[key as ClassIconKey];
  return CLASS_ICONS[DEFAULT_CLASS_ICON];
}
