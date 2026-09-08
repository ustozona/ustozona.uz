"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { timeAgoUz } from "@/lib/localization";
import { Badge } from "@/components/ui/badge";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { MessageSquare, Lightbulb, Activity, Info } from "lucide-react";
import type { NotificationItem, NotificationKind } from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMA KARTASI — roʻyxatning yagona qurilish birligi.

   Anatomiya: [32px iconbox] [sarlavha / ostmatn / meta] [oʻqilmagan
   nuqta]. Karta oʻzini oʻzi tushuntiradi, shuning uchun roʻyxatni
   ixtiyoriy tartibda (kun boʻlimlari, filtr, kelajakda alohida sahifa)
   qayta joylash mumkin — oʻrash konteyneri kartaga taʼsir qilmaydi.

   Oʻqilmagan holat — accent BORDER. Fon tini (`bg-primary/[0.04]`)
   yorugʻ mavzuda deyarli koʻrinmasdi, border esa qatorlar orasida
   ham aniq ajraladi va qoʻshimcha rang talab qilmaydi.
   ════════════════════════════════════════════════════════════════════ */

const KIND_ICON: Record<
  Exclude<NotificationKind, "birthday">,
  React.ComponentType<{ className?: string }>
> = {
  reply: MessageSquare,
  feedback: Lightbulb,
  status: Activity,
  system: Info,
};

const KIND_ICON_TONE: Record<NotificationKind, string> = {
  reply: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  feedback: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  status: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  system: "bg-muted text-muted-foreground",
  birthday: "bg-primary/10 text-primary",
};

/* Tugʻilgan kun — yagona "insoniy" xabar turi: qolganlari tizim hodisasi
   (javob, holat, fikr), bu esa tabrik. Shuning uchun lucide glifi emas,
   emoji sprite'i (`StudentRiskCard` dagi bilan bir xil naqsh) — u baribir
   oʻsha iconbox ichida turadi, karta anatomiyasi oʻzgarmaydi. */
const BIRTHDAY_EMOJI = "🎂";

/** Eski yozuvlar `kind: "system"` bilan saqlangan — sarlavhasidan
 *  tanib olamiz, aks holda ular hech qachon yangi koʻrinishga oʻtmasdi. */
export function effectiveKind(n: NotificationItem): NotificationKind {
  if (n.kind === "birthday") return "birthday";
  return n.title.endsWith("tugʻilgan kuni") ? "birthday" : n.kind;
}

function KindIcon({ kind }: { kind: NotificationKind }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md",
        KIND_ICON_TONE[kind]
      )}
    >
      {kind === "birthday" ? (
        <AppleEmojiSprite emoji={BIRTHDAY_EMOJI} className="size-4" />
      ) : (
        React.createElement(KIND_ICON[kind], { className: "size-4" })
      )}
    </span>
  );
}

export function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (id: string, href?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id, item.href)}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left transition-colors",
        item.read
          ? "border-border bg-card hover:bg-muted/60"
          : "border-primary/40 bg-card hover:bg-primary/[0.06]"
      )}
    >
      <KindIcon kind={effectiveKind(item)} />

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "line-clamp-2 text-sm text-foreground",
              item.read ? "font-normal" : "font-medium"
            )}
          >
            {item.title}
          </span>
          {item.badgeLabel && (
            <Badge
              variant="outline"
              className={cn("shrink-0 px-1.5 py-0 text-[10px] font-medium", item.badgeClassName)}
            >
              {item.badgeLabel}
            </Badge>
          )}
        </span>
        {item.body && (
          <span className="mt-0.5 line-clamp-2 block text-caption">{item.body}</span>
        )}
        <span className="mt-1.5 block text-caption">{timeAgoUz(item.createdAt)}</span>
      </span>

      {!item.read && (
        <span
          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
          aria-label="Oʻqilmagan"
        />
      )}
    </button>
  );
}
