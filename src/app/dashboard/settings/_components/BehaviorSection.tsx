"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCard, RewardCard, SkillCard } from "@/components/behavior/SkillCard";
import { RewardFormDialog } from "@/components/behavior/RewardFormDialog";
import {
  SkillFormDialog,
  type SkillType,
} from "@/components/behavior/SkillFormDialog";
import AutoPointsEditor from "@/components/behavior/AutoPointsEditor";
import type { BehaviorReward, BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { SaveFooter, SettingsCard, useDraft, useRegisterDraft } from "./SettingsShared";

/* Sozlamalar > Xulq — avto-ball qoidalari (explicit Save, muharrir xulq
   sahifasidagi modal bilan umumiy) hamda koʻnikma/mukofot editorlari — ball
   berish modalidagi bilan bir xil karta-grid (ClassDojo UX). Karta bosilsa
   tahrir dialogi, oxirgi shtrixli karta — yangi qoʻshish. Tahrir/oʻchirish
   eski yozuvlarga taʼsir qilmaydi — eventlar snapshot. */

/* auto-fill/minmax — konteyner kengligiga qarab (viewport emas) moslashadi,
   shu sababli sidebar ochilib-yopilganda ustunlar soni ham darhol qayta
   hisoblanadi (fixed sm:/md: breakpointlarida bu ishlamas edi). */
const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3";

/** Avtomatik ballar kartasi — draft + explicit Save. */
function AutoPointsCard() {
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const setAutoSettings = useBehaviorStore((s) => s.setAutoSettings);
  const { draft, setDraft, dirty, save, reset } = useDraft(autoSettings, setAutoSettings);
  useRegisterDraft("xulq-avto", dirty, save, reset);

  return (
    <SettingsCard
      title="Avtomatik ballar"
      description="Davomat va jurnal belgilariga qarab xulq ballari oʻzi yoziladi; belgi tuzatilsa ball ham tuzatiladi. Avto-ballar ataylab kichik — asosiy pedagogik baholash qoʻlda beriladigan koʻnikma ballarida qolsin."
      footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
    >
      <AutoPointsEditor value={draft} onChange={setDraft} />
    </SettingsCard>
  );
}

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
      <AutoPointsCard />

      <SettingsCard
        title="Koʻnikmalar"
        description="Ball berish modalida chiqadigan koʻnikmalar. Nom qisqa boʻlsin — aniq harakatni tavsifda yozing. Tahrir eski yozuvlarga taʼsir qilmaydi."
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
      </SettingsCard>

      <SettingsCard
        title="Ragʻbat doʻkoni"
        description="Oʻquvchilar toʻplagan ballarini shu mukofotlarga almashtiradi. Ijtimoiy-maqom mukofotlari (imtiyoz, rol) moddiy sovgʻalardan koʻra yaxshiroq ishlaydi."
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
