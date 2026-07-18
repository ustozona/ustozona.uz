import { ChevronRight } from "lucide-react";
import { TypographyLabel } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "destructive" | "success";
  active?: boolean;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "group/tile text-left rounded-xl border bg-muted/30 px-3.5 py-3 flex flex-col gap-1 transition-colors",
        interactive && "hover:bg-muted/60 cursor-pointer",
        active ? "border-primary/40 bg-primary/5" : "border-border/60",
        !interactive && "cursor-default"
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            tone === "destructive" && "text-destructive",
            tone === "success" && "text-success"
          )}
        />
        <TypographyLabel className="truncate flex-1">{label}</TypographyLabel>
        {interactive && (
          <ChevronRight className="size-3.5 text-muted-foreground/40 opacity-0 group-hover/tile:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
      <div
        className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          tone === "destructive" && "text-destructive",
          tone === "success" && "text-success"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground/80 truncate">{sub}</div>}
    </button>
  );
}
