"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Brend CTA tugmasi — sariq pill (#FBC02D) + ostida 3px toʻq sariq (#C08D1B) asos.
 * Hoverda oʻngdagi dumaloq strelka chapga suzib oʻtadi va 45° buriladi.
 */
export function BrandCtaButton({
  className,
  children,
  href,
  ...props
}: Omit<ButtonProps, "variant" | "size"> & { href?: string }) {
  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">{children}</span>
      <span className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
        <ArrowUpRight className="size-4" />
      </span>
    </>
  );

  return (
    <Button
      variant="brand"
      asChild={Boolean(href)}
      className={cn(
        "group relative h-12 w-fit cursor-pointer overflow-hidden p-1 ps-6 pe-14 text-sm font-medium transition-all duration-500 hover:ps-14 hover:pe-6",
        className,
      )}
      {...props}
    >
      {href ? <a href={href}>{content}</a> : content}
    </Button>
  );
}

export default BrandCtaButton;
