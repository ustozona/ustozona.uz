"use client";

import * as React from "react";
import { Award, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { uid, type BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { formatPoints } from "./SkillCard";

/* Koʻnikma formasi — qoʻshish ham, tahrirlash ham (skill prop bor =
   tahrir). Nom qisqa (tez bosish uchun), tavsif aniq harakatga
   asoslangan (Daisy talabi) — ikki alohida maydon.

   Tahrir eski eventlarga taʼsir qilmaydi (ular snapshot); oʻchirishda
   ham tarix saqlanadi. Oxirgi koʻnikmani oʻchirish blok — ball berish
   modali boʻsh qolmasin. */

export type SkillType = "positive" | "negative";

const MAGNITUDE_MIN = 1;
const MAGNITUDE_MAX = 5;
const MAGNITUDE_PRESETS = [1, 2, 3, 4, 5];

export function SkillFormDialog({
  open,
  onOpenChange,
  skill,
  defaultType = "positive",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash; boʻlmasa yangi koʻnikma. */
  skill?: BehaviorSkill;
  /** Yangi koʻnikma uchun boshlangʻich tur (qaysi tabdan ochilgani). */
  defaultType?: SkillType;
}) {
  const skills = useBehaviorStore((s) => s.skills);
  const setSkills = useBehaviorStore((s) => s.setSkills);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState("1f31f");
  const [type, setType] = React.useState<SkillType>("positive");
  const [magnitude, setMagnitude] = React.useState("1");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Har ochilishda forma holati skill'dan (yoki defaultlardan) qayta tiklanadi.
  React.useEffect(() => {
    if (!open) return;
    if (skill) {
      const abs = Math.abs(skill.points);
      setName(skill.name);
      setDescription(skill.description ?? "");
      setEmoji(skill.emoji);
      setType(skill.points > 0 ? "positive" : "negative");
      setMagnitude(String(Math.min(MAGNITUDE_MAX, Math.max(MAGNITUDE_MIN, abs))));
    } else {
      setName("");
      setDescription("");
      setEmoji(defaultType === "positive" ? "1f31f" : "26a0-fe0f");
      setType(defaultType);
      setMagnitude("1");
    }
    setConfirmDelete(false);
  }, [open, skill, defaultType]);

  const parsedMagnitude = Number.parseInt(magnitude, 10);
  const magnitudeValid =
    Number.isInteger(parsedMagnitude) &&
    parsedMagnitude >= MAGNITUDE_MIN &&
    parsedMagnitude <= MAGNITUDE_MAX;

  const canDelete = skill !== undefined && skills.length > 1;

  // Oʻchirish dialogida kontekst — koʻnikma nechta yozuvda ishlatilgan.
  const usageCount = React.useMemo(() => {
    if (!skill) return 0;
    let n = 0;
    for (const events of Object.values(eventsByClass)) {
      for (const e of events) if (e.skillId === skill.id) n += 1;
    }
    return n;
  }, [eventsByClass, skill]);

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedDesc = description.trim();
    if (!magnitudeValid) return;
    const next: BehaviorSkill = {
      id: skill?.id ?? uid("bhs"),
      name: trimmedName,
      emoji,
      points: (type === "positive" ? 1 : -1) * parsedMagnitude,
      ...(trimmedDesc ? { description: trimmedDesc } : {}),
    };
    setSkills(
      skill
        ? skills.map((s) => (s.id === skill.id ? next : s))
        : [...skills, next]
    );
    onOpenChange(false);
  };

  const remove = () => {
    if (!skill) return;
    setSkills(skills.filter((s) => s.id !== skill.id));
    setConfirmDelete(false);
    onOpenChange(false);
  };

  const deleteButton = (
    <Button
      variant="ghost"
      size="sm"
      disabled={!canDelete}
      onClick={() => setConfirmDelete(true)}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="size-4" aria-hidden />
      Oʻchirish
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-lg">
          <DialogHeaderBar
            icon={<Award className="size-[18px]" aria-hidden />}
            title={
              <span className="flex items-center gap-2">
                {skill ? "Koʻnikmani tahrirlash" : "Yangi koʻnikma"}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] font-medium",
                    type === "positive"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {type === "positive" ? "Ijobiy" : "Salbiy"}
                </span>
              </span>
            }
          />

          <div className="flex justify-center bg-muted/40 pt-5 pb-3">
            <div className="relative flex w-28 flex-col items-center gap-2 rounded-xl border border-border bg-card px-2.5 pt-5 pb-3">
              <span
                className={cn(
                  "absolute top-1.5 right-2 text-xs font-bold tabular-nums",
                  type === "positive" ? "text-success" : "text-destructive"
                )}
              >
                {formatPoints((type === "positive" ? 1 : -1) * (parsedMagnitude || 0))}
              </span>
              <BehaviorEmoji code={emoji} className="size-8" />
              <span
                className={cn(
                  "line-clamp-2 text-center text-[13px] font-medium leading-tight",
                  name.trim() ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {name.trim() || "Nom"}
              </span>
            </div>
          </div>

          <div className="space-y-4 bg-background p-6">
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <span className="block h-5" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <EmojiPickerButton value={emoji} onChange={setEmoji} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Emojini oʻzgartirish</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="bh-skill-name">Nom</Label>
                <Input
                  id="bh-skill-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  placeholder="Masalan: Faol qatnashdi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bh-skill-magnitude">Ball</Label>
                <Select value={magnitude} onValueChange={setMagnitude}>
                  <SelectTrigger id="bh-skill-magnitude" className="w-[4.5rem]">
                    <SelectValue>
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          type === "positive" ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        {type === "positive" ? "+" : "−"}
                        {magnitude}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MAGNITUDE_PRESETS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {type === "positive" ? "+" : "−"}
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="group space-y-2">
              <Label htmlFor="bh-skill-desc">
                Tavsif{" "}
                <span className="font-normal text-muted-foreground">(ixtiyoriy)</span>
              </Label>
              <Textarea
                id="bh-skill-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder='Masalan: "Savolga dalil bilan javob berdi"'
              />
              <p className="text-caption hidden group-focus-within:block">
                Qaysi aniq harakat nazarda tutilishini yozing — koʻnikma
                kartasi ustiga borilganda koʻrinadi.
              </p>
            </div>
          </div>

          <DialogFooter
            className={cn(
              "border-t border-border bg-muted/20 p-6 pt-4",
              skill ? "sm:justify-between" : undefined
            )}
          >
            {skill &&
              (canDelete ? (
                deleteButton
              ) : (
                <Tooltip>
                  {/* disabled element hodisa bermaydi — trigger uchun span oʻraladi */}
                  <TooltipTrigger asChild>
                    <span className="inline-flex">{deleteButton}</span>
                  </TooltipTrigger>
                  <TooltipContent>Kamida bitta koʻnikma qolishi kerak</TooltipContent>
                </Tooltip>
              ))}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button disabled={!name.trim() || !magnitudeValid} onClick={save}>
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
              «{skill?.name}» koʻnikmasini oʻchirasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {usageCount > 0
                ? `Bu koʻnikma bilan ${usageCount} ta ball berilgan. `
                : ""}
              Berilgan ballar tarixi saqlanadi — eski yozuvlar oʻchmaydi,
              faqat koʻnikma ball berish roʻyxatidan yoʻqoladi.
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
