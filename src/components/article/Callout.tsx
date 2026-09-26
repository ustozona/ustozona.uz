import { Pencil, Lightbulb, Info, TriangleAlert, type LucideIcon } from "lucide-react";

/* Dars muharriridagi callout-extension.ts bilan bir xil rang/ikon tanlovi —
   lekin Tiptap import qilmaydi (server komponentlarda, help maqolalarida
   ishlatiladi). Faqat eng ko'p kerak bo'ladigan 4 tur — to'liq 11 turlik
   ro'yxat faqat dars muharririga xos. */
const CALLOUT_META: Record<"note" | "tip" | "info" | "warning", { icon: LucideIcon; color: string }> = {
  note: { icon: Pencil, color: "var(--info)" },
  tip: { icon: Lightbulb, color: "oklch(0.66 0.13 185)" },
  info: { icon: Info, color: "oklch(0.65 0.13 215)" },
  warning: { icon: TriangleAlert, color: "var(--warning)" },
};

export type StaticCalloutType = keyof typeof CALLOUT_META;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: StaticCalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const meta = CALLOUT_META[type];
  const Icon = meta.icon;
  return (
    <div className="static-callout" style={{ "--cl": meta.color } as React.CSSProperties}>
      <div className="static-callout-icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        {title && <p className="static-callout-title">{title}</p>}
        <div className="static-callout-body">{children}</div>
      </div>
    </div>
  );
}
