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
import { TelegramAuthDialog } from "@/components/telegram/TelegramAuthDialog";
import {
  getTgConnectionAction,
  getTgNotifyPrefsAction,
  setTgMarketingAction,
  setTgNotifyPrefsAction,
} from "@/server/actions/tg-auth";
import { notifyTimeOptions, type TgConnection, type TgNotifyPrefs } from "@/lib/tg-auth-types";
import { SettingsCard, SettingsList } from "./SettingsShared";

/* Sozlamalar → Telegram. Ustozona botiga ulanish, Telegram tasdiqlagan
   telefon, marketing roziligi va kunlik xabarlar vaqti.

   LessonLab bogʻlanishi bilan BIR XIL kimlik (`user_telegram`) — biri
   ulansa ikkinchisi ham ulangan boʻladi. Uzish hozircha LessonLab
   boʻlimida (u yerda maʼlumotlarga taʼsiri koʻrsatiladi). */
export default function TelegramSection() {
  const t = useTranslations("TelegramSection");
  const [conn, setConn] = React.useState<TgConnection | null | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [savingMarketing, setSavingMarketing] = React.useState(false);

  const load = React.useCallback(() => {
    getTgConnectionAction()
      .then(setConn)
      .catch(() => setConn(null));
  }, []);

  React.useEffect(load, [load]);

  // `?ulash=1` — xatdagi «Telegramni ulash» tugmasi: ustoz shu yerga
  // kelib yana bir tugma qidirmasin, oyna oʻzi ochiladi. Bir marta.
  const autoLink = useSearchParams().get("ulash") === "1";
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (!autoLink || autoOpened.current || !conn?.enabled || conn.linked) return;
    autoOpened.current = true;
    setDialogOpen(true);
  }, [autoLink, conn]);

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

  if (conn === undefined) {
    return (
      <SettingsCard title={t("title")} description={t("description")}>
        <Skeleton className="h-40 w-full rounded-xl" />
      </SettingsCard>
    );
  }

  if (!conn || !conn.enabled) {
    return (
      <SettingsCard title={t("title")} description={t("description")}>
        <p className="text-body text-muted-foreground">{t("disabled")}</p>
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
      description: !conn.linked
        ? t("notLinked")
        : !conn.botActive
          ? t("botInactive")
          : conn.username
            ? t("linkedAs", { username: `@${conn.username}` })
            : t("linked"),
      multiline: true,
      trailing: !conn.linked ? (
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          {t("connect")}
        </Button>
      ) : (
        !conn.botActive && openBot
      ),
    },
    {
      key: "phone",
      leading: <Phone className="size-4 text-muted-foreground" aria-hidden />,
      title: t("phoneLabel"),
      description: conn.phone ?? (conn.linked ? t("phoneMissing") : t("phoneNeedsLink")),
      multiline: true,
      dimmed: !conn.linked,
      trailing: conn.linked && !conn.phone && conn.botActive ? openBot : undefined,
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
        <SettingsList items={items} />
      </SettingsCard>
      {conn.linked && <DigestPrefsCard />}
      <TelegramAuthDialog
        kind="link"
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) load();
        }}
        onLinked={load}
      />
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
