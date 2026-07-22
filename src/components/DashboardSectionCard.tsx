import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { cn } from "@/lib/utils";

/**
 * Mustaqil boʻlim kartasi — oʻquvchi profili sahifasidagi uslub (bg-card,
 * p-5, border, shadow-sm, ixtiyoriy ikonka+sarlavha qatori). Statistika
 * sahifasi ham shu naqshni ishlatadi — bitta katta "umbrella" karta emas,
 * har bir boʻlim oʻz kartasida.
 */
export function DashboardSectionCard({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-xl bg-card p-5 border border-border", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center gap-2.5">
          {Icon && (
            <SectionIcon>
              <Icon />
            </SectionIcon>
          )}
          {title && <CardTitle className="truncate">{title}</CardTitle>}
          {action && <div className="ml-auto shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
