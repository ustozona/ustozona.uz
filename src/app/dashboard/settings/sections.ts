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
   `SECTION_IDS`ga murojaat qilinadi, xato-toʻliq link kelib chiqmasin. */

export type SectionGroup = "shaxsiy" | "oqitish" | "hisob";

export type SectionDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  group: SectionGroup;
  Component: React.ComponentType;
};

export const GROUP_LABELS: Record<SectionGroup, string> = {
  shaxsiy: "Shaxsiy",
  oqitish: "Taʼlim",
  hisob: "Profil va tariflar",
};

export const SECTIONS: SectionDef[] = [
  {
    id: "profil",
    label: "Profil",
    subtitle: "Shaxsiy maʼlumotlar va statistika",
    icon: User,
    group: "shaxsiy",
    Component: dynamic(() => import("./_components/ProfileSection")),
  },
  {
    id: "korinish",
    label: "Koʻrinish",
    subtitle: "Mavzu, fon va til",
    icon: Palette,
    group: "shaxsiy",
    Component: dynamic(() => import("./_components/AppearanceSection")),
  },
  {
    id: "jurnal",
    label: "Jurnal",
    subtitle: "Baholash shkalasi",
    icon: BarChart2,
    group: "oqitish",
    Component: dynamic(() => import("./_components/JournalSection")),
  },
  {
    id: "davomat",
    label: "Davomat",
    subtitle: "Statuslar va taʼsir",
    icon: CheckSquare,
    group: "oqitish",
    Component: dynamic(() => import("./_components/AttendanceSection")),
  },
  {
    id: "jadval",
    label: "Dars jadvali",
    subtitle: "Smena va qoʻngʻiroq",
    icon: Clock,
    group: "oqitish",
    Component: dynamic(() => import("./_components/BellSection")),
  },
  {
    id: "oquv-yili",
    label: "Oʻquv yili",
    subtitle: "Choraklar va taʼtillar",
    icon: CalendarRange,
    group: "oqitish",
    Component: dynamic(() => import("./_components/AcademicYearSection")),
  },
  {
    id: "tarif",
    label: "Tarif",
    subtitle: "Reja va imkoniyatlar",
    icon: CreditCard,
    group: "hisob",
    Component: dynamic(() => import("./_components/PlanSection")),
  },
  {
    id: "hisob",
    label: "Xavfsizlik va maxfiylik",
    subtitle: "Eksport, DPA va hisobni oʻchirish",
    icon: ShieldCheck,
    group: "hisob",
    Component: dynamic(() => import("./_components/DataSection")),
  },
];

export const SECTION_IDS = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.id])
) as Record<string, string>;

export const GROUP_ORDER: SectionGroup[] = ["shaxsiy", "oqitish", "hisob"];
