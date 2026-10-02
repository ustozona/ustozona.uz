"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassEnvironment } from "@/lib/lesson-models";

/* ════════════════════════════════════════════════════════════════════
   SINF PASPORTI — sinf sharoiti bir marta kiritiladi, keyin har darsda
   ishlatiladi: AI rejasi, tekshirish usuli, oʻyin tavsiyasi. Dars
   muharriridagi Reja ustasi bilan BIR manba (`useClassEnv`).

   Savollar texnik emas, sinf haqiqati tilida: «bolalar darsda telefon
   ishlata oladimi?», «printer bormi?» (docs/topshiriq-boshlash-markazi.md
   §2, vaziyat tili).
   ════════════════════════════════════════════════════════════════════ */

const SWITCHES = ["phones", "smartboard", "projector", "printer", "pult", "internet", "movement"] as const;

export function ClassEnvDialog({
  className,
  env,
  studentCount,
  onSave,
  onClose,
}: {
  className: string;
  env: ClassEnvironment;
  studentCount: number;
  onSave: (env: ClassEnvironment) => void;
  onClose: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const [draft, setDraft] = useState<ClassEnvironment>(env);
  const patch = (p: Partial<ClassEnvironment>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeaderBar
          icon={<Settings2 aria-hidden />}
          title={t("env.title")}
          description={className ? t("env.subtitle", { className }) : undefined}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <p className="text-caption text-muted-foreground">{t("env.hint")}</p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {SWITCHES.map((key) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t(`env.${key}`)}</span>
                  <span className="block text-caption text-muted-foreground">{t(`env.${key}Hint`)}</span>
                </span>
                <Switch checked={draft[key]} onCheckedChange={(v) => patch({ [key]: v } as Partial<ClassEnvironment>)} />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-caption text-muted-foreground">
              {t("env.count")}
              <Input
                type="number"
                min={1}
                max={60}
                value={draft.studentCount ?? ""}
                placeholder={studentCount ? String(studentCount) : undefined}
                onChange={(e) => patch({ studentCount: e.target.value ? Math.min(60, Math.max(1, Number(e.target.value))) : null })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-caption text-muted-foreground">
              {t("env.level")}
              <Select
                value={draft.level ?? "none"}
                onValueChange={(v) => patch({ level: v === "none" ? null : (v as ClassEnvironment["level"]) })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("env.levels.none")}</SelectItem>
                  <SelectItem value="strong">{t("env.levels.strong")}</SelectItem>
                  <SelectItem value="mixed">{t("env.levels.mixed")}</SelectItem>
                  <SelectItem value="weak">{t("env.levels.weak")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" className="shadow-none" onClick={onClose}>{t("cancel")}</Button>
          <Button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            {t("env.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Pasportning ixcham koʻrinishi — reja va tavsiya ustunlarida. */
export function EnvSummary({
  env,
  isDefault,
  onEdit,
}: {
  env: ClassEnvironment;
  isDefault: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("LessonStudio");
  if (isDefault) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex items-start gap-3 rounded-lg border border-dashed border-warning/50 bg-warning/5 p-3 text-left transition-colors hover:bg-warning/10"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{t("env.emptyTitle")}</span>
          <span className="block text-caption text-muted-foreground">{t("env.emptyHint")}</span>
        </span>
      </button>
    );
  }
  const on = SWITCHES.filter((k) => env[k]);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-muted-foreground">{t("env.title")}</span>
        <button type="button" onClick={onEdit} className="text-caption font-medium text-foreground underline-offset-4 hover:underline">
          {t("env.edit")}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!env.phones && <span className="rounded-full bg-muted px-2 py-0.5 text-tag text-muted-foreground">{t("env.noPhonesChip")}</span>}
        {on.map((k) => (
          <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-tag text-foreground">{t(`env.${k}Chip`)}</span>
        ))}
      </div>
    </div>
  );
}
