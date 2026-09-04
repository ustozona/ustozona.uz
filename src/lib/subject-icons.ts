import {
  Atom,
  BookOpen,
  Dumbbell,
  FlaskConical,
  Globe2,
  HeartHandshake,
  Landmark,
  Languages,
  Leaf,
  Monitor,
  PenTool,
  Sigma,
  type LucideIcon,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   FAN IKONALARI — qiymatga bogʻliq ikona, `class-icons.ts` naqshi.

   Qoldiq relsidagi rangli doira ichida turadi. Fan id'si loyihaga qarab
   oʻzgarishi mumkin (maktab oʻz fanlarini yaratadi), shuning uchun
   moslik NOM boʻyicha ham qidiriladi va topilmasa neytral ikona
   qaytadi — hech qachon boʻsh qolmaydi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ Bu XARITA, funksiya emas — isteʼmolchi `SUBJECT_ICONS[id]` deb
 * toʻgʻridan-toʻgʻri indekslaydi (`class-icons.ts` bilan bir xil naqsh).
 *
 * Funksiya qilib qoʻyilsa `react-hooks/static-components` qoidasi ishga
 * tushadi: linter chaqiruv natijasini «renderda yaratilgan komponent»
 * deb hisoblaydi va bu haqiqatan xavfli — komponent identifikatsiyasi
 * har renderda oʻzgarsa React uni qayta mount qiladi.
 */
export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  mat: Sigma,
  ona: Languages,
  adb: BookOpen,
  ing: Languages,
  fiz: Atom,
  kim: FlaskConical,
  bio: Leaf,
  tar: Landmark,
  geo: Globe2,
  inf: Monitor,
  jis: Dumbbell,
  trb: HeartHandshake,
};

/** Fan roʻyxatda boʻlmasa — neytral ikona. */
export const DEFAULT_SUBJECT_ICON: LucideIcon = PenTool;
