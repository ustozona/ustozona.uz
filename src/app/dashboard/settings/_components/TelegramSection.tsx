"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Megaphone, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { TelegramAuthDialog } from "@/components/telegram/TelegramAuthDialog";
import { getTgConnectionAction, setTgMarketingAction } from "@/server/actions/tg-auth";
import type { TgConnection } from "@/lib/tg-auth-types";
import { SettingsCard, SettingsList } from "./SettingsShared";

/* Sozlamalar → Telegram. Ustozona botiga ulanish, Telegram tasdiqlagan
   telefon va marketing roziligi. Bildirishnoma vaqtlari ham shu boʻlimga
   qoʻshiladi (keyingi bosqich).

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
