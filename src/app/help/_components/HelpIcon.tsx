import {
  Calendar, LayoutGrid, Users, BookOpen, FileText, ClipboardList,
  Library, ClipboardCheck, Award, BarChart2, Target, TrendingUp,
  Settings, Rocket, Compass, type LucideIcon,
} from "lucide-react";
import type { HelpIconName } from "@/lib/help-content";

const ICON_MAP: Record<HelpIconName, LucideIcon> = {
  calendar: Calendar,
  layoutGrid: LayoutGrid,
  users: Users,
  bookOpen: BookOpen,
  fileText: FileText,
  clipboardList: ClipboardList,
  library: Library,
  clipboardCheck: ClipboardCheck,
  award: Award,
  barChart2: BarChart2,
  target: Target,
  trendingUp: TrendingUp,
  settings: Settings,
  rocket: Rocket,
  compass: Compass,
};

export function HelpIcon({ name, className }: { name: HelpIconName; className?: string }) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} />;
}
