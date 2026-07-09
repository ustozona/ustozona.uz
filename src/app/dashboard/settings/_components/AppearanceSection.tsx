"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useSettingsStore,
  normalizeBackground,
  normalizeBackgroundScale,
  BACKGROUND_SCALE_MIN,
  BACKGROUND_SCALE_MAX,
  type WorkspaceBackground as BgKind,
  type AppLanguage,
} from "@/store/useSettingsStore";
import { backgroundStyle } from "@/components/WorkspaceBackground";
import { LANGUAGES } from "@/lib/languages";
import { Badge } from "@/components/ui/badge";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { KarakalpakFlag } from "@/components/ui/karakalpak-flag";
import { Slider } from "@/components/ui/slider";
import { SettingsGroup, SettingRow, SaveSignalPing } from "./SettingsShared";

const THEMES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Kunduzgi", icon: Sun },
  { value: "dark", label: "Tungi", icon: Moon },
  { value: "system", label: "Tizim", icon: Monitor },
];

const BACKGROUNDS: { value: BgKind; label: string }[] = [
  { value: "plain", label: "Toza" },
  { value: "grid", label: "Katakli" },
  { value: "lined", label: "Qatorli" },
  { value: "parchment", label: "Nuqtali" },
  { value: "stripes", label: "Diagonal" },
  { value: "checker", label: "Shaxmatli" },
  { value: "graphDashed", label: "Grafik (shtrixli)" },
  { value: "graph45", label: "Grafik (45°)" },
  { value: "circuit", label: "Sxema" },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const workspaceBackground = normalizeBackground(
    useSettingsStore((s) => s.workspaceBackground)
  );
  const setWorkspaceBackground = useSettingsStore((s) => s.setWorkspaceBackground);
  const backgroundScale = normalizeBackgroundScale(useSettingsStore((s) => s.backgroundScale));
  const setBackgroundScale = useSettingsStore((s) => s.setBackgroundScale);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? theme ?? "light" : "light";

  return (
    <>
      {/* Mavzu */}
      <SettingsGroup
        title="Mavzu"
        description="Kunduzgi, tungi yoki qurilma tizimiga mos keladigan mavzuni tanlang."
        action={<SaveSignalPing signal={activeTheme} />}
      >
        <div role="radiogroup" aria-label="Mavzu" className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const active = activeTheme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-accent text-foreground ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <t.icon className="size-5" strokeWidth={2} />
                <span className="font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </SettingsGroup>

      {/* Ishchi maydon foni */}
      <SettingsGroup
        title="Ishchi maydon foni"
        description="Asosiy ishchi maydon foni koʻrinishi."
        action={<SaveSignalPing signal={`${workspaceBackground}-${backgroundScale}`} />}
      >
        <div role="radiogroup" aria-label="Ishchi maydon foni" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BACKGROUNDS.map((b) => {
            const active = workspaceBackground === b.value;
            return (
              <button
                key={b.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={b.label}
                onClick={() => setWorkspaceBackground(b.value)}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors",
                  active ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30"
                )}
              >
                <span
                  className="block h-16 w-full overflow-hidden rounded-lg border border-border/60"
                  style={backgroundStyle(b.value, false, backgroundScale)}
                />
                <span className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-xs font-medium text-foreground">{b.label}</span>
                  {active && <Check className="size-3.5 text-primary" />}
                </span>
              </button>
            );
          })}
        </div>

        <SettingRow title="Naqsh oʻlchami" description="Katakcha/nuqta oraligʻini uzluksiz kattalashtiring yoki kichraytiring.">
          <div className="flex w-44 items-center gap-3">
            <Slider
              aria-label="Naqsh oʻlchami"
              value={[backgroundScale]}
              onValueChange={([v]) => setBackgroundScale(v)}
              min={BACKGROUND_SCALE_MIN}
              max={BACKGROUND_SCALE_MAX}
              step={5}
              className="w-32"
            />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {backgroundScale}%
            </span>
          </div>
        </SettingRow>
      </SettingsGroup>

      {/* Til */}
      <SettingsGroup title="Til" description="Interfeys tili. Hozirda faqat oʻzbek tili toʻliq integratsiya qilingan.">
        <SettingRow title="Interfeys tili" description="Yaqin orada boshqa tillar ham qoʻshiladi.">
          <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
            <SelectTrigger className="w-56" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" side="top" align="end">
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value} disabled={!l.ready}>
                  {l.flagCode ? (
                    <AppleEmoji code={l.flagCode} label={l.label} className="size-4 rounded-[3px]" />
                  ) : (
                    <KarakalpakFlag className="size-4 shrink-0 rounded-[3px]" />
                  )}
                  <span className="flex-1">{l.label}</span>
                  {!l.ready && (
                    <Badge variant="secondary" className="gap-1.5 text-[10px] font-normal">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-muted-foreground/60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-muted-foreground" />
                      </span>
                      Tez orada
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsGroup>
    </>
  );
}
