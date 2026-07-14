"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Settings, LogOut, ChevronDown, Moon, Sun, Check } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function HeaderAccountMenu() {
  const profile = useSettingsStore((s) => s.profile);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const activeLang = LANGUAGES.find((l) => l.value === language);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const name = hydrated ? profile.name : "Foydalanuvchi";
  const initials = hydrated ? initialsOf(profile.name) || "F" : "F";
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
            Sozlamalar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Mavzu — tez almashtirish */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {isDark ? <Sun /> : <Moon />}
          {isDark ? "Yorugʻ rejim" : "Qorongʻu rejim"}
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
            <span className="flex-1">Til</span>
            <span className="text-xs text-muted-foreground">{activeLang?.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuLabel>Interfeys tili</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.value}
                disabled={!l.ready}
                onSelect={() => setLanguage(l.value)}
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
                    Tez orada
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
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
