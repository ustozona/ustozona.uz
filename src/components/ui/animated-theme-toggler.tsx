"use client";

import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  /** Controlled theme value — parent (next-themes) owns persistence. */
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

/** Doira shaklidagi View Transitions API bilan animatsiyalangan tema almashtirgich. */
export function AnimatedThemeToggler({
  className,
  duration = 400,
  theme,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    const nextTheme = isDark ? "light" : "dark";

    if (!button || typeof document.startViewTransition !== "function") {
      onThemeChange(nextTheme);
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.style.setProperty("--magicui-theme-toggle-vt-duration", `${duration}ms`);

    const transition = document.startViewTransition(() => {
      flushSync(() => onThemeChange(nextTheme));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
        { duration, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }, [isDark, duration, onThemeChange]);

  return (
    <button
      type="button"
      {...props}
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Temani almashtirish</span>
    </button>
  );
}
