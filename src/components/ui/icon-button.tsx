"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type IconButtonVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>;

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "size"> & {
  active?: boolean;
  inactiveVariant?: IconButtonVariant;
  activeVariant?: IconButtonVariant;
};

export function IconButton({
  className,
  active = false,
  inactiveVariant = "ghost",
  activeVariant = "secondary",
  variant,
  children,
  ...props
}: IconButtonProps) {
  const resolvedVariant = variant ?? (active ? activeVariant : inactiveVariant);

  return (
    <Button
      size="icon-sm"
      variant={resolvedVariant}
      className={cn("rounded-lg", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
