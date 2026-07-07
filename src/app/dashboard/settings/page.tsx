"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
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
import { SECTIONS, GROUP_LABELS, GROUP_ORDER } from "./sections";

export default function SettingsPage() {
  return (
    <React.Suspense fallback={null}>
      <SettingsPageInner />
    </React.Suspense>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?section= — yagona manba. useSearchParams reaktiv boʻlgani uchun header
  // dropdownidan yoki chapdagi nav'dan kelgan har qanday oʻzgarish (hatto
  // sahifa allaqachon ochiq boʻlsa ham) darhol qayta render qiladi.
  const param = searchParams.get("section");
  const active = param && SECTIONS.some((s) => s.id === param) ? param : "profil";

  const select = (id: string) => {
    const url = new URLSearchParams(searchParams.toString());
    url.set("section", id);
    router.replace(`/dashboard/settings?${url.toString()}`, { scroll: false });
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
            <nav className="flex flex-col gap-3 p-2">
              {GROUP_ORDER.map((group) => (
                <div key={group} className="flex flex-col gap-0.5">
                  <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {GROUP_LABELS[group]}
                  </span>
                  {SECTIONS.filter((s) => s.group === group).map((s) => {
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
                </div>
              ))}
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
                  {GROUP_ORDER.map((group) => (
                    <React.Fragment key={group}>
                      {SECTIONS.filter((s) => s.group === group).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </React.Fragment>
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
