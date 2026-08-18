import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing sahifasining YAGONA CTA tugmasi.
 *
 * Header'dagi "Kirish" tugmasi ham, hero, narxlar va yakuniy CTA ham shu
 * komponentdan foydalanadi — sahifada bir nechta xil tugma uslubi boʻlmasin.
 *
 * `size`: "sm" (header, h-10) | "lg" (bloklar ichidagi asosiy CTA, h-12)
 * `variant`: "solid" (asosiy harakat) | "outline" (ikkilamchi / "tez orada")
 */
type ButtonWithIconProps = {
  children?: ReactNode;
  href?: string;
  className?: string;
  size?: "sm" | "lg";
  variant?: "solid" | "outline";
  fullWidth?: boolean;
  target?: string;
  rel?: string;
  onClick?: () => void;
};

const ButtonWithIcon = ({
  children = "Roʻyxatdan oʻtish",
  href,
  className,
  size = "lg",
  variant = "solid",
  fullWidth = false,
  target,
  rel,
  onClick,
}: ButtonWithIconProps) => {
  const isSm = size === "sm";
  const isOutline = variant === "outline";

  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">
        {children}
      </span>
      <div
        className={cn(
          "absolute rounded-full flex items-center justify-center transition-all duration-500 group-hover:rotate-45",
          isSm
            ? "right-1 w-8 h-8 group-hover:right-[calc(100%-36px)]"
            : "right-1 w-10 h-10 group-hover:right-[calc(100%-44px)]",
          isOutline
            ? "bg-primary text-primary-foreground"
            : "bg-background text-foreground",
        )}
      >
        <ArrowUpRight size={16} />
      </div>
    </>
  );

  return (
    <Button
      asChild={Boolean(href)}
      variant={isOutline ? "outline" : "default"}
      className={cn(
        "relative text-sm font-medium rounded-full group transition-all duration-500 overflow-hidden cursor-pointer",
        isSm
          ? "h-10 p-1 ps-4 pe-12 hover:ps-12 hover:pe-4"
          : "h-12 p-1 ps-6 pe-14 hover:ps-14 hover:pe-6",
        fullWidth ? "w-full" : "w-fit",
        className,
      )}
    >
      {href ? (
        <a href={href} target={target} rel={rel} onClick={onClick}>
          {content}
        </a>
      ) : (
        content
      )}
    </Button>
  );
};

export default ButtonWithIcon;
