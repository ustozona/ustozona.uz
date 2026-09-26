"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Megaphone, Moon, Phone, Send, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LessonLabLinkPanel } from "@/components/lessonlab/LessonLabLinkPanel";
import {
  getTgConnectionAction,
  getTgNotifyPrefsAction,
  setTgMarketingAction,
  setTgNotifyPrefsAction,
} from "@/server/actions/tg-auth";
import { notifyTimeOptions, type TgConnection, type TgNotifyPrefs } from "@/lib/tg-auth-types";
import { SettingsCard, SettingsList } from "./SettingsShared";

/* Sozlamalar → Telegram. YAGONA joy: Telegramni ulash/almashtirish,
   Telegram tasdiqlagan telefon, marketing roziligi va kunlik xabarlar.

   Ulash — TOʻLIQ @uzlessonlabbot orqali (yaratuvchi qarori, 2026-09-26):
   `LessonLabLinkPanel` → `TelegramLinkDialog`. Ilgari bu yerda Ustozona
   botining alohida ulash oynasi, «LessonLab» boʻlimida esa ikkinchi yoʻl
   bor edi — bitta kimlik (`user_telegram`) uchun ikki tugma. Endi bitta.
   Keyingi bosqichda Ustozona boti funksiyalari (telefon, eslatmalar,
   kirish) ham shu botga koʻchadi; ungacha pastdagi qatorlar Ustozona
   botiga tegishli (`conn.botActive` — u bot ishga tushirilganmi). */
export default function TelegramSection() {
  const t = useTranslations("TelegramSection");
  const [conn, setConn] = React.useState<TgConnection | null | undefined>(undefined);
  const [savingMarketing, setSavingMarketing] = React.useState(false);

  const load = React.useCallback(() => {
    getTgConnectionAction()
      .then(setConn)
      .catch(() => setConn(null));
  }, []);

  React.useEffect(load, [load]);

  // `?ulash=1` — xatdagi «Telegramni ulash» tugmasi: ustoz shu yerga
  // kelib yana bir tugma qidirmasin, oyna oʻzi ochiladi (bir marta).
  const autoLink = useSearchParams().get("ulash") === "1";

  // Botda raqam yuborilgach sahifaga qaytganda — yangi holat.
  React.useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const toggleMarketing = async (next: boolean) => {
    setSavingMarketing(true);
    const ok = await setTgMarketingAction(next).catch(() => false);
    setSavingMarketing(false);
    if (!ok) return toast.error(t("saveFailed"));
    setConn((c) => (c ? { ...c, marketing: next ? "yes" : "no" } : c));
  };

  const linkPanel = (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <LessonLabLinkPanel variant="full" autoOpen={autoLink} onChange={load} />
    </div>
  );

  if (conn === undefined) {
    return (
      <SettingsCard title={t("title")} description={t("description")}>
        {linkPanel}
        <Skeleton className="h-24 w-full rounded-xl" />
      </SettingsCard>
    );
  }

  // Ustozona boti sozlanmagan yoki Telegram hali ulanmagan — faqat ulash.
  // Telefon, marketing va eslatmalar ulangandan keyin maʼno kasb etadi.
  if (!conn || !conn.enabled || !conn.linked) {
    return (
      <SettingsCard title={t("title")} description={t("description")}>
        {linkPanel}
      </SettingsCard>
    );
  }

  const openBot = conn.botUrl && (
    <Button variant="outline" size="sm" asChild>
      <a href={conn.botUrl} target="_blank" rel="noopener noreferrer">
        {t("openBot")}
      </a>
    </Button>
  );

  const items = [
    {
      key: "telegram",
      leading: <Send className="size-4 text-muted-foreground" aria-hidden />,
      title: t("telegramLabel"),
      description: !conn.botActive
        ? t("botInactive")
        : conn.username
          ? t("linkedAs", { username: `@${conn.username}` })
          : t("linked"),
      multiline: true,
      trailing: !conn.botActive && openBot,
    },
    {
      key: "phone",
      leading: <Phone className="size-4 text-muted-foreground" aria-hidden />,
      title: t("phoneLabel"),
      description: conn.phone ?? t("phoneMissing"),
      multiline: true,
      trailing: !conn.phone && conn.botActive ? openBot : undefined,
    },
    {
      key: "marketing",
      leading: <Megaphone className="size-4 text-muted-foreground" aria-hidden />,
      title: t("marketingLabel"),
      description: t("marketingHint"),
      multiline: true,
      dimmed: !conn.botActive,
      trailing: (
        <Switch
          checked={conn.marketing === "yes"}
          disabled={!conn.botActive || savingMarketing}
          onCheckedChange={toggleMarketing}
          aria-label={t("marketingLabel")}
        />
      ),
    },
  ];

  return (
    <>
      <SettingsCard title={t("title")} description={t("description")}>
        {linkPanel}
        <SettingsList items={items} />
      </SettingsCard>
      <DigestPrefsCard />
    </>
  );
}

const MORNING_TIMES = notifyTimeOptions("morning");
const EVENING_TIMES = notifyTimeOptions("evening");

/** Kunlik xabarlar — har oʻzgarish darhol saqlanadi (bitta maydon, draft kerak emas). */
function DigestPrefsCard() {
  const t = useTranslations("TelegramSection");
  const [prefs, setPrefs] = React.useState<TgNotifyPrefs | null>(null);

  React.useEffect(() => {
    getTgNotifyPrefsAction()
      .then(setPrefs)
      .catch(() => setPrefs(null));
  }, []);

  if (!prefs) return null;

  const update = async (patch: Partial<TgNotifyPrefs>) => {
    const prev = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const ok = await setTgNotifyPrefsAction(next).catch(() => false);
    if (!ok) {
      setPrefs(prev);
      toast.error(t("saveFailed"));
    }
  };

  const timeSelect = (value: string, options: string[], onChange: (v: string) => void, disabled: boolean, label: string) => (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-24" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <SettingsCard title={t("digestTitle")} description={t("digestDescription")}>
      <SettingsList
        items={[
          {
            key: "evening",
            leading: <Moon className="size-4 text-muted-foreground" aria-hidden />,
            title: t("eveningLabel"),
            description: t("eveningHint"),
            multiline: true,
            dimmed: !prefs.eveningEnabled,
            trailing: (
              <>
                {timeSelect(prefs.eveningTime, EVENING_TIMES, (v) => update({ eveningTime: v }), !prefs.eveningEnabled, t("eveningLabel"))}
                <Switch
                  checked={prefs.eveningEnabled}
                  onCheckedChange={(v) => update({ eveningEnabled: v })}
                  aria-label={t("eveningLabel")}
                />
              </>
            ),
          },
          {
            key: "morning",
            leading: <Sun className="size-4 text-muted-foreground" aria-hidden />,
            title: t("morningLabel"),
            description: t("morningHint"),
            multiline: true,
            dimmed: !prefs.morningEnabled,
            trailing: (
              <>
                {timeSelect(prefs.morningTime, MORNING_TIMES, (v) => update({ morningTime: v }), !prefs.morningEnabled, t("morningLabel"))}
                <Switch
                  checked={prefs.morningEnabled}
                  onCheckedChange={(v) => update({ morningEnabled: v })}
                  aria-label={t("morningLabel")}
                />
              </>
            ),
          },
        ]}
      />
    </SettingsCard>
  );
}
