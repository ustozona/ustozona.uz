import { GraduationCap, BookOpen, BarChart2, ClipboardCheck, CheckCircle, Target, CalendarRange, TrendingUp, MessageSquare } from "lucide-react";
import type { FeatureLoopItem } from "@/components/onboarding/FeatureLoop";

/** Ustozonaning asosiy funksiyalari — onboarding va login/register foni uchun yagona manba. */
export const PRODUCT_FEATURES: FeatureLoopItem[] = [
  {
    icon: GraduationCap,
    title: "Sinflar va oʻquvchilar",
    desc: "Sinflaringiz va oʻquvchilar roʻyxati bir joyda.",
    color: "green",
  },
  {
    icon: BookOpen,
    title: "Darslarni rejalashtirish",
    desc: "Dars jadvali, mavzular va oʻquv materiallari.",
    color: "sky",
  },
  {
    icon: BarChart2,
    title: "Jurnal va baholar",
    desc: "Baholash mezonlari va oʻzlashtirish tahlili.",
    color: "violet",
  },
  {
    icon: ClipboardCheck,
    title: "Davomat",
    desc: "Har bir darsda davomatni tez belgilang.",
    color: "amber",
  },
  {
    icon: CheckCircle,
    title: "Vazifalar",
    desc: "Shaxsiy va sinf vazifalarini rejalashtiring.",
    color: "red",
  },
  {
    icon: Target,
    title: "Standartlar",
    desc: "Oʻquv dasturi standartlari boʻyicha nazorat.",
    color: "teal",
  },
  {
    icon: CalendarRange,
    title: "Taqvim",
    desc: "Oʻquv yili va dars jadvalini bir joyda kuzating.",
    color: "indigo",
  },
  {
    icon: TrendingUp,
    title: "Hisobotlar",
    desc: "Sinf va oʻquvchi statistikasini tahlil qiling.",
    color: "blue",
  },
  {
    icon: MessageSquare,
    title: "Xulosa",
    desc: "Ota-onalar uchun davriy xulosalar tayyorlang.",
    color: "orange",
  },
];
