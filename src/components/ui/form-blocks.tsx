"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { TypographyLabel, TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <TypographyLabel className="mb-2 block text-muted-foreground">
        {title}
      </TypographyLabel>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function FormHint({
  icon,
  title,
  tag,
  tagClass,
  text,
}: {
  icon?: React.ReactNode;
  title: string;
  tag?: string;
  tagClass?: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <TypographySmall className="text-sm font-medium leading-none text-foreground">
            {title}
          </TypographySmall>
        </div>
        {tag && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-bold",
              tagClass ?? "bg-warning/10 text-warning-foreground"
            )}
          >
            {tag}
          </span>
        )}
      </div>
      <TypographyMuted className="text-sm leading-relaxed">{text}</TypographyMuted>
    </div>
  );
}

export function FormFieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {hint && <Info className="size-3" />}
      </Label>
      {children}
    </div>
  );
}
