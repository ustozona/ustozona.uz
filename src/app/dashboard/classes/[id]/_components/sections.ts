import {
  LayoutGrid,
  CalendarDays,
  BookOpen,
  Users,
  BarChart3,
  ClipboardCheck,
  Award,
  Target,
} from "lucide-react";

/* ── Sinf-detali bo'limlari — yagona manba (server wrapper ham, client shell ham
   shu yerdan o'qiydi; "use client" modulдан eksport qilib bo'lmaydi). ── */
export const CLASS_SECTIONS = [
  { key: "overview",   label: "Umumiy",      subtitle: "Kalendar, vazifa va davomat", icon: LayoutGrid },
  { key: "planner",    label: "Reja",        subtitle: "Jadval va kalendar",          icon: CalendarDays },
  { key: "lessons",    label: "Darslar",     subtitle: "Bo'limlar va mavzular",       icon: BookOpen },
  { key: "students",   label: "O'quvchilar", subtitle: "Ro'yxat va profillar",        icon: Users },
  { key: "grades",     label: "Baholar",     subtitle: "Jurnal va o'zlashtirish",     icon: BarChart3 },
  { key: "attendance", label: "Davomat",     subtitle: "Kunlik yo'qlama",             icon: ClipboardCheck },
  { key: "behavior",   label: "Xulq",        subtitle: "Ballar va rag'bat",           icon: Award },
  { key: "standards",  label: "Standartlar", subtitle: "Dastur standartlari",         icon: Target },
] as const;

export type ClassSection = (typeof CLASS_SECTIONS)[number]["key"];
