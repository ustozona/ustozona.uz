"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCard, RewardCard, SkillCard } from "@/components/behavior/SkillCard";
import { RewardFormDialog } from "@/components/behavior/RewardFormDialog";
import {
  SkillFormDialog,
  type SkillType,
} from "@/components/behavior/SkillFormDialog";
import type { BehaviorReward, BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { SaveSignalPing, SettingsGroup } from "./SettingsShared";

/* Sozlamalar > Xulq — koʻnikma va mukofot editorlari, ball berish
   modalidagi bilan bir xil karta-grid (ClassDojo UX). Karta bosilsa
   tahrir dialogi, oxirgi shtrixli karta — yangi qoʻshish.

   Store'ga toʻgʻridan-toʻgʻri yoziladi (yagona manba), sync avtomatik.
   Tahrir/oʻchirish eski yozuvlarga taʼsir qilmaydi — eventlar snapshot. */

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4";

export default function BehaviorSection() {
  const skills = useBehaviorStore((s) => s.skills);
  const rewards = useBehaviorStore((s) => s.rewards);

  const [skillDialog, setSkillDialog] = React.useState<{
    skill?: BehaviorSkill;
    type: SkillType;
  } | null>(null);
  const [rewardDialog, setRewardDialog] = React.useState<{
    reward?: BehaviorReward;
  } | null>(null);

  const positive = skills.filter((s) => s.points > 0);
  const negative = skills.filter((s) => s.points < 0);

  const skillGrid = (list: BehaviorSkill[], type: SkillType) => (
    <div className={GRID_CLASS}>
      {list.map((s) => (
        <SkillCard
          key={s.id}
          skill={s}
          onSelect={(sk) => setSkillDialog({ skill: sk, type })}
        />
      ))}
      <AddCard
        label="Koʻnikma qoʻshish"
        onClick={() => setSkillDialog({ type })}
      />
    </div>
  );

  return (
    <>
      <SettingsGroup
        title="Koʻnikmalar"
        description="Ball berish modalida chiqadigan koʻnikmalar. Nom qisqa boʻlsin — qaysi aniq harakat nazarda tutilishini tavsifda yozing. Tahrir eski yozuvlarga taʼsir qilmaydi."
        action={<SaveSignalPing signal={skills} />}
      >
        <Tabs defaultValue="positive">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="positive">Ijobiy ({positive.length})</TabsTrigger>
            <TabsTrigger value="negative">Salbiy ({negative.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="positive" className="mt-3">
            {skillGrid(positive, "positive")}
          </TabsContent>
          <TabsContent value="negative" className="mt-3">
            {skillGrid(negative, "negative")}
          </TabsContent>
        </Tabs>
      </SettingsGroup>

      <SettingsGroup
        title="Ragʻbat doʻkoni"
        description="Oʻquvchilar toʻplagan ballarini shu mukofotlarga almashtiradi. Ijtimoiy-maqom mukofotlari (imtiyoz, rol) moddiy sovgʻalardan koʻra yaxshiroq ishlaydi."
        action={<SaveSignalPing signal={rewards} />}
      >
        <div className={GRID_CLASS}>
          {rewards.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              onSelect={(rw) => setRewardDialog({ reward: rw })}
            />
          ))}
          <AddCard label="Mukofot qoʻshish" onClick={() => setRewardDialog({})} />
        </div>
      </SettingsGroup>

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
