"use client";

import * as React from "react";
import { Award, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeaderBar,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BehaviorSkill } from "@/lib/behavior-data";
import { AddCard, SkillCard } from "./SkillCard";
import type { SkillType } from "./SkillFormDialog";

/* Ball berish modali — koʻnikmalar karta-grid (ClassDojo UX).
   Bitta oʻquvchi ham, butun sinf ham shu modal orqali; sarlavha
   kontekstli. Koʻnikma bosilishi bilan ball yoziladi va modal yopiladi
   (tasdiq markaziy kartada). Oxirgi shtrixli karta — Sozlamalarga
   bormasdan yangi koʻnikma qoʻshish shortcuti. */

export function SkillGrid({
  skills,
  onSelect,
  onAdd,
}: {
  skills: BehaviorSkill[];
  onSelect: (skill: BehaviorSkill, el: HTMLElement) => void;
  onAdd?: () => void;
}) {
  const t = useTranslations("AwardDialog");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {skills.map((s) => (
        <SkillCard key={s.id} skill={s} onSelect={onSelect} />
      ))}
      {onAdd && <AddCard label={t("addSkill")} onClick={onAdd} />}
    </div>
  );
}

export function AwardDialog({
  open,
  onOpenChange,
  title,
  skills,
  onSelect,
  onAddSkill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  skills: BehaviorSkill[];
  onSelect: (skill: BehaviorSkill, el: HTMLElement) => void;
  /** Shtrixli karta bosilganda — qaysi tur tabidan ochilgani bilan. */
  onAddSkill?: (type: SkillType) => void;
}) {
  const t = useTranslations("AwardDialog");
  const positive = skills.filter((s) => s.points > 0);
  const negative = skills.filter((s) => s.points < 0);
  const both = positive.length > 0 && negative.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeaderBar icon={<Award className="size-[18px]" aria-hidden />} title={title} />

        {both ? (
          <Tabs defaultValue="positive">
            <TabsList variant="line" className="w-full border-b border-border px-6">
              <TabsTrigger value="positive">
                <ThumbsUp />
                {t("positive")}
              </TabsTrigger>
              <TabsTrigger value="negative">
                <ThumbsDown />
                {t("negative")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="positive" className="p-6">
              <SkillGrid
                skills={positive}
                onSelect={onSelect}
                onAdd={onAddSkill && (() => onAddSkill("positive"))}
              />
            </TabsContent>
            <TabsContent value="negative" className="p-6">
              <SkillGrid
                skills={negative}
                onSelect={onSelect}
                onAdd={onAddSkill && (() => onAddSkill("negative"))}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6">
            <SkillGrid
              skills={skills}
              onSelect={onSelect}
              onAdd={
                onAddSkill &&
                (() => onAddSkill(negative.length > 0 ? "negative" : "positive"))
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
