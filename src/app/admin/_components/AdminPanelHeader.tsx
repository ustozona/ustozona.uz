import * as React from "react";
import { PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

/* Admin panellarining sarlavhasi — `PanelHeader` ning oʻzi, faqat
   joylashuvi flex.

   Standart `PanelHeader` grid (1fr · auto · 1fr): sarlavha ustuni enning
   yarmi bilan cheklanadi. Admin panellarida esa izoh uzun («Faollashmagan
   yoki 14+ kun jim — sababini soʻrash kerak»), amallar koʻp
   (foydalanuvchilar jadvalidagi 6 ta filtr). Flexʼda amali yoʻq panelda
   izoh butun enni oladi, amallar sigʻmasa pastga oʻraladi va `ml-auto`
   tufayli oʻngda qoladi.

   Qolgan hamma narsa — slotlar, `divider`, atributlar — `PanelHeader` ga
   oʻzgarishsiz uzatiladi. */
export function AdminPanelHeader({
  className,
  ...props
}: React.ComponentProps<typeof PanelHeader>) {
  return <PanelHeader className={cn("flex flex-wrap items-center", className)} {...props} />;
}
