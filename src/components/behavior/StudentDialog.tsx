"use client";

import * as React from "react";
import Link from "next/link";
import { Award, BarChart3, Gift, SquareArrowOutUpRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyMuted } from "@/components/ui/typography";
import {
  studentBalance,
  type BehaviorPeriod,
  type BehaviorReward,
  type BehaviorSkill,
} from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { SkillGrid } from "./AwardDialog";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { ReportPanel } from "./ReportPanel";
import type { SkillType } from "./SkillFormDialog";

/* ════════════════════════════════════════════════════════════════════
   Bitta-oʻquvchi modali (ClassDojo UX, chap navigatsiyali):

   1. Ball berish (default) — AwardDialog'dagi karta-grid.
   2. Ball sarflash — mukofotlar doʻkoni (balans yetmasa disabled +
      "N ball yetishmaydi") + pastda erkin sarflash formasi.
   3. Ballar hisoboti — davr filtri + donut + timeline (⋮ oʻchirish,
      izoh qoʻshish).

   Sarflashda undo — toast action orqali (removeRedemption).
   "Profilni ochish" → /dashboard/students/[id]?tab=behavior.
   ════════════════════════════════════════════════════════════════════ */

type PanelId = "award" | "shop" | "report";

const NAV: { id: PanelId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "award", label: "Ball berish", icon: Award },
  { id: "shop", label: "Ball sarflash", icon: Gift },
  { id: "report", label: "Ballar hisoboti", icon: BarChart3 },
];

const EMPTY_EVENTS: never[] = [];

export type DialogStudent = { id: string; name: string; initials: string };

export function StudentDialog({
  open,
  onOpenChange,
  classId,
  student,
  colorHex,
  onAward,
  onAddSkill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  student: DialogStudent | null;
  colorHex: string;
  /** Koʻnikma tanlandi — ota komponent yozadi (konfetti + tasdiq + yopish). */
  onAward: (skill: BehaviorSkill, el: HTMLElement) => void;
  onAddSkill: (type: SkillType) => void;
}) {
  const skills = useBehaviorStore((s) => s.skills);
  const rewards = useBehaviorStore((s) => s.rewards);
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const redemptions = useBehaviorStore((s) => s.redemptions);
  const redeem = useBehaviorStore((s) => s.redeem);
  const removeRedemption = useBehaviorStore((s) => s.removeRedemption);
  const removeEvents = useBehaviorStore((s) => s.removeEvents);
  const setEventNote = useBehaviorStore((s) => s.setEventNote);

  const [panel, setPanel] = React.useState<PanelId>("award");
  const [period, setPeriod] = React.useState<BehaviorPeriod>("thisWeek");

  // Har ochilishda default panelga qaytadi.
  React.useEffect(() => {
    if (open) setPanel("award");
  }, [open]);

  const classRedemptions = React.useMemo(
    () => redemptions.filter((r) => r.classId === classId),
    [redemptions, classId]
  );
  const balance = student
    ? studentBalance(events, classRedemptions, student.id)
    : 0;

  if (!student) return null;

  const spend = (spendArg: { reward: BehaviorReward } | { cost: number; name: string }) => {
    const id = redeem(classId, student.id, spendArg);
    if (!id) {
      toast.error("Balans yetarli emas");
      return false;
    }
    const label =
      "reward" in spendArg
        ? `${spendArg.reward.name} — ${spendArg.reward.cost} ball sarflandi`
        : `${spendArg.cost} ball sarflandi`;
    toast.success(label, {
      action: { label: "Bekor qilish", onClick: () => removeRedemption(id) },
    });
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-3xl">
        {/* Header: avatar + ism + balans + profil havolasi */}
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="size-11">
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: colorHex }}
              >
                {student.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-left">{student.name}</DialogTitle>
              <div className="mt-1 flex items-center gap-2.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    balance < 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  )}
                >
                  {balance} ball
                </span>
                <Link
                  href={`/dashboard/students/${encodeURIComponent(student.id)}?tab=behavior`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Profilni ochish
                  <SquareArrowOutUpRight className="size-3" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0">
          {/* Chap navigatsiya */}
          <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-border p-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = panel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPanel(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Panel mazmuni */}
          <ScrollArea className="h-[440px] min-w-0 flex-1">
            <div className="p-5">
              {panel === "award" && (
                <AwardPanel skills={skills} onAward={onAward} onAddSkill={onAddSkill} />
              )}
              {panel === "shop" && (
                <ShopPanel rewards={rewards} balance={balance} onSpend={spend} />
              )}
              {panel === "report" && (
                <ReportPanel
                  events={events.filter((e) => e.studentId === student.id)}
                  period={period}
                  onPeriodChange={setPeriod}
                  onDelete={(e) => removeEvents(classId, [e.id])}
                  onSaveNote={(e, note) => setEventNote(classId, e.id, note)}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── 1-panel: Ball berish ───────────────────────────────────────────── */

function AwardPanel({
  skills,
  onAward,
  onAddSkill,
}: {
  skills: BehaviorSkill[];
  onAward: (skill: BehaviorSkill, el: HTMLElement) => void;
  onAddSkill: (type: SkillType) => void;
}) {
  const positive = skills.filter((s) => s.points > 0);
  const negative = skills.filter((s) => s.points < 0);
  const both = positive.length > 0 && negative.length > 0;

  if (!both) {
    return (
      <SkillGrid
        skills={skills}
        onSelect={onAward}
        onAdd={() => onAddSkill(negative.length > 0 ? "negative" : "positive")}
      />
    );
  }
  return (
    <Tabs defaultValue="positive">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="positive">Ijobiy</TabsTrigger>
        <TabsTrigger value="negative">Salbiy</TabsTrigger>
      </TabsList>
      <TabsContent value="positive" className="mt-4">
        <SkillGrid skills={positive} onSelect={onAward} onAdd={() => onAddSkill("positive")} />
      </TabsContent>
      <TabsContent value="negative" className="mt-4">
        <SkillGrid skills={negative} onSelect={onAward} onAdd={() => onAddSkill("negative")} />
      </TabsContent>
    </Tabs>
  );
}

/* ── 2-panel: Ball sarflash (doʻkon + erkin sarflash) ───────────────── */

function ShopPanel({
  rewards,
  balance,
  onSpend,
}: {
  rewards: BehaviorReward[];
  balance: number;
  onSpend: (spend: { reward: BehaviorReward } | { cost: number; name: string }) => boolean;
}) {
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  const parsed = Number.parseInt(amount, 10);
  const freeValid =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= balance && note.trim().length > 0;

  const submitFree = () => {
    if (!freeValid) return;
    if (onSpend({ cost: parsed, name: note.trim() })) {
      setAmount("");
      setNote("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {rewards.length === 0 ? (
          <TypographyMuted className="text-sm">
            Doʻkon boʻsh — Sozlamalar &gt; Xulq-atvor boʻlimida mukofot qoʻshing.
          </TypographyMuted>
        ) : (
          rewards.map((r) => {
            const missing = r.cost - balance;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <BehaviorEmoji code={r.emoji} label={r.name} className="size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                  <TypographyMuted className="text-xs tabular-nums">
                    {r.cost} ball
                    {missing > 0 && (
                      <span className="text-destructive"> · {missing} ball yetishmaydi</span>
                    )}
                  </TypographyMuted>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={missing > 0}
                  onClick={() => onSpend({ reward: r })}
                >
                  Almashtirish
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Erkin sarflash — roʻyxatda yoʻq holatlar uchun */}
      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Erkin sarflash</p>
          <TypographyMuted className="text-xs">
            Roʻyxatda yoʻq holatlar uchun — miqdor va izoh kiriting.
          </TypographyMuted>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="bh-free-amount" className="text-xs">
              Miqdor
            </Label>
            <Input
              id="bh-free-amount"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(balance, 1)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24"
            />
          </div>
          <div className="min-w-40 flex-1 space-y-1.5">
            <Label htmlFor="bh-free-note" className="text-xs">
              Izoh
            </Label>
            <Input
              id="bh-free-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Nimaga sarflandi?"
            />
          </div>
          <Button disabled={!freeValid} onClick={submitFree}>
            Sarflash
          </Button>
        </div>
      </div>
    </div>
  );
}

/* 3-panel (Ballar hisoboti) — umumiy ReportPanel.tsx'dan. */
