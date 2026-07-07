"use client";

import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { KarakalpakFlag } from "@/components/ui/karakalpak-flag";
import { useSettingsStore } from "@/store/useSettingsStore";
import { LANGUAGES } from "@/lib/languages";

export default function HeaderLanguageMenu() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <Globe className="size-4" />
            <span className="sr-only">Til</span>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Interfeys tili</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-60 rounded-2xl border-none p-2 shadow-lg"
      >
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.value}
            disabled={!l.ready}
            onClick={() => setLanguage(l.value)}
            className="gap-3 rounded-xl px-3 py-2.5 text-sm"
          >
            {l.flagCode ? (
              <AppleEmoji code={l.flagCode} label={l.label} className="size-5 rounded-[3px]" />
            ) : (
              <KarakalpakFlag className="size-5 shrink-0 rounded-[3px]" />
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
            {language === l.value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
