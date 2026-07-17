"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSettingsStore,
  normalizeBackground,
  normalizeBackgroundScale,
  BACKGROUND_SCALE_MIN,
  BACKGROUND_SCALE_MAX,
  type WorkspaceBackground as BgKind,
} from "@/store/useSettingsStore";
import { backgroundStyle } from "@/components/WorkspaceBackground";
import { LANGUAGES } from "@/lib/languages";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { Badge } from "@/components/ui/badge";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { KarakalpakFlag } from "@/components/ui/karakalpak-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SettingsCard, SettingRow, SaveSignalPing } from "./SettingsShared";

export default function AppearanceSection() {
  const t = useTranslations("AppearanceSection");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const workspaceBackground = normalizeBackground(
    useSettingsStore((s) => s.workspaceBackground)
  );
  const setWorkspaceBackground = useSettingsStore((s) => s.setWorkspaceBackground);
  const backgroundScale = normalizeBackgroundScale(useSettingsStore((s) => s.backgroundScale));
  const setBackgroundScale = useSettingsStore((s) => s.setBackgroundScale);
  const language = useSettingsStore((s) => s.language);
  const currentLanguage = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];
  const autoToursEnabled = useSettingsStore((s) => s.autoToursEnabled);
  const setAutoToursEnabled = useSettingsStore((s) => s.setAutoToursEnabled);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const handleLanguageChange = (value: string) => {
    setLanguage(value as typeof language);
    if (isLocale(value)) {
      document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  };

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? theme ?? "light" : "light";

  const themes: { value: string; label: string; icon: React.ElementType }[] = [
    { value: "light", label: t("themeLight"), icon: Sun },
    { value: "dark", label: t("themeDark"), icon: Moon },
    { value: "system", label: t("themeSystem"), icon: Monitor },
  ];

  const backgrounds: { value: BgKind; label: string }[] = [
    { value: "plain", label: t("bgPlain") },
    { value: "grid", label: t("bgGrid") },
    { value: "lined", label: t("bgLined") },
    { value: "parchment", label: t("bgParchment") },
    { value: "stripes", label: t("bgStripes") },
    { value: "checker", label: t("bgChecker") },
    { value: "graphDashed", label: t("bgGraphDashed") },
    { value: "graph45", label: t("bgGraph45") },
    { value: "circuit", label: t("bgCircuit") },
  ];

  return (
    <>
      {/* Mavzu */}
      <SettingsCard
        title={t("themeTitle")}
        description={t("themeDescription")}
        action={<SaveSignalPing signal={activeTheme} />}
      >
        <div role="radiogroup" aria-label={t("themeAriaLabel")} className="grid grid-cols-3 gap-2">
          {themes.map((th) => {
            const active = activeTheme === th.value;
            return (
              <button
                key={th.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(th.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-accent text-foreground ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <th.icon className="size-5" strokeWidth={2} />
                <span className="font-medium">{th.label}</span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Ishchi maydon foni */}
      <SettingsCard
        title={t("backgroundTitle")}
        description={t("backgroundDescription")}
        action={<SaveSignalPing signal={`${workspaceBackground}-${backgroundScale}`} />}
      >
        <div role="radiogroup" aria-label={t("backgroundAriaLabel")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {backgrounds.map((b) => {
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

        <SettingRow title={t("patternSizeTitle")} description={t("patternSizeDescription")}>
          <div className="flex w-44 items-center gap-3">
            <Slider
              aria-label={t("patternSizeTitle")}
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
      </SettingsCard>

      {/* Til */}
      <SettingsCard title={t("languageTitle")} description={t("languageDescription")}>
        <SettingRow
          title={
            <span className="flex items-center gap-2">
              {currentLanguage?.flagCode ? (
                <AppleEmoji
                  code={currentLanguage.flagCode}
                  label={currentLanguage.label}
                  className="size-4 rounded-[3px]"
                />
              ) : (
                <KarakalpakFlag className="size-4 shrink-0 rounded-[3px]" />
              )}
              {currentLanguage?.label ?? t("defaultLanguageLabel")}
            </span>
          }
          description={t("languageRowDescription")}
        >
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-44" aria-label={t("languageSelectAria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value} disabled={!l.ready}>
                  <span className="flex items-center gap-2">
                    {l.label}
                    {!l.ready && (
                      <Badge variant="secondary" className="ml-1">
                        {t("comingSoon")}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsCard>
      {/* Avtomatik turlar */}
      <SettingsCard
        title={t("autoTourTitle")}
        description={t("autoTourDescription")}
        action={<SaveSignalPing signal={`${autoToursEnabled}`} />}
      >
        <SettingRow
          title={t("autoTourRowTitle")}
          description={t("autoTourRowDescription")}
        >
          <Switch
            checked={autoToursEnabled}
            onCheckedChange={setAutoToursEnabled}
          />
        </SettingRow>
      </SettingsCard>
    </>
  );
}
