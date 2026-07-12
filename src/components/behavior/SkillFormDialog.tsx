"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { uid, type BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { EmojiPalette } from "./EmojiPalette";

/* Koʻnikma formasi — qoʻshish ham, tahrirlash ham (skill prop bor =
   tahrir). Nom qisqa (tez bosish uchun), tavsif aniq harakatga
   asoslangan (Daisy talabi) — ikki alohida maydon.

   Tahrir eski eventlarga taʼsir qilmaydi (ular snapshot); oʻchirishda
   ham tarix saqlanadi. Oxirgi koʻnikmani oʻchirish blok — ball berish
   modali boʻsh qolmasin. */

export type SkillType = "positive" | "negative";

const MAGNITUDES = [1, 2, 3, 4, 5];

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
  const [magnitude, setMagnitude] = React.useState(1);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Har ochilishda forma holati skill'dan (yoki defaultlardan) qayta tiklanadi.
  React.useEffect(() => {
    if (!open) return;
    if (skill) {
      setName(skill.name);
      setDescription(skill.description ?? "");
      setEmoji(skill.emoji);
      setType(skill.points > 0 ? "positive" : "negative");
      setMagnitude(Math.min(5, Math.abs(skill.points)));
    } else {
      setName("");
      setDescription("");
      setEmoji(defaultType === "positive" ? "1f31f" : "26a0-fe0f");
      setType(defaultType);
      setMagnitude(1);
    }
    setConfirmDelete(false);
  }, [open, skill, defaultType]);

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
    const next: BehaviorSkill = {
      id: skill?.id ?? uid("bhs"),
      name: trimmedName,
      emoji,
      points: (type === "positive" ? 1 : -1) * magnitude,
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {skill ? "Koʻnikmani tahrirlash" : "Yangi koʻnikma"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
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
              <p className="text-caption">
                Qaysi aniq harakat nazarda tutilishini yozing — koʻnikma
                kartasi ustiga borilganda koʻrinadi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Tabs value={type} onValueChange={(v) => setType(v as SkillType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="positive">Ijobiy</TabsTrigger>
                    <TabsTrigger value="negative">Salbiy</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label>Ball</Label>
                <Select
                  value={String(magnitude)}
                  onValueChange={(v) => setMagnitude(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAGNITUDES.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {type === "positive" ? `+${n}` : `−${n}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <EmojiPalette value={emoji} onChange={setEmoji} />
            </div>
          </div>

          <DialogFooter className={skill ? "sm:justify-between" : undefined}>
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
              <Button disabled={!name.trim()} onClick={save}>
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
