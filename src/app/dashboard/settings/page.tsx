"use client";

import * as React from "react";
import {
  User,
  Palette,
  BarChart2,
  CheckSquare,
  Clock,
  CalendarRange,
  CreditCard,
  Database,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import ProfileSection from "./_components/ProfileSection";
import AppearanceSection from "./_components/AppearanceSection";
import JournalSection from "./_components/JournalSection";
import AttendanceSection from "./_components/AttendanceSection";
import BellSection from "./_components/BellSection";
import AcademicYearSection from "./_components/AcademicYearSection";
import PlanSection from "./_components/PlanSection";
import DataSection from "./_components/DataSection";

type SectionDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  Component: React.ComponentType;
};

const SECTIONS: SectionDef[] = [
  { id: "profil", label: "Profil", subtitle: "Shaxsiy maʼlumot va statistika", icon: User, Component: ProfileSection },
  { id: "korinish", label: "Koʻrinish", subtitle: "Mavzu, fon va til", icon: Palette, Component: AppearanceSection },
  { id: "jurnal", label: "Jurnal", subtitle: "Baholash shkalasi", icon: BarChart2, Component: JournalSection },
  { id: "davomat", label: "Davomat", subtitle: "Statuslar va taʼsir", icon: CheckSquare, Component: AttendanceSection },
  { id: "jadval", label: "Dars jadvali", subtitle: "Smena va qoʻngʻiroq", icon: Clock, Component: BellSection },
  { id: "oquv-yili", label: "Oʻquv yili", subtitle: "Choraklar va taʼtillar", icon: CalendarRange, Component: AcademicYearSection },
  { id: "tarif", label: "Tarif", subtitle: "Reja va imkoniyatlar", icon: CreditCard, Component: PlanSection },
  { id: "hisob", label: "Hisob", subtitle: "Eksport, DPA va xavfsizlik", icon: Database, Component: DataSection },
];

export default function SettingsPage() {
  const [active, setActive] = React.useState("profil");

  // ?section= bilan sinxron (Suspense talab qilmaydigan yengil usul).
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("section");
    if (p && SECTIONS.some((s) => s.id === p)) setActive(p);
  }, []);

  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", id);
    window.history.replaceState(null, "", url);
  };

  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const Body = current.Component;

  return (
    <div className="flex-1 min-w-0 h-full min-h-0 flex gap-6 p-4 md:p-6 overflow-hidden">
      {/* Chap: boʻlim navigatsiyasi */}
      <aside className="hidden w-60 shrink-0 md:block">
        <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
          <div className="flex items-center gap-2 border-b border-border px-4 py-4">
            <SectionIcon>
              <Settings />
            </SectionIcon>
            <CardTitle>Sozlamalar</CardTitle>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <nav className="flex flex-col gap-0.5 p-2">
              {SECTIONS.map((s) => {
                const isActive = s.id === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => select(s.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <s.icon className="size-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </Card>
      </aside>

      {/* Oʻng: tanlangan boʻlim */}
      <div className="h-full min-h-0 min-w-0 flex-1">
        <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
          <div className="flex min-h-[4.5rem] shrink-0 items-center gap-3 border-b border-border px-5 py-4 md:px-6">
            <SectionIcon>
              <current.icon />
            </SectionIcon>
            <div className="flex min-w-0 flex-col">
              <CardTitle className="truncate">{current.label}</CardTitle>
              <TypographyMuted className="hidden truncate sm:block">{current.subtitle}</TypographyMuted>
            </div>

            {/* Mobil boʻlim tanlagichi */}
            <div className="ml-auto md:hidden">
              <Select value={active} onValueChange={select}>
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex max-w-2xl flex-col gap-8 p-5 md:p-6">
              <Body />
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
