"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TogglePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={selected ? "secondary" : "ghost"}
      size="sm"
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-0 cursor-pointer rounded-md px-3 text-sm transition-all",
        selected ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Button>
  );
}
