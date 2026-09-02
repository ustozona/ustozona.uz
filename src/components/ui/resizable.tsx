"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   shadcn/ui `resizable` — react-resizable-panels **v4** API ustida.

   ⚠️ v4 da nomlar oʻzgargan: `PanelGroup` → `Group`,
   `PanelResizeHandle` → `Separator`, yoʻnalish esa `direction` emas,
   `orientation`. Oʻlchamlar satr birligida beriladi (`"65%"`).

   Ajratgich rangi va fokus halqasi loyiha tokenlaridan.
   ════════════════════════════════════════════════════════════════════ */

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex items-center justify-center bg-transparent",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        "data-[orientation=horizontal]:w-1.5 data-[orientation=vertical]:h-1.5",
        "hover:bg-border data-[dragging]:bg-border transition-colors duration-fast",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-6 w-3 items-center justify-center rounded-sm border border-border bg-card">
          <GripVerticalIcon className="size-3 text-muted-foreground" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
