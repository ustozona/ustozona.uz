"use client";

import { useMemo, useState } from "react";
import { Sparkles, AlertTriangle, Bell, Users, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TypographyMuted, TypographyLabel } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import ClassListPanel from "@/components/ClassListPanel";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { withSidebarPageClass, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import {
  seedClass,
  classMisconceptions,
  mastery,
  decay,
  lastAssessedDate,
} from "@/lib/diagnostics";

const SEED_CLASS_ID = "9-b";

export default function XulosaPage() {
  const [storeClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });
  // Demo: diagnostik seed faqat 9-B uchun. Default shuni tanlaymiz.
  const [classId, setClassId] = useState<string>(SEED_CLASS_ID);
  const handleSelect = (id: string) => { setClassId(id); setSelectedClassId(id); };

  const data = seedClass();
  const isSeed = classId === SEED_CLASS_ID;

  // ─── Hisob-kitoblar (diagnostics sof funksiyalari) ──────────────────────
  const misconceptions = useMemo(() => {
    if (!isSeed) return [];
    return data.standards.flatMap((std) =>
      classMisconceptions(
        data.responses,
        data.questions,
        data.misconceptions,
        std.id,
        data.students.length
      ).map((cm) => ({ ...cm, standardId: std.id }))
    ).sort((a, b) => b.count - a.count);
  }, [isSeed, data]);

  const retrievals = useMemo(() => {
    if (!isSeed) return [];
    return data.standards
      .map((std) => ({ std, d: decay(lastAssessedDate(std.id)) }))
      .filter((x) => x.d.due)
      .sort((a, b) => b.d.days - a.d.days);
  }, [isSeed, data]);

  // Eng oxirgi baholangan standart boʻyicha oʻzlashtirmagan oʻquvchilar
  const attention = useMemo(() => {
    if (!isSeed) return null;
    const latest = [...data.standards]
      .map((std) => ({ std, date: lastAssessedDate(std.id) }))
      .filter((x) => x.date)
      .sort((a, b) => (a.date! < b.date! ? 1 : -1))[0];
    if (!latest) return null;
    const below = data.students.filter((stu) => {
      const m = mastery(data.responses, data.questions, stu.id, latest.std.id);
      return m.state === "not-mastered";
    });
    return { std: latest.std, students: below };
  }, [isSeed, data]);

  const totalStudents = isSeed ? data.students.length : 0;

  return (
    <>
      <div className="hidden lg:block w-[280px] shrink-0 h-full py-4 pl-4">
        <ClassListPanel page="standards" selectedClassId={storeClassId ?? ""} onSelect={handleSelect} />
      </div>

      <div className={withSidebarPageClass}>
        <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-16")}>
            <div className="flex items-center gap-3 min-w-0">
              <SectionIcon>
                <Sparkles className="size-[18px]" aria-hidden />
              </SectionIcon>
              <div className="min-w-0">
                <CardTitle>Dars xulosa</CardTitle>
                <TypographyMuted className="text-caption">
                  {isSeed ? "9-B · Informatika — keyingi darsga tayyorgarlik" : "Diagnostik maʼlumot tanlangan sinf uchun mavjud emas"}
                </TypographyMuted>
              </div>
            </div>
            <Badge variant="outline" className="shadow-none gap-1.5 shrink-0">
              <Sparkles className="size-3.5 text-primary" />
              Ustozona AI
            </Badge>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            {!isSeed ? (
              <EmptyState />
            ) : (
              <div className="px-6 py-6 space-y-8">
                {/* 1. Sinf misconception kartalari */}
                <Section
                  icon={<AlertTriangle className="size-4 text-destructive" />}
                  title="Sinfdagi umumiy xatolar"
                  hint="Distraktor tahlili asosida — qaysi tushunmovchilik keng tarqalgan"
                >
                  {misconceptions.length === 0 ? (
                    <Muted>Sezilarli umumiy xato aniqlanmadi.</Muted>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {misconceptions.map((cm) => (
                        <div key={cm.misconception.id} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-xs font-bold text-foreground">{cm.standardId}</span>
                            <Badge variant="outline" className="shadow-none border-destructive/30 text-destructive tabular-nums">
                              {cm.count}/{totalStudents} oʻquvchi
                            </Badge>
                          </div>
                          <p className="text-body text-foreground/90 leading-relaxed">{cm.misconception.label}</p>
                          {cm.misconception.remediationRef && (
                            <Button variant="outline" size="sm" className="shadow-none self-start gap-2">
                              <FileText className="size-3.5 text-amber-500" />
                              {cm.misconception.remediationRef}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* 2. Retrieval signallari */}
                <Section
                  icon={<Bell className="size-4 text-warning-foreground" />}
                  title="Takrorlash signallari"
                  hint="Unutilish arafasidagi mavzular — dars boshida 5 daqiqalik retrieval quiz"
                >
                  {retrievals.length === 0 ? (
                    <Muted>Hozircha takrorlash kerak boʻlgan mavzu yoʻq.</Muted>
                  ) : (
                    <div className="space-y-2">
                      {retrievals.map(({ std, d }) => (
                        <div key={std.id} className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
                          <span className="font-mono text-xs font-bold text-foreground shrink-0">{std.code}</span>
                          <p className="text-body text-foreground/90 flex-1 min-w-0 truncate">{std.desc}</p>
                          <Badge variant="outline" className="shadow-none border-warning/30 text-warning-foreground tabular-nums shrink-0">
                            {d.days} kun oldin
                          </Badge>
                          <Button variant="outline" size="sm" className="shadow-none shrink-0 gap-2">
                            Takrorlash <ArrowRight className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* 3. Alohida eʼtibor */}
                {attention && (
                  <Section
                    icon={<Users className="size-4 text-info" />}
                    title="Alohida eʼtibor talab qiladi"
                    hint={`${attention.std.code} boʻyicha 75% chegaradan past oʻquvchilar`}
                  >
                    {attention.students.length === 0 ? (
                      <Muted>
                        <CheckCircle2 className="size-4 text-success inline -mt-0.5 mr-1.5" />
                        Hamma oʻquvchi {attention.std.code} ni oʻzlashtirdi.
                      </Muted>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attention.students.map((stu) => (
                          <div key={stu.id} className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1">
                            <Avatar className="size-7">
                              <AvatarFallback className="text-[11px]">{stu.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-caption text-foreground">{stu.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="heading-small text-foreground">{title}</h2>
      </div>
      <TypographyLabel className="block text-muted-foreground/70 normal-case font-normal text-caption">{hint}</TypographyLabel>
      {children}
    </section>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <TypographyMuted className="text-body">{children}</TypographyMuted>;
}

function EmptyState() {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia><Illustration name="9" className="h-32 text-black dark:text-white" /></EmptyMedia>
        <EmptyTitle>Diagnostik maʼlumot yoʻq</EmptyTitle>
        <EmptyDescription>
          Demo bosqichida diagnostika faqat 9-B (Informatika) sinfi uchun mavjud. Roʻyxatdan 9-B ni tanlang.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
