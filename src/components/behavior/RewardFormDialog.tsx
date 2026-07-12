"use client";

import * as React from "react";
import { Gift, Minus, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeaderBar,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uid, type BehaviorReward } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { EmojiPickerButton } from "./EmojiPickerButton";

/* Mukofot formasi — qoʻshish/tahrirlash/oʻchirish (SkillFormDialog
   qolipi). Narx = ball (1–10000, sync zod chegarasi bilan mos).
   Oʻchirishda almashtirishlar tarixi saqlanadi (snapshot). */

const COST_MIN = 1;
const COST_MAX = 10000;

export function RewardFormDialog({
  open,
  onOpenChange,
  reward,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash; boʻlmasa yangi mukofot. */
  reward?: BehaviorReward;
}) {
  const rewards = useBehaviorStore((s) => s.rewards);
  const setRewards = useBehaviorStore((s) => s.setRewards);
  const redemptions = useBehaviorStore((s) => s.redemptions);

  const [name, setName] = React.useState("");
  const [cost, setCost] = React.useState("10");
  const [emoji, setEmoji] = React.useState("1f3c6");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(reward?.name ?? "");
    setCost(String(reward?.cost ?? 10));
    setEmoji(reward?.emoji ?? "1f3c6");
    setConfirmDelete(false);
  }, [open, reward]);

  const parsedCost = Number.parseInt(cost, 10);
  const costValid =
    Number.isInteger(parsedCost) && parsedCost >= COST_MIN && parsedCost <= COST_MAX;

  const usageCount = React.useMemo(
    () => (reward ? redemptions.filter((r) => r.rewardId === reward.id).length : 0),
    [redemptions, reward]
  );

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed || !costValid) return;
    const next: BehaviorReward = {
      id: reward?.id ?? uid("bhr"),
      name: trimmed,
      emoji,
      cost: parsedCost,
    };
    setRewards(
      reward
        ? rewards.map((r) => (r.id === reward.id ? next : r))
        : [...rewards, next]
    );
    onOpenChange(false);
  };

  const remove = () => {
    if (!reward) return;
    setRewards(rewards.filter((r) => r.id !== reward.id));
    setConfirmDelete(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-lg">
          <DialogHeaderBar
            icon={<Gift className="size-[18px]" aria-hidden />}
            title={reward ? "Mukofotni tahrirlash" : "Yangi mukofot"}
          />

          <div className="space-y-4 p-6">
            <div className="flex justify-center">
              <EmojiPickerButton value={emoji} onChange={setEmoji} size="lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bh-reward-name">Nom</Label>
              <Input
                id="bh-reward-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="Masalan: Joy tanlash huquqi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bh-reward-cost">Narxi (ball)</Label>
              <div className="flex h-9 w-32 items-stretch overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  aria-label="Kamaytirish"
                  onClick={() => setCost(String(Math.max(COST_MIN, (parsedCost || 0) - 1)))}
                  className="flex w-7 shrink-0 items-center justify-center border-r border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Minus className="size-3.5" aria-hidden />
                </button>
                <Input
                  id="bh-reward-cost"
                  type="number"
                  inputMode="numeric"
                  min={COST_MIN}
                  max={COST_MAX}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="h-7 min-w-0 flex-1 border-none bg-transparent px-0 text-center font-semibold tabular-nums shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Koʻpaytirish"
                  onClick={() => setCost(String(Math.min(COST_MAX, (parsedCost || 0) + 1)))}
                  className="flex w-7 shrink-0 items-center justify-center border-l border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
              <p className="text-caption">
                Oʻquvchi shuncha ball toʻplaganda almashtira oladi.
              </p>
            </div>
          </div>

          <DialogFooter
            className={cn(
              "border-t border-border bg-muted/20 px-6 py-4",
              reward ? "sm:justify-between" : undefined
            )}
          >
            {reward && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
                Oʻchirish
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button disabled={!name.trim() || !costValid} onClick={save}>
                Saqlash
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              «{reward?.name}» mukofotini oʻchirasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {usageCount > 0
                ? `Bu mukofot ${usageCount} marta almashtirilgan. `
                : ""}
              Almashtirishlar tarixi saqlanadi — mukofot faqat doʻkon
              roʻyxatidan yoʻqoladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Oʻchirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
