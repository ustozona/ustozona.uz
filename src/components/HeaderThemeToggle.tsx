"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function HeaderThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AnimatedThemeToggler
          theme={theme}
          onThemeChange={(t) => setTheme(t)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Yorugʻ rejim" : "Qorongʻu rejim"}</TooltipContent>
    </Tooltip>
  );
}
