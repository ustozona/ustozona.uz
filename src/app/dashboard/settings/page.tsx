"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { SavedIndicator, useDraftRegistry, useSaveSignal } from "./_components/SettingsShared";
import { SECTION_GROUPS, SECTIONS } from "./sections";

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
  // Param yoʻqligi mobilda "roʻyxat" holati, desktopda esa default "profil".
  const param = searchParams.get("section");
  const selected = param && SECTIONS.some((s) => s.id === param) ? param : null;

  // Boʻlimlardagi SavedIndicator'lar yonganida keladigan global puls —
  // headerdagi umumiy indikator shu signalga qaraydi.
  const savedSignal = useSaveSignal((s) => s.n);

  // Saqlanmagan draft'lar — Save/Cancel har kartaning oʻz footerida; bu
  // registr faqat boʻlim tark etilishidan oldingi tasdiq uchun ishlatiladi.
  const draftEntries = useDraftRegistry((s) => s.entries);
  const hasDirty = Object.values(draftEntries).some((e) => e.dirty);
  const [pendingId, setPendingId] = React.useState<string | null | false>(false);

  const navigate = (id: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (id) url.set("section", id);
    else url.delete("section");
    const qs = url.toString();
    router.replace(`/dashboard/settings${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const select = (id: string | null) => {
    if (hasDirty) {
      setPendingId(id);
      return;
    }
    navigate(id);
  };

  const current = SECTIONS.find((s) => s.id === (selected ?? "profil")) ?? SECTIONS[0];
  const Body = current.Component;

  // Scroll boshlanganda kontent sarlavhasiga nozik soya beriladi.
  const [scrolled, setScrolled] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const handleScroll = () => setScrolled((viewportRef.current?.scrollTop ?? 0) > 0);

  return (
    <div className="h-full min-h-0 p-4 md:p-6">
      <Card className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-0 overflow-hidden py-0">
        {/* Sahifa sarlavhasi */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 md:px-6 md:py-5">
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
          <div className="flex shrink-0 items-center gap-3 pt-1">
            <SavedIndicator signal={savedSignal} bubble={false} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Chap nav — faqat md+ */}
          <nav
            aria-label="Sozlamalar boʻlimlari"
            className="hidden w-56 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border px-3 py-4 md:flex"
          >
            {SECTION_GROUPS.map((g) => (
              <div key={g.id} className="flex flex-col gap-1">
                <span className="px-3 pb-1 text-label font-semibold uppercase text-muted-foreground">
                  {g.label}
                </span>
                {SECTIONS.filter((s) => s.group === g.id).map((s) => {
                  const active = current.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => select(s.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                        active
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <s.icon />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Mobil roʻyxat — param yoʻq boʻlsa (faqat < md) */}
          {!selected && (
            <ScrollArea className="min-h-0 flex-1 md:hidden">
              <div className="flex flex-col gap-6 p-5">
                {SECTION_GROUPS.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2">
                    <span className="text-label font-semibold uppercase text-muted-foreground">
                      {g.label}
                    </span>
                    <div className="overflow-hidden rounded-xl border border-border">
                      {SECTIONS.filter((s) => s.group === g.id).map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => select(s.id)}
                          className={cn(
                            "flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-muted",
                            i !== 0 && "border-t border-border"
                          )}
                        >
                          <s.icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium text-foreground">
                              {s.label}
                            </span>
                            <span className="truncate text-caption">{s.subtitle}</span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Boʻlim kontenti — desktopda doim, mobilda faqat param bor boʻlsa */}
          <div className={cn("min-h-0 min-w-0 flex-1 flex-col", selected ? "flex" : "hidden md:flex")}>
            {/* Orqaga tugmasi — faqat mobil (desktopda nav aktiv holatni koʻrsatadi) */}
            <div
              className={cn(
                "flex shrink-0 items-center gap-3 border-b border-border px-5 py-3 transition-shadow duration-fast md:hidden",
                scrolled && "shadow-[0_4px_6px_-6px_rgb(0_0_0_/_0.25)]"
              )}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Boʻlimlar roʻyxatiga qaytish"
                onClick={() => select(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <span className="truncate text-sm font-medium text-foreground">{current.label}</span>
            </div>
            <ScrollArea
              className="min-h-0 flex-1 bg-muted/40"
              viewportRef={viewportRef}
              onScrollCapture={handleScroll}
            >
              <div className="flex flex-col gap-5 p-5 md:p-6">
                <Body />
              </div>
            </ScrollArea>
          </div>
        </div>
      </Card>

      {/* Saqlanmagan oʻzgarishlar guard'i */}
      <AlertDialog open={pendingId !== false} onOpenChange={(o) => !o && setPendingId(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Saqlanmagan oʻzgarishlar bor</AlertDialogTitle>
            <AlertDialogDescription>
              Ushbu boʻlimda saqlanmagan oʻzgarishlar mavjud. Boshqa boʻlimga oʻtsangiz, ular
              bekor boʻladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Qolish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingId !== false) navigate(pendingId);
                setPendingId(false);
              }}
            >
              Baribir oʻtish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
