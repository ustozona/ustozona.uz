"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { SavedIndicator, useSaveSignal } from "./_components/SettingsShared";
import { SECTIONS } from "./sections";

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
  // dropdownidan yoki deep-linkdan (davomat gear, ?bell=1) kelgan har qanday
  // oʻzgarish sahifa allaqachon ochiq boʻlsa ham darhol qayta render qiladi.
  const param = searchParams.get("section");
  const active = param && SECTIONS.some((s) => s.id === param) ? param : "profil";

  // Boʻlimlardagi SavedIndicator'lar yonganida keladigan global puls —
  // headerdagi umumiy indikator shu signalga qaraydi.
  const savedSignal = useSaveSignal((s) => s.n);

  const select = (id: string) => {
    const url = new URLSearchParams(searchParams.toString());
    url.set("section", id);
    router.replace(`/dashboard/settings?${url.toString()}`, { scroll: false });
  };

  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const Body = current.Component;

  // Scroll boshlanganda tab qatoriga nozik soya beriladi.
  const [scrolled, setScrolled] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const handleScroll = () => setScrolled((viewportRef.current?.scrollTop ?? 0) > 0);

  return (
    <div className="h-full min-h-0 p-4 md:p-6">
      <Card className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-0 overflow-hidden py-0">
        {/* Sahifa sarlavhasi — tab qatori bilan birga qotib turadi */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <div className="flex items-center gap-3">
            <SectionIcon>
              <Settings />
            </SectionIcon>
            <div className="flex min-w-0 flex-col">
              <h1 className="heading-page text-foreground">Sozlamalar</h1>
              <TypographyMuted>
                Profil, taʼlim jarayoni va hisobga oid sozlamalar — bir joyda.
              </TypographyMuted>
            </div>
          </div>
          <div className="shrink-0 pt-1">
            <SavedIndicator signal={savedSignal} bubble={false} />
          </div>
        </div>

        <Tabs
          value={active}
          onValueChange={select}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          {/* Tab qatori — border kartaning toʻliq eniga choʻziladi */}
          <div
            className={cn(
              "shrink-0 border-b border-border px-3 pt-4 transition-shadow duration-200",
              scrolled && "shadow-[0_4px_6px_-6px_rgb(0_0_0_/_0.25)]"
            )}
          >
            <TabsList
              variant="line"
              className="justify-start gap-1 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {SECTIONS.map((s) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  // after chizigʻi standartda -5px pastda — border-b ustiga
                  // tushishi uchun bottom-0 ga koʻtariladi, aks holda
                  // overflow-x-auto uni kesib tashlaydi.
                  className="h-9 flex-none gap-1.5 px-3 group-data-[orientation=horizontal]/tabs:after:bottom-0"
                >
                  <s.icon />
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Faqat shu zona scroll boʻladi */}
          <ScrollArea className="min-h-0 flex-1" viewportRef={viewportRef} onScrollCapture={handleScroll}>
            <TabsContent value={active} className="p-5 md:p-6">
              <div className="flex flex-col gap-8">
                <Body />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </Card>
    </div>
  );
}
