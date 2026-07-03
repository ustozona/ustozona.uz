import * as React from "react";

import { cn } from "@/lib/utils";

type BaseProps<T extends keyof React.JSX.IntrinsicElements> = React.ComponentPropsWithoutRef<T> & {
  className?: string;
};

// Page title — 24px / 700 / foreground
export function TypographyH1({ className, ...props }: BaseProps<"h1">) {
  return (
    <h1
      className={cn("scroll-m-20 text-2xl font-bold tracking-tight text-foreground/95", className)}
      {...props}
    />
  );
}

// Section title — 20px / 600 / foreground
export function TypographyH2({ className, ...props }: BaseProps<"h2">) {
  return (
    <h2
      className={cn("scroll-m-20 text-xl font-semibold tracking-tight text-foreground/95", className)}
      {...props}
    />
  );
}

// Subsection — 18px / 600 / foreground/90
export function TypographyH3({ className, ...props }: BaseProps<"h3">) {
  return (
    <h3
      className={cn("scroll-m-20 text-lg font-semibold tracking-tight text-foreground/95/90", className)}
      {...props}
    />
  );
}

// Group heading — 16px / 600 / foreground/80
export function TypographyH4({ className, ...props }: BaseProps<"h4">) {
  return (
    <h4
      className={cn("scroll-m-20 text-base font-semibold tracking-tight text-foreground/95/80", className)}
      {...props}
    />
  );
}

// Body — 14px / 400 / foreground
export function TypographyP({ className, ...props }: BaseProps<"p">) {
  return <p className={cn("text-sm leading-6 text-foreground/95 [&:not(:first-child)]:mt-4", className)} {...props} />;
}

export function TypographyBlockquote({ className, ...props }: BaseProps<"blockquote">) {
  return (
    <blockquote className={cn("mt-4 border-l-2 pl-4 italic text-muted-foreground", className)} {...props} />
  );
}

export function TypographyTable({ className, ...props }: BaseProps<"table">) {
  return <table className={cn("my-4 w-full overflow-hidden", className)} {...props} />;
}

export function TypographyList({
  className,
  ordered = false,
  ...props
}: (BaseProps<"ul"> & { ordered?: false }) | (BaseProps<"ol"> & { ordered: true })) {
  if (ordered) {
    const orderedProps = props as BaseProps<"ol">;
    return (
      <ol
        className={cn("my-4 ml-6 list-decimal text-sm text-foreground/95 [&>li]:mt-1.5", className)}
        {...orderedProps}
      />
    );
  }

  const unorderedProps = props as BaseProps<"ul">;
  return <ul className={cn("my-4 ml-6 list-disc text-sm text-foreground/95 [&>li]:mt-1.5", className)} {...unorderedProps} />;
}

export function TypographyInlineCode({ className, ...props }: BaseProps<"code">) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold text-foreground/95",
        className
      )}
      {...props}
    />
  );
}

// Lead — 16px / 400 / muted-foreground
export function TypographyLead({ className, ...props }: BaseProps<"p">) {
  return <p className={cn("text-base text-muted-foreground", className)} {...props} />;
}

// Large — 16px / 600 / foreground
export function TypographyLarge({ className, ...props }: BaseProps<"div">) {
  return <div className={cn("text-base font-semibold text-foreground/95", className)} {...props} />;
}

// Small — 12px / 500 / muted-foreground
export function TypographySmall({ className, ...props }: BaseProps<"small">) {
  return <small className={cn("text-xs font-medium leading-none text-muted-foreground", className)} {...props} />;
}

// Muted — 12px / 400 / muted-foreground
export function TypographyMuted({ className, ...props }: BaseProps<"p">) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

// Label — 11px / 500 uppercase / muted-foreground
export function TypographyLabel({ className, ...props }: BaseProps<"span">) {
  return (
    <span
      className={cn("text-[11px] font-medium uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  );
}
