import dynamic from "next/dynamic";
import {
  User,
  Palette,
  BarChart2,
  CheckSquare,
  Clock,
  CalendarRange,
  CreditCard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/* Boʻlim registri — yagona manba. Har bir id shu yerda; boshqa joyda
   (masalan header dropdown) qoʻlda id yozish oʻrniga shu yerdagi
   `SECTION_IDS`ga murojaat qilinadi, xato-toʻliq link kelib chiqmasin.
   Tartib = tab tartibi. */

export type SectionDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  Component: React.ComponentType;
};

export const SECTIONS: SectionDef[] = [
  {
    id: "profil",
    label: "Profil",
    subtitle: "Shaxsiy maʼlumotlar va statistika",
    icon: User,
    Component: dynamic(() => import("./_components/ProfileSection")),
  },
  {
    id: "korinish",
    label: "Koʻrinish",
    subtitle: "Mavzu, fon va til sozlamalari",
    icon: Palette,
    Component: dynamic(() => import("./_components/AppearanceSection")),
  },
  {
    id: "oquv-yili",
    label: "Oʻquv yili",
    subtitle: "Choraklar va taʼtillar",
    icon: CalendarRange,
    Component: dynamic(() => import("./_components/AcademicYearSection")),
  },
  {
    id: "jadval",
    label: "Dars jadvali",
    subtitle: "Smena va qoʻngʻiroq",
    icon: Clock,
    Component: dynamic(() => import("./_components/BellSection")),
  },
  {
    id: "davomat",
    label: "Davomat",
    subtitle: "Statuslar va taʼsir",
    icon: CheckSquare,
    Component: dynamic(() => import("./_components/AttendanceSection")),
  },
  {
    id: "jurnal",
    label: "Jurnal",
    subtitle: "Baholash shkalasi",
    icon: BarChart2,
    Component: dynamic(() => import("./_components/JournalSection")),
  },
  {
    id: "tarif",
    label: "Tarif",
    subtitle: "Reja va imkoniyatlar",
    icon: CreditCard,
    Component: dynamic(() => import("./_components/PlanSection")),
  },
  {
    id: "hisob",
    label: "Xavfsizlik",
    subtitle: "Maxfiylik, eksport, DPA va hisobni oʻchirish",
    icon: ShieldCheck,
    Component: dynamic(() => import("./_components/DataSection")),
  },
];

export const SECTION_IDS = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.id])
) as Record<string, string>;
