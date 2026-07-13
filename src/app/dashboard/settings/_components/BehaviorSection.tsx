"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AddCard, RewardCard, SkillCard } from "@/components/behavior/SkillCard";
import { RewardFormDialog } from "@/components/behavior/RewardFormDialog";
import {
  SkillFormDialog,
  type SkillType,
} from "@/components/behavior/SkillFormDialog";
import type {
  BehaviorAutoSettings,
  BehaviorReward,
  BehaviorSkill,
} from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { SaveSignalPing, SettingsGroup, SettingsList } from "./SettingsShared";

/* Sozlamalar > Xulq — koʻnikma va mukofot editorlari, ball berish
   modalidagi bilan bir xil karta-grid (ClassDojo UX). Karta bosilsa
   tahrir dialogi, oxirgi shtrixli karta — yangi qoʻshish.

   Store'ga toʻgʻridan-toʻgʻri yoziladi (yagona manba), sync avtomatik.
   Tahrir/oʻchirish eski yozuvlarga taʼsir qilmaydi — eventlar snapshot. */

/* auto-fill/minmax — konteyner kengligiga qarab (viewport emas) moslashadi,
   shu sababli sidebar ochilib-yopilganda ustunlar soni ham darhol qayta
   hisoblanadi (fixed sm:/md: breakpointlarida bu ishlamas edi). */
const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3";

/** Ball qiymati tanlagichi — musbatga "+" qoʻshiladi. */
function PointsSelect({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-20 tabular-nums" size="sm" disabled={disabled} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={String(o)} className="tabular-nums">
            {o > 0 ? `+${o}` : String(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Avtomatik ballar guruhi — vazn falsafasi: avto ballar past (±1..±2),
    qoʻlda pedagogik ballar yuqori. Toggle OFF tarixni oʻchirmaydi. */
function AutoPointsGroup() {
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const setAutoSettings = useBehaviorStore((s) => s.setAutoSettings);

  const patch = (partial: Partial<BehaviorAutoSettings>) =>
    setAutoSettings({ ...autoSettings, ...partial });

  const att = autoSettings.attendanceEnabled;
  const jrn = autoSettings.journalEnabled;

  return (
    <SettingsGroup
      title="Avtomatik ballar"
      description="Davomat va jurnal belgilariga qarab xulq ballari oʻzi yoziladi. Belgini keyin tuzatsangiz, ball ham oʻzi tuzatiladi. Avto-ballar ataylab kichik — asosiy pedagogik baholash qoʻlda beriladigan koʻnikma ballarida qolsin."
      action={<SaveSignalPing signal={autoSettings} />}
    >
      <SettingsList
        items={[
          {
            key: "att-master",
            title: "Davomatdan avto-ballar",
            description: "Kechikish va sababsiz kelmaslik xulq balliga avtomatik taʼsir qiladi",
            trailing: (
              <Switch
                checked={att}
                onCheckedChange={(on) => patch({ attendanceEnabled: on })}
                aria-label="Davomatdan avto-ballarni yoqish"
              />
            ),
          },
          {
            key: "late",
            title: "Kechikdi",
            dimmed: !att,
            trailing: (
              <PointsSelect
                value={autoSettings.latePoints}
                options={[-1, -2, -3, -4, -5]}
                onChange={(v) => patch({ latePoints: v })}
                disabled={!att}
                ariaLabel="Kechikish balli"
              />
            ),
          },
          {
            key: "absent",
            title: "Sababsiz kelmadi",
            description: "Sababli kelmaslik ballga taʼsir qilmaydi",
            dimmed: !att,
            trailing: (
              <PointsSelect
                value={autoSettings.absentPoints}
                options={[-1, -2, -3, -4, -5]}
                onChange={(v) => patch({ absentPoints: v })}
                disabled={!att}
                ariaLabel="Sababsiz kelmaslik balli"
              />
            ),
          },
          {
            key: "present",
            title: "Har kelgan dars uchun",
            description:
              "Odatda oʻchiq (ball qadrsizlanadi) — davomati juda past sinflar uchun vaqtincha yoqish mumkin",
            dimmed: !att || !autoSettings.presentEnabled,
            trailing: (
              <>
                <PointsSelect
                  value={autoSettings.presentPoints}
                  options={[1, 2, 3]}
                  onChange={(v) => patch({ presentPoints: v })}
                  disabled={!att || !autoSettings.presentEnabled}
                  ariaLabel="Kelgan dars balli"
                />
                <Switch
                  checked={autoSettings.presentEnabled}
                  onCheckedChange={(on) => patch({ presentEnabled: on })}
                  disabled={!att}
                  aria-label="Har kelgan dars uchun ballni yoqish"
                />
              </>
            ),
          },
          {
            key: "streak",
            title: "Davomat seriyasi bonusi",
            description:
              "Ketma-ket shuncha dars kechikish va sababsiz qoldirishsiz — bonus. Sababli kelmaslik seriyani buzmaydi (pauza). Boshlangʻich yoki kam soatli fanga 3, yuqori sinfga 5 tavsiya etiladi.",
            dimmed: !att || !autoSettings.streakEnabled,
            trailing: (
              <>
                <PointsSelect
                  value={autoSettings.streakN}
                  options={[2, 3, 4, 5, 6, 7, 8, 10]}
                  onChange={(v) => patch({ streakN: v })}
                  disabled={!att || !autoSettings.streakEnabled}
                  ariaLabel="Seriya uzunligi (dars soni)"
                />
                <PointsSelect
                  value={autoSettings.streakBonus}
                  options={[1, 2, 3, 4, 5]}
                  onChange={(v) => patch({ streakBonus: v })}
                  disabled={!att || !autoSettings.streakEnabled}
                  ariaLabel="Seriya bonusi"
                />
                <Switch
                  checked={autoSettings.streakEnabled}
                  onCheckedChange={(on) => patch({ streakEnabled: on })}
                  disabled={!att}
                  aria-label="Davomat seriyasi bonusini yoqish"
                />
              </>
            ),
          },
        ]}
      />
      <SettingsList
        items={[
          {
            key: "jrn-master",
            title: "Jurnaldan avto-ballar",
            description:
              "Topshiriq baholanganda plus; topshirish muddati oʻtib katak boʻsh qolsa minus",
            trailing: (
              <Switch
                checked={jrn}
                onCheckedChange={(on) => patch({ journalEnabled: on })}
                aria-label="Jurnaldan avto-ballarni yoqish"
              />
            ),
          },
          {
            key: "graded",
            title: "Topshiriq baholandi",
            description: "Baho qiymatidan qatʼi nazar — bajarganlik jarayon-signali",
            dimmed: !jrn,
            trailing: (
              <PointsSelect
                value={autoSettings.gradedPoints}
                options={[1, 2, 3]}
                onChange={(v) => patch({ gradedPoints: v })}
                disabled={!jrn}
                ariaLabel="Baholangan topshiriq balli"
              />
            ),
          },
          {
            key: "due",
            title: "Muddatida topshirilmadi",
            description:
              "Faqat muddat kiritilgan topshiriqlarga taalluqli; «Q» (qatnashmadi) belgilangan katakka minus yozilmaydi. Keyin baho qoʻyilsa minus olib tashlanadi.",
            dimmed: !jrn,
            trailing: (
              <PointsSelect
                value={autoSettings.missedDuePoints}
                options={[-1, -2, -3]}
                onChange={(v) => patch({ missedDuePoints: v })}
                disabled={!jrn}
                ariaLabel="Muddati oʻtgan topshiriq balli"
              />
            ),
          },
        ]}
      />
    </SettingsGroup>
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
      <AutoPointsGroup />

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
