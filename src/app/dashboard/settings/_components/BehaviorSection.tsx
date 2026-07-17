"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCard, RewardCard, SkillCard } from "@/components/behavior/SkillCard";
import { RewardFormDialog } from "@/components/behavior/RewardFormDialog";
import {
  SkillFormDialog,
  type SkillType,
} from "@/components/behavior/SkillFormDialog";
import { useAutoRuleTiles } from "@/components/behavior/AutoPointsEditor";
import type { BehaviorReward, BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { SaveFooter, SettingsCard, useDraft, useRegisterDraft } from "./SettingsShared";

/* Sozlamalar > Xulq — avtomatik va qoʻlda beriladigan ballar BIR XIL
   karta-gridda (oʻqituvchi uchun ikkalasi ham "xulq balli"): avto-qoida
   kartalari ("Avto" nishonli, Popover'da tahrirlanadi, explicit Save) +
   koʻnikma kartalari (dialogda tahrirlanadi, darhol saqlanadi) Ijobiy/
   Salbiy tabga ball ishorasiga qarab aralashtiriladi. Oxirgi shtrixli
   karta — yangi koʻnikma qoʻshish. Tahrir/oʻchirish eski yozuvlarga
   taʼsir qilmaydi — eventlar snapshot. */

const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3";

export default function BehaviorSection() {
  const t = useTranslations("BehaviorSection");
  const skills = useBehaviorStore((s) => s.skills);
  const rewards = useBehaviorStore((s) => s.rewards);
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const setAutoSettings = useBehaviorStore((s) => s.setAutoSettings);
  const { draft: autoDraft, setDraft: setAutoDraft, dirty, save, reset } = useDraft(
    autoSettings,
    setAutoSettings
  );
  useRegisterDraft("xulq-avto", dirty, save, reset);
  const autoTiles = useAutoRuleTiles(autoDraft, setAutoDraft);

  const [skillDialog, setSkillDialog] = React.useState<{
    skill?: BehaviorSkill;
    type: SkillType;
  } | null>(null);
  const [rewardDialog, setRewardDialog] = React.useState<{
    reward?: BehaviorReward;
  } | null>(null);

  const positive = skills.filter((s) => s.points > 0);
  const negative = skills.filter((s) => s.points < 0);

  const skillGrid = (list: BehaviorSkill[], type: SkillType, autoRules: React.ReactNode[]) => (
    <div className={GRID_CLASS}>
      {autoRules}
      {list.map((s) => (
        <SkillCard
          key={s.id}
          skill={s}
          onSelect={(sk) => setSkillDialog({ skill: sk, type })}
        />
      ))}
      <AddCard
        label={t("addSkill")}
        onClick={() => setSkillDialog({ type })}
      />
    </div>
  );

  return (
    <>
      <SettingsCard
        title={t("title")}
        description={t("description")}
        footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
      >
        <Tabs defaultValue="positive">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="positive">{t("tabPositive", { count: positive.length + autoTiles.positive.length })}</TabsTrigger>
            <TabsTrigger value="negative">{t("tabNegative", { count: negative.length + autoTiles.negative.length })}</TabsTrigger>
          </TabsList>
          <TabsContent value="positive" className="mt-3">
            {skillGrid(positive, "positive", autoTiles.positive)}
          </TabsContent>
          <TabsContent value="negative" className="mt-3">
            {skillGrid(negative, "negative", autoTiles.negative)}
          </TabsContent>
        </Tabs>
      </SettingsCard>

      <SettingsCard
        title={t("rewardsTitle")}
        description={t("rewardsDescription")}
      >
        <div className={GRID_CLASS}>
          {rewards.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              onSelect={(rw) => setRewardDialog({ reward: rw })}
            />
          ))}
          <AddCard label={t("addReward")} onClick={() => setRewardDialog({})} />
        </div>
      </SettingsCard>

      <SkillFormDialog
        open={skillDialog !== null}
        onOpenChange={(o) => {
          if (!o) setSkillDialog(null);
        }}
        skill={skillDialog?.skill}
        defaultType={skillDialog?.type ?? "positive"}
      />
      <RewardFormDialog
        open={rewardDialog !== null}
        onOpenChange={(o) => {
          if (!o) setRewardDialog(null);
        }}
        reward={rewardDialog?.reward}
      />
    </>
  );
}
