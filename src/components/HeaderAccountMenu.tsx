"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Settings, LogOut, ChevronDown, Moon, Sun, Check, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { KarakalpakFlag } from "@/components/ui/karakalpak-flag";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { LANGUAGES } from "@/lib/languages";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { authClient } from "@/lib/auth-client";
import { isSuperAdmin } from "@/lib/auth-roles";

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* Faqat super_admin'ga koʻrinadi (kosmetik — haqiqiy gate server'da). */
function AdminPanelItem() {
  const t = useTranslations("HeaderAccountMenu");
  const { data } = authClient.useSession();
  if (!data || !isSuperAdmin(data.user)) return null;
  return (
    <DropdownMenuItem asChild>
      <Link href="/admin">
        <ShieldCheck />
        {t("adminPanel")}
      </Link>
    </DropdownMenuItem>
  );
}

export default function HeaderAccountMenu() {
  const t = useTranslations("HeaderAccountMenu");
  const router = useRouter();
  const profile = useSettingsStore((s) => s.profile);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const activeLang = LANGUAGES.find((l) => l.value === language);

  const handleLanguageChange = (value: typeof language) => {
    setLanguage(value);
    if (isLocale(value)) {
      document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  };

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const name = hydrated ? profile.name : t("defaultUserName");
  const initials = hydrated ? initialsOf(profile.name) || t("defaultInitial") : t("defaultInitial");
  const avatarHex = hydrated
    ? CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Avatar size="sm">
          {hydrated && profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={name} />}
          <AvatarFallback style={avatarHex ? { background: avatarHex, color: "white" } : undefined}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/settings?section=profil" className="flex items-center gap-2.5 py-2">
            <Avatar size="sm">
              {hydrated && profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={name} />}
              <AvatarFallback style={avatarHex ? { background: avatarHex, color: "white" } : undefined}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {hydrated ? profile.email : ""}
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <AdminPanelItem />
        <DropdownMenuSeparator />

        {/* Mavzu — tez almashtirish */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {isDark ? <Sun /> : <Moon />}
          {isDark ? t("lightMode") : t("darkMode")}
        </DropdownMenuItem>

        {/* Til — ichki menyu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            {activeLang?.flagCode ? (
              <AppleEmoji
                code={activeLang.flagCode}
                label={activeLang.label}
                className="size-4 rounded-[3px]"
              />
            ) : (
              <KarakalpakFlag className="size-4 shrink-0 rounded-[3px]" />
            )}
            <span className="flex-1">{t("language")}</span>
            <span className="text-xs text-muted-foreground">{activeLang?.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuLabel>{t("interfaceLanguage")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.value}
                disabled={!l.ready}
                onSelect={() => handleLanguageChange(l.value)}
                className="gap-2.5"
              >
                {l.flagCode ? (
                  <AppleEmoji code={l.flagCode} label={l.label} className="size-4 rounded-[3px]" />
                ) : (
                  <KarakalpakFlag className="size-4 shrink-0 rounded-[3px]" />
                )}
                <span className="flex-1">{l.label}</span>
                {!l.ready && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {t("comingSoon")}
                  </Badge>
                )}
                {language === l.value && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await authClient.signOut();
            // To'liq reload: xotiradagi store'larda oldingi hisob
            // ma'lumotlari qolib ketmasligi uchun (DataSection bilan bir xil).
            window.location.href = "/login";
          }}
        >
          <LogOut />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
