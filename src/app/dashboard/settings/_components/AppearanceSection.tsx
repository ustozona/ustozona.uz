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
  type WorkspaceBackground as BgKind,
  type AppLanguage,
} from "@/store/useSettingsStore";
import { backgroundStyle } from "@/components/WorkspaceBackground";
import { SettingsGroup, SettingRow } from "./SettingsShared";

const THEMES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Yorugʻ", icon: Sun },
  { value: "dark", label: "Qorongʻu", icon: Moon },
  { value: "system", label: "Tizim", icon: Monitor },
];

const BACKGROUNDS: { value: BgKind; label: string }[] = [
  { value: "grid", label: "Katakcha" },
  { value: "parchment", label: "Qogʻoz" },
  { value: "circles", label: "Doiralar" },
  { value: "stripes", label: "Chiziqlar" },
];

const LANGUAGES: { value: AppLanguage; label: string; ready: boolean }[] = [
  { value: "uz", label: "Oʻzbekcha", ready: true },
  { value: "ru", label: "Ruscha (tez orada)", ready: false },
  { value: "en", label: "English (soon)", ready: false },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const workspaceBackground = normalizeBackground(
    useSettingsStore((s) => s.workspaceBackground)
  );
  const setWorkspaceBackground = useSettingsStore((s) => s.setWorkspaceBackground);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? theme ?? "light" : "light";

  return (
    <>
      {/* Mavzu */}
      <SettingsGroup title="Mavzu" description="Yorugʻ, qorongʻu yoki tizim sozlamasiga moslanadi.">
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
        description="Dashboard orqa fonining vizual koʻrinishi."
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
                  style={backgroundStyle(b.value, false)}
                />
                <span className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-xs font-medium text-foreground">{b.label}</span>
                  {active && <Check className="size-3.5 text-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsGroup>

      {/* Til */}
      <SettingsGroup title="Til" description="Interfeys tili. Hozircha faqat oʻzbekcha toʻliq qoʻllab-quvvatlanadi.">
        <SettingRow title="Interfeys tili" description="Boshqa tillar tez orada qoʻshiladi.">
          <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
            <SelectTrigger className="w-44" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value} disabled={!l.ready}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsGroup>
    </>
  );
}
