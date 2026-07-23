"use client";

import { useTranslations } from "next-intl";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SaveFooter, SettingsCard, SwitchRow, useDraft, useRegisterDraft } from "./SettingsShared";

export default function TasksSection() {
  const t = useTranslations("TasksSection");
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);
  const setTasksSettings = useSettingsStore((s) => s.setTasksSettings);
  const { draft, setDraft, dirty, save, reset } = useDraft(tasksSettings, setTasksSettings);
  useRegisterDraft("vazifalar-tugilgan-kun", dirty, save, reset);

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
    </SettingsCard>
  );
}
