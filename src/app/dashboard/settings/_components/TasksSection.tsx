"use client";

import { useTranslations } from "next-intl";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Input } from "@/components/ui/input";
import { TypographyLabel } from "@/components/ui/typography";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SaveFooter, SettingsCard, SwitchRow, useDraft, useRegisterDraft } from "./SettingsShared";

export default function TasksSection() {
  const t = useTranslations("TasksSection");
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);
  const setTasksSettings = useSettingsStore((s) => s.setTasksSettings);
  // Bitta draft — ikkala boʻlim (tugʻilgan kun + pomodoro) shu yerdan yoziladi;
  // alohida draft'lar boʻlsa, ikkinchisini saqlash birinchisining eski
  // qiymatini qaytarib qoʻyar edi (ikkalasi ham bitta `tasksSettings`ni yozadi).
  const { draft, setDraft, dirty, save, reset } = useDraft(tasksSettings, setTasksSettings);
  useRegisterDraft("vazifalar-sozlamalari", dirty, save, reset);

  const numberField = (
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number
  ) => (
    <Input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
      className="h-8 w-20"
    />
  );

  return (
    <SettingsCard
      title={t("title")}
      description={t("description")}
      footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
    >
      <div className="flex flex-col gap-3">
        <SwitchRow
          title={t("birthdayToggleTitle")}
          description={t("birthdayToggleDescription")}
          checked={draft.birthdayTasks}
          onCheckedChange={(v) => setDraft({ ...draft, birthdayTasks: v })}
        />
        {draft.birthdayTasks && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium text-foreground">{t("leadLabel")}</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(draft.birthdayLead)}
              onValueChange={(v) => v && setDraft({ ...draft, birthdayLead: Number(v) as 0 | 1 | 3 })}
            >
              <ToggleGroupItem value="0">{t("leadSameDay")}</ToggleGroupItem>
              <ToggleGroupItem value="1">{t("lead1Day")}</ToggleGroupItem>
              <ToggleGroupItem value="3">{t("lead3Days")}</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <TypographyLabel>{t("pomodoroTitle")}</TypographyLabel>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">{t("pomoLengthLabel")}</span>
          {numberField(draft.pomoMinutes, (v) => setDraft({ ...draft, pomoMinutes: v }), 1, 180)}
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">{t("shortBreakLabel")}</span>
          {numberField(draft.shortBreakMinutes, (v) => setDraft({ ...draft, shortBreakMinutes: v }), 1, 60)}
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">{t("longBreakLabel")}</span>
          {numberField(draft.longBreakMinutes, (v) => setDraft({ ...draft, longBreakMinutes: v }), 1, 60)}
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">{t("longBreakEveryLabel")}</span>
          {numberField(draft.longBreakEvery, (v) => setDraft({ ...draft, longBreakEvery: v }), 2, 12)}
        </div>
      </div>
    </SettingsCard>
  );
}
